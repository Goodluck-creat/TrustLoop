"use client";

import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#who", label: "For hirers and freelancers" },
];

// Desktop: links and buttons sit in the bar. Phone: a hamburger opens a menu with everything.
export default function LandingNav({ desktopAuth, menuAuth }: { desktopAuth: ReactNode; menuAuth: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <header className="flex items-center justify-between rounded-full border border-white/20 bg-white/10 py-2 pl-5 pr-2 backdrop-blur-md md:px-6">
        <span className="text-lg font-extrabold tracking-tight">Trust<span className="text-bronze">Loop</span></span>
        <nav className="hidden gap-6 text-sm font-semibold text-white/80 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-white">{l.label}</a>
          ))}
        </nav>
        <div className="hidden md:block">{desktopAuth}</div>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="landing-menu"
          onClick={() => setOpen((o) => !o)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 hover:bg-white/10 md:hidden"
        >
          {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
      </header>

      {open && (
        <div
          id="landing-menu"
          className="absolute left-0 right-0 top-full z-40 mt-2 rounded-3xl border border-white/20 bg-[#0d2d25]/95 p-4 shadow-2xl backdrop-blur-xl md:hidden"
        >
          <nav className="flex flex-col">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-base font-semibold text-white/90 hover:bg-white/10"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 border-t border-white/15 pt-3" onClick={() => setOpen(false)}>
            {menuAuth}
          </div>
        </div>
      )}
    </div>
  );
}
