import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { toggleFollow } from "@/app/actions/social";

export const instant = false;

export default async function PassportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await db.user.findUnique({ where: { id } });
  if (!person) notFound();

  const viewerId = await getUserId();
  const isOrg = person.role === "ORG";
  const isSelf = viewerId === id;

  const [followers, following, creds] = await Promise.all([
    db.follow.count({ where: { followingId: id } }),
    db.follow.count({ where: { followerId: id } }),
    db.credential.findMany({
      where: isOrg ? { issuerId: id } : { contributorId: id },
      include: { task: true, issuer: true, contributor: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);
  const isFollowing = viewerId
    ? Boolean(await db.follow.findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: id } } }))
    : false;

  const approved = isOrg ? await db.task.count({ where: { orgId: id, status: { in: ["APPROVED", "PAID"] } } }) : 0;
  const paid = isOrg ? await db.task.count({ where: { orgId: id, status: "PAID" } }) : 0;
  const earned = isOrg ? null : await db.task.aggregate({ where: { contributorId: id, status: "PAID" }, _sum: { rewardNgn: true } });

  const stats: [string, string][] = isOrg
    ? [["Tasks paid", String(paid)], ["Payment reliability", approved ? `${paid} of ${approved}` : "No data yet"], ["Followers", String(followers)]]
    : [["Verified work", String(creds.length)], ["Total earned", `₦${(earned?._sum.rewardNgn ?? 0).toLocaleString("en-NG")}`], ["Followers", String(followers)]];

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-sky-50 px-6 py-10 text-slate-800">
      <div className="mx-auto max-w-2xl space-y-5">
        <Link href="/" className="text-sm font-semibold text-indigo-700">← TrustLoop</Link>

        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-xl">
          <p className="text-xs font-bold tracking-widest opacity-80">TRUST PASSPORT</p>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold">
              {person.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{person.name}</h1>
              <p className="text-sm opacity-90">{isOrg ? "Hirer / organization" : "Freelancer / contributor"}</p>
              <p className="text-xs opacity-80">{following} following</p>
            </div>
          </div>
          {!isSelf && (
            viewerId ? (
              <form action={toggleFollow.bind(null, id)} className="mt-4">
                <button className="rounded-xl bg-white px-5 py-2 text-sm font-bold text-indigo-700">
                  {isFollowing ? "Following ✓" : "Follow"}
                </button>
              </form>
            ) : (
              <Link href="/login" className="mt-4 inline-block rounded-xl bg-white px-5 py-2 text-sm font-bold text-indigo-700">Log in to follow</Link>
            )
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/80 bg-white/70 p-4 text-center backdrop-blur">
              <p className="text-xl font-extrabold text-indigo-700">{value}</p>
              <p className="text-xs text-slate-600">{label}</p>
            </div>
          ))}
        </div>

        <h2 className="text-lg font-bold">{isOrg ? "Work they approved and paid for" : "Verified work"}</h2>
        {creds.length === 0 && (
          <p className="rounded-2xl border border-white/80 bg-white/70 p-5 text-slate-600">No verified work yet.</p>
        )}
        {creds.map((c) => (
          <Link key={c.id} href={`/verify/${c.id}`} className="block rounded-2xl border border-white/80 bg-white/70 p-5 backdrop-blur transition hover:-translate-y-0.5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-bold">{c.task.title}</p>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Verified</span>
            </div>
            <p className="text-sm text-slate-600">
              {isOrg ? `Completed by ${c.contributor.name}` : `Issued by ${c.issuer.name}`} · {c.createdAt.toLocaleDateString("en-NG")}
            </p>
          </Link>
        ))}

        <p className="text-xs text-slate-500">
          This record comes from approved work with signed credentials. It is evidence of specific projects, not a score.
        </p>
      </div>
    </main>
  );
}