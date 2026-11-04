import Link from "next/link";
import { Bell, LayoutDashboard, BadgeCheck, LogOut } from "lucide-react";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { logout } from "@/app/actions/auth";

const link = "relative flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-ink/80 transition hover:bg-cream";
const label = "sr-only sm:not-sr-only";

export default async function AppNav() {
  const userId = await getUserId();
  const unread = userId ? await db.notification.count({ where: { userId, readAt: null } }) : 0;

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-ink">
          Trust<span className="text-bronze">Loop</span>
        </Link>
        {userId ? (
          <nav className="flex items-center gap-1">
            <Link href="/dashboard" className={link}><LayoutDashboard className="h-5 w-5" aria-hidden /><span className={label}>Dashboard</span></Link>
            <Link href={`/p/${userId}`} className={link}><BadgeCheck className="h-5 w-5" aria-hidden /><span className={label}>Passport</span></Link>
            <Link href="/notifications" className={link}>
              <Bell className="h-5 w-5" aria-hidden /><span className={label}>Notifications</span>
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-bronze px-1 text-[11px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <form action={logout}>
              <button className={link}><LogOut className="h-5 w-5" aria-hidden /><span className={label}>Log out</span></button>
            </form>
          </nav>
        ) : (
          <nav className="flex items-center gap-2">
            <Link href="/login" className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink hover:bg-cream">Log in</Link>
            <Link href="/signup" className="rounded-full bg-forest text-white hover:bg-[#0d2d25] px-4 py-2 text-sm font-bold text-white">Sign up</Link>
          </nav>
        )}
      </div>
    </header>
  );
}