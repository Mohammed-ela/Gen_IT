import type { ScoreDetails, BusinessSignal, FinancialYear, CompanyComplements } from "@/types";
import { TECH_NAF_CODES } from "@/types";
import { computeGrowth } from "@/lib/sirene";

interface ScoringInput {
  creationDate?: string | null;
  nafCode?: string | null;
  employeeRange?: string | null;
  isActive: boolean;
  hasCollectiveProcedure?: boolean;
  bodaccSignals?: string[];
  legalForm?: string | null;
  directorName?: string | null;
  address?: string | null;
  lat?: number | null;
  finances?: FinancialYear[];
  complements?: CompanyComplements | null;
  nombreEtablissements?: number | null;
  beneficiairesCount?: number;
  conventionsCount?: number;
}

export function computeScore(input: ScoringInput): {
  score: number;
  details: ScoreDetails;
  signals: BusinessSignal[];
} {
  const recency = scoreRecency(input.creationDate);
  const activity = scoreActivity(input.nafCode);
  const size = scoreSize(input.employeeRange);
  const stability = scoreStability(input.isActive, input.hasCollectiveProcedure);
  const finances = scoreFinances(input.finances ?? []);
  const signals = scoreSignals(input.bodaccSignals ?? [], input.complements);
  const total = recency + activity + size + stability + finances + signals;

  return {
    score: Math.min(100, Math.round(total)),
    details: {
      recency,
      activity,
      size,
      stability,
      finances,
      signals,
      total: Math.min(100, Math.round(total)),
    },
    signals: detectSignals(input),
  };
}

function scoreRecency(d?: string | null): number {
  if (!d) return 4;
  const months = (Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (months <= 6) return 20;
  if (months <= 12) return 18;
  if (months <= 24) return 15;
  if (months <= 48) return 10;
  if (months <= 84) return 7;
  return 4;
}

function scoreActivity(naf?: string | null): number {
  if (!naf) return 4;
  const n = naf.replace(".", "").toUpperCase();
  if ((TECH_NAF_CODES as readonly string[]).includes(n)) return 20;
  if (["7022Z", "7010Z", "7490A", "7490B", "7112B", "8559A", "8559B"].includes(n)) return 15;
  if (["7311Z", "7312Z", "6499Z", "7820Z", "7830Z", "8220Z"].includes(n)) return 12;
  return 6;
}

function scoreSize(range?: string | null): number {
  if (!range || range === "NN") return 6;
  const scores: Record<string, number> = {
    "00": 4,
    "01": 8,
    "02": 11,
    "03": 13,
    "11": 15,
    "12": 13,
    "21": 11,
    "22": 9,
    "31": 7,
    "32": 5,
  };
  return scores[range] ?? 6;
}

function scoreStability(active: boolean, collectiveProcedure?: boolean): number {
  if (!active) return 0;
  if (collectiveProcedure) return 3;
  return 20;
}

function scoreFinances(finances: FinancialYear[]): number {
  if (!finances.length) return 0;

  const latest = finances[0];
  let points = 0;

  if (latest.ca !== null && latest.ca !== undefined) {
    points += 5;
    if (latest.ca >= 2_000_000) points += 5;
    else if (latest.ca >= 500_000) points += 3;
    else if (latest.ca >= 100_000) points += 1;
  }

  if (latest.resultatNet !== null && latest.resultatNet !== undefined) {
    if (latest.resultatNet > 0) points += 3;
    else if (latest.resultatNet < 0) points -= 2;
  }

  if (finances.length >= 2 && latest.ca && finances[1]?.ca) {
    const growth = computeGrowth(latest.ca, finances[1].ca);
    if (growth !== null && growth > 0) points += 2;
  }

  return Math.max(0, Math.min(15, points));
}

function scoreSignals(bodacc: string[], complements?: CompanyComplements | null): number {
  let points = 0;
  if (bodacc.includes("augmentation_capital")) points += 5;
  if (bodacc.includes("modification_siege")) points += 3;
  if (complements?.estSocieteMission) points += 2;
  if (complements?.egaproRenseignee) points += 1;
  return Math.min(10, points);
}

function detectSignals(input: ScoringInput): BusinessSignal[] {
  const out: BusinessSignal[] = [];

  if (input.creationDate) {
    const months = (Date.now() - new Date(input.creationDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (months <= 24) out.push("creation_recente");
  }

  if (input.nafCode) {
    const normalized = input.nafCode.replace(".", "").toUpperCase();
    if ((TECH_NAF_CODES as readonly string[]).includes(normalized)) out.push("secteur_tech");
  }

  if (input.finances?.length) {
    const latest = input.finances[0];
    if (latest.ca !== null && latest.ca !== undefined) out.push("ca_disponible");
    if (latest.resultatNet !== null && latest.resultatNet !== undefined && latest.resultatNet > 0) {
      out.push("resultat_positif");
    }
    if (input.finances.length >= 2 && latest.ca && input.finances[1]?.ca) {
      const growth = computeGrowth(latest.ca, input.finances[1].ca);
      if (growth !== null && growth > 10) out.push("croissance_ca");
    }
  }

  if (input.bodaccSignals?.includes("augmentation_capital")) out.push("augmentation_capital");
  if (input.bodaccSignals?.includes("modification_siege")) out.push("modification_siege");
  if (input.bodaccSignals?.includes("cession_fonds")) out.push("cession_fonds");

  if (input.legalForm && ["SAS", "SASU", "SA"].includes(input.legalForm)) {
    out.push("structure_juridique_solide");
  }

  if (input.directorName) out.push("dirigeant_identifie");
  if (input.beneficiairesCount && input.beneficiairesCount > 0) out.push("beneficiaires_connus");
  if (input.nombreEtablissements && input.nombreEtablissements > 1) out.push("multi_etablissements");
  if (input.complements?.estEss) out.push("ess");
  if (input.complements?.estRge || input.complements?.estBio || input.complements?.estQualiopi) {
    out.push("label_qualite");
  }
  if (input.complements?.estSocieteMission) out.push("societe_mission");
  if (input.conventionsCount && input.conventionsCount > 0) out.push("convention_collective");

  return [...new Set(out)];
}

export const SIGNAL_LABELS: Record<
  BusinessSignal,
  { label: string; style: { bg: string; color: string; border: string }; description: string }
> = {
  creation_recente: {
    label: "Creation recente",
    style: { bg: "hsl(158 60% 36% / 0.12)", color: "hsl(158 60% 46%)", border: "hsl(158 60% 36% / 0.3)" },
    description: "Entreprise creee il y a moins de 2 ans",
  },
  augmentation_capital: {
    label: "Augmentation capital",
    style: { bg: "hsl(243 75% 63% / 0.12)", color: "hsl(243 75% 70%)", border: "hsl(243 75% 63% / 0.3)" },
    description: "Augmentation de capital detectee au BODACC",
  },
  modification_siege: {
    label: "Transfert siege",
    style: { bg: "hsl(200 80% 50% / 0.12)", color: "hsl(200 80% 60%)", border: "hsl(200 80% 50% / 0.3)" },
    description: "Transfert de siege ou changement de localisation",
  },
  ca_disponible: {
    label: "CA publie",
    style: { bg: "hsl(38 85% 50% / 0.12)", color: "hsl(38 85% 58%)", border: "hsl(38 85% 50% / 0.3)" },
    description: "Chiffre d'affaires disponible",
  },
  resultat_positif: {
    label: "Rentable",
    style: { bg: "hsl(158 60% 36% / 0.12)", color: "hsl(158 60% 46%)", border: "hsl(158 60% 36% / 0.3)" },
    description: "Resultat net positif sur le dernier exercice",
  },
  croissance_ca: {
    label: "CA en hausse",
    style: { bg: "hsl(158 80% 36% / 0.15)", color: "hsl(158 80% 50%)", border: "hsl(158 80% 36% / 0.35)" },
    description: "Croissance du chiffre d'affaires superieure a 10%",
  },
  multi_etablissements: {
    label: "Multi-sites",
    style: { bg: "hsl(220 60% 55% / 0.12)", color: "hsl(220 60% 65%)", border: "hsl(220 60% 55% / 0.3)" },
    description: "Presence sur plusieurs sites en France",
  },
  secteur_tech: {
    label: "Secteur tech",
    style: { bg: "hsl(243 75% 63% / 0.10)", color: "hsl(243 75% 72%)", border: "hsl(243 75% 63% / 0.25)" },
    description: "Secteur numerique ou informatique",
  },
  structure_juridique_solide: {
    label: "SAS / SA",
    style: { bg: "hsl(220 10% 50% / 0.10)", color: "hsl(220 10% 62%)", border: "hsl(220 10% 50% / 0.25)" },
    description: "Structure juridique plutot solide pour le B2B",
  },
  dirigeant_identifie: {
    label: "Dirigeant connu",
    style: { bg: "hsl(24 80% 50% / 0.10)", color: "hsl(24 80% 60%)", border: "hsl(24 80% 50% / 0.25)" },
    description: "Identite du dirigeant disponible",
  },
  beneficiaires_connus: {
    label: "Beneficiaires",
    style: { bg: "hsl(280 60% 55% / 0.10)", color: "hsl(280 60% 65%)", border: "hsl(280 60% 55% / 0.25)" },
    description: "Beneficiaires effectifs identifies",
  },
  convention_collective: {
    label: "Convention",
    style: { bg: "hsl(200 60% 45% / 0.10)", color: "hsl(200 60% 55%)", border: "hsl(200 60% 45% / 0.25)" },
    description: "Convention collective renseignee",
  },
  label_qualite: {
    label: "Label qualite",
    style: { bg: "hsl(170 60% 40% / 0.10)", color: "hsl(170 60% 50%)", border: "hsl(170 60% 40% / 0.25)" },
    description: "Certification RGE, Bio ou Qualiopi",
  },
  societe_mission: {
    label: "Societe a mission",
    style: { bg: "hsl(38 70% 50% / 0.10)", color: "hsl(38 70% 58%)", border: "hsl(38 70% 50% / 0.25)" },
    description: "Mission ou raison d'etre inscrite aux statuts",
  },
  ess: {
    label: "ESS",
    style: { bg: "hsl(158 50% 38% / 0.12)", color: "hsl(158 50% 48%)", border: "hsl(158 50% 38% / 0.3)" },
    description: "Economie sociale et solidaire",
  },
  cession_fonds: {
    label: "Cession",
    style: { bg: "hsl(12 80% 55% / 0.10)", color: "hsl(12 80% 64%)", border: "hsl(12 80% 55% / 0.25)" },
    description: "Cession ou vente de fonds detectee au BODACC",
  },
};

export function getScoreCategory(score: number): {
  label: string;
  color: string;
  bg: string;
  border: string;
} {
  if (score >= 70) {
    return {
      label: "Chaud",
      color: "hsl(158 60% 46%)",
      bg: "hsl(158 60% 36% / 0.12)",
      border: "hsl(158 60% 36% / 0.35)",
    };
  }
  if (score >= 45) {
    return {
      label: "Tiede",
      color: "hsl(38 85% 58%)",
      bg: "hsl(38 85% 50% / 0.12)",
      border: "hsl(38 85% 50% / 0.35)",
    };
  }
  return {
    label: "Froid",
    color: "hsl(220 10% 55%)",
    bg: "hsl(220 10% 50% / 0.08)",
    border: "hsl(220 10% 50% / 0.25)",
  };
}
