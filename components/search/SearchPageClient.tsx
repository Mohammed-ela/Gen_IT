"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react";
import CompanyCard from "@/components/companies/CompanyCard";
import SearchFilters from "@/components/search/SearchFilters";
import AppLayout from "@/components/layout/AppLayout";
import type { Company, SearchFilters as Filters, SearchResponse } from "@/types";
import { buildCompaniesCsv } from "@/lib/export";
import { getFavoriteSirens } from "@/lib/favorites";
import {
  computeIcpFit,
  ICP_LABELS,
  DEFAULT_CUSTOM_ICP,
  type CustomIcpSettings,
  type IcpProfile,
} from "@/lib/icp";

type SortOption = "score" | "recent" | "name";

function parseFilters(params: URLSearchParams): Filters {
  return {
    nafCode: params.get("nafCode") ?? undefined,
    department: params.get("department") ?? undefined,
    postalCode: params.get("postalCode") ?? undefined,
    employeeRange: params.get("employeeRange") ?? undefined,
    legalForm: params.get("legalForm") ?? undefined,
  };
}

function parseCustomIcp(params: URLSearchParams): CustomIcpSettings {
  return {
    targetSector: (params.get("icp_sector") as CustomIcpSettings["targetSector"]) || DEFAULT_CUSTOM_ICP.targetSector,
    minEmployees: (params.get("icp_size") as CustomIcpSettings["minEmployees"]) || DEFAULT_CUSTOM_ICP.minEmployees,
    prefersRecent: params.get("icp_recent") === "1",
    prefersGrowth: params.get("icp_growth") === "1",
    prefersMultiSite: params.get("icp_multi") === "1",
  };
}

function hasSearchState(query: string, filters: Filters): boolean {
  return Boolean(query.trim() || Object.values(filters).some(Boolean));
}

export default function SearchPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("query") ?? "";
  const initialFilters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const initialPage = Number(searchParams.get("page") ?? "1");
  const initialSort = (searchParams.get("sort") as SortOption) || "score";
  const initialIcpProfile = (searchParams.get("icp") as IcpProfile) || "default";
  const initialCustomIcp = useMemo(() => parseCustomIcp(searchParams), [searchParams]);

  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [favoriteSirens, setFavoriteSirens] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [icpProfile, setIcpProfile] = useState<IcpProfile>(initialIcpProfile);
  const [customIcp, setCustomIcp] = useState<CustomIcpSettings>(initialCustomIcp);

  const hydratedRef = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const syncUrl = useCallback(
    (q: string, f: Filters, page: number, sortBy: SortOption, profile: IcpProfile, custom: CustomIcpSettings) => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("query", q.trim());
      if (f.nafCode) params.set("nafCode", f.nafCode);
      if (f.department) params.set("department", f.department);
      if (f.postalCode) params.set("postalCode", f.postalCode);
      if (f.employeeRange) params.set("employeeRange", f.employeeRange);
      if (f.legalForm) params.set("legalForm", f.legalForm);
      if (sortBy !== "score") params.set("sort", sortBy);
      if (profile !== "default") params.set("icp", profile);
      if (profile === "custom") {
        if (custom.targetSector !== "any") params.set("icp_sector", custom.targetSector);
        if (custom.minEmployees !== "any") params.set("icp_size", custom.minEmployees);
        if (custom.prefersRecent) params.set("icp_recent", "1");
        if (custom.prefersGrowth) params.set("icp_growth", "1");
        if (custom.prefersMultiSite) params.set("icp_multi", "1");
      }
      if (page > 1) params.set("page", String(page));

      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(nextUrl, { scroll: false });
    },
    [pathname, router],
  );

  const doSearch = useCallback(
    async (
      q: string,
      f: Filters,
      page = 1,
      sortBy: SortOption = "score",
      updateUrl = true,
      profile: IcpProfile = icpProfile,
      custom: CustomIcpSettings = customIcp,
    ) => {
      if (!hasSearchState(q, f)) {
        setResults(null);
        setError(null);
        setCurrentPage(1);
        if (updateUrl) syncUrl("", {}, 1, "score", profile, custom);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set("query", q.trim());
        if (f.nafCode) params.set("nafCode", f.nafCode);
        if (f.department) params.set("department", f.department);
        if (f.postalCode) params.set("postalCode", f.postalCode);
        if (f.employeeRange) params.set("employeeRange", f.employeeRange);
        if (f.legalForm) params.set("legalForm", f.legalForm);
        params.set("sort", sortBy);
        params.set("page", String(page));
        params.set("limit", "20");

        const res = await fetch(`/api/companies/search?${params.toString()}`);
        if (!res.ok) throw new Error("Erreur lors de la recherche");

        const data: SearchResponse = await res.json();
        setResults(data);
        setCurrentPage(page);
        if (updateUrl) syncUrl(q, f, page, sortBy, profile, custom);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    },
    [syncUrl, icpProfile, customIcp],
  );

  useEffect(() => {
    const startingFilters = parseFilters(new URLSearchParams(searchParams.toString()));
    const startingQuery = searchParams.get("query") ?? "";
    const startingPage = Number(searchParams.get("page") ?? "1");
    const startingSort = (searchParams.get("sort") as SortOption) || "score";
    const startingIcpProfile = (searchParams.get("icp") as IcpProfile) || "default";
    const startingCustomIcp = parseCustomIcp(new URLSearchParams(searchParams.toString()));

    setQuery(startingQuery);
    setFilters(startingFilters);
    setSort(startingSort);
    setCurrentPage(startingPage);
    setIcpProfile(startingIcpProfile);
    setCustomIcp(startingCustomIcp);

    if (hasSearchState(startingQuery, startingFilters)) {
      void doSearch(startingQuery, startingFilters, startingPage, startingSort, false, startingIcpProfile, startingCustomIcp);
    }

    hydratedRef.current = true;
  }, [searchParams, doSearch]);

  useEffect(() => {
    if (!hydratedRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void doSearch(query, filters, 1, sort, true);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, filters, sort, icpProfile, customIcp, doSearch]);

  useEffect(() => {
    const sync = () => {
      const favorites = getFavoriteSirens();
      setFavoriteCount(favorites.length);
      setFavoriteSirens(favorites);
    };
    sync();
    window.addEventListener("favorites:changed", sync);
    return () => window.removeEventListener("favorites:changed", sync);
  }, []);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const hasFilters = showFilters || activeFilterCount > 0;
  const hasActiveSearch = hasSearchState(query, filters);
  const rankedResults = (results?.data ?? [])
    .map((company) => {
      const fit = computeIcpFit(company, icpProfile, customIcp);
      return {
        ...company,
        fitScore: fit.fitScore,
        fitReasons: fit.reasons,
      };
    })
    .sort((a, b) => {
      if (icpProfile === "default") return 0;
      return b.fitScore - a.fitScore;
    });
  const visibleResults = favoritesOnly
    ? rankedResults.filter((company) => favoriteSirens.includes(company.siren))
    : rankedResults;

  const exportCsv = useCallback(() => {
    if (!results?.data?.length) return;
    const csv = buildCompaniesCsv(results.data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gen-it-search-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [results]);

  const setCustomField = useCallback(
    <K extends keyof CustomIcpSettings>(key: K, value: CustomIcpSettings[K]) => {
      setCustomIcp((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  return (
    <AppLayout>
      <div className="container-dashboard px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 max-w-3xl">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--text))" }}>
            Recherche d&apos;entreprises
          </h1>
          <p className="text-sm mt-1.5 max-w-2xl" style={{ color: "hsl(var(--text-muted))" }}>
            Base SIRENE avec scoring, tri et URL partageable pour reprendre une analyse sans
            perdre le contexte.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="space-y-4 xl:sticky xl:top-16 self-start">
            <div
              className="rounded-2xl border p-4"
              style={{
                backgroundColor: "hsl(var(--surface))",
                borderColor: "hsl(var(--border-subtle))",
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p
                    className="text-[11px] uppercase tracking-[0.18em]"
                    style={{ color: "hsl(var(--text-faint))" }}
                  >
                    Recherche
                  </p>
                  <p className="text-sm mt-1" style={{ color: "hsl(var(--text-muted))" }}>
                    Recherche instantanee, filtres persistants et partageables.
                  </p>
                  <p className="text-[11px] mt-2" style={{ color: "hsl(var(--text-faint))" }}>
                    {favoriteCount} favori{favoriteCount > 1 ? "s" : ""} sauvegarde{favoriteCount > 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex xl:hidden items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium"
                  style={{
                    backgroundColor: hasFilters ? "hsl(var(--accent-muted))" : "hsl(var(--surface-2))",
                    borderColor: hasFilters
                      ? "hsl(var(--accent) / 0.35)"
                      : "hsl(var(--border-subtle))",
                    color: hasFilters ? "hsl(var(--accent))" : "hsl(var(--text-muted))",
                  }}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filtres
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void doSearch(query, filters, 1, sort, true);
                }}
                className="space-y-3"
              >
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: "hsl(var(--text-faint))" }}
                  />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Nom d'entreprise, SIREN, activite..."
                    className="w-full pl-9 pr-9 py-3 text-sm rounded-xl border outline-none transition-all"
                    style={{
                      backgroundColor: "hsl(var(--surface-2))",
                      borderColor: "hsl(var(--border))",
                      color: "hsl(var(--text))",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "hsl(var(--accent))";
                      e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--accent) / 0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "hsl(var(--border))";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "hsl(var(--text-faint))" }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: "hsl(var(--accent))",
                    color: "hsl(var(--accent-fg))",
                  }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  {loading ? "Recherche..." : "Rechercher"}
                </button>

                <button
                  type="button"
                  onClick={() => setFavoritesOnly((value) => !value)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all"
                  style={{
                    backgroundColor: favoritesOnly ? "hsl(var(--accent-muted))" : "hsl(var(--surface))",
                    border: `1px solid ${favoritesOnly ? "hsl(var(--accent) / 0.35)" : "hsl(var(--border))"}`,
                    color: favoritesOnly ? "hsl(var(--accent))" : "hsl(var(--text-muted))",
                  }}
                >
                  {favoritesOnly ? "Affichage: favoris" : "Afficher seulement mes favoris"}
                </button>

                <div className="space-y-1">
                  <label className="text-[11px]" style={{ color: "hsl(var(--text-faint))" }}>
                    Profil ICP
                  </label>
                  <select
                    value={icpProfile}
                    onChange={(e) => setIcpProfile(e.target.value as IcpProfile)}
                    className="field-input"
                  >
                    {Object.entries(ICP_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {icpProfile === "custom" && (
                  <div
                    className="rounded-xl border p-3 space-y-3"
                    style={{
                      borderColor: "hsl(var(--border))",
                      backgroundColor: "hsl(var(--surface-2))",
                    }}
                  >
                    <div className="space-y-1">
                      <label className="text-[11px]" style={{ color: "hsl(var(--text-faint))" }}>
                        Secteur cible
                      </label>
                      <select
                        value={customIcp.targetSector}
                        onChange={(e) => setCustomField("targetSector", e.target.value as CustomIcpSettings["targetSector"])}
                        className="field-input"
                      >
                        <option value="any">Indifferent</option>
                        <option value="tech">Tech</option>
                        <option value="industry">Industrie / BTP</option>
                        <option value="distributed">Reseau distribue</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px]" style={{ color: "hsl(var(--text-faint))" }}>
                        Taille cible
                      </label>
                      <select
                        value={customIcp.minEmployees}
                        onChange={(e) => setCustomField("minEmployees", e.target.value as CustomIcpSettings["minEmployees"])}
                        className="field-input"
                      >
                        <option value="any">Indifferente</option>
                        <option value="small">Petite structure</option>
                        <option value="medium">PME / taille moyenne</option>
                      </select>
                    </div>

                    <div className="grid gap-2">
                      <ToggleRow
                        label="Favoriser entreprises recentes"
                        checked={customIcp.prefersRecent}
                        onChange={(value) => setCustomField("prefersRecent", value)}
                      />
                      <ToggleRow
                        label="Favoriser signaux de croissance"
                        checked={customIcp.prefersGrowth}
                        onChange={(value) => setCustomField("prefersGrowth", value)}
                      />
                      <ToggleRow
                        label="Favoriser structures multi-sites"
                        checked={customIcp.prefersMultiSite}
                        onChange={(value) => setCustomField("prefersMultiSite", value)}
                      />
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className={showFilters ? "block xl:block" : "hidden xl:block"}>
              <SearchFilters filters={filters} onChange={setFilters} />
            </div>
          </aside>

          <section className="min-w-0">
            {error && (
              <div
                className="mb-4 p-3.5 rounded-xl border text-sm"
                style={{
                  backgroundColor: "hsl(var(--red) / 0.08)",
                  borderColor: "hsl(var(--red) / 0.3)",
                  color: "hsl(var(--red))",
                }}
              >
                {error}
              </div>
            )}

            {results && !loading && (
              <div className="max-w-5xl space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p
                      className="text-[11px] uppercase tracking-[0.18em]"
                      style={{ color: "hsl(var(--text-faint))" }}
                    >
                      Resultats
                    </p>
                    <p className="text-sm mt-1" style={{ color: "hsl(var(--text-muted))" }}>
                      <span className="font-semibold" style={{ color: "hsl(var(--text))" }}>
                        {favoritesOnly ? visibleResults.length.toLocaleString("fr-FR") : results.total.toLocaleString("fr-FR")}
                      </span>{" "}
                      entreprises{favoritesOnly ? " favorites" : ""}
                    </p>
                    {icpProfile !== "default" && (
                      <p className="text-[11px] mt-1" style={{ color: "hsl(var(--accent))" }}>
                        Rerank selon: {ICP_LABELS[icpProfile]}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-wrap justify-end">
                    <button
                      type="button"
                      onClick={exportCsv}
                      className="px-3 py-2 rounded-xl border text-xs font-medium transition-all"
                      style={{
                        backgroundColor: "hsl(var(--surface))",
                        borderColor: "hsl(var(--border))",
                        color: "hsl(var(--text-muted))",
                      }}
                    >
                      Export CSV
                    </button>
                    <label className="text-xs" style={{ color: "hsl(var(--text-faint))" }}>
                      Tri
                    </label>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortOption)}
                      className="field-input min-w-[11rem]"
                    >
                      <option value="score">Score descendant</option>
                      <option value="recent">Creation recente</option>
                      <option value="name">Nom A-Z</option>
                    </select>
                    <span className="text-xs font-mono" style={{ color: "hsl(var(--text-faint))" }}>
                      page {currentPage}/{results.totalPages}
                    </span>
                  </div>
                </div>

                <div className="grid gap-3">
                  {visibleResults.map((company: Company) => (
                    <CompanyCard key={company.siren} company={company} />
                  ))}
                </div>

                {results.totalPages > 1 && !favoritesOnly && (
                  <div className="flex justify-center gap-2 pt-4">
                    <PageBtn
                      label="Precedent"
                      disabled={currentPage <= 1}
                      onClick={() => void doSearch(query, filters, currentPage - 1, sort, true)}
                    />
                    <PageBtn
                      label="Suivant"
                      disabled={currentPage >= results.totalPages}
                      onClick={() => void doSearch(query, filters, currentPage + 1, sort, true)}
                    />
                  </div>
                )}
              </div>
            )}

            {loading && (
              <div className="max-w-5xl space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-28 rounded-2xl animate-pulse"
                    style={{ backgroundColor: "hsl(var(--surface))" }}
                  />
                ))}
              </div>
            )}

            {!results && !loading && (
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
                  <Search className="w-5 h-5" style={{ color: "hsl(var(--text-faint))" }} />
                </div>
                <p className="text-base font-medium" style={{ color: "hsl(var(--text))" }}>
                  Lance une recherche pour afficher une liste structuree.
                </p>
                <p className="text-sm mt-2 max-w-xl" style={{ color: "hsl(var(--text-muted))" }}>
                  Ton URL gardera les filtres et le tri. Pratique pour reprendre une analyse ou
                  partager un segment.
                </p>
              </div>
            )}

            {!loading && hasActiveSearch && results?.data.length === 0 && (
              <div
                className="max-w-5xl rounded-2xl border p-8"
                style={{
                  backgroundColor: "hsl(var(--surface))",
                  borderColor: "hsl(var(--border-subtle))",
                }}
              >
                <p className="text-base font-medium" style={{ color: "hsl(var(--text))" }}>
                  Aucun resultat avec ces criteres.
                </p>
                <p className="text-sm mt-2" style={{ color: "hsl(var(--text-muted))" }}>
                  Elargis le departement, retire un filtre d&apos;effectif ou repasse le tri sur
                  score.
                </p>
              </div>
            )}

            {!loading && favoritesOnly && results && visibleResults.length === 0 && results.data.length > 0 && (
              <div
                className="max-w-5xl rounded-2xl border p-8"
                style={{
                  backgroundColor: "hsl(var(--surface))",
                  borderColor: "hsl(var(--border-subtle))",
                }}
              >
                <p className="text-base font-medium" style={{ color: "hsl(var(--text))" }}>
                  Aucun favori dans ce jeu de resultats.
                </p>
                <p className="text-sm mt-2" style={{ color: "hsl(var(--text-muted))" }}>
                  Ajoute des entreprises avec l&apos;etoile puis reactive ce filtre.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}

function PageBtn({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 rounded-xl border text-xs font-medium transition-all disabled:opacity-30"
      style={{
        backgroundColor: "hsl(var(--surface))",
        borderColor: "hsl(var(--border))",
        color: "hsl(var(--text-muted))",
      }}
    >
      {label}
    </button>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-xs" style={{ color: "hsl(var(--text-muted))" }}>
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative w-10 h-6 rounded-full transition-colors"
        style={{ backgroundColor: checked ? "hsl(var(--accent))" : "hsl(var(--border))" }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform"
          style={{
            backgroundColor: "white",
            transform: checked ? "translateX(16px)" : "translateX(0)",
          }}
        />
      </button>
    </label>
  );
}
