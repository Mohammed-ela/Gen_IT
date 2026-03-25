"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react";
import CompanyCard from "@/components/companies/CompanyCard";
import SearchFilters from "@/components/search/SearchFilters";
import AppLayout from "@/components/layout/AppLayout";
import type { Company, CompanyWithFit, SearchFilters as Filters, SearchResponse } from "@/types";
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
  const minScoreRaw = params.get("minScore");
  return {
    nafCode: params.get("nafCode") ?? undefined,
    department: params.get("department") ?? undefined,
    postalCode: params.get("postalCode") ?? undefined,
    employeeRange: params.get("employeeRange") ?? undefined,
    legalForm: params.get("legalForm") ?? undefined,
    minScore: minScoreRaw ? parseInt(minScoreRaw, 10) : undefined,
    createdAfter: params.get("createdAfter") ?? undefined,
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

  const [query, setQuery] = useState(() => searchParams.get("query") ?? "");
  const [filters, setFilters] = useState<Filters>(() => parseFilters(searchParams));
  const [sort, setSort] = useState<SortOption>(() => (searchParams.get("sort") as SortOption) || "score");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => Number(searchParams.get("page") ?? "1"));
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [favoriteSirens, setFavoriteSirens] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [icpProfile, setIcpProfile] = useState<IcpProfile>(() => (searchParams.get("icp") as IcpProfile) || "default");
  const [customIcp, setCustomIcp] = useState<CustomIcpSettings>(() => parseCustomIcp(searchParams));

  // Ref pour annuler les requêtes en cours si une nouvelle part avant la fin
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  // Indique que l'hydration initiale est terminée
  const didInitRef = useRef(false);

  const syncUrl = useCallback(
    (q: string, f: Filters, page: number, sortBy: SortOption, profile: IcpProfile, custom: CustomIcpSettings) => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("query", q.trim());
      if (f.nafCode) params.set("nafCode", f.nafCode);
      if (f.department) params.set("department", f.department);
      if (f.postalCode) params.set("postalCode", f.postalCode);
      if (f.employeeRange) params.set("employeeRange", f.employeeRange);
      if (f.legalForm) params.set("legalForm", f.legalForm);
      if (f.minScore) params.set("minScore", String(f.minScore));
      if (f.createdAfter) params.set("createdAfter", f.createdAfter);
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
      profile: IcpProfile = "default",
      custom: CustomIcpSettings = DEFAULT_CUSTOM_ICP,
    ) => {
      if (!hasSearchState(q, f)) {
        setResults(null);
        setError(null);
        setCurrentPage(1);
        if (updateUrl) syncUrl("", {}, 1, "score", profile, custom);
        return;
      }

      // Annule la requête précédente si elle tourne encore
      abortRef.current?.abort();
      abortRef.current = new AbortController();

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
        if (f.minScore) params.set("minScore", String(f.minScore));
        if (f.createdAfter) params.set("createdAfter", f.createdAfter);
        params.set("sort", sortBy);
        params.set("page", String(page));
        params.set("limit", "20");

        const res = await fetch(`/api/companies/search?${params.toString()}`, {
          signal: abortRef.current.signal,
        });
        if (!res.ok) throw new Error("Erreur lors de la recherche");

        const data: SearchResponse = await res.json();
        setResults(data);
        setCurrentPage(page);
        if (updateUrl) syncUrl(q, f, page, sortBy, profile, custom);
      } catch (err) {
        // Ignore les annulations volontaires
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    },
    [syncUrl],
  );

  // Ref toujours à jour pour les effets qui n'ont pas doSearch en dep
  const doSearchRef = useRef(doSearch);
  useEffect(() => { doSearchRef.current = doSearch; }, [doSearch]);

  // Hydration initiale — état depuis l'URL, puis déclenche la recherche si besoin
  // On ne met pas doSearch en dep pour éviter la boucle : user tape → doSearch change → effet reset query
  useEffect(() => {
    const urlQuery = searchParams.get("query") ?? "";
    const urlFilters = parseFilters(searchParams);
    const urlPage = Number(searchParams.get("page") ?? "1");
    const urlSort = (searchParams.get("sort") as SortOption) || "score";
    const urlProfile = (searchParams.get("icp") as IcpProfile) || "default";
    const urlCustom = parseCustomIcp(searchParams);

    setQuery(urlQuery);
    setFilters(urlFilters);
    setSort(urlSort);
    setCurrentPage(urlPage);
    setIcpProfile(urlProfile);
    setCustomIcp(urlCustom);

    if (hasSearchState(urlQuery, urlFilters)) {
      void doSearchRef.current(urlQuery, urlFilters, urlPage, urlSort, false, urlProfile, urlCustom);
    }

    didInitRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Debounce sur les saisies utilisateur — ne s'active qu'après l'hydration
  useEffect(() => {
    if (!didInitRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void doSearch(query, filters, 1, sort, true, icpProfile, customIcp);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, filters, sort, icpProfile, customIcp, doSearch]);

  // Sync des favoris (localStorage → state)
  useEffect(() => {
    const sync = () => {
      const favs = getFavoriteSirens();
      setFavoriteCount(favs.length);
      setFavoriteSirens(favs);
    };
    sync();
    window.addEventListener("favorites:changed", sync);
    return () => window.removeEventListener("favorites:changed", sync);
  }, []);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const hasFilters = showFilters || activeFilterCount > 0;
  const hasActiveSearch = hasSearchState(query, filters);

  // ICP scoring — mémoïsé pour ne pas recalculer à chaque rendu non lié
  const rankedResults = useMemo<CompanyWithFit[]>(() => {
    return (results?.data ?? [])
      .map((company) => {
        const fit = computeIcpFit(company, icpProfile, customIcp);
        return { ...company, fitScore: fit.fitScore, fitReasons: fit.reasons };
      })
      .sort((a, b) => {
        if (icpProfile === "default") return 0;
        return b.fitScore - a.fitScore;
      });
  }, [results?.data, icpProfile, customIcp]);

  const visibleResults = favoritesOnly
    ? rankedResults.filter((c) => favoriteSirens.includes(c.siren))
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
            Base SIRENE — scoring, filtres et URL partageable.
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
                    Filtres persistants et URL partageable.
                  </p>
                  <p className="text-[11px] mt-2" style={{ color: "hsl(var(--text-faint))" }}>
                    {favoriteCount} favori{favoriteCount > 1 ? "s" : ""} sauvegardé{favoriteCount > 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex xl:hidden items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium"
                  style={{
                    backgroundColor: hasFilters ? "hsl(var(--accent-muted))" : "hsl(var(--surface-2))",
                    borderColor: hasFilters ? "hsl(var(--accent) / 0.35)" : "hsl(var(--border-subtle))",
                    color: hasFilters ? "hsl(var(--accent))" : "hsl(var(--text-muted))",
                  }}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filtres{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void doSearch(query, filters, 1, sort, true, icpProfile, customIcp);
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
                    placeholder="Nom, SIREN, activité..."
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
                  onClick={() => setFavoritesOnly((v) => !v)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all"
                  style={{
                    backgroundColor: favoritesOnly ? "hsl(var(--accent-muted))" : "hsl(var(--surface))",
                    border: `1px solid ${favoritesOnly ? "hsl(var(--accent) / 0.35)" : "hsl(var(--border))"}`,
                    color: favoritesOnly ? "hsl(var(--accent))" : "hsl(var(--text-muted))",
                  }}
                >
                  {favoritesOnly ? "Affichage : favoris" : "Favoris uniquement"}
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
                        <option value="any">Indifférent</option>
                        <option value="tech">Tech</option>
                        <option value="industry">Industrie / BTP</option>
                        <option value="distributed">Réseau distribué</option>
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
                        <option value="any">Indifférente</option>
                        <option value="small">Petite structure</option>
                        <option value="medium">PME / taille moyenne</option>
                      </select>
                    </div>

                    <div className="grid gap-2">
                      <ToggleRow
                        label="Favoriser entreprises récentes"
                        checked={customIcp.prefersRecent}
                        onChange={(v) => setCustomField("prefersRecent", v)}
                      />
                      <ToggleRow
                        label="Favoriser signaux de croissance"
                        checked={customIcp.prefersGrowth}
                        onChange={(v) => setCustomField("prefersGrowth", v)}
                      />
                      <ToggleRow
                        label="Favoriser structures multi-sites"
                        checked={customIcp.prefersMultiSite}
                        onChange={(v) => setCustomField("prefersMultiSite", v)}
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
                    <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "hsl(var(--text-faint))" }}>
                      Résultats
                    </p>
                    <p className="text-sm mt-1" style={{ color: "hsl(var(--text-muted))" }}>
                      <span className="font-semibold" style={{ color: "hsl(var(--text))" }}>
                        {favoritesOnly ? visibleResults.length.toLocaleString("fr-FR") : results.total.toLocaleString("fr-FR")}
                      </span>{" "}
                      entreprise{(favoritesOnly ? visibleResults.length : results.total) > 1 ? "s" : ""}
                      {favoritesOnly ? " favorites" : ""}
                    </p>
                    {icpProfile !== "default" && (
                      <p className="text-[11px] mt-1" style={{ color: "hsl(var(--accent))" }}>
                        Reranké selon : {ICP_LABELS[icpProfile]}
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
                      <option value="recent">Création récente</option>
                      <option value="name">Nom A–Z</option>
                    </select>
                    <span className="text-xs font-mono" style={{ color: "hsl(var(--text-faint))" }}>
                      {currentPage}/{results.totalPages}
                    </span>
                  </div>
                </div>

                <div className="grid gap-3">
                  {visibleResults.map((company: CompanyWithFit) => (
                    <CompanyCard key={company.siren} company={company} />
                  ))}
                </div>

                {results.totalPages > 1 && !favoritesOnly && (
                  <div className="flex justify-center gap-2 pt-4">
                    <PageBtn
                      label="Précédent"
                      disabled={currentPage <= 1}
                      onClick={() => void doSearch(query, filters, currentPage - 1, sort, true, icpProfile, customIcp)}
                    />
                    <PageBtn
                      label="Suivant"
                      disabled={currentPage >= results.totalPages}
                      onClick={() => void doSearch(query, filters, currentPage + 1, sort, true, icpProfile, customIcp)}
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
                  Lance une recherche pour afficher une liste.
                </p>
                <p className="text-sm mt-2 max-w-xl" style={{ color: "hsl(var(--text-muted))" }}>
                  L&apos;URL garde les filtres et le tri — pratique pour partager un segment ou reprendre plus tard.
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
                  Aucun résultat avec ces critères.
                </p>
                <p className="text-sm mt-2" style={{ color: "hsl(var(--text-muted))" }}>
                  Élargis le département, retire un filtre ou baisse le score minimum.
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
                  Aucun favori dans ce jeu de résultats.
                </p>
                <p className="text-sm mt-2" style={{ color: "hsl(var(--text-muted))" }}>
                  Ajoute des entreprises avec l&apos;étoile puis réactive ce filtre.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}

function PageBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
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

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
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
