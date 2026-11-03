const grads = [
  "from-violet-500 to-fuchsia-500",
  "from-cyan-400 to-indigo-500",
  "from-amber-400 to-pink-500",
  "from-emerald-400 to-cyan-500",
  "from-pink-500 to-orange-400",
];

export default function Avatar({ name, className = "h-12 w-12 text-base" }: { name: string; className?: string }) {
  const i = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % grads.length;
  return (
    <div aria-hidden className={`flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-bold text-white ${grads[i]} ${className}`}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}