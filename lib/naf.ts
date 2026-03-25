/**
 * Mapping NAF (Nomenclature d'Activités Françaises) — codes vers libellés
 * Source : INSEE — codes les plus fréquents couvrant ~80% des entreprises
 */

export const NAF_LABELS: Record<string, string> = {
  // ── Section J — Information et communication ─────────────
  "6110Z": "Télécommunications filaires",
  "6120Z": "Télécommunications sans fil",
  "6130Z": "Télécommunications par satellite",
  "6190Z": "Autres activités de télécommunication",
  "6201Z": "Programmation informatique",
  "6202A": "Conseil en systèmes et logiciels informatiques",
  "6202B": "Tierce maintenance systèmes et applications",
  "6203Z": "Gestion d'installations informatiques",
  "6209Z": "Autres activités informatiques",
  "6311Z": "Traitement de données, hébergement et activités connexes",
  "6312Z": "Portails internet",
  "6391Z": "Agences de presse",
  "6399Z": "Autres services d'information",

  // ── Section M — Activités spécialisées ──────────────────
  "6910Z": "Activités juridiques",
  "6920Z": "Activités comptables",
  "7010Z": "Activités des sièges sociaux",
  "7021Z": "Conseil en relations publiques et communication",
  "7022Z": "Conseil pour les affaires et autres conseils de gestion",
  "7111Z": "Activités d'architecture",
  "7112A": "Activité des géomètres",
  "7112B": "Ingénierie et études techniques",
  "7120A": "Contrôle technique automobile",
  "7120B": "Analyse, essais et inspections techniques",
  "7211Z": "Recherche-développement en biotechnologie",
  "7219Z": "Autre recherche-développement en sciences physiques et naturelles",
  "7220Z": "Recherche-développement en sciences humaines et sociales",
  "7311Z": "Activités des agences de publicité",
  "7312Z": "Régie publicitaire de médias",
  "7320Z": "Études de marché et sondages",
  "7410Z": "Activités spécialisées de design",
  "7420Z": "Activités photographiques",
  "7430Z": "Traduction et interprétation",
  "7490A": "Activité des économistes de la construction",
  "7490B": "Activités spécialisées, scientifiques et techniques diverses",
  "7500Z": "Activités vétérinaires",

  // ── Section N — Services administratifs ─────────────────
  "7711A": "Location de courte durée de voitures",
  "7711B": "Location de longue durée de voitures",
  "7721Z": "Location d'articles de loisirs et de sport",
  "7810Z": "Activités des agences de placement de main-d'œuvre",
  "7820Z": "Activités des agences de travail temporaire",
  "7830Z": "Autre mise à disposition de ressources humaines",
  "8110Z": "Activités combinées de soutien lié aux bâtiments",
  "8121Z": "Nettoyage courant des bâtiments",
  "8211Z": "Services administratifs combinés de bureau",
  "8219Z": "Photocopie, préparation de documents",
  "8220Z": "Activités de centres d'appels",
  "8230Z": "Organisation de salons professionnels et congrès",
  "8291Z": "Activités des agences de recouvrement",
  "8299Z": "Autres activités de soutien aux entreprises",

  // ── Section G — Commerce ────────────────────────────────
  "4619A": "Centrales d'achat alimentaires",
  "4619B": "Autres intermédiaires du commerce en produits divers",
  "4651Z": "Commerce de gros d'ordinateurs, équipements périphériques et logiciels",
  "4652Z": "Commerce de gros de composants et d'équipements électroniques",
  "4741Z": "Commerce de détail d'ordinateurs, unités périphériques et logiciels",
  "4742Z": "Commerce de détail de matériels de télécommunication",
  "4791A": "Vente à distance sur catalogue général",
  "4791B": "Vente à distance sur catalogue spécialisé",

  // ── Section K — Finance ─────────────────────────────────
  "6411Z": "Activités de banque centrale",
  "6419Z": "Autres intermédiations monétaires",
  "6430Z": "Fonds de placement et entités financières similaires",
  "6491Z": "Crédit-bail",
  "6499Z": "Autres activités de services financiers",
  "6512Z": "Autres assurances",
  "6622Z": "Activités des agents et courtiers d'assurances",
  "6630Z": "Gestion de fonds",

  // ── Section F — Construction ────────────────────────────
  "4120A": "Construction de maisons individuelles",
  "4120B": "Construction d'autres bâtiments résidentiels",
  "4211Z": "Construction de routes et autoroutes",
  "4321A": "Travaux d'installation électrique dans tous locaux",
  "4321B": "Travaux d'installation électrique sur la voie publique",
  "4322A": "Travaux d'installation d'eau et de gaz",
  "4399C": "Travaux de maçonnerie générale et gros œuvre",

  // ── Section Q — Santé ────────────────────────────────────
  "8610Z": "Activités hospitalières",
  "8621Z": "Activité des médecins généralistes",
  "8622A": "Activités de radiodiagnostic et radiothérapie",
  "8699D": "Activités des infirmiers et sages-femmes",
  "8711A": "Hébergement médicalisé pour personnes âgées",

  // ── Section P — Enseignement ────────────────────────────
  "8520Z": "Enseignement primaire",
  "8531Z": "Enseignement secondaire général",
  "8542Z": "Enseignement supérieur",
  "8559A": "Formation continue d'adultes",
  "8559B": "Autres enseignements",

  // ── Section I — Restauration ────────────────────────────
  "5510Z": "Hôtels et hébergement similaire",
  "5610A": "Restauration traditionnelle",
  "5610B": "Cafétérias et autres libres-services",
  "5621Z": "Services des traiteurs",
  "5630Z": "Débits de boissons",

  // ── Section R — Arts & loisirs ──────────────────────────
  "9001Z": "Arts du spectacle vivant",
  "9002Z": "Activités de soutien au spectacle vivant",
  "9003A": "Création artistique relevant des arts plastiques",
  "9003B": "Autre création artistique",
  "9321Z": "Activités des parcs d'attractions et parcs à thèmes",
};

/**
 * Retourne le libellé d'un code NAF
 * Si non trouvé, retourne le code lui-même
 */
export function normalizeNaf(code: string): string {
  return code.replace(".", "").toUpperCase();
}

export function getNafLabel(code: string): string {
  if (!code) return "";
  return NAF_LABELS[normalizeNaf(code)] ?? code;
}

/**
 * Codes NAF regroupés par grande famille pour l'UI
 */
export const NAF_GROUPS = [
  {
    label: "Tech & Numérique",
    codes: ["6201Z", "6202A", "6202B", "6203Z", "6209Z", "6311Z", "6312Z", "6110Z", "6120Z"],
  },
  {
    label: "Conseil & Services aux entreprises",
    codes: ["7022Z", "7010Z", "7490B", "7490A", "8299Z", "8220Z"],
  },
  {
    label: "Ingénierie & R&D",
    codes: ["7112B", "7211Z", "7219Z", "7120B"],
  },
  {
    label: "Marketing & Communication",
    codes: ["7311Z", "7312Z", "7021Z", "7320Z", "7410Z"],
  },
  {
    label: "Finance & Assurance",
    codes: ["6419Z", "6499Z", "6622Z", "6630Z"],
  },
  {
    label: "Formation & Enseignement",
    codes: ["8559A", "8559B", "8542Z"],
  },
];
