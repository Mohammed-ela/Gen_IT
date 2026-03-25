// BODACC — Bulletin Officiel des Annonces Civiles et Commerciales
// https://bodacc-datadila.opendatasoft.com

import type { BodaccRecord } from "@/types";

const BASE_URL = "https://bodacc-datadila.opendatasoft.com/api/explore/v2.1";

export interface BodaccAnalysis {
  signals: string[];
  lastEvent?: string;
  lastEventDate?: string;
  hasCollectiveProcedure: boolean;
  capitalSocial?: number | null;
  capitalHistory: CapitalEvent[];
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
    const url = new URL(`${BASE_URL}/catalog/datasets/annonces-commerciales/records`);
    // Priorité à la correspondance exacte SIREN
    url.searchParams.set("where", `etablissement.siren="${siren}" OR registre LIKE "${siren}%"`);
    url.searchParams.set("order_by", "dateparution DESC");
    url.searchParams.set("limit", "20");
    url.searchParams.set("timezone", "Europe/Paris");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 86400 },
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
  const summary: EventSummary = {
    totalEvents: events.length,
    creations: 0,
    modifications: 0,
    ventes: 0,
    procedures: 0,
    radiations: 0,
  };

  for (const event of events) {
    const famille = (event.familleavis ?? "").toLowerCase();
    const typeActe = (event.acte?.typeActeLibelle ?? "").toLowerCase();

    if (famille.includes("creation") || famille.includes("créat")) summary.creations++;
    else if (famille.includes("modif")) summary.modifications++;
    else if (famille.includes("vente") || famille.includes("cession")) summary.ventes++;
    else if (
      famille.includes("procedure") ||
      famille.includes("procédure") ||
      famille.includes("liquidation") ||
      famille.includes("redressement")
    )
      summary.procedures++;
    else if (famille.includes("radiat")) summary.radiations++;

    if (
      famille.includes("procedure collective") ||
      famille.includes("liquidation judiciaire") ||
      famille.includes("redressement judiciaire") ||
      typeActe.includes("liquidation") ||
      typeActe.includes("redressement")
    ) {
      hasCollectiveProcedure = true;
    }

    if (event.acte?.capital) {
      // Formats FR : "1 000 000 €", "1.000.000,50 EUR", "500000"
      const cleaned = event.acte.capital
        .replace(/[^0-9,]/g, "")
        .replace(",", ".");
      const montant = parseFloat(cleaned);
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

    if (typeActe.includes("transfert de siège") || typeActe.includes("transfer")) {
      if (!signals.includes("modification_siege")) signals.push("modification_siege");
    }

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

export function getBodaccEventLabel(event: BodaccRecord): string {
  return event.familleavis_lib ?? event.typeavis_lib ?? "Événement";
}

export function getBodaccEventColor(event: BodaccRecord): string {
  const famille = (event.familleavis ?? "").toLowerCase();
  if (famille.includes("procedure") || famille.includes("liquidation")) return "hsl(var(--red))";
  if (famille.includes("creation")) return "hsl(var(--emerald))";
  if (famille.includes("modif")) return "hsl(var(--accent))";
  if (famille.includes("vente")) return "hsl(var(--amber))";
  if (famille.includes("radiat")) return "hsl(var(--red))";
  return "hsl(var(--text-faint))";
}
