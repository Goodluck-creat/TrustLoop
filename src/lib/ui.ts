export const card = "rounded-3xl border border-ink/10 bg-white shadow-sm shadow-ink/5";
export const pill = "inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ring-1";
export const input =
  "w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-forest";

export const STATUS: Record<string, { label: string; cls: string }> = {
  AWAITING_FUNDING: { label: "Unfunded", cls: "bg-rose-100 text-rose-800 ring-rose-600/20" },
  FUNDED: { label: "Open", cls: "bg-emerald-100 text-emerald-800 ring-emerald-600/20" },
  ASSIGNED: { label: "In progress", cls: "bg-sky-100 text-sky-800 ring-sky-600/20" },
  SUBMITTED: { label: "In review", cls: "bg-amber-100 text-amber-800 ring-amber-600/20" },
  APPROVED: { label: "Approved", cls: "bg-emerald-100 text-emerald-800 ring-emerald-600/20" },
  PAID: { label: "Paid", cls: "bg-forest/10 text-forest ring-forest/20" },
};