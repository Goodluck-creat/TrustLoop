const grads = [
  "from-forest to-[#2c6b57]",
  "from-bronze to-[#8a6638]",
  "from-[#6f8a73] to-[#3f6652]",
  "from-[#2c6b57] to-forest",
  "from-[#8a6638] to-bronze",
];

export default function Avatar({
  name,
  src,
  className = "h-12 w-12 text-base",
}: { name: string; src?: string | null; className?: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={`relative shrink-0 rounded-2xl object-cover ${className}`} />
    );
  }
  const i = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % grads.length;
  return (
    <div aria-hidden className={`relative flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-bold text-white ${grads[i]} ${className}`}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}