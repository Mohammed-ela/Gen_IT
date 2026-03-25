"use client";

import { useState } from "react";
import { getScoreCategory } from "@/lib/scoring";
import type { ScoreDetails } from "@/types";

const CRITERIA = [
  { key: "recency"   as const, label: "Récence",   max: 20 },
  { key: "activity"  as const, label: "Secteur",   max: 20 },
  { key: "size"      as const, label: "Taille",    max: 15 },
  { key: "stability" as const, label: "Stabilité", max: 20 },
  { key: "finances"  as const, label: "Finances",  max: 15 },
  { key: "signals"   as const, label: "Signaux",   max: 10 },
];

interface Props {
  score: number;
  size?: "sm" | "md" | "lg";
  details?: ScoreDetails | null;
}

export default function ScoreBadge({ score, size = "md", details }: Props) {
  const [open, setOpen] = useState(false);
  const cat = getScoreCategory(score);

  const dim = {
    sm: "w-9 h-9 text-xs",
    md: "w-11 h-11 text-sm",
    lg: "w-16 h-16 text-xl",
  }[size];

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        className={`${dim} rounded-lg flex flex-col items-center justify-center border font-mono font-bold cursor-default`}
        style={{ backgroundColor: cat.bg, borderColor: cat.border, color: cat.color }}
        onMouseEnter={() => details && setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => details && setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label={`Score ${score}/100`}
      >
        {score}
        {size === "lg" && (
          <span className="text-[9px] font-sans font-normal mt-0.5 opacity-70">
            {cat.label}
          </span>
        )}
      </button>

      {open && details && (
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-44 rounded-xl border p-3 space-y-2 shadow-xl pointer-events-none"
          style={{
            backgroundColor: "hsl(var(--surface))",
            borderColor: "hsl(var(--border))",
          }}
        >
          {/* Flèche */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
            style={{
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid hsl(var(--border))",
            }}
          />

          {CRITERIA.map((c) => {
            const val = details[c.key] ?? 0;
            const pct = Math.round((val / c.max) * 100);
            return (
              <div key={c.key}>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[10px]" style={{ color: "hsl(var(--text-muted))" }}>
                    {c.label}
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: "hsl(var(--text-faint))" }}>
                    {val}/{c.max}
                  </span>
                </div>
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ backgroundColor: "hsl(var(--surface-2))" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: "hsl(var(--accent))",
                      opacity: 0.5 + pct / 200,
                    }}
                  />
                </div>
              </div>
            );
          })}

          <p
            className="text-[10px] pt-1 border-t text-center"
            style={{ color: "hsl(var(--text-faint))", borderColor: "hsl(var(--border-subtle))" }}
          >
            {score}/100 — {cat.label}
          </p>
        </div>
      )}
    </div>
  );
}
