import type { Company } from "@/types";
import { normalizeNaf } from "@/lib/naf";

export type IcpProfile = "default" | "startup_saas" | "pme_industrielle" | "reseau_multi_sites" | "custom";

export interface CustomIcpSettings {
  targetSector: "any" | "tech" | "industry" | "distributed";
  minEmployees: "any" | "small" | "medium";
  prefersRecent: boolean;
  prefersGrowth: boolean;
  prefersMultiSite: boolean;
}

export const DEFAULT_CUSTOM_ICP: CustomIcpSettings = {
  targetSector: "any",
  minEmployees: "any",
  prefersRecent: false,
  prefersGrowth: false,
  prefersMultiSite: false,
};

export const ICP_LABELS: Record<IcpProfile, string> = {
  default: "Profil neutre",
  startup_saas: "Startup / SaaS",
  pme_industrielle: "PME industrielle",
  reseau_multi_sites: "Reseau multi-sites",
  custom: "Profil personnalise",
};

export function computeIcpFit(
  company: Company,
  profile: IcpProfile,
  custom: CustomIcpSettings = DEFAULT_CUSTOM_ICP,
): {
  fitScore: number;
  reasons: string[];
} {
  if (profile === "default") {
    return { fitScore: company.score, reasons: ["score general"] };
  }

  if (profile === "custom") {
    return computeCustomFit(company, custom);
  }

  let score = 0;
  const reasons: string[] = [];
  const employeeRange = company.employeeRange ?? "";
  const nafCode = normalizeNaf(company.nafCode ?? "");
  const ageInMonths = company.creationDate
    ? Math.round((Date.now() - new Date(company.creationDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : null;

  if (profile === "startup_saas") {
    if (["6201Z", "6202A", "6202B", "6203Z", "6209Z", "6311Z"].includes(nafCode)) {
      score += 35;
      reasons.push("secteur tech");
    }
    if (ageInMonths !== null && ageInMonths <= 48) {
      score += 20;
      reasons.push("creation recente");
    }
    if (["01", "02", "03", "11", "12"].includes(employeeRange)) {
      score += 15;
      reasons.push("taille compatible");
    }
    if (company.signals.includes("croissance_ca") || company.signals.includes("augmentation_capital")) {
      score += 15;
      reasons.push("signal croissance");
    }
    if (company.legalForm && ["SAS", "SASU"].includes(company.legalForm)) {
      score += 10;
      reasons.push("structure startup");
    }
  }

  if (profile === "pme_industrielle") {
    if (["C", "F"].includes(company.nafSection ?? "")) {
      score += 30;
      reasons.push("secteur industriel");
    }
    if (["11", "12", "21", "22"].includes(employeeRange)) {
      score += 25;
      reasons.push("taille PME");
    }
    if (company.finances?.[0]?.ca) {
      score += 20;
      reasons.push("finances publiees");
    }
    if (company.signals.includes("multi_etablissements")) {
      score += 10;
      reasons.push("presence terrain");
    }
  }

  if (profile === "reseau_multi_sites") {
    if ((company.nombreEtablissementsOuverts ?? company.nombreEtablissements ?? 0) > 1) {
      score += 35;
      reasons.push("plusieurs etablissements");
    }
    if (["G", "I", "N"].includes(company.nafSection ?? "")) {
      score += 20;
      reasons.push("secteur distribue");
    }
    if (["11", "12", "21", "22", "31"].includes(employeeRange)) {
      score += 20;
      reasons.push("taille compatible");
    }
    if (company.signals.includes("modification_siege")) {
      score += 10;
      reasons.push("mouvement structurel");
    }
  }

  score += Math.round(company.score * 0.2);
  return {
    fitScore: Math.min(100, score),
    reasons: reasons.length ? reasons : ["score general"],
  };
}

function computeCustomFit(company: Company, custom: CustomIcpSettings): {
  fitScore: number;
  reasons: string[];
} {
  let score = Math.round(company.score * 0.25);
  const reasons: string[] = [];
  const employeeRange = company.employeeRange ?? "";
  const nafCode = normalizeNaf(company.nafCode ?? "");
  const section = company.nafSection ?? "";
  const ageInMonths = company.creationDate
    ? Math.round((Date.now() - new Date(company.creationDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : null;

  if (custom.targetSector === "tech" && ["6201Z", "6202A", "6202B", "6203Z", "6209Z", "6311Z"].includes(nafCode)) {
    score += 25;
    reasons.push("secteur tech");
  }
  if (custom.targetSector === "industry" && ["C", "F"].includes(section)) {
    score += 25;
    reasons.push("secteur industriel");
  }
  if (custom.targetSector === "distributed" && ["G", "I", "N"].includes(section)) {
    score += 25;
    reasons.push("secteur distribue");
  }

  if (custom.minEmployees === "small" && ["01", "02", "03", "11"].includes(employeeRange)) {
    score += 15;
    reasons.push("petite structure");
  }
  if (custom.minEmployees === "medium" && ["11", "12", "21", "22", "31"].includes(employeeRange)) {
    score += 15;
    reasons.push("taille moyenne+");
  }

  if (custom.prefersRecent && ageInMonths !== null && ageInMonths <= 48) {
    score += 15;
    reasons.push("recent");
  }
  if (custom.prefersGrowth && (company.signals.includes("croissance_ca") || company.signals.includes("augmentation_capital"))) {
    score += 20;
    reasons.push("croissance");
  }
  if (custom.prefersMultiSite && (company.nombreEtablissementsOuverts ?? company.nombreEtablissements ?? 0) > 1) {
    score += 20;
    reasons.push("multi-sites");
  }

  return {
    fitScore: Math.min(100, score),
    reasons: reasons.length ? reasons : ["score general"],
  };
}
