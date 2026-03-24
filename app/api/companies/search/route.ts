import { NextRequest, NextResponse } from "next/server";
import { searchSirene, normalizeSireneResult } from "@/lib/sirene";
import { computeScore } from "@/lib/scoring";
import type { SearchResponse } from "@/types";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const query = sp.get("query") ?? "";
  const nafCode = sp.get("nafCode") ?? "";
  const department = sp.get("department") ?? "";
  const postalCode = sp.get("postalCode") ?? "";
  const employeeRange = sp.get("employeeRange") ?? "";
  const legalForm = sp.get("legalForm") ?? "";
  const sort = sp.get("sort") ?? "score";
  const page = parseInt(sp.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(sp.get("limit") ?? "20", 10), 50);

  try {
    const sireneData = await searchSirene({
      q: query || undefined,
      code_naf: nafCode || undefined,
      departement: department || undefined,
      code_postal: postalCode || undefined,
      tranche_effectif_salarie: employeeRange || undefined,
      nature_juridique: legalForm || undefined,
      per_page: limit,
      page,
    });

    const companies = sireneData.results.map((raw) => {
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
        id: normalized.siren!,
        ...normalized,
        score,
        scoreDetails: details,
        signals,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    if (sort === "recent") {
      companies.sort((a, b) => {
        const aDate = a.creationDate ? new Date(a.creationDate).getTime() : 0;
        const bDate = b.creationDate ? new Date(b.creationDate).getTime() : 0;
        return bDate - aDate;
      });
    } else if (sort === "name") {
      companies.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "fr"));
    } else {
      companies.sort((a, b) => b.score - a.score);
    }

    const response: SearchResponse = {
      data: companies as SearchResponse["data"],
      total: sireneData.total_results,
      page: sireneData.page,
      limit: sireneData.per_page,
      totalPages: sireneData.total_pages,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[/api/companies/search]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recherche. Veuillez reessayer." },
      { status: 500 },
    );
  }
}
