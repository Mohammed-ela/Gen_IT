import type { Company } from "@/types";

function escapeCsv(value: string | number | null | undefined): string {
  const normalized = value === null || value === undefined ? "" : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
}

export function buildCompaniesCsv(companies: Company[]): string {
  const headers = [
    "SIREN",
    "Nom",
    "Score",
    "Ville",
    "Departement",
    "NAF",
    "Activite",
    "Forme juridique",
    "Effectif",
    "Date creation",
    "Signaux",
  ];

  const rows = companies.map((company) => [
    company.siren,
    company.name,
    company.score,
    company.city,
    company.department,
    company.nafCode,
    company.nafLabel,
    company.legalForm,
    company.employeeRange,
    company.creationDate,
    company.signals?.join(" | "),
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
}
