import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, BadgeCheck, UserPlus, ArrowUpRight, Pencil, ExternalLink, Plus } from "lucide-react";
import Shell from "@/components/Shell";
import Avatar from "@/components/Avatar";
import Cover from "@/components/Cover";
import BioSection from "@/components/BioSection";
import { LevelPill } from "@/components/TrustBadges";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { avatarSrc, coverSrc } from "@/lib/images";
import { externalLevel } from "@/lib/trust";
import { toggleFollow } from "@/app/actions/social";
import { card, pill } from "@/lib/ui";

export const instant = false;

const tiles = ["from-forest to-[#2c6b57]", "from-bronze to-[#8a6638]", "from-[#6f8a73] to-[#3f6652]", "from-[#2c6b57] to-forest"];
const order = { CONFIRMED: 0, CHECKED: 1, SELF: 2, DISPUTED: 3 } as const;

export default async function PassportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await db.user.findUnique({ where: { id } });
  if (!person) notFound();

  const viewerId = await getUserId();
  const isOrg = person.role === "ORG";
  const isSelf = viewerId === id;

  const followers = await db.follow.count({ where: { followingId: id } });
  const following = await db.follow.count({ where: { followerId: id } });
  const creds = await db.credential.findMany({
    where: isOrg ? { issuerId: id } : { contributorId: id },
    include: { task: true, issuer: true, contributor: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const external = isOrg
    ? []
    : (await db.externalWork.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 20 }))
        .map((w) => ({ w, level: externalLevel(w) }))
        .sort((a, b) => order[a.level] - order[b.level]);
  const isFollowing = viewerId
    ? Boolean(await db.follow.findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: id } } }))
    : false;

  const stats: [string, number][] = [
    [isOrg ? "Tasks paid" : "Verified work", creds.length],
    ["Followers", followers],
    ["Following", following],
  ];

  return (
    <Shell>
      <div className={`${card} overflow-hidden`}>
        <Cover seed={person.name} src={coverSrc(person)} className="h-36 sm:h-52" />
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <Avatar name={person.name} src={avatarSrc(person)} className="h-24 w-24 text-3xl ring-4 ring-paper" />
            {isSelf && (
              <Link href="/settings/profile" className="flex items-center gap-2 rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold hover:bg-cream">
                <Pencil className="h-4 w-4" aria-hidden /> Edit profile
              </Link>
            )}
            {!isSelf &&
              (viewerId ? (
                <form action={toggleFollow.bind(null, id)}>
                  <button className="flex items-center gap-2 rounded-full bg-forest px-6 py-2.5 text-sm font-bold text-white">
                    {isFollowing ? "Following" : <><UserPlus className="h-4 w-4" aria-hidden /> Follow</>}
                  </button>
                </form>
              ) : (
                <Link href="/login" className="rounded-full bg-forest px-6 py-2.5 text-sm font-bold text-white">Log in to follow</Link>
              ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold">{person.name}</h1>
            <span className={`${pill} bg-sage/30 text-forest ring-forest/20`}>{isOrg ? "Hirer" : "Freelancer"}</span>
          </div>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <BadgeCheck className="h-4 w-4 text-emerald-700" aria-hidden /> Trust Passport · built from approved, signed work
          </p>
          {person.roqquStatus === "verified" && (
            <p className="mt-1 flex items-center gap-2 text-sm text-muted">
              <ShieldCheck className="h-4 w-4 text-forest" aria-hidden /> Verified on Roqqu
            </p>
          )}
          <BioSection bio={person.bio} isSelf={isSelf} isOrg={isOrg} />
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {stats.map(([label, n]) => (
              <div key={label} className="rounded-2xl bg-cream/60 py-4">
                <p className="text-2xl font-extrabold">{n}</p>
                <p className="text-xs text-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-xl font-bold">{isOrg ? "Work they approved and paid for" : "Verified on TrustLoop"}</h2>
      {creds.length === 0 && <p className={`${card} p-6 text-muted`}>No verified work yet.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {creds.map((c, i) => (
          <Link key={c.id} href={`/verify/${c.id}`} className={`${card} group flex items-center gap-4 p-5 transition hover:-translate-y-1 hover:bg-cream`}>
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white ${tiles[i % tiles.length]}`}>
              <BadgeCheck className="h-7 w-7" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{c.task.title}</p>
              <p className="truncate text-sm text-muted">
                {isOrg ? `Completed by ${c.contributor.name}` : `Issued by ${c.issuer.name}`} · {c.createdAt.toLocaleDateString("en-NG")}
              </p>
              <span className={`${pill} mt-2 bg-emerald-100 text-emerald-800 ring-emerald-600/20`}>Verified</span>
            </div>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-muted transition group-hover:text-forest" aria-hidden />
          </Link>
        ))}
      </div>

      {!isOrg && (external.length > 0 || isSelf) && (
        <>
          <div className="mb-3 mt-10 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Outside work</h2>
            {isSelf && (
              <Link href="/outside-work" className="inline-flex items-center gap-1 rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold hover:bg-cream">
                <Plus className="h-4 w-4" aria-hidden /> Add or manage
              </Link>
            )}
          </div>
          {external.length === 0 && <p className={`${card} p-6 text-muted`}>Add work you did elsewhere. We check the link, and a referee can confirm it.</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            {external.map(({ w, level }) => {
              let host = "";
              try { host = new URL(w.evidenceUrl).hostname; } catch {}
              const domain = w.refereeEmail ? w.refereeEmail.split("@")[1] : null;
              return (
                <article key={w.id} className={`${card} space-y-2 p-5`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-bold">{w.title}</p>
                    <LevelPill level={level} />
                  </div>
                  <p className="line-clamp-3 text-sm text-ink/80">{w.description}</p>
                  <a href={w.evidenceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-sm font-semibold text-forest underline">
                    {host || "View evidence"} <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </a>
                  {w.respondedAt && (
                    <p className="text-xs text-muted">
                      {w.refereeResponse === "CONFIRMED" ? "Confirmed" : "Disputed"} by {w.refereeName}
                      {domain ? ` (@${domain})` : ""}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted">Outside work is not signed by TrustLoop. The label shows how much evidence stands behind each item.</p>
        </>
      )}

      <p className="mt-6 text-xs text-muted">Verified work is evidence of specific, signed projects. It is not a score.</p>
    </Shell>
  );
}
