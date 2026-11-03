import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { logout } from "@/app/actions/auth";
export const instant = false;

export default async function Dashboard() {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-sky-50 px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Hi, {user.name}</h1>
          <form action={logout}>
            <button className="rounded-xl bg-white px-4 py-2 font-semibold text-indigo-700 shadow-sm">Log out</button>
          </form>
        </div>
        <div className="rounded-3xl border border-white/80 bg-white/70 p-6 shadow-sm backdrop-blur">
          <p className="text-slate-600">
            You are signed in as{" "}
            <b>{user.role === "ORG" ? "an organization" : "a contributor"}</b>.
          </p>
        </div>
      </div>
    </main>
  );
}