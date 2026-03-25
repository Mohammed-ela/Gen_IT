import type { Company } from "@/types";

function escapeCsv(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

export function buildCompaniesCsv(companies: Company[]): string {
  const headers = [
    "SIREN", "Nom", "Score", "Catégorie",
    "Ville", "Département", "NAF", "Activité",
    "Forme juridique", "Effectif", "Date création",
    "CA (€)", "Résultat net (€)", "Marge nette (%)", "Capital social (€)",
    "Nb établissements", "Signaux",
  ];

  const rows = companies.map((c) => {
    const latest = c.finances?.[0];
    const marge =
      latest?.ca && latest?.resultatNet != null && latest.ca > 0
        ? Math.round((latest.resultatNet / latest.ca) * 100)
        : null;

    return [
      c.siren,
      c.name,
      c.score,
      c.categoryEntreprise,
      c.city,
      c.department,
      c.nafCode,
      c.nafLabel,
      c.legalForm,
      c.employeeRange,
      c.creationDate ? c.creationDate.slice(0, 10) : null,
      latest?.ca ?? null,
      latest?.resultatNet ?? null,
      marge,
      c.capitalSocial ?? null,
      c.nombreEtablissementsOuverts ?? c.nombreEtablissements ?? null,
      c.signals?.join(" | "),
    ];
  });

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
}
