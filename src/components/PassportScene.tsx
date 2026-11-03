"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

const qr = Array.from({ length: 81 }, (_, i) => (i * 7 + (i >> 3) * 5) % 3 === 0);
const hidden = { backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transformStyle: "preserve-3d" } as const;

function Person({ id, skin, shirt, hair, title, sub }: { id: string; skin: string; shirt: string; hair: string; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 120 150" className="h-28 w-24 drop-shadow-[0_18px_25px_rgba(124,58,237,0.5)] sm:h-36 sm:w-28" aria-hidden="true">
        <defs>
          <radialGradient id={`s-${id}`} cx="35%" cy="25%" r="80%">
            <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
            <stop offset="1" stopColor="#000" stopOpacity="0.15" />
          </radialGradient>
        </defs>
        <rect x="18" y="84" width="84" height="64" rx="32" fill={shirt} />
        <rect x="18" y="84" width="84" height="64" rx="32" fill={`url(#s-${id})`} />
        <circle cx="60" cy="48" r="28" fill={skin} />
        <circle cx="60" cy="48" r="28" fill={`url(#s-${id})`} />
        <path d="M31 46 C31 16 89 16 89 46 C80 33 40 33 31 46Z" fill={hair} />
        <circle cx="50" cy="52" r="3" fill="#2b1810" />
        <circle cx="70" cy="52" r="3" fill="#2b1810" />
        <path d="M51 62 Q60 69 69 62" stroke="#5b2a1a" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
      <div className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-center backdrop-blur-md">
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="text-xs text-slate-300">{sub}</p>
      </div>
    </div>
  );
}

export default function PassportScene() {
  const [rot, setRot] = useState({ x: -8, y: 22 });
  const [auto, setAuto] = useState(true);
  const start = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const tick = () => {
      if (auto) setRot((r) => ({ ...r, y: r.y + 0.3 }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [auto]);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  function down(e: PointerEvent<HTMLDivElement>) {
    start.current = { x: e.clientX, y: e.clientY, rx: rot.x, ry: rot.y };
    setAuto(false);
    if (timer.current) window.clearTimeout(timer.current);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    const s = start.current;
    if (!s) return;
    setRot({
      y: s.ry + (e.clientX - s.x) * 0.5,
      x: Math.max(-35, Math.min(35, s.rx - (e.clientY - s.y) * 0.3)),
    });
  }
  function up() {
    start.current = null;
    timer.current = window.setTimeout(() => setAuto(true), 2500);
  }

  return (
    <div
      role="img"
      aria-label="Interactive 3D Trust Passport. Drag to rotate."
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      style={{ touchAction: "pan-y" }}
      className="relative mx-auto flex h-[480px] w-full max-w-[540px] cursor-grab select-none items-center justify-center active:cursor-grabbing"
    >
      <div className="pointer-events-none absolute inset-x-8 top-1/2 h-40 -translate-y-1/2 rounded-full bg-violet-500/30 blur-3xl" />

      <div className="pointer-events-none absolute bottom-2 left-0 z-10 tl-float"><Person id="hirer" skin="#f1c7a0" shirt="#6366f1" hair="#2b1810" title="Hirer" sub="Posts a ₦20,000 task" /></div>
      <div className="pointer-events-none absolute right-0 top-2 z-10 tl-float-b"><Person id="free" skin="#8d5a3b" shirt="#ec4899" hair="#120a06" title="Freelancer" sub="Gets paid + credential" /></div>
      <div className="tl-coin pointer-events-none top-[46%] z-20 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-amber-400 text-lg font-bold text-amber-900 shadow-lg">₦</div>

      <div style={{ perspective: "1200px" }}>
        <div
          className="relative h-[340px] w-[240px] sm:h-[380px] sm:w-[270px]"
          style={{ transformStyle: "preserve-3d", transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }}
        >
          {/* FRONT */}
          <div style={hidden} className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white shadow-2xl ring-1 ring-white/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.2em] text-indigo-100">TRUST PASSPORT</span>
              <span className="rounded-full bg-emerald-400/25 px-2 py-0.5 text-[10px] font-bold text-emerald-100">Sample</span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-lg font-bold">AO</div>
              <div>
                <p className="font-bold">Ada Okafor</p>
                <p className="text-xs text-indigo-100">Brand designer</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[["5", "Tasks"], ["5", "Verified"], ["0", "Disputes"]].map(([n, l]) => (
                <div key={l} className="rounded-xl bg-white/15 py-2">
                  <p className="text-lg font-bold">{n}</p>
                  <p className="text-[10px] text-indigo-100">{l}</p>
                </div>
              ))}
            </div>
            <ul className="mt-4 space-y-2 text-xs">
              {["Logo design", "Poster design", "Website testing"].map((t) => (
                <li key={t} className="flex items-center justify-between rounded-xl bg-white/15 px-3 py-2">
                  <span>{t}</span><span className="font-bold text-emerald-200">✓ Verified</span>
                </li>
              ))}
            </ul>
            <span style={{ transform: "translateZ(55px)" }} className="absolute -right-4 top-14 rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 shadow-lg">✓ Paid</span>
            <span style={{ transform: "translateZ(35px)" }} className="absolute -left-4 bottom-12 rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-amber-900 shadow-lg">On-chain ✓</span>
          </div>

          {/* BACK */}
          <div style={{ ...hidden, transform: "rotateY(180deg)" }} className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-900 p-5 text-white shadow-2xl ring-1 ring-white/20">
            <p className="text-[10px] font-bold tracking-[0.2em] text-indigo-200">SCAN TO VERIFY</p>
            <div className="mx-auto mt-4 grid w-40 grid-cols-9 gap-[3px] rounded-2xl bg-white p-3">
              {qr.map((on, i) => (<span key={i} className={`aspect-square rounded-[2px] ${on ? "bg-indigo-900" : "bg-indigo-100"}`} />))}
            </div>
            <p className="mt-4 text-center text-sm font-bold text-emerald-300">✓ Hash matches on-chain record</p>
            <p className="mt-1 text-center text-xs text-slate-300">Approved by issuer · Payment confirmed</p>
            <p className="mt-4 rounded-xl bg-white/10 px-3 py-2 text-center font-mono text-[11px] text-slate-200">Base · 0x9f3a…c21b</p>
          </div>
        </div>
      </div>

      <p className="pointer-events-none absolute bottom-0 w-full text-center text-xs text-slate-300">Drag to rotate the Trust Passport</p>
    </div>
  );
}