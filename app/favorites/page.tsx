"use client";

import { useCallback, useEffect, useState } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import CompanyCard from "@/components/companies/CompanyCard";
import { buildCompaniesCsv } from "@/lib/export";
import { getFavoriteSirens } from "@/lib/favorites";
import type { Company } from "@/types";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    const sirens = getFavoriteSirens();

    if (!sirens.length) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    const responses = await Promise.all(
      sirens.map(async (siren) => {
        try {
          const res = await fetch(`/api/companies/${siren}`);
          if (!res.ok) return null;
          const data = await res.json();
          return data.company as Company;
        } catch {
          return null;
        }
      }),
    );

    setFavorites(
      responses
        .filter((item): item is Company => Boolean(item))
        .sort((a, b) => b.score - a.score),
    );
    setLoading(false);
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

  return (
    <AppLayout>
      <div className="container-dashboard px-1 sm:px-0 py-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--text))" }}>
              Favoris
            </h1>
            <p className="text-sm mt-1.5" style={{ color: "hsl(var(--text-muted))" }}>
              Retrouve rapidement les entreprises mises de cote et exporte-les si besoin.
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

        {loading ? (
          <div className="max-w-5xl rounded-2xl border p-10 flex items-center gap-3" style={{
            backgroundColor: "hsl(var(--surface))",
            borderColor: "hsl(var(--border-subtle))",
          }}>
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: "hsl(var(--accent))" }} />
            <span className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>
              Chargement des favoris...
            </span>
          </div>
        ) : favorites.length === 0 ? (
          <div
            className="max-w-5xl rounded-2xl border p-8 sm:p-10"
            style={{
              backgroundColor: "hsl(var(--surface))",
              borderColor: "hsl(var(--border-subtle))",
            }}
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
              Depuis la recherche, utilise l&apos;etoile sur une entreprise pour la retrouver ici.
            </p>
          </div>
        ) : (
          <div className="max-w-5xl space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>
                <span className="font-semibold" style={{ color: "hsl(var(--text))" }}>
                  {favorites.length}
                </span>{" "}
                entreprise{favorites.length > 1 ? "s" : ""} en suivi
              </p>
            </div>

            <div className="grid gap-3">
              {favorites.map((company) => (
                <CompanyCard key={company.siren} company={company} />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
