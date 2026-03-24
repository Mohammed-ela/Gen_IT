/**
 * GET /api/companies/:siren
 * Fiche complète : SIRENE + BODACC agrégés
 */

import { NextRequest, NextResponse } from "next/server";
import { getCompanyBySiren, normalizeSireneResult } from "@/lib/sirene";
import { getBodaccEvents, analyzeBodaccEvents } from "@/lib/bodacc";
import { computeScore } from "@/lib/scoring";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ siren: string }> }
) {
  const { siren } = await params;

  if (!siren || !/^\d{9}$/.test(siren)) {
    return NextResponse.json({ error: "SIREN invalide (9 chiffres attendus)" }, { status: 400 });
  }

  try {
    // Appels parallèles SIRENE + BODACC
    const [sireneRaw, bodaccEvents] = await Promise.all([
      getCompanyBySiren(siren),
      getBodaccEvents(siren),
    ]);

    if (!sireneRaw) {
      return NextResponse.json({ error: "Entreprise introuvable dans SIRENE" }, { status: 404 });
    }

    const normalized = normalizeSireneResult(sireneRaw);
    const bodacc = analyzeBodaccEvents(bodaccEvents);

    const { score, details, signals } = computeScore({
      creationDate: normalized.creationDate ?? null,
      nafCode: normalized.nafCode ?? null,
      employeeRange: normalized.employeeRange ?? null,
      isActive: normalized.isActive ?? true,
      hasCollectiveProcedure: bodacc.hasCollectiveProcedure,
      bodaccSignals: bodacc.signals,
      legalForm: normalized.legalForm ?? null,
      directorName: normalized.dirigeants?.[0]?.nom ?? null,
      address: normalized.address ?? null,
      lat: normalized.lat ?? null,
      finances: normalized.finances ?? [],
      complements: normalized.complements ?? null,
      nombreEtablissements: normalized.nombreEtablissements ?? null,
      beneficiairesCount: normalized.beneficiairesEffectifs?.length ?? 0,
      conventionsCount: normalized.conventionsCollectives?.length ?? 0,
    });

    const company = {
      id: siren,
      ...normalized,
      score,
      scoreDetails: details,
      signals: [...new Set([...signals, ...bodacc.signals.filter((s) => !signals.includes(s as any))])],
      lastBodaccEvent: bodacc.lastEvent ?? null,
      lastBodaccDate: bodacc.lastEventDate ?? null,
      capitalSocial: bodacc.capitalSocial ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      company,
      bodaccEvents: bodaccEvents.slice(0, 10),
      bodaccAnalysis: {
        capitalHistory: bodacc.capitalHistory,
        eventSummary: bodacc.eventSummary,
        hasCollectiveProcedure: bodacc.hasCollectiveProcedure,
      },
    });
  } catch (error) {
    console.error(`[/api/companies/${siren}]`, error);
    return NextResponse.json({ error: "Erreur lors de la récupération des données" }, { status: 500 });
  }
}
