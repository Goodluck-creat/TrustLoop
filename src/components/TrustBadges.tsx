import { BadgeCheck, Users } from "lucide-react";
import { pill } from "@/lib/ui";
import type { ExternalLevel, TrustSummary } from "@/lib/trust";

export const LEVEL: Record<ExternalLevel, { label: string; cls: string }> = {
  CONFIRMED: { label: "Confirmed by referee", cls: "bg-emerald-100 text-emerald-800 ring-emerald-600/20" },
  CHECKED: { label: "Link checked", cls: "bg-sky-100 text-sky-800 ring-sky-600/20" },
  SELF: { label: "Self-reported", cls: "bg-cream text-muted ring-ink/15" },
  DISPUTED: { label: "Disputed by referee", cls: "bg-rose-100 text-rose-800 ring-rose-600/20" },
};

export function LevelPill({ level }: { level: ExternalLevel }) {
  return <span className={`${pill} ${LEVEL[level].cls}`}>{LEVEL[level].label}</span>;
}

export default function TrustBadges({ s }: { s: TrustSummary }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <span className={`${pill} bg-forest/10 text-forest ring-forest/20`}>
          <BadgeCheck className="mr-1 h-3.5 w-3.5" aria-hidden /> {s.verified} verified on TrustLoop
        </span>
        <span className={`${pill} bg-cream text-ink ring-ink/15`}>
          <Users className="mr-1 h-3.5 w-3.5" aria-hidden /> {s.hirers} {s.hirers === 1 ? "hirer" : "hirers"}
        </span>
      </div>
      {s.recent.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted">Recent verified work</p>
          <ul className="mt-1 space-y-1 text-sm">
            {s.recent.map((t, i) => (<li key={i} className="truncate">{t}</li>))}
          </ul>
        </div>
      )}
      {s.external.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted">Outside work</p>
          <ul className="mt-1 space-y-1 text-sm">
            {s.external.map((w, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 truncate">{w.title}</span>
                <LevelPill level={w.level} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
