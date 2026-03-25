/**
 * Service SIRENE — API Recherche Entreprises (data.gouv.fr)
 * https://recherche-entreprises.api.gouv.fr
 * Aucune clé API requise
 *
 * Exploite l'intégralité des champs retournés :
 * identité, dirigeants, bénéficiaires effectifs, finances,
 * labels (ESS/RGE/Bio...), conventions collectives, établissements
 */

import type { SireneResult, Company, Dirigeant, BeneficiaireEffectif, FinancialYear, Etablissement } from "@/types";
import { getNafLabel } from "@/lib/naf";
import { NAF_SECTIONS } from "@/types";

const BASE_URL = "https://recherche-entreprises.api.gouv.fr";

// ─── Recherche ────────────────────────────────────────────────────────────────

export interface SireneApiResponse {
  results: SireneResult[];
  total_results: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export async function searchSirene(params: {
  q?: string;
  code_naf?: string;
  departement?: string;
  code_postal?: string;
  tranche_effectif_salarie?: string;
  nature_juridique?: string;
  etat_administratif?: string;
  per_page?: number;
  page?: number;
}): Promise<SireneApiResponse> {
  const url = new URL(`${BASE_URL}/search`);

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  });

  if (!params.etat_administratif) url.searchParams.set("etat_administratif", "A");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error(`SIRENE ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getCompanyBySiren(siren: string): Promise<SireneResult | null> {
  try {
    const url = new URL(`${BASE_URL}/search`);
    url.searchParams.set("q", siren);
    url.searchParams.set("per_page", "1");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 1800 },
    });

    if (!res.ok) return null;
    const data: SireneApiResponse = await res.json();

    // Vérifie que le SIREN correspond exactement
    return data.results?.find((r) => r.siren === siren) ?? data.results?.[0] ?? null;
  } catch {
    return null;
  }
}

// ─── Normalisation complète ───────────────────────────────────────────────────

export function normalizeSireneResult(raw: SireneResult): Partial<Company> {
  const siege = raw.siege;
  const nafCode = (raw.activite_principale ?? siege?.activite_principale ?? "")
    .replace(".", "")
    .toUpperCase();

  const section = raw.section_activite_principale ?? "";

  return {
    siren: raw.siren,
    siret: siege?.siret ?? null,
    name: raw.nom_complet ?? raw.nom_raison_sociale ?? "Sans dénomination",
    legalName: raw.nom_raison_sociale ?? raw.nom_complet ?? null,
    sigle: raw.sigle ?? null,
    legalForm: getLegalFormLabel(raw.nature_juridique ?? ""),
    legalFormCode: raw.nature_juridique ?? null,
    nafCode: nafCode || null,
    nafLabel: nafCode ? getNafLabel(nafCode) : null,
    nafSection: section || null,
    nafSectionLabel: section ? (NAF_SECTIONS[section] ?? null) : null,
    categoryEntreprise: raw.categorie_entreprise ?? null,
    employeeRange: raw.tranche_effectif_salarie ?? siege?.tranche_effectif_salarie ?? null,
    employeeRangeYear: raw.annee_tranche_effectif_salarie ?? siege?.annee_tranche_effectif_salarie ?? null,
    caractereEmployeur: raw.caractere_employeur ?? null,
    creationDate: raw.date_creation ? new Date(raw.date_creation).toISOString() : null,
    lastUpdate: raw.date_mise_a_jour ? new Date(raw.date_mise_a_jour).toISOString() : null,
    isActive: raw.etat_administratif === "A",

    nombreEtablissements: raw.nombre_etablissements ?? null,
    nombreEtablissementsOuverts: raw.nombre_etablissements_ouverts ?? null,

    // Localisation
    address: siege?.adresse ?? null,
    postalCode: siege?.code_postal ?? null,
    city: siege?.libelle_commune ?? null,
    department: siege?.departement ?? null,
    region: siege?.region ?? null,
    lat: siege?.latitude ? parseFloat(siege.latitude) : null,
    lng: siege?.longitude ? parseFloat(siege.longitude) : null,

    // Dirigeants (tous)
    dirigeants: normalizeDirigeants(raw.dirigeants),

    // Bénéficiaires effectifs
    beneficiairesEffectifs: normalizeBeneficiaires(raw.beneficiaires_effectifs),

    // Finances
    finances: normalizeFinances(raw.finances),

    // Labels
    complements: raw.complements
      ? {
          estEss: raw.complements.est_ess ?? null,
          estRge: raw.complements.est_rge ?? null,
          estBio: raw.complements.est_bio ?? null,
          estQualiopi: raw.complements.est_qualiopi ?? null,
          estOrganismeFormation: raw.complements.est_organisme_formation ?? null,
          estEntrepreneurSpectacle: raw.complements.est_entrepreneur_spectacle ?? null,
          estSocieteMission: raw.complements.est_societe_mission ?? null,
          estServicePublic: raw.complements.est_service_public ?? null,
          estFiness: raw.complements.est_finess ?? null,
          identifiantAssociation: raw.complements.identifiant_association ?? null,
          conventionCollectiveRenseignee: raw.complements.convention_collective_renseignee ?? null,
          egaproRenseignee: raw.complements.egapro_renseignee ?? null,
        }
      : undefined,

    // Conventions collectives
    conventionsCollectives: raw.conventions_collectives?.map((cc) => ({
      idcc: cc.idcc ?? null,
      etat: cc.etat ?? null,
      denomination: cc.denominationUniteLegale ?? null,
      nature: cc.nature ?? null,
    })) ?? [],

    // Établissements (branches)
    etablissements: normalizeEtablissements(raw.matching_etablissements),
  };
}

// ─── Helpers de normalisation ─────────────────────────────────────────────────

function normalizeDirigeants(
  raw?: SireneResult["dirigeants"]
): Dirigeant[] {
  if (!raw?.length) return [];
  return raw.map((d) => ({
    nom: d.nom ?? null,
    prenoms: d.prenoms ?? null,
    qualite: d.qualite ?? null,
    typeDirigeant: d.type_dirigeant ?? undefined,
    anneeNaissance: d.annee_naissance ?? null,
    datePrisePoste: d.date_prise_de_poste ?? null,
    denomination: d.denomination ?? null,
    sirenDirigeant: d.siren ?? null,
  }));
}

function normalizeBeneficiaires(
  raw?: SireneResult["beneficiaires_effectifs"]
): BeneficiaireEffectif[] {
  if (!raw?.length) return [];
  return raw.map((b) => ({
    nom: b.nom ?? null,
    prenoms: b.prenoms ?? null,
    nationalite: b.nationalite ?? null,
    pourcentageParts: b.pourcentage_parts ?? null,
    pourcentageVotes: b.pourcentage_votes ?? null,
    typeBeneficiaire: b.type_beneficiaire ?? null,
  }));
}

function normalizeFinances(
  raw?: SireneResult["finances"]
): FinancialYear[] {
  if (!raw?.length) return [];
  return raw
    .filter((f) => f.annee !== undefined)
    .map((f) => ({
      annee: f.annee!,
      ca: f.ca ?? null,
      resultatNet: f.resultat_net ?? null,
      dateCloture: f.date_cloture_exercice ?? null,
    }))
    .sort((a, b) => b.annee - a.annee); // Trier par année décroissante
}

function normalizeEtablissements(
  raw?: SireneResult["matching_etablissements"]
): Etablissement[] {
  if (!raw?.length) return [];
  return raw.map((e) => ({
    siret: e.siret,
    adresse: e.adresse ?? null,
    codePostal: e.code_postal ?? null,
    commune: e.libelle_commune ?? null,
    departement: e.departement ?? null,
    nafCode: e.activite_principale?.replace(".", "").toUpperCase() ?? null,
    employeeRange: e.tranche_effectif_salarie ?? null,
    estSiege: e.est_siege ?? false,
    etatAdministratif: e.etat_administratif ?? null,
    lat: e.latitude ? parseFloat(e.latitude) : null,
    lng: e.longitude ? parseFloat(e.longitude) : null,
  }));
}

// ─── Forme juridique ─────────────────────────────────────────────────────────

const LEGAL_FORMS: Record<string, string> = {
  "1000": "Entrepreneur individuel",
  "2110": "Indivision",
  "2120": "Société créée de fait",
  "2210": "GEIE",
  "2310": "SARL",
  "2385": "SARL unipersonnelle (EURL)",
  "3110": "Société de droit étranger immatriculée au RCS",
  "4110": "Société civile",
  "5191": "Société en commandite par actions",
  "5202": "SARL",
  "5306": "SA à conseil d'administration",
  "5308": "SA à directoire",
  "5385": "SARL",
  "5410": "SA à conseil d'administration",
  "5415": "SA à directoire",
  "5422": "Société anonyme",
  "5443": "Société par actions simplifiée",
  "5453": "Société par actions simplifiée unipersonnelle",
  "5458": "Société par actions simplifiée",
  "5475": "Société à responsabilité limitée",
  "5485": "SARL",
  "5498": "SARL",
  "5499": "EURL",
  "5505": "SA",
  "5510": "SA",
  "5545": "Société anonyme",
  "5551": "Société coopérative",
  "5596": "SA à conseil d'administration",
  "5599": "SA",
  "5600": "SAS",
  "5605": "SASU",
  "5610": "SAS",
  "5615": "SASU",
  "5616": "SAS",
  "5621": "SAS",
  "5631": "SAS",
  "5660": "SAS",
  "5670": "SAS",
  "5680": "SASU",
  "5695": "SA",
  "5699": "SA",
  "5710": "SAS",
  "5720": "SASU",
  "5800": "Société européenne",
  "6310": "Groupement d'intérêt économique (GIE)",
  "6410": "Groupement européen d'intérêt économique",
  "6540": "Association loi 1901",
  "6550": "Association reconnue d'utilité publique",
  "7111": "Commune",
  "7113": "Département",
  "7122": "Région",
  "7490": "Collectivité territoriale",
  "8210": "Organisme central de sécurité sociale",
  "9220": "Association",
};

export function getLegalFormLabel(code: string): string {
  return LEGAL_FORMS[code] ?? code;
}

// ─── Utilitaires d'affichage ─────────────────────────────────────────────────

/** Formate un chiffre d'affaires en notation compacte française */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

/** Retourne la variation en % entre deux valeurs */
export function computeGrowth(current: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}
