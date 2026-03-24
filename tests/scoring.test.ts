import test from "node:test";
import assert from "node:assert/strict";
import { computeScore, getScoreCategory } from "@/lib/scoring";

test("computeScore returns stronger score for healthy tech company", () => {
  const result = computeScore({
    creationDate: new Date().toISOString(),
    nafCode: "6201Z",
    employeeRange: "11",
    isActive: true,
    legalForm: "SAS",
    directorName: "Martin",
    finances: [
      { annee: 2024, ca: 1_200_000, resultatNet: 120_000 },
      { annee: 2023, ca: 900_000, resultatNet: 80_000 },
    ],
    nombreEtablissements: 2,
    beneficiairesCount: 1,
    conventionsCount: 1,
  });

  assert.ok(result.score >= 70);
  assert.equal(result.details.activity, 20);
  assert.ok(result.signals.includes("secteur_tech"));
  assert.ok(result.signals.includes("croissance_ca"));
});

test("computeScore penalizes inactive company", () => {
  const result = computeScore({
    creationDate: "2018-01-01T00:00:00.000Z",
    nafCode: "9602A",
    employeeRange: "00",
    isActive: false,
    finances: [{ annee: 2024, ca: 20_000, resultatNet: -3_000 }],
  });

  assert.ok(result.score < 30);
  assert.equal(result.details.stability, 0);
});

test("getScoreCategory maps thresholds correctly", () => {
  assert.equal(getScoreCategory(75).label, "Chaud");
  assert.equal(getScoreCategory(50).label, "Tiede");
  assert.equal(getScoreCategory(20).label, "Froid");
});
