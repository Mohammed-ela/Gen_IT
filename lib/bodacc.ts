/**
 * Service BODACC — Bulletin Officiel des Annonces Civiles et Commerciales
 * https://bodacc-datadila.opendatasoft.com
 *
 * Données exploitées :
 * - Créations / modifications / cessations
 * - Capital social initial + augmentations de capital
 * - Procédures collectives (redressement, liquidation)
 * - Transferts de siège
 * - Ventes et cessions de fonds de commerce
 */

import type { BodaccRecord } from "@/types";

const BASE_URL = "https://bodacc-datadila.opendatasoft.com/api/explore/v2.1";

export interface BodaccAnalysis {
  signals: string[];
  lastEvent?: string;
  lastEventDate?: string;
  hasCollectiveProcedure: boolean;
  capitalSocial?: number | null;    // capital extrait du BODACC création
  capitalHistory: CapitalEvent[];   // historique des augmentations
  eventSummary: EventSummary;
}

export interface CapitalEvent {
  date: string;
  montant: number;
  devise: string;
  type: "creation" | "augmentation";
}

export interface EventSummary {
  totalEvents: number;
  creations: number;
  modifications: number;
  ventes: number;
  procedures: number;
  radiations: number;
}

export async function getBodaccEvents(siren: string): Promise<BodaccRecord[]> {
  try {
    // Requête principale : recherche par SIREN dans le registre
    const url = new URL(`${BASE_URL}/catalog/datasets/annonces-commerciales/records`);
    url.searchParams.set("where", `registre LIKE "${siren}%" OR etablissement.siren="${siren}"`);
    url.searchParams.set("order_by", "dateparution DESC");
    url.searchParams.set("limit", "20");
    url.searchParams.set("timezone", "Europe/Paris");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 }, // Cache 24h
    });

    if (!res.ok) return [];

    const data = await res.json();
    return data.results ?? [];
  } catch {
    return [];
  }
}

export function analyzeBodaccEvents(events: BodaccRecord[]): BodaccAnalysis {
  if (!events.length) {
    return {
      signals: [],
      hasCollectiveProcedure: false,
      capitalSocial: null,
      capitalHistory: [],
      eventSummary: { totalEvents: 0, creations: 0, modifications: 0, ventes: 0, procedures: 0, radiations: 0 },
    };
  }

  const signals: string[] = [];
  let hasCollectiveProcedure = false;
  const capitalHistory: CapitalEvent[] = [];
  const summary: EventSummary = { totalEvents: events.length, creations: 0, modifications: 0, ventes: 0, procedures: 0, radiations: 0 };

  for (const event of events) {
    const famille = (event.familleavis ?? "").toLowerCase();
    const typeActe = (event.acte?.typeActeLibelle ?? "").toLowerCase();

    // Comptage par famille
    if (famille.includes("creation") || famille.includes("créat")) summary.creations++;
    else if (famille.includes("modif")) summary.modifications++;
    else if (famille.includes("vente") || famille.includes("cession")) summary.ventes++;
    else if (famille.includes("procedure") || famille.includes("procédure") || famille.includes("liquidation") || famille.includes("redressement")) summary.procedures++;
    else if (famille.includes("radiat")) summary.radiations++;

    // Procédure collective = signal négatif fort
    if (
      famille.includes("procedure collective") ||
      famille.includes("liquidation judiciaire") ||
      famille.includes("redressement judiciaire") ||
      typeActe.includes("liquidation") ||
      typeActe.includes("redressement")
    ) {
      hasCollectiveProcedure = true;
    }

    // Capital (création ou augmentation)
    if (event.acte?.capital) {
      const montant = parseFloat(event.acte.capital.replace(/[^0-9.,]/g, "").replace(",", "."));
      if (!isNaN(montant) && montant > 0) {
        const isCreation = famille.includes("creation") || famille.includes("créat");
        capitalHistory.push({
          date: event.dateparution ?? "",
          montant,
          devise: event.acte.devise ?? "EUR",
          type: isCreation ? "creation" : "augmentation",
        });
        if (!isCreation) signals.push("augmentation_capital");
      }
    }

    // Transfert de siège = expansion
    if (typeActe.includes("transfert de siège") || typeActe.includes("transfer")) {
      if (!signals.includes("modification_siege")) signals.push("modification_siege");
    }

    // Cession de fonds de commerce
    if (famille.includes("vente") || typeActe.includes("cession de fonds")) {
      if (!signals.includes("cession_fonds")) signals.push("cession_fonds");
    }
  }

  const latestEvent = events[0];
  const capitalSocial = capitalHistory.find((c) => c.type === "creation")?.montant ?? null;

  return {
    signals,
    lastEvent: latestEvent?.familleavis_lib ?? latestEvent?.typeavis_lib ?? undefined,
    lastEventDate: latestEvent?.dateparution ?? undefined,
    hasCollectiveProcedure,
    capitalSocial,
    capitalHistory: capitalHistory.sort((a, b) => b.date.localeCompare(a.date)),
    eventSummary: summary,
  };
}

/** Label lisible pour un type d'événement BODACC */
export function getBodaccEventLabel(event: BodaccRecord): string {
  return event.familleavis_lib ?? event.typeavis_lib ?? "Événement";
}

/** Icône par type d'événement */
export function getBodaccEventColor(event: BodaccRecord): string {
  const famille = (event.familleavis ?? "").toLowerCase();
  if (famille.includes("procedure") || famille.includes("liquidation")) return "hsl(var(--red))";
  if (famille.includes("creation")) return "hsl(var(--emerald))";
  if (famille.includes("modif")) return "hsl(var(--accent))";
  if (famille.includes("vente")) return "hsl(var(--amber))";
  if (famille.includes("radiat")) return "hsl(var(--red))";
  return "hsl(var(--text-faint))";
}
