export const card = "rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl";
export const pill = "inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ring-1";
export const input =
  "w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400";

export const STATUS: Record<string, { label: string; cls: string }> = {
  AWAITING_FUNDING: { label: "Unfunded", cls: "bg-rose-400/15 text-rose-200 ring-rose-300/30" },
  FUNDED: { label: "Open", cls: "bg-emerald-400/15 text-emerald-200 ring-emerald-300/30" },
  ASSIGNED: { label: "In progress", cls: "bg-sky-400/15 text-sky-200 ring-sky-300/30" },
  SUBMITTED: { label: "In review", cls: "bg-amber-400/15 text-amber-200 ring-amber-300/30" },
  APPROVED: { label: "Approved", cls: "bg-emerald-400/15 text-emerald-200 ring-emerald-300/30" },
  PAID: { label: "Paid", cls: "bg-violet-400/20 text-violet-200 ring-violet-300/30" },
};