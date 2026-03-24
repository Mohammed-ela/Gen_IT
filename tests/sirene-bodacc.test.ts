import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSireneResult } from "@/lib/sirene";
import { analyzeBodaccEvents } from "@/lib/bodacc";
import type { SireneResult, BodaccRecord } from "@/types";

test("normalizeSireneResult maps core company fields", () => {
  const raw: SireneResult = {
    siren: "123456789",
    nom_complet: "Acme Tech",
    date_creation: "2022-01-01",
    activite_principale: "6201Z",
    section_activite_principale: "J",
    etat_administratif: "A",
    tranche_effectif_salarie: "11",
    nature_juridique: "5710",
    siege: {
      siret: "12345678900011",
      libelle_commune: "Paris",
      code_postal: "75001",
      departement: "75",
      region: "11",
      latitude: "48.86",
      longitude: "2.34",
      activite_principale: "6201Z",
    },
    dirigeants: [{ nom: "Dupont", type_dirigeant: "personne_physique" }],
  };

  const normalized = normalizeSireneResult(raw);

  assert.equal(normalized.siren, "123456789");
  assert.equal(normalized.city, "Paris");
  assert.equal(normalized.nafCode, "6201Z");
  assert.equal(normalized.isActive, true);
  assert.equal(normalized.dirigeants?.[0]?.nom, "Dupont");
});

test("analyzeBodaccEvents extracts signals and procedures", () => {
  const events: BodaccRecord[] = [
    {
      familleavis: "creation",
      familleavis_lib: "Creation",
      dateparution: "2024-01-15",
      acte: { capital: "10000", devise: "EUR" },
    },
    {
      familleavis: "modification",
      dateparution: "2025-02-01",
      acte: { typeActeLibelle: "Transfert de siege" },
    },
    {
      familleavis: "procedure collective",
      dateparution: "2025-03-01",
      acte: { typeActeLibelle: "Liquidation judiciaire" },
    },
  ];

  const analysis = analyzeBodaccEvents(events);

  assert.equal(analysis.hasCollectiveProcedure, true);
  assert.ok(analysis.signals.includes("modification_siege"));
  assert.equal(analysis.capitalSocial, 10000);
  assert.equal(analysis.eventSummary.totalEvents, 3);
});
