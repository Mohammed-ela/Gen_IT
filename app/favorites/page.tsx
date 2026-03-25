"use client";

import { useCallback, useEffect, useState } from "react";
import { Bookmark, Loader2, TrendingUp, Users, BarChart2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import CompanyCard from "@/components/companies/CompanyCard";
import { buildCompaniesCsv } from "@/lib/export";
import { getFavoriteSirens } from "@/lib/favorites";
import type { Company, CompanyWithFit } from "@/types";
import { EMPLOYEE_RANGES } from "@/types";

function toFit(c: Company): CompanyWithFit {
  return { ...c, fitScore: c.score, fitReasons: [] };
}

function formatK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    const sirens = getFavoriteSirens();
    if (!sirens.length) { setFavorites([]); setLoading(false); return; }

    try {
      // Batch : 1 requête pour tous les favoris
      const res = await fetch("/api/companies/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sirens }),
      });
      if (!res.ok) throw new Error();
      const data: { companies: Company[] } = await res.json();
      setFavorites(data.companies.sort((a, b) => b.score - a.score));
    } catch {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFavorites();
    window.addEventListener("favorites:changed", loadFavorites);
    return () => window.removeEventListener("favorites:changed", loadFavorites);
  }, [loadFavorites]);

  const exportFavorites = useCallback(() => {
    if (!favorites.length) return;
    const csv = buildCompaniesCsv(favorites);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gen-it-favoris-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [favorites]);

  const clearFavorites = useCallback(() => {
    window.localStorage.setItem("gen_it_favorites", JSON.stringify([]));
    window.dispatchEvent(new CustomEvent("favorites:changed", { detail: [] }));
  }, []);

  // Stats agrégées
  const avgScore = favorites.length
    ? Math.round(favorites.reduce((s, c) => s + c.score, 0) / favorites.length)
    : null;

  const totalCa = favorites.reduce((s, c) => s + (c.finances?.[0]?.ca ?? 0), 0);

  const topSectors = Object.entries(
    favorites.reduce<Record<string, number>>((acc, c) => {
      const label = c.nafSectionLabel ?? c.nafLabel ?? "Autre";
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <AppLayout>
      <div className="container-dashboard px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--text))" }}>
              Favoris
            </h1>
            <p className="text-sm mt-1.5" style={{ color: "hsl(var(--text-muted))" }}>
              Entreprises mises de côté, triées par score.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportFavorites}
              disabled={!favorites.length}
              className="px-3 py-2 rounded-xl border text-xs font-medium transition-all disabled:opacity-40"
              style={{
                backgroundColor: "hsl(var(--surface))",
                borderColor: "hsl(var(--border))",
                color: "hsl(var(--text-muted))",
              }}
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={clearFavorites}
              disabled={!favorites.length}
              className="px-3 py-2 rounded-xl border text-xs font-medium transition-all disabled:opacity-40"
              style={{
                backgroundColor: "hsl(var(--surface))",
                borderColor: "hsl(var(--border))",
                color: "hsl(var(--text-muted))",
              }}
            >
              Vider
            </button>
          </div>
        </div>

        {/* Stats agrégées — visibles uniquement quand on a des favoris */}
        {!loading && favorites.length > 0 && (
          <div
            className="max-w-5xl grid grid-cols-2 sm:grid-cols-4 gap-px mb-6 rounded-2xl overflow-hidden border"
            style={{ borderColor: "hsl(var(--border-subtle))", backgroundColor: "hsl(var(--border-subtle))" }}
          >
            <StatCell icon={<BarChart2 className="w-3.5 h-3.5" />} label="Score moyen" value={avgScore !== null ? `${avgScore}/100` : "—"} />
            <StatCell icon={<Users className="w-3.5 h-3.5" />} label="Entreprises" value={String(favorites.length)} />
            <StatCell icon={<TrendingUp className="w-3.5 h-3.5" />} label="CA cumulé" value={totalCa > 0 ? formatK(totalCa) + " €" : "—"} />
            <div
              className="p-3 space-y-1"
              style={{ backgroundColor: "hsl(var(--surface))" }}
            >
              <p className="text-[10px] uppercase tracking-widest" style={{ color: "hsl(var(--text-faint))" }}>
                Top secteurs
              </p>
              {topSectors.length ? topSectors.map(([label, count]) => (
                <p key={label} className="text-[11px] truncate" style={{ color: "hsl(var(--text-muted))" }}>
                  <span className="font-semibold" style={{ color: "hsl(var(--text))" }}>{count}×</span> {label}
                </p>
              )) : <p className="text-[11px]" style={{ color: "hsl(var(--text-faint))" }}>—</p>}
            </div>
          </div>
        )}

        {loading ? (
          <div
            className="max-w-5xl rounded-2xl border p-10 flex items-center gap-3"
            style={{ backgroundColor: "hsl(var(--surface))", borderColor: "hsl(var(--border-subtle))" }}
          >
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: "hsl(var(--accent))" }} />
            <span className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>
              Chargement…
            </span>
          </div>
        ) : favorites.length === 0 ? (
          <div
            className="max-w-5xl rounded-2xl border p-8 sm:p-10"
            style={{ backgroundColor: "hsl(var(--surface))", borderColor: "hsl(var(--border-subtle))" }}
          >
            <div
              className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center"
              style={{ backgroundColor: "hsl(var(--surface-2))" }}
            >
              <Bookmark className="w-5 h-5" style={{ color: "hsl(var(--text-faint))" }} />
            </div>
            <p className="text-base font-medium" style={{ color: "hsl(var(--text))" }}>
              Aucun favori pour l&apos;instant.
            </p>
            <p className="text-sm mt-2 max-w-xl" style={{ color: "hsl(var(--text-muted))" }}>
              Depuis la recherche, utilise l&apos;étoile sur une carte pour retrouver l&apos;entreprise ici.
            </p>
          </div>
        ) : (
          <div className="max-w-5xl space-y-3">
            {favorites.map((company) => (
              <CompanyCard key={company.siren} company={toFit(company)} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function StatCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-3 space-y-1" style={{ backgroundColor: "hsl(var(--surface))" }}>
      <div className="flex items-center gap-1.5" style={{ color: "hsl(var(--text-faint))" }}>
        {icon}
        <p className="text-[10px] uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-base font-bold font-mono" style={{ color: "hsl(var(--text))" }}>
        {value}
      </p>
    </div>
  );
}
