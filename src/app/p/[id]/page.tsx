import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, UserPlus, ArrowUpRight, Pencil } from "lucide-react";
import Shell from "@/components/Shell";
import Avatar from "@/components/Avatar";
import Cover from "@/components/Cover";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { avatarSrc, coverSrc } from "@/lib/images";
import { toggleFollow } from "@/app/actions/social";
import { card, pill } from "@/lib/ui";

export const instant = false;

const tiles = ["from-violet-500 to-fuchsia-500", "from-cyan-400 to-indigo-500", "from-amber-400 to-pink-500", "from-emerald-400 to-cyan-500"];

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
            <Avatar name={person.name} src={avatarSrc(person)} className="h-24 w-24 text-3xl ring-4 ring-[#0B0B2B]" />
            {isSelf && (
              <Link href="/settings/profile" className="flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold hover:bg-white/10">
                <Pencil className="h-4 w-4" aria-hidden /> Edit profile
              </Link>
            )}
            {!isSelf &&
              (viewerId ? (
                <form action={toggleFollow.bind(null, id)}>
                  <button className="flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-indigo-900">
                    {isFollowing ? "Following" : <><UserPlus className="h-4 w-4" aria-hidden /> Follow</>}
                  </button>
                </form>
              ) : (
                <Link href="/login" className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-indigo-900">Log in to follow</Link>
              ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold">{person.name}</h1>
            <span className={`${pill} bg-cyan-400/15 text-cyan-200 ring-cyan-300/30`}>{isOrg ? "Hirer" : "Freelancer"}</span>
          </div>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-300">
            <BadgeCheck className="h-4 w-4 text-emerald-300" aria-hidden /> Trust Passport · built from approved, signed work
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {stats.map(([label, n]) => (
              <div key={label} className="rounded-2xl bg-white/5 py-4">
                <p className="text-2xl font-extrabold">{n}</p>
                <p className="text-xs text-slate-300">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-xl font-bold">{isOrg ? "Work they approved and paid for" : "Verified work"}</h2>
      {creds.length === 0 && <p className={`${card} p-6 text-slate-300`}>No verified work yet.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {creds.map((c, i) => (
          <Link key={c.id} href={`/verify/${c.id}`} className={`${card} group flex items-center gap-4 p-5 transition hover:-translate-y-1 hover:bg-white/10`}>
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tiles[i % tiles.length]}`}>
              <BadgeCheck className="h-7 w-7" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{c.task.title}</p>
              <p className="truncate text-sm text-slate-300">
                {isOrg ? `Completed by ${c.contributor.name}` : `Issued by ${c.issuer.name}`} · {c.createdAt.toLocaleDateString("en-NG")}
              </p>
              <span className={`${pill} mt-2 bg-emerald-400/15 text-emerald-200 ring-emerald-300/30`}>Verified</span>
            </div>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:text-white" aria-hidden />
          </Link>
        ))}
      </div>
      <p className="mt-6 text-xs text-slate-400">This record is evidence of specific, signed projects. It is not a score.</p>
    </Shell>
  );
}