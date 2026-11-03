const covers = [
  "from-violet-600 via-fuchsia-500 to-orange-400",
  "from-cyan-500 via-indigo-500 to-violet-600",
  "from-pink-500 via-rose-500 to-amber-400",
  "from-emerald-400 via-cyan-500 to-indigo-600",
];

export default function Cover({
  seed,
  src,
  className = "h-28 sm:h-40",
}: { seed: string; src?: string | null; className?: string }) {
  if (src) {
    return (
      <div className={`relative overflow-hidden bg-slate-800 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      </div>
    );
  }
  const i = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % covers.length;
  return (
    <div aria-hidden className={`relative overflow-hidden bg-gradient-to-br ${covers[i]} ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(0,0,0,0.25),transparent_50%)]" />
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border-[18px] border-white/15" />
      <div className="absolute bottom-[-30px] left-10 h-24 w-24 rounded-full bg-white/15 blur-md" />
    </div>
  );
}