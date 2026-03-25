"use client";

import type { SearchFilters } from "@/types";
import { EMPLOYEE_RANGES } from "@/types";

const NAF_PRESETS = [
  { code: "6201Z", label: "Développement logiciel" },
  { code: "6202A", label: "Conseil IT" },
  { code: "6203Z", label: "Gestion informatique" },
  { code: "6311Z", label: "Hébergement / Cloud" },
  { code: "7022Z", label: "Conseil en gestion" },
  { code: "7312Z", label: "Agence digitale" },
];

const LEGAL_FORMS = [
  { code: "5710", label: "SAS" },
  { code: "5720", label: "SASU" },
  { code: "5498", label: "SARL" },
  { code: "1000", label: "Entrepreneur individuel" },
];

const QUICK_FILTERS = [
  { label: "Tech · Paris", filters: { nafCode: "6201Z", department: "75" } },
  { label: "ESN · Lyon", filters: { nafCode: "6202A", department: "69" } },
  { label: "Startups récentes", filters: { legalForm: "5710", employeeRange: "01", createdAfter: "24" } },
  { label: "PME 10-50 sal.", filters: { employeeRange: "11" } },
  { label: "Score 70+", filters: { minScore: 70 } },
];

// Calcule la date ISO de début à partir d'un nombre de mois
function monthsAgoIso(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

export default function SearchFilters({
  filters,
  onChange,
}: {
  filters: SearchFilters;
  onChange: (f: SearchFilters) => void;
}) {
  const set = (k: keyof SearchFilters, v: string) =>
    onChange({ ...filters, [k]: v || undefined });

  const setNum = (k: keyof SearchFilters, v: string) =>
    onChange({ ...filters, [k]: v ? Number(v) : undefined });

  // "6" → date ISO d'il y a 6 mois (stockée dans createdAfter)
  const setCreatedAfter = (months: string) => {
    if (!months) {
      onChange({ ...filters, createdAfter: undefined });
      return;
    }
    onChange({ ...filters, createdAfter: monthsAgoIso(Number(months)) });
  };

  return (
    <div
      className="rounded-2xl border p-4 space-y-4"
      style={{
        backgroundColor: "hsl(var(--surface))",
        borderColor: "hsl(var(--border-subtle))",
      }}
    >
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "hsl(var(--text-faint))" }}>
          Filtres
        </p>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--text-muted))" }}>
          Réduis le bruit avant d&apos;ouvrir les fiches.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
        <FilterField label="Département">
          <input
            type="text"
            value={filters.department ?? ""}
            onChange={(e) => set("department", e.target.value)}
            placeholder="75, 69, 13..."
            className="field-input"
          />
        </FilterField>

        <FilterField label="Secteur NAF">
          <select
            value={filters.nafCode ?? ""}
            onChange={(e) => set("nafCode", e.target.value)}
            className="field-input"
          >
            <option value="">Tous</option>
            {NAF_PRESETS.map((n) => (
              <option key={n.code} value={n.code}>
                {n.code} — {n.label}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Effectif">
          <select
            value={filters.employeeRange ?? ""}
            onChange={(e) => set("employeeRange", e.target.value)}
            className="field-input"
          >
            <option value="">Tous</option>
            {Object.entries(EMPLOYEE_RANGES)
              .filter(([c]) => !["NN", "41", "42", "51", "52", "53"].includes(c))
              .map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
          </select>
        </FilterField>

        <FilterField label="Forme juridique">
          <select
            value={filters.legalForm ?? ""}
            onChange={(e) => set("legalForm", e.target.value)}
            className="field-input"
          >
            <option value="">Toutes</option>
            {LEGAL_FORMS.map((f) => (
              <option key={f.code} value={f.code}>
                {f.label}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Score minimum">
          <select
            value={filters.minScore ?? ""}
            onChange={(e) => setNum("minScore", e.target.value)}
            className="field-input"
          >
            <option value="">Tous</option>
            <option value="40">40 et +</option>
            <option value="55">55 et +</option>
            <option value="70">70 et + (chaud)</option>
            <option value="80">80 et +</option>
          </select>
        </FilterField>

        <FilterField label="Créée depuis">
          <select
            value=""
            onChange={(e) => setCreatedAfter(e.target.value)}
            className="field-input"
          >
            <option value="">Peu importe</option>
            <option value="3">3 derniers mois</option>
            <option value="6">6 derniers mois</option>
            <option value="12">Cette année</option>
            <option value="24">2 dernières années</option>
          </select>
        </FilterField>
      </div>

      <div className="space-y-2 pt-3 border-t" style={{ borderColor: "hsl(var(--border-subtle))" }}>
        <span className="text-[11px] font-medium" style={{ color: "hsl(var(--text-faint))" }}>
          Raccourcis
        </span>
        <div className="flex gap-2 flex-wrap">
          {QUICK_FILTERS.map((q) => (
            <button
              key={q.label}
              onClick={() => onChange({ ...filters, ...q.filters })}
              className="text-[11px] px-2.5 py-1 rounded-full border transition-all font-medium"
              style={{
                backgroundColor: "hsl(var(--accent-muted) / 0.4)",
                borderColor: "hsl(var(--accent) / 0.3)",
                color: "hsl(var(--accent))",
              }}
            >
              {q.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => onChange({})}
          className="text-[11px] transition-colors"
          style={{ color: "hsl(var(--text-faint))" }}
        >
          Effacer tous les filtres
        </button>
      </div>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium" style={{ color: "hsl(var(--text-faint))" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
