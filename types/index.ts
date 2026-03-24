// ─── Entreprise enrichie ─────────────────────────────────────────────────────

export interface Company {
  id: string;
  siren: string;
  siret?: string | null;
  name: string;
  legalName?: string | null;
  sigle?: string | null;
  legalForm?: string | null;
  legalFormCode?: string | null;
  nafCode?: string | null;
  nafLabel?: string | null;
  nafSection?: string | null;       // "J", "M", etc.
  nafSectionLabel?: string | null;  // "Information et communication"
  categoryEntreprise?: string | null; // PME, ETI, GE
  employeeRange?: string | null;
  employeeRangeYear?: string | null;
  caractereEmployeur?: string | null; // "O" / "N"
  creationDate?: string | null;
  lastUpdate?: string | null;
  isActive: boolean;

  // Établissements
  nombreEtablissements?: number | null;
  nombreEtablissementsOuverts?: number | null;
  etablissements?: Etablissement[];

  // Localisation siège
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  department?: string | null;
  region?: string | null;
  lat?: number | null;
  lng?: number | null;

  // Direction
  dirigeants?: Dirigeant[];

  // Bénéficiaires effectifs
  beneficiairesEffectifs?: BeneficiaireEffectif[];

  // Finances (dernières années déclarées)
  finances?: FinancialYear[];

  // Labels & certifications
  complements?: CompanyComplements;

  // Conventions collectives
  conventionsCollectives?: ConventionCollective[];

  // Scoring
  score: number;
  scoreDetails?: ScoreDetails | null;
  signals: string[];

  // BODACC
  lastBodaccEvent?: string | null;
  lastBodaccDate?: string | null;
  capitalSocial?: number | null;    // extrait du BODACC création

  createdAt: string;
  updatedAt: string;
}

// ─── Dirigeants ───────────────────────────────────────────────────────────────

export interface Dirigeant {
  nom?: string | null;
  prenoms?: string | null;
  qualite?: string | null;
  typeDirigeant?: "personne_physique" | "personne_morale" | string;
  anneeNaissance?: string | null;
  datePrisePoste?: string | null;
  // si personne morale
  denomination?: string | null;
  sirenDirigeant?: string | null;
}

// ─── Bénéficiaires effectifs ──────────────────────────────────────────────────

export interface BeneficiaireEffectif {
  nom?: string | null;
  prenoms?: string | null;
  nationalite?: string | null;
  pourcentageParts?: number | null;
  pourcentageVotes?: number | null;
  typeBeneficiaire?: string | null;
}

// ─── Finances ─────────────────────────────────────────────────────────────────

export interface FinancialYear {
  annee: number;
  ca?: number | null;             // chiffre d'affaires
  resultatNet?: number | null;    // résultat net
  dateCloture?: string | null;
}

// ─── Compléments / Labels ─────────────────────────────────────────────────────

export interface CompanyComplements {
  estEss?: boolean | null;              // Économie sociale et solidaire
  estRge?: boolean | null;              // Reconnu Garant Environnement
  estBio?: boolean | null;              // Certification bio
  estQualiopi?: boolean | null;         // Certification formation
  estOrganismeFormation?: boolean | null;
  estEntrepreneurSpectacle?: boolean | null;
  estSocieteMission?: boolean | null;   // Société à mission (RSE)
  estServicePublic?: boolean | null;
  estFiness?: boolean | null;           // établissement sanitaire/social
  identifiantAssociation?: string | null;
  conventionCollectiveRenseignee?: boolean | null;
  egaproRenseignee?: boolean | null;    // index égalité H/F
}

// ─── Convention collective ────────────────────────────────────────────────────

export interface ConventionCollective {
  idcc?: string | null;
  etat?: string | null;           // "VIGUEUR", "DÉNONCIATION", etc.
  denomination?: string | null;
  nature?: string | null;
}

// ─── Établissements ──────────────────────────────────────────────────────────

export interface Etablissement {
  siret: string;
  adresse?: string | null;
  codePostal?: string | null;
  commune?: string | null;
  departement?: string | null;
  nafCode?: string | null;
  employeeRange?: string | null;
  estSiege?: boolean;
  etatAdministratif?: string | null;
  lat?: number | null;
  lng?: number | null;
}

// ─── Score ───────────────────────────────────────────────────────────────────

export interface ScoreDetails {
  recency: number;     // 0-20
  activity: number;    // 0-20
  size: number;        // 0-15
  stability: number;   // 0-20
  finances: number;    // 0-15  ← nouveau
  signals: number;     // 0-10
  total: number;       // 0-100
}

// ─── Signaux business ────────────────────────────────────────────────────────

export type BusinessSignal =
  | "creation_recente"
  | "augmentation_capital"
  | "modification_siege"
  | "ca_disponible"
  | "resultat_positif"
  | "croissance_ca"
  | "multi_etablissements"
  | "secteur_tech"
  | "structure_juridique_solide"
  | "dirigeant_identifie"
  | "beneficiaires_connus"
  | "convention_collective"
  | "label_qualite"          // RGE, Bio, Qualiopi
  | "societe_mission"
  | "ess"
  | "cession_fonds";

// ─── Recherche ───────────────────────────────────────────────────────────────

export interface SearchFilters {
  query?: string;
  nafCode?: string;
  city?: string;
  department?: string;
  region?: string;
  postalCode?: string;
  legalForm?: string;
  employeeRange?: string;
  createdAfter?: string;
  createdBefore?: string;
  minScore?: number;
  isActive?: boolean;
  sort?: "score" | "recent" | "name";
}

export interface SearchResponse {
  data: Company[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── SIRENE brut (réponse API complète) ───────────────────────────────────────

export interface SireneRawSiege {
  siret: string;
  adresse?: string;
  code_postal?: string;
  libelle_commune?: string;
  commune?: string;
  departement?: string;
  region?: string;
  latitude?: string;
  longitude?: string;
  tranche_effectif_salarie?: string;
  annee_tranche_effectif_salarie?: string;
  date_creation?: string;
  date_mise_a_jour?: string;
  etat_administratif?: string;
  numero_voie?: string;
  type_voie?: string;
  libelle_voie?: string;
  complement_adresse?: string;
  geo_adresse?: string;
  activite_principale?: string;
  liste_idcc?: string[];
  liste_rge?: string[];
  liste_id_bio?: string[];
  est_siege?: boolean;
}

export interface SireneResult {
  siren: string;
  nom_complet: string;
  nom_raison_sociale?: string;
  sigle?: string;
  nombre_etablissements?: number;
  nombre_etablissements_ouverts?: number;
  date_creation: string;
  date_mise_a_jour?: string;
  tranche_effectif_salarie?: string;
  annee_tranche_effectif_salarie?: string;
  categorie_entreprise?: string;
  annee_categorie_entreprise?: string;
  caractere_employeur?: string;
  activite_principale?: string;
  section_activite_principale?: string;
  etat_administratif?: string;
  nature_juridique?: string;
  siege?: SireneRawSiege;
  dirigeants?: Array<{
    nom?: string;
    prenoms?: string;
    qualite?: string;
    type_dirigeant?: string;
    annee_naissance?: string;
    date_prise_de_poste?: string;
    denomination?: string;
    siren?: string;
  }>;
  beneficiaires_effectifs?: Array<{
    nom?: string;
    prenoms?: string;
    nationalite?: string;
    pourcentage_parts?: number;
    pourcentage_votes?: number;
    type_beneficiaire?: string;
  }>;
  finances?: Array<{
    annee?: number;
    ca?: number;
    resultat_net?: number;
    date_cloture_exercice?: string;
  }>;
  matching_etablissements?: Array<{
    siret: string;
    adresse?: string;
    code_postal?: string;
    libelle_commune?: string;
    departement?: string;
    activite_principale?: string;
    tranche_effectif_salarie?: string;
    etat_administratif?: string;
    est_siege?: boolean;
    latitude?: string;
    longitude?: string;
  }>;
  conventions_collectives?: Array<{
    idcc?: string;
    etat?: string;
    denominationUniteLegale?: string;
    nature?: string;
  }>;
  complements?: {
    est_ess?: boolean;
    est_rge?: boolean;
    est_bio?: boolean;
    est_qualiopi?: boolean;
    est_organisme_formation?: boolean;
    est_entrepreneur_spectacle?: boolean;
    est_societe_mission?: boolean;
    est_service_public?: boolean;
    est_finess?: boolean;
    identifiant_association?: string;
    convention_collective_renseignee?: boolean;
    egapro_renseignee?: boolean;
  };
}

// ─── BODACC ──────────────────────────────────────────────────────────────────

export interface BodaccRecord {
  id?: string;
  numerodepartement?: string;
  typeavis?: string;
  typeavis_lib?: string;
  familleavis?: string;
  familleavis_lib?: string;
  dateparution?: string;
  numerodeparution?: string;
  tribunal?: string;
  ville?: string;
  cp?: string;
  registre?: string;
  commercant?: string;
  acte?: {
    typeActe?: string;
    typeActeLibelle?: string;
    capital?: string;
    devise?: string;
    activite?: string;
    precisions?: string;
    montant?: string;
  };
  etablissement?: {
    siren?: string;
    siret?: string;
    denomination?: string;
    adresse?: string;
  };
  publicationavis?: string;
}

// ─── NAF ─────────────────────────────────────────────────────────────────────

export const TECH_NAF_CODES = [
  "6201Z", "6202A", "6202B", "6203Z", "6209Z",
  "6311Z", "6312Z", "7022Z", "7312Z", "7490B",
  "6110Z", "6120Z", "6130Z", "6190Z", "6391Z",
] as const;

export const NAF_SECTIONS: Record<string, string> = {
  A: "Agriculture, sylviculture et pêche",
  B: "Industries extractives",
  C: "Industrie manufacturière",
  D: "Production d'électricité, de gaz, de vapeur",
  E: "Production et distribution d'eau, assainissement",
  F: "Construction",
  G: "Commerce",
  H: "Transports et entreposage",
  I: "Hébergement et restauration",
  J: "Information et communication",
  K: "Activités financières et d'assurance",
  L: "Activités immobilières",
  M: "Activités spécialisées, scientifiques et techniques",
  N: "Activités de services administratifs",
  O: "Administration publique",
  P: "Enseignement",
  Q: "Santé humaine et action sociale",
  R: "Arts, spectacles et activités récréatives",
  S: "Autres activités de services",
  T: "Activités des ménages",
  U: "Activités extra-territoriales",
};

export const EMPLOYEE_RANGES: Record<string, string> = {
  NN: "Non renseigné",
  "00": "0 salarié",
  "01": "1 à 2 salariés",
  "02": "3 à 5 salariés",
  "03": "6 à 9 salariés",
  "11": "10 à 19 salariés",
  "12": "20 à 49 salariés",
  "21": "50 à 99 salariés",
  "22": "100 à 199 salariés",
  "31": "200 à 249 salariés",
  "32": "250 à 499 salariés",
  "41": "500 à 999 salariés",
  "42": "1 000 à 1 999 salariés",
  "51": "2 000 à 4 999 salariés",
  "52": "5 000 à 9 999 salariés",
  "53": "10 000 salariés et plus",
};

export const REGIONS: Record<string, string> = {
  "01": "Guadeloupe", "02": "Martinique", "03": "Guyane",
  "04": "La Réunion", "06": "Mayotte",
  "11": "Île-de-France", "24": "Centre-Val de Loire",
  "27": "Bourgogne-Franche-Comté", "28": "Normandie",
  "32": "Hauts-de-France", "44": "Grand Est",
  "52": "Pays de la Loire", "53": "Bretagne",
  "75": "Nouvelle-Aquitaine", "76": "Occitanie",
  "84": "Auvergne-Rhône-Alpes", "93": "Provence-Alpes-Côte d'Azur",
  "94": "Corse",
};
