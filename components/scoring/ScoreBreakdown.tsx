import type { ScoreDetails } from "@/types";
import { getScoreCategory } from "@/lib/scoring";

const CRITERIA = [
  { key: "recency"   as const, label: "Récence",    max: 20, hint: "Fraîcheur de création" },
  { key: "activity"  as const, label: "Secteur",    max: 20, hint: "Pertinence du secteur NAF" },
  { key: "size"      as const, label: "Taille",     max: 15, hint: "Effectif déclaré" },
  { key: "stability" as const, label: "Stabilité",  max: 20, hint: "Santé légale (BODACC)" },
  { key: "finances"  as const, label: "Finances",   max: 15, hint: "CA, résultat net déclarés" },
  { key: "signals"   as const, label: "Signaux",    max: 10, hint: "Levées de fonds, expansion…" },
];

export default function ScoreBreakdown({
  score, details,
}: {
  score: number;
  details?: ScoreDetails | null;
}) {
  const cat = getScoreCategory(score);

  return (
    <div className="rounded-lg border p-5 space-y-5"
      style={{ backgroundColor: "hsl(var(--surface))", borderColor: "hsl(var(--border-subtle))" }}>

      {/* Score global */}
      <div className="text-center">
        <div className="inline-flex w-16 h-16 rounded-xl items-center justify-center border mx-auto"
          style={{ backgroundColor: cat.bg, borderColor: cat.border }}>
          <span className="text-2xl font-bold font-mono" style={{ color: cat.color }}>{score}</span>
        </div>
        <p className="text-xs font-semibold mt-1.5" style={{ color: cat.color }}>{cat.label}</p>
        <p className="text-[11px] mt-0.5" style={{ color: "hsl(var(--text-faint))" }}>Score sur 100</p>
      </div>

      {/* Barres par critère */}
      <div className="space-y-2.5">
        {CRITERIA.map((c) => {
          const val = details?.[c.key] ?? 0;
          const pct = Math.round((val / c.max) * 100);
          return (
            <div key={c.key} title={c.hint}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>{c.label}</span>
                <span className="text-[11px] font-mono" style={{ color: "hsl(var(--text-faint))" }}>
                  {val}/{c.max}
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden"
                style={{ backgroundColor: "hsl(var(--surface-2))" }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: "hsl(var(--accent))", opacity: 0.6 + pct / 250 }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="space-y-1.5 pt-3 border-t"
        style={{ borderColor: "hsl(var(--border-subtle))" }}>
        {([
          { min: 70, label: "Chaud",  color: "hsl(158 60% 46%)" },
          { min: 45, label: "Tiède",  color: "hsl(38 85% 58%)" },
          { min: 0,  label: "Froid",  color: "hsl(220 10% 55%)" },
        ] as const).map((l) => (
          <div key={l.min} className="flex items-center gap-2 text-[11px]"
            style={{ color: "hsl(var(--text-faint))" }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: l.color }} />
            <span>{l.min}+ = <strong style={{ color: l.color }}>{l.label}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}
