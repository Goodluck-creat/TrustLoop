import dns from "node:dns/promises";
import net from "node:net";

export type CheckReport = {
  ranAt: string;
  reachable: boolean;
  httpStatus: number | null;
  finalHost: string | null;
  secure: boolean;
  titleSeen: string | null;
  mentionsName: boolean;
  mentionsProject: boolean;
  github?: { exists: boolean; owner?: string; note?: string };
  passed: boolean;
  notes: string[];
};

// ---------- Safe fetching: never let a user make our server call private addresses ----------

function ipv4Private(ip: string) {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function ipPrivate(ip: string) {
  if (net.isIPv4(ip)) return ipv4Private(ip);
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase();
    if (l === "::" || l === "::1" || l.startsWith("::ffff:")) return true;
    return /^(fc|fd|fe8|fe9|fea|feb)/.test(l);
  }
  return true;
}

async function assertPublic(u: URL) {
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("Only http and https links are allowed");
  if (u.port && u.port !== "80" && u.port !== "443") throw new Error("Unusual ports are not allowed");
  const host = u.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("That address is not public");
  if (net.isIP(host)) {
    if (ipPrivate(host)) throw new Error("That address is not public");
    return;
  }
  const addrs = await dns.lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => ipPrivate(a.address))) throw new Error("That address is not public");
}

async function safeGet(start: string, opts: { maxBytes: number; timeoutMs: number; accept?: string }) {
  let url = new URL(start);
  for (let hop = 0; hop < 4; hop++) {
    await assertPublic(url);
    const res = await fetch(url, {
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(opts.timeoutMs),
      headers: {
        "User-Agent": "TrustLoopCheck/1.0 (+https://trust-loop-theta.vercel.app)",
        Accept: opts.accept ?? "text/html,application/json;q=0.9,*/*;q=0.5",
      },
    });
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      url = new URL(loc, url);
      continue;
    }
    const chunks: Uint8Array[] = [];
    let received = 0;
    const reader = res.body?.getReader();
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (received >= opts.maxBytes) {
          await reader.cancel();
          break;
        }
      }
    }
    return {
      status: res.status,
      url,
      contentType: res.headers.get("content-type") ?? "",
      text: Buffer.concat(chunks).toString("utf8").slice(0, opts.maxBytes),
    };
  }
  throw new Error("Too many redirects");
}

// ---------- The check itself ----------

const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 2);

export async function runAuthenticityCheck(input: { url: string; personName: string; projectTitle: string }): Promise<CheckReport> {
  const report: CheckReport = {
    ranAt: new Date().toISOString(),
    reachable: false,
    httpStatus: null,
    finalHost: null,
    secure: false,
    titleSeen: null,
    mentionsName: false,
    mentionsProject: false,
    passed: false,
    notes: [],
  };

  try {
    const r = await safeGet(input.url, { maxBytes: 300_000, timeoutMs: 8000 });
    report.httpStatus = r.status;
    report.finalHost = r.url.hostname;
    report.secure = r.url.protocol === "https:";
    report.reachable = r.status < 400;

    if (report.reachable) {
      report.notes.push(`The link loads (HTTP ${r.status}) on ${r.url.hostname}${report.secure ? " over HTTPS" : ", without HTTPS"}.`);
    } else if (r.status === 401 || r.status === 403 || r.status === 429) {
      report.notes.push(`The site answered but would not show its content to an automatic check (HTTP ${r.status}). This is common for sites that need a login.`);
    } else {
      report.notes.push(`The link did not load (HTTP ${r.status}).`);
    }

    if (report.reachable && /html|text|json/i.test(r.contentType)) {
      const html = r.text;
      report.titleSeen = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim().slice(0, 140) ?? null;
      const body = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&[a-z#0-9]+;/gi, " ")
        .toLowerCase();

      const n = words(input.personName);
      if (n.length) {
        report.mentionsName =
          n.length === 1 ? body.includes(n[0]) : body.includes(n.join(" ")) || (body.includes(n[0]) && body.includes(n[n.length - 1]));
      }
      const pw = words(input.projectTitle).filter((w) => w.length >= 4);
      if (pw.length) {
        const hits = pw.filter((w) => body.includes(w)).length;
        report.mentionsProject = hits >= Math.min(2, pw.length);
      }
      report.notes.push(report.mentionsName ? "The page mentions your name." : "The page does not mention your name.");
      report.notes.push(report.mentionsProject ? "The page mentions this project." : "The page does not clearly mention this project.");
    }

    // GitHub: check that the repository exists
    if (r.url.hostname === "github.com" || input.url.includes("github.com/")) {
      const parts = new URL(input.url).pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        try {
          const g = await safeGet(`https://api.github.com/repos/${parts[0]}/${parts[1]}`, {
            maxBytes: 100_000,
            timeoutMs: 6000,
            accept: "application/vnd.github+json",
          });
          if (g.status === 200) {
            const j = JSON.parse(g.text) as { owner?: { login?: string } };
            report.github = { exists: true, owner: j.owner?.login };
            report.notes.push(`GitHub confirms this repository exists (owner: ${j.owner?.login ?? "unknown"}).`);
          } else if (g.status === 404) {
            report.github = { exists: false };
            report.notes.push("GitHub says this repository does not exist or is private.");
          } else {
            report.github = { exists: false, note: `GitHub returned ${g.status}` };
            report.notes.push("GitHub could not be checked right now.");
          }
        } catch {
          report.notes.push("GitHub could not be checked right now.");
        }
      }
    }

    report.passed = report.reachable && (report.mentionsName || report.mentionsProject || Boolean(report.github?.exists));
    report.notes.push(
      report.passed
        ? "Result: the link shows signs that this work exists. This is evidence, not proof that you did it."
        : "Result: not enough signs found. A referee confirmation would strengthen this item.",
    );
  } catch (e) {
    report.notes.push(`The link could not be checked: ${e instanceof Error ? e.message : "unknown problem"}.`);
  }
  return report;
}
