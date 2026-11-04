import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import Shell from "@/components/Shell";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { markAllRead } from "@/app/actions/notifications";
import { card } from "@/lib/ui";

export const instant = false;

export default async function Notifications() {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const items = await db.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
  const unread = items.filter((n) => !n.readAt).length;

  return (
    <Shell>
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold">Notifications</h1>
          {unread > 0 && (
            <form action={markAllRead}>
              <button className="flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold hover:bg-cream">
                <CheckCheck className="h-4 w-4" aria-hidden /> Mark all as read
              </button>
            </form>
          )}
        </div>
        {items.length === 0 && <p className={`${card} p-6 text-muted`}>Nothing yet. Updates about your tasks and payments will appear here.</p>}
        {items.map((n) => (
          <Link key={n.id} href={n.href} className={`${card} flex items-start gap-4 p-4 transition hover:bg-cream ${n.readAt ? "opacity-70" : ""}`}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-forest text-white">
              <Bell className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-bold">
                {n.title}
                {!n.readAt && <span className="h-2 w-2 rounded-full bg-bronze" aria-label="Unread" />}
              </p>
              <p className="text-sm text-muted">{n.body}</p>
              <p className="mt-1 text-xs text-muted">
                {n.createdAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Shell>
  );
}