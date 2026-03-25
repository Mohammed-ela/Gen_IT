import { NextRequest, NextResponse } from "next/server";
import { getCompanyBySiren, normalizeSireneResult } from "@/lib/sirene";
import { computeScore } from "@/lib/scoring";

// Charge plusieurs entreprises en parallèle à partir d'une liste de SIRENs
export async function POST(request: NextRequest) {
  let body: { sirens?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const sirens = Array.isArray(body.sirens)
    ? (body.sirens as unknown[])
        .filter((s): s is string => typeof s === "string" && /^\d{9}$/.test(s))
        .slice(0, 50) // plafond raisonnable
    : [];

  if (!sirens.length) {
    return NextResponse.json({ companies: [] });
  }

  const results = await Promise.all(
    sirens.map(async (siren) => {
      try {
        const raw = await getCompanyBySiren(siren);
        if (!raw) return null;

        const normalized = normalizeSireneResult(raw);
        const { score, details, signals } = computeScore({
          creationDate: normalized.creationDate ?? null,
          nafCode: normalized.nafCode ?? null,
          employeeRange: normalized.employeeRange ?? null,
          isActive: normalized.isActive ?? true,
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

        return {
          id: siren,
          ...normalized,
          score,
          scoreDetails: details,
          signals,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } catch {
        return null;
      }
    })
  );

  return NextResponse.json({
    companies: results.filter(Boolean),
  });
}
