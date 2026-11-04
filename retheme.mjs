// TrustLoop light-theme conversion.
// Usage (from the project root):  node retheme.mjs
// Commit first (git add -A && git commit -m "before retheme") so you can undo with: git restore src
import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const src = path.join(root, "src");
if (!fs.existsSync(src)) {
  console.error("Run this from the project root (the folder that contains src/).");
  process.exit(1);
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
function applyList(text, list) {
  for (const [a, b] of list) {
    const re = new RegExp("(?<![\\w\\-/\\[:])" + esc(a) + "(?![\\w/\\]\\-])", "g");
    text = text.replace(re, b);
  }
  return text;
}

// Regexes run first (they need context).
const REGEXES = [
  [/bg-white\/5 (p-\d) backdrop-blur/g, "bg-white $1 shadow-sm shadow-ink/5"],
  [/bg-white ([^"`]*?)text-indigo-900/g, "bg-forest $1text-white"],
];

const COMMON = [
  // presets in src/lib/ui.ts
  ["border border-white/10 bg-white/5 backdrop-blur-xl", "border border-ink/10 bg-white shadow-sm shadow-ink/5"],
  ["border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400",
   "border border-ink/15 bg-white px-4 py-3 text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-forest"],
  ["bg-white/5 p-6 shadow-2xl", "bg-white p-6 shadow-xl shadow-ink/5"],
  ["bg-white/5 p-6 backdrop-blur-xl", "bg-white p-6 shadow-sm shadow-ink/5"],
  // page backgrounds
  ["bg-[#0B0B2B]/85", "bg-paper/85"],
  ["bg-[#0B0B2B] text-white", "bg-paper text-ink"],
  ["ring-[#0B0B2B]", "ring-paper"],
  // aurora blobs
  ["bg-violet-600", "bg-sage"],
  ["bg-fuchsia-500", "bg-sand"],
  ["bg-cyan-500", "bg-[#cfe0d3]"],
  // text that was white on dark but now sits on light
  ["text-xl font-extrabold tracking-tight text-white", "text-xl font-extrabold tracking-tight text-ink"],
  ["text-white hover:text-violet-200", "text-ink hover:text-forest"],
  ["font-semibold text-white hover:bg-white/10", "font-semibold text-ink hover:bg-cream"],
  ["text-center font-semibold text-white backdrop-blur", "text-center font-semibold text-ink backdrop-blur"],
  // final call-to-action band on the landing page
  ["bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 p-10", "bg-sand p-10 text-ink"],
  ["mx-auto mt-3 max-w-lg text-white/90", "mx-auto mt-3 max-w-lg text-ink/80"],
  ["inline-flex items-center gap-2 text-sm text-white/80", "inline-flex items-center gap-2 text-sm text-ink/70"],
  // gradient banners and buttons -> solid forest
  ["bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500", "bg-forest text-white"],
  ["bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500", "bg-forest text-white"],
  ["bg-gradient-to-r from-violet-600 to-pink-600", "bg-forest text-white hover:bg-[#0d2d25]"],
  ["bg-gradient-to-r from-violet-500 to-pink-500", "bg-forest text-white"],
  ["bg-gradient-to-br from-violet-500 to-pink-500", "bg-forest text-white"],
  ["bg-gradient-to-br from-emerald-500/20 to-cyan-500/20", "bg-sage/30"],
  ["bg-gradient-to-br from-emerald-500 via-teal-500 to-indigo-600", "bg-forest text-white"],
  ["bg-gradient-to-br from-rose-600 to-red-800", "bg-rose-800 text-white"],
  ["bg-gradient-to-r from-violet-300 to-pink-300", "bg-gradient-to-r from-forest to-[#2c6b57]"],
  ["from-cyan-300 via-violet-300 to-pink-300", "from-forest via-[#2c6b57] to-bronze"],
  // landing page cards and step circles
  ["from-indigo-500/30", "from-sage/40"],
  ["from-pink-500/30", "from-sand/60"],
  ["to-white/5", "to-white"],
  ["from-violet-400 to-indigo-500", "from-forest to-[#2c6b57] text-white"],
  ["from-sky-400 to-cyan-500", "from-[#2c6b57] to-[#4a8a74] text-white"],
  ["from-emerald-400 to-teal-500", "from-[#6f8a73] to-[#3f6652] text-white"],
  ["from-pink-400 to-fuchsia-500", "from-bronze to-[#8a6638] text-white"],
  // avatars, tiles, covers
  ["from-violet-500 to-fuchsia-500", "from-forest to-[#2c6b57]"],
  ["from-cyan-400 to-indigo-500", "from-bronze to-[#8a6638]"],
  ["from-amber-400 to-pink-500", "from-[#6f8a73] to-[#3f6652]"],
  ["from-emerald-400 to-cyan-500", "from-[#2c6b57] to-forest"],
  ["from-pink-500 to-orange-400", "from-[#8a6638] to-bronze"],
  ["from-violet-600 via-fuchsia-500 to-orange-400", "from-forest via-[#2c6b57] to-bronze"],
  ["from-cyan-500 via-indigo-500 to-violet-600", "from-[#2c6b57] via-forest to-ink"],
  ["from-pink-500 via-rose-500 to-amber-400", "from-bronze via-[#a9763f] to-sand"],
  ["from-emerald-400 via-cyan-500 to-indigo-600", "from-sage via-[#2c6b57] to-forest"],
  // shadows, rings, focus states
  ["shadow-violet-900/50", "shadow-forest/25"],
  ["shadow-violet-900/40", "shadow-forest/20"],
  ["peer-checked:border-violet-400", "peer-checked:border-forest"],
  ["peer-checked:bg-violet-500/20", "peer-checked:bg-sage/30"],
  ["peer-focus-visible:ring-violet-400", "peer-focus-visible:ring-forest"],
  ["focus-within:ring-violet-400", "focus-within:ring-forest"],
  ["focus:ring-violet-400", "focus:ring-forest"],
  ["border-violet-300/50", "border-forest/40"],
  ["border-amber-300/30", "border-amber-400/50"],
  ["placeholder:text-slate-400", "placeholder:text-faint"],
  // status chips
  ["bg-amber-400/10", "bg-amber-50"],
  ["bg-emerald-400/15", "bg-emerald-100"],
  ["bg-rose-400/15", "bg-rose-100"],
  ["bg-amber-400/15", "bg-amber-100"],
  ["bg-sky-400/15", "bg-sky-100"],
  ["bg-cyan-400/15", "bg-sage/30"],
  ["bg-violet-400/20", "bg-forest/10"],
  ["ring-violet-300/30", "ring-forest/20"],
  ["ring-cyan-300/30", "ring-forest/20"],
  ["ring-emerald-300/30", "ring-emerald-600/20"],
  ["ring-amber-300/30", "ring-amber-600/20"],
  ["ring-rose-300/30", "ring-rose-600/20"],
  ["ring-sky-300/30", "ring-sky-600/20"],
  ["text-emerald-200", "text-emerald-800"],
  ["text-emerald-300", "text-emerald-700"],
  ["text-amber-200", "text-amber-800"],
  ["text-amber-300", "text-amber-700"],
  ["text-rose-200", "text-rose-800"],
  ["text-rose-300", "text-rose-700"],
  ["text-sky-200", "text-sky-800"],
  ["text-cyan-200", "text-forest"],
  ["text-cyan-300", "text-forest"],
  ["text-violet-100", "text-forest"],
  ["text-violet-200", "text-forest"],
  ["text-violet-300", "text-forest"],
  ["text-pink-300", "text-bronze"],
  ["bg-pink-500", "bg-bronze"],
  ["bg-pink-400", "bg-bronze"],
  // generic dark-surface -> light-surface
  ["hover:bg-white/10", "hover:bg-cream"],
  ["bg-white/5", "bg-cream/60"],
  ["bg-white/10", "bg-cream"],
  ["border-white/10", "border-ink/10"],
  ["border-white/15", "border-ink/15"],
  ["border-white/20", "border-ink/15"],
  ["border-white/25", "border-ink/20"],
  ["ring-white/10", "ring-ink/10"],
  ["hover:text-white", "hover:text-ink"],
  ["text-slate-100", "text-ink"],
  ["text-slate-200", "text-ink/80"],
  ["text-slate-300", "text-muted"],
  ["text-slate-400", "text-muted"],
];

// The 3D passport keeps its look; only its labels and colours change.
const PASSPORT = [
  ["drop-shadow-[0_18px_25px_rgba(124,58,237,0.5)]", "drop-shadow-[0_18px_25px_rgba(18,61,50,0.35)]"],
  ["bg-violet-500/30 blur-3xl", "bg-sage/50 blur-3xl"],
  ["rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-center backdrop-blur-md",
   "rounded-2xl border border-ink/10 bg-white px-3 py-2 text-center shadow-md shadow-ink/10"],
  ['<p className="text-sm font-bold text-white">{title}</p>', '<p className="text-sm font-bold text-ink">{title}</p>'],
  ['<p className="text-xs text-slate-300">{sub}</p>', '<p className="text-xs text-muted">{sub}</p>'],
  ["from-indigo-600 via-violet-600 to-fuchsia-600", "from-[#123D32] via-[#1b5a49] to-[#2c6b57]"],
  ["from-slate-900 via-indigo-900 to-violet-900", "from-[#17221F] via-[#123D32] to-[#1b5a49]"],
  ["bg-white/10 px-4 py-3 text-sm font-semibold backdrop-blur-md", "bg-white px-4 py-3 text-sm font-semibold text-ink shadow-lg shadow-ink/10"],
  ['<Check className="h-4 w-4 text-emerald-300" aria-hidden /> Payment released', '<Check className="h-4 w-4 text-emerald-700" aria-hidden /> Payment released'],
  ["w-full text-center text-xs text-slate-300", "w-full text-center text-xs text-muted"],
];

const THEME = `
/* trustloop-theme */
@theme inline {
  --color-forest: #123D32;
  --color-ink: #17221F;
  --color-paper: #F7F6F1;
  --color-cream: #EEECE4;
  --color-sage: #A7B7A6;
  --color-sand: #D8C7A8;
  --color-bronze: #B58B55;
  --color-muted: #66716B;
  --color-faint: #929B94;
}
html { scroll-behavior: smooth; }
body { background: #F7F6F1; color: #17221F; }
`;

const changed = [];
const warnings = [];

function walk(dir, out = []) {
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir, n);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(n)) out.push(p);
  }
  return out;
}

// 1. Theme tokens and base colours
const cssPath = path.join(src, "app", "globals.css");
if (fs.existsSync(cssPath)) {
  let css = fs.readFileSync(cssPath, "utf8");
  const before = css;
  css = css.replace(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{[^}]*\}\s*\}/g, "");
  if (!css.includes("/* trustloop-theme */")) css += THEME;
  if (!/@import\s+["']tailwindcss["']/.test(css)) {
    warnings.push("globals.css has no '@import \"tailwindcss\"' line, so this may be Tailwind v3. The colour names (forest, ink, paper...) would then need a tailwind.config entry. Tell me and I will give you that version.");
  }
  if (css !== before) { fs.writeFileSync(cssPath, css); changed.push("src/app/globals.css"); }
} else {
  warnings.push("src/app/globals.css not found.");
}

// 2. Class conversion
for (const file of walk(src)) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  const before = fs.readFileSync(file, "utf8");
  let s = before;
  if (path.basename(file) === "PassportScene.tsx") {
    s = applyList(s, PASSPORT);
  } else {
    for (const [re, b] of REGEXES) s = s.replace(re, b);
    s = applyList(s, COMMON);
  }
  if (s !== before) { fs.writeFileSync(file, s); changed.push(rel); }
}

// 3. The /login page bug: make login and signup use the real forms
const comp = (n) => path.join(src, "components", n);
const forms = fs.existsSync(comp("AuthForms.tsx")) ? fs.readFileSync(comp("AuthForms.tsx"), "utf8") : "";
const haveAuth = fs.existsSync(comp("AuthLayout.tsx")) && /export function LoginForm/.test(forms) && /export function SignupForm/.test(forms);
for (const [name, Comp, Fn] of [["login", "LoginForm", "LoginPage"], ["signup", "SignupForm", "SignupPage"]]) {
  const p = path.join(src, "app", name, "page.tsx");
  const cur = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
  if (cur.includes(Comp)) continue;
  if (!haveAuth) {
    warnings.push(`src/app/${name}/page.tsx is not using ${Comp}, but AuthLayout.tsx or AuthForms.tsx is missing. Add those two files first (from my Part 2 message), then run this script again.`);
    continue;
  }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `import AuthLayout from "@/components/AuthLayout";\nimport { ${Comp} } from "@/components/AuthForms";\n\nexport default function ${Fn}() {\n  return (\n    <AuthLayout>\n      <${Comp} />\n    </AuthLayout>\n  );\n}\n`);
  changed.push(`src/app/${name}/page.tsx (rewritten: it was showing the wrong page)`);
}

// 4. layout.tsx sanity check
const layout = path.join(src, "app", "layout.tsx");
if (fs.existsSync(layout)) {
  const l = fs.readFileSync(layout, "utf8");
  if (!/export default/.test(l) || !/import type \{ Metadata \}/.test(l)) {
    warnings.push("src/app/layout.tsx is missing 'export default' or the Metadata import. Replace the whole file with the layout from my last message.");
  }
}

// 5. Report anything still styled for the dark theme
const LEFT = /(violet|fuchsia|indigo|cyan-\d|pink-\d|bg-white\/\d|border-white|0B0B2B|text-slate-[1-4]00)/;
const leftovers = [];
for (const file of walk(src)) {
  if (path.basename(file) === "PassportScene.tsx") continue;
  fs.readFileSync(file, "utf8").split("\n").forEach((line, i) => {
    if (LEFT.test(line)) leftovers.push(`${path.relative(root, file).replaceAll("\\", "/")}:${i + 1}  ${line.trim().slice(0, 110)}`);
  });
}

console.log(`\nUpdated ${changed.length} file(s):`);
changed.forEach((c) => console.log("  " + c));
if (warnings.length) { console.log("\nWarnings:"); warnings.forEach((w) => console.log("  - " + w)); }
console.log(leftovers.length ? `\nStill dark-themed (paste these to me):\n  ${leftovers.join("\n  ")}` : "\nNo dark-theme classes left.");
