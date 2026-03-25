"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Users, Calendar, ArrowUpRight, Star, TrendingUp, TrendingDown } from "lucide-react";
import ScoreBadge from "@/components/scoring/ScoreBadge";
import SignalBadge from "@/components/scoring/SignalBadge";
import Sparkline from "@/components/ui/Sparkline";
import type { CompanyWithFit } from "@/types";
import { EMPLOYEE_RANGES } from "@/types";
import { isFavoriteSiren, toggleFavoriteSiren } from "@/lib/favorites";
import { toast } from "@/lib/toast";

export default function CompanyCard({ company }: { company: CompanyWithFit }) {
  const [isFavorite, setIsFavorite] = useState(false);

  const ageInMonths = company.creationDate
    ? Math.round((Date.now() - new Date(company.creationDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : null;

  const ageLabel =
    ageInMonths === null
      ? null
      : ageInMonths < 12
        ? `${ageInMonths} mois`
        : `${Math.round(ageInMonths / 12)} ans`;

  const latestFinance = company.finances?.[0];
  const prevFinance = company.finances?.[1];

  const margeNette =
    latestFinance?.ca && latestFinance?.resultatNet != null && latestFinance.ca > 0
      ? Math.round((latestFinance.resultatNet / latestFinance.ca) * 100)
      : null;

  // CA des 2–4 dernières années pour la sparkline (ordre chrono croissant)
  const caHistory = (company.finances ?? [])
    .filter((f) => f.ca != null)
    .slice(0, 4)
    .reverse()
    .map((f) => f.ca as number);

  const caGrowing =
    caHistory.length >= 2 ? caHistory[caHistory.length - 1] >= caHistory[0] : null;

  const employeeLabel =
    company.employeeRange && company.employeeRange !== "NN"
      ? EMPLOYEE_RANGES[company.employeeRange] ?? `${company.employeeRange} sal.`
      : null;

  useEffect(() => {
    setIsFavorite(isFavoriteSiren(company.siren));
    const sync = () => setIsFavorite(isFavoriteSiren(company.siren));
    window.addEventListener("favorites:changed", sync);
    return () => window.removeEventListener("favorites:changed", sync);
  }, [company.siren]);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleFavoriteSiren(company.siren);
    const added = next.includes(company.siren);
    setIsFavorite(added);
    toast(
      added ? `${company.name} ajouté aux favoris` : `${company.name} retiré des favoris`,
      added ? "success" : "info"
    );
  };

  return (
    <Link
      href={`/companies/${company.siren}`}
      className="group grid gap-4 rounded-2xl border p-4 transition-all md:grid-cols-[auto_minmax(0,1fr)_auto]"
      style={{
        backgroundColor: "hsl(var(--surface))",
        borderColor: "hsl(var(--border-subtle))",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "hsl(var(--accent) / 0.35)";
        e.currentTarget.style.backgroundColor = "hsl(var(--surface-2))";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "hsl(var(--border-subtle))";
        e.currentTarget.style.backgroundColor = "hsl(var(--surface))";
      }}
    >
      {/* Score + forme juridique */}
      <div className="flex items-start gap-3 md:block">
        <ScoreBadge score={company.score} details={company.scoreDetails} />
        {company.legalForm && (
          <span
            className="inline-flex md:mt-3 text-[11px] px-2 py-0.5 rounded font-medium"
            style={{ backgroundColor: "hsl(var(--surface-2))", color: "hsl(var(--text-faint))" }}
          >
            {company.legalForm}
          </span>
        )}
      </div>

      {/* Corps */}
      <div className="min-w-0 space-y-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold leading-tight" style={{ color: "hsl(var(--text))" }}>
              {company.name}
            </span>
            <span className="text-[11px] font-mono" style={{ color: "hsl(var(--text-faint))" }}>
              {company.siren}
            </span>
            {company.categoryEntreprise && (
              <span
                className="text-[11px] px-2 py-0.5 rounded font-medium"
                style={{ backgroundColor: "hsl(var(--surface-2))", color: "hsl(var(--text-faint))" }}
              >
                {company.categoryEntreprise}
              </span>
            )}
            {company.fitScore !== company.score && (
              <span
                className="text-[11px] px-2 py-0.5 rounded font-medium"
                style={{ backgroundColor: "hsl(var(--accent-muted))", color: "hsl(var(--accent))" }}
              >
                Fit {company.fitScore}
              </span>
            )}
          </div>

          {company.nafLabel && (
            <p className="text-sm" style={{ color: "hsl(var(--accent))" }}>
              {company.nafCode} — {company.nafLabel}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
          {company.city && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--text-faint))" }}>
              <MapPin className="w-3 h-3" />
              {company.city}{company.department ? ` · ${company.department}` : ""}
            </span>
          )}
          {employeeLabel && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--text-faint))" }}>
              <Users className="w-3 h-3" />
              {employeeLabel}
            </span>
          )}
          {ageLabel && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--text-faint))" }}>
              <Calendar className="w-3 h-3" />
              {ageLabel}
            </span>
          )}
          {margeNette !== null && (
            <span
              className="flex items-center gap-1 text-xs font-mono"
              style={{ color: margeNette >= 0 ? "hsl(var(--emerald))" : "hsl(var(--red))" }}
            >
              {margeNette >= 0
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />
              }
              marge {margeNette > 0 ? "+" : ""}{margeNette}%
            </span>
          )}
          {caHistory.length >= 2 && (
            <Sparkline values={caHistory} positive={caGrowing ?? true} />
          )}
        </div>

        {company.signals?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {company.signals.slice(0, 4).map((s) => (
              <SignalBadge key={s} signal={s} />
            ))}
          </div>
        )}

        {company.fitReasons.length > 0 && company.fitScore !== company.score && (
          <p className="text-[11px]" style={{ color: "hsl(var(--text-faint))" }}>
            Match : {company.fitReasons.join(" · ")}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="hidden md:flex items-start justify-end">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            onClick={handleFavorite}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border transition-colors"
            style={{
              borderColor: isFavorite ? "hsl(var(--accent) / 0.35)" : "hsl(var(--border-subtle))",
              backgroundColor: isFavorite ? "hsl(var(--accent-muted))" : "transparent",
              color: isFavorite ? "hsl(var(--accent))" : "hsl(var(--text-faint))",
            }}
          >
            <Star className="w-3.5 h-3.5" fill={isFavorite ? "currentColor" : "none"} />
          </button>
          <ArrowUpRight
            className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "hsl(var(--accent))" }}
          />
        </div>
      </div>
    </Link>
  );
}
