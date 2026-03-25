import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Building2, MapPin, Calendar, Users, Hash,
  User, AlertTriangle, ExternalLink, TrendingUp, TrendingDown,
  Minus, Globe, Award, Briefcase, BarChart2,
} from "lucide-react";
import ScoreBadge from "@/components/scoring/ScoreBadge";
import SignalBadge from "@/components/scoring/SignalBadge";
import ScoreBreakdown from "@/components/scoring/ScoreBreakdown";
import AppLayout from "@/components/layout/AppLayout";
import type {
  BodaccRecord, Dirigeant, BeneficiaireEffectif,
  FinancialYear, Etablissement, ConventionCollective,
} from "@/types";
import { EMPLOYEE_RANGES, REGIONS } from "@/types";
import { formatCurrency, computeGrowth } from "@/lib/sirene";
import type { BodaccAnalysis } from "@/lib/bodacc";
import { getBodaccEventColor } from "@/lib/bodacc";

async function getCompany(siren: string) {
  const base =
    process.env.NEXT_PUBLIC_API_URL ??
    (process.env.URL ? process.env.URL : "http://localhost:3000");
  const res = await fetch(`${base}/api/companies/${siren}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function CompanyPage({ params }: { params: Promise<{ siren: string }> }) {
  const { siren } = await params;
  const data = await getCompany(siren);
  if (!data) notFound();

  const { company: c, bodaccEvents, bodaccAnalysis } = data as {
    company: any;
    bodaccEvents: BodaccRecord[];
    bodaccAnalysis: BodaccAnalysis;
  };

  const latestFinance: FinancialYear | null = c.finances?.[0] ?? null;
  const prevFinance: FinancialYear | null = c.finances?.[1] ?? null;
  const caGrowth = latestFinance?.ca && prevFinance?.ca
    ? computeGrowth(latestFinance.ca, prevFinance.ca)
    : null;
  const summary = buildCompanySummary(c, bodaccAnalysis, latestFinance, caGrowth);

  return (
    <AppLayout>
      <div className="container-dashboard px-4 sm:px-6 py-6 sm:py-8">
        {/* Retour */}
        <Link href="/search" className="inline-flex items-center gap-1.5 text-xs mb-6 transition-colors"
          style={{ color: "hsl(var(--text-faint))" }}>
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour aux résultats
        </Link>

        {/* ── En-tête ─────────────────────────────────────────────────────── */}
        <Card className="mb-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "hsl(var(--surface-2))" }}>
              <Building2 className="w-6 h-6" style={{ color: "hsl(var(--accent))" }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h1 className="text-xl font-bold leading-tight" style={{ color: "hsl(var(--text))" }}>
                    {c.name}
                    {c.sigle && <span className="text-sm font-normal ml-2" style={{ color: "hsl(var(--text-muted))" }}>({c.sigle})</span>}
                  </h1>
                  {c.legalName && c.legalName !== c.name && (
                    <p className="text-sm mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>{c.legalName}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {c.legalForm && <Tag>{c.legalForm}</Tag>}
                    {c.categoryEntreprise && (
                      <Tag highlight>{c.categoryEntreprise}</Tag>
                    )}
                    {!c.isActive && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border font-medium"
                        style={{ backgroundColor: "hsl(var(--red) / 0.1)", borderColor: "hsl(var(--red) / 0.3)", color: "hsl(var(--red))" }}>
                        <AlertTriangle className="w-3 h-3" />Fermée
                      </span>
                    )}
                    <span className="text-[11px] font-mono" style={{ color: "hsl(var(--text-faint))" }}>
                      SIREN {c.siren}
                    </span>
                    {c.siret && (
                      <span className="text-[11px] font-mono" style={{ color: "hsl(var(--text-faint))" }}>
                        SIRET {c.siret}
                      </span>
                    )}
                  </div>
                </div>
                <ScoreBadge score={c.score} size="md" />
              </div>

              {/* Signaux */}
              {c.signals?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t"
                  style={{ borderColor: "hsl(var(--border-subtle))" }}>
                  {c.signals.map((s: string) => <SignalBadge key={s} signal={s} />)}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* ── Stats rapides ──────────────────────────────────────────────── */}
        <div className="grid gap-3 mb-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Card title="Synthese rapide">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] mb-1" style={{ color: "hsl(var(--text-faint))" }}>
                  Pourquoi cette entreprise ressort
                </p>
                <p className="text-sm font-medium" style={{ color: "hsl(var(--text))" }}>
                  {summary.opportunity}
                </p>
              </div>
              <div>
                <p className="text-[11px] mb-1" style={{ color: "hsl(var(--text-faint))" }}>
                  Point de vigilance
                </p>
                <p className="text-sm" style={{ color: "hsl(var(--text-muted))" }}>
                  {summary.risk}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {summary.highlights.map((item) => (
                  <Tag key={item} highlight>{item}</Tag>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Derniere activite">
            <div className="space-y-3">
              <p className="text-sm font-medium" style={{ color: "hsl(var(--text))" }}>
                {summary.lastActivity}
              </p>
              <p className="text-[11px]" style={{ color: "hsl(var(--text-faint))" }}>
                {summary.context}
              </p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-5 max-w-6xl">
          <StatCard
            label="Chiffre d'affaires"
            value={latestFinance?.ca ? formatCurrency(latestFinance.ca) : "—"}
            sub={latestFinance ? `Exercice ${latestFinance.annee}` : "Non publié"}
            trend={caGrowth}
          />
          <StatCard
            label="Résultat net"
            value={latestFinance?.resultatNet !== null && latestFinance?.resultatNet !== undefined
              ? formatCurrency(latestFinance.resultatNet) : "—"}
            sub={latestFinance?.resultatNet !== null && latestFinance?.resultatNet !== undefined
              ? (latestFinance.resultatNet >= 0 ? "Bénéfice" : "Déficit") : "Non publié"}
            resultColor={latestFinance?.resultatNet !== null && latestFinance?.resultatNet !== undefined
              ? (latestFinance.resultatNet >= 0 ? "emerald" : "red") : undefined}
          />
          <StatCard
            label="Effectif"
            value={c.employeeRange && c.employeeRange !== "NN"
              ? (EMPLOYEE_RANGES[c.employeeRange] ?? c.employeeRange) : "—"}
            sub={c.employeeRangeYear ? `Déclaré en ${c.employeeRangeYear}` : "Non renseigné"}
          />
          <StatCard
            label="Établissements"
            value={c.nombreEtablissementsOuverts != null
              ? `${c.nombreEtablissementsOuverts} ouvert${c.nombreEtablissementsOuverts > 1 ? "s" : ""}`
              : (c.nombreEtablissements != null ? `${c.nombreEtablissements} total` : "—")}
            sub={c.capitalSocial ? `Capital ${formatCurrency(c.capitalSocial)}` : ""}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_20rem] gap-5 items-start">
          {/* ── Colonne principale ───────────────────────────────────────── */}
          <div className="space-y-4 min-w-0">

            {/* Activité & Localisation */}
            <Card title="Activité & localisation">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <InfoRow icon={Hash} label="Code NAF" value={c.nafCode ? `${c.nafCode}` : null}
                  sub={c.nafLabel ?? undefined} />
                <InfoRow icon={Globe} label="Secteur" value={c.nafSectionLabel ?? c.nafSection ?? null} />
                <InfoRow icon={Calendar} label="Date de création"
                  value={c.creationDate
                    ? new Date(c.creationDate).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
                    : null} />
                <InfoRow icon={MapPin} label="Siège social"
                  value={[c.address, c.postalCode, c.city].filter(Boolean).join(", ")} />
                <InfoRow icon={MapPin} label="Département / Région"
                  value={[
                    c.department ? `Dép. ${c.department}` : null,
                    c.region ? REGIONS[c.region] ?? null : null,
                  ].filter(Boolean).join(" — ")} />
                {c.lastUpdate && (
                  <InfoRow icon={Calendar} label="Dernière mise à jour"
                    value={new Date(c.lastUpdate).toLocaleDateString("fr-FR")} />
                )}
              </div>
            </Card>

            {/* Finances détaillées */}
            {c.finances?.length > 0 && (
              <Card title="Données financières">
                <div className="space-y-3">
                  {c.finances.slice(0, 4).map((f: FinancialYear, i: number) => {
                    const prev = c.finances[i + 1];
                    const growth = f.ca && prev?.ca ? computeGrowth(f.ca, prev.ca) : null;
                    return (
                      <div key={f.annee}
                        className="flex flex-col gap-2 py-2.5 border-b last:border-0 sm:flex-row sm:items-center sm:justify-between"
                        style={{ borderColor: "hsl(var(--border-subtle))" }}>
                        <span className="text-sm font-mono font-medium" style={{ color: "hsl(var(--text-muted))" }}>
                          {f.annee}
                        </span>
                          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                          {f.ca !== null && f.ca !== undefined && (
                            <div className="text-right">
                              <p className="text-[11px]" style={{ color: "hsl(var(--text-faint))" }}>CA</p>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold" style={{ color: "hsl(var(--text))" }}>
                                  {formatCurrency(f.ca)}
                                </span>
                                {growth !== null && (
                                  <GrowthBadge value={growth} />
                                )}
                              </div>
                            </div>
                          )}
                          {f.resultatNet !== null && f.resultatNet !== undefined && (
                            <div className="text-right">
                              <p className="text-[11px]" style={{ color: "hsl(var(--text-faint))" }}>Résultat net</p>
                              <span className="text-sm font-semibold"
                                style={{ color: f.resultatNet >= 0 ? "hsl(var(--emerald))" : "hsl(var(--red))" }}>
                                {formatCurrency(f.resultatNet)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] mt-2" style={{ color: "hsl(var(--text-faint))" }}>
                  Source : DGFIP via data.gouv.fr
                </p>
              </Card>
            )}

            {/* Dirigeants */}
            {c.dirigeants?.length > 0 && (
              <Card title={`Direction (${c.dirigeants.length})`}>
                <div className="space-y-3">
                  {c.dirigeants.map((d: Dirigeant, i: number) => (
                    <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0"
                      style={{ borderColor: "hsl(var(--border-subtle))" }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
                        style={{ backgroundColor: "hsl(var(--surface-2))", color: "hsl(var(--text-muted))" }}>
                        {d.typeDirigeant === "personne_morale" ? "M" : (d.prenoms?.[0] ?? d.nom?.[0] ?? "?")}
                      </div>
                      <div>
                        {d.typeDirigeant === "personne_morale" ? (
                          <p className="text-sm font-medium" style={{ color: "hsl(var(--text))" }}>
                            {d.denomination ?? "Société dirigeante"}
                            {d.sirenDirigeant && (
                              <span className="text-[11px] ml-2 font-mono" style={{ color: "hsl(var(--text-faint))" }}>
                                SIREN {d.sirenDirigeant}
                              </span>
                            )}
                          </p>
                        ) : (
                          <p className="text-sm font-medium" style={{ color: "hsl(var(--text))" }}>
                            {[d.prenoms, d.nom].filter(Boolean).join(" ")}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {d.qualite && <Tag>{d.qualite}</Tag>}
                          {d.anneeNaissance && (
                            <span className="text-[11px]" style={{ color: "hsl(var(--text-faint))" }}>
                              Né en {d.anneeNaissance}
                            </span>
                          )}
                          {d.datePrisePoste && (
                            <span className="text-[11px]" style={{ color: "hsl(var(--text-faint))" }}>
                              Depuis {new Date(d.datePrisePoste).getFullYear()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Bénéficiaires effectifs */}
            {c.beneficiairesEffectifs?.length > 0 && (
              <Card title={`Bénéficiaires effectifs (${c.beneficiairesEffectifs.length})`}>
                <div className="space-y-2">
                  {c.beneficiairesEffectifs.map((b: BeneficiaireEffectif, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0"
                      style={{ borderColor: "hsl(var(--border-subtle))" }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "hsl(var(--text))" }}>
                          {[b.prenoms, b.nom].filter(Boolean).join(" ") || "Non renseigné"}
                        </p>
                        {b.nationalite && (
                          <p className="text-[11px]" style={{ color: "hsl(var(--text-faint))" }}>
                            Nationalité : {b.nationalite}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {b.pourcentageParts !== null && b.pourcentageParts !== undefined && (
                          <p className="text-sm font-bold font-mono" style={{ color: "hsl(var(--accent))" }}>
                            {b.pourcentageParts}%
                          </p>
                        )}
                        <p className="text-[11px]" style={{ color: "hsl(var(--text-faint))" }}>
                          {b.pourcentageVotes !== null && b.pourcentageVotes !== undefined
                            ? `${b.pourcentageVotes}% votes` : "parts"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] mt-2" style={{ color: "hsl(var(--text-faint))" }}>
                  Source : Registre National des Entreprises (INPI)
                </p>
              </Card>
            )}

            {/* Labels & certifications */}
            {c.complements && hasAnyLabel(c.complements) && (
              <Card title="Labels & certifications">
                <div className="flex flex-wrap gap-2">
                  {c.complements.estEss && <LabelBadge icon="🤝" label="ESS" desc="Économie Sociale et Solidaire" />}
                  {c.complements.estRge && <LabelBadge icon="🌿" label="RGE" desc="Reconnu Garant de l'Environnement" />}
                  {c.complements.estBio && <LabelBadge icon="🌱" label="Bio" desc="Certification biologique" />}
                  {c.complements.estQualiopi && <LabelBadge icon="🎓" label="Qualiopi" desc="Certification organisme de formation" />}
                  {c.complements.estOrganismeFormation && <LabelBadge icon="📚" label="Organisme de formation" desc="Habilité à dispenser des formations" />}
                  {c.complements.estEntrepreneurSpectacle && <LabelBadge icon="🎭" label="Entrepreneur du spectacle" desc="" />}
                  {c.complements.estSocieteMission && <LabelBadge icon="🎯" label="Société à mission" desc="Raison d'être inscrite aux statuts" />}
                  {c.complements.estServicePublic && <LabelBadge icon="🏛️" label="Service public" desc="" />}
                  {c.complements.identifiantAssociation && (
                    <LabelBadge icon="🔗" label={`RNA : ${c.complements.identifiantAssociation}`} desc="Identifiant association" />
                  )}
                  {c.complements.egaproRenseignee && (
                    <LabelBadge icon="⚖️" label="Index égalité H/F" desc="Index Egapro publié" />
                  )}
                </div>
              </Card>
            )}

            {/* Convention collective */}
            {c.conventionsCollectives?.length > 0 && (
              <Card title="Convention collective">
                <div className="space-y-2">
                  {c.conventionsCollectives.map((cc: ConventionCollective, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <Briefcase className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: "hsl(var(--text-faint))" }} />
                      <div>
                        {cc.denomination && (
                          <p className="text-sm font-medium" style={{ color: "hsl(var(--text))" }}>
                            {cc.denomination}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {cc.idcc && <Tag>IDCC {cc.idcc}</Tag>}
                          {cc.etat && <Tag>{cc.etat}</Tag>}
                          {cc.nature && (
                            <span className="text-[11px]" style={{ color: "hsl(var(--text-faint))" }}>
                              {cc.nature.replace(/_/g, " ").toLowerCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Établissements */}
            {c.etablissements?.length > 1 && (
              <Card title={`Établissements (${c.etablissements.length})`}>
                <div className="space-y-2">
                  {c.etablissements.slice(0, 8).map((e: Etablissement) => (
                    <div key={e.siret} className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
                      style={{ borderColor: "hsl(var(--border-subtle))" }}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px]" style={{ color: "hsl(var(--text-faint))" }}>
                            {e.siret}
                          </span>
                          {e.estSiege && <Tag>Siège</Tag>}
                          {e.etatAdministratif === "F" && (
                            <span className="text-[10px]" style={{ color: "hsl(var(--red))" }}>Fermé</span>
                          )}
                        </div>
                        {(e.commune || e.codePostal) && (
                          <p className="text-xs mt-0.5" style={{ color: "hsl(var(--text-muted))" }}>
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {[e.codePostal, e.commune].filter(Boolean).join(" ")}
                            {e.departement ? ` (${e.departement})` : ""}
                          </p>
                        )}
                      </div>
                      {e.employeeRange && e.employeeRange !== "NN" && (
                        <span className="text-[11px]" style={{ color: "hsl(var(--text-faint))" }}>
                          {EMPLOYEE_RANGES[e.employeeRange] ?? e.employeeRange}
                        </span>
                      )}
                    </div>
                  ))}
                  {c.etablissements.length > 8 && (
                    <p className="text-[11px] pt-1" style={{ color: "hsl(var(--text-faint))" }}>
                      + {c.etablissements.length - 8} autres établissements
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* BODACC */}
            {bodaccEvents?.length > 0 && (
              <Card title={`Historique légal BODACC (${bodaccAnalysis?.eventSummary?.totalEvents ?? bodaccEvents.length} événements)`}>

                {/* Résumé */}
                {bodaccAnalysis?.eventSummary && (
                  <div className="flex gap-3 mb-4 flex-wrap">
                    {bodaccAnalysis.eventSummary.creations > 0 && (
                      <SummaryPill color="emerald" label={`${bodaccAnalysis.eventSummary.creations} création${bodaccAnalysis.eventSummary.creations > 1 ? "s" : ""}`} />
                    )}
                    {bodaccAnalysis.eventSummary.modifications > 0 && (
                      <SummaryPill color="accent" label={`${bodaccAnalysis.eventSummary.modifications} modification${bodaccAnalysis.eventSummary.modifications > 1 ? "s" : ""}`} />
                    )}
                    {bodaccAnalysis.eventSummary.ventes > 0 && (
                      <SummaryPill color="amber" label={`${bodaccAnalysis.eventSummary.ventes} vente${bodaccAnalysis.eventSummary.ventes > 1 ? "s" : ""}`} />
                    )}
                    {bodaccAnalysis.eventSummary.procedures > 0 && (
                      <SummaryPill color="red" label={`${bodaccAnalysis.eventSummary.procedures} procédure${bodaccAnalysis.eventSummary.procedures > 1 ? "s" : ""}`} />
                    )}
                  </div>
                )}

                {/* Historique capital */}
                {bodaccAnalysis?.capitalHistory?.length > 0 && (
                  <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: "hsl(var(--surface-2))" }}>
                    <p className="text-[11px] font-semibold mb-2" style={{ color: "hsl(var(--text-faint))" }}>
                      Historique du capital
                    </p>
                    <div className="space-y-1.5">
                      {bodaccAnalysis.capitalHistory.map((cap, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span style={{ color: "hsl(var(--text-muted))" }}>
                            {cap.type === "creation" ? "Capital initial" : "Augmentation de capital"}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold font-mono" style={{ color: "hsl(var(--text))" }}>
                              {formatCurrency(cap.montant)}
                            </span>
                            <span className="text-[11px]" style={{ color: "hsl(var(--text-faint))" }}>
                              {new Date(cap.date).toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Événements */}
                <div className="space-y-3">
                  {bodaccEvents.map((ev: BodaccRecord, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: getBodaccEventColor(ev) }} />
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: "hsl(var(--text))" }}>
                          {ev.familleavis_lib ?? ev.typeavis_lib}
                          {ev.acte?.typeActeLibelle && (
                            <span className="font-normal" style={{ color: "hsl(var(--text-muted))" }}>
                              {" "}· {ev.acte.typeActeLibelle}
                            </span>
                          )}
                        </p>
                        {ev.acte?.activite && (
                          <p className="text-xs" style={{ color: "hsl(var(--text-muted))" }}>
                            Activité : {ev.acte.activite}
                          </p>
                        )}
                        <p className="text-xs mt-0.5" style={{ color: "hsl(var(--text-faint))" }}>
                          {ev.dateparution ? new Date(ev.dateparution).toLocaleDateString("fr-FR") : ""}
                          {ev.tribunal ? ` · ${ev.tribunal}` : ""}
                          {ev.ville ? ` · ${ev.ville}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <a href={`https://www.bodacc.fr/annonce/liste-entreprise-0/${c.siren}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs mt-4 hover:underline"
                  style={{ color: "hsl(var(--accent))" }}>
                  Voir toutes les annonces BODACC <ExternalLink className="w-3 h-3" />
                </a>
              </Card>
            )}
          </div>

          {/* ── Colonne score ──────────────────────────────────────────────── */}
          <div className="space-y-4 xl:sticky xl:top-16">
            <ScoreBreakdown score={c.score} details={c.scoreDetails} />

            {/* Liens externes */}
            <Card title="Sources officielles">
              <div className="space-y-2">
                <ExternalLink_ href={`https://annuaire-entreprises.data.gouv.fr/entreprise/${c.siren}`}
                  label="Annuaire Entreprises" />
                <ExternalLink_ href={`https://www.infogreffe.fr/recherche-siret-siren/${c.siren}`}
                  label="Infogreffe" />
                <ExternalLink_ href={`https://www.pappers.fr/entreprise/${c.siren}`}
                  label="Pappers" />
                <ExternalLink_ href={`https://www.societe.com/societe/${c.siren}.html`}
                  label="Societe.com" />
                {bodaccEvents?.length > 0 && (
                  <ExternalLink_ href={`https://www.bodacc.fr/annonce/liste-entreprise-0/${c.siren}`}
                    label="BODACC officiel" />
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border p-5 ${className}`}
      style={{ backgroundColor: "hsl(var(--surface))", borderColor: "hsl(var(--border-subtle))" }}>
      {title && (
        <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-4"
          style={{ color: "hsl(var(--text-faint))" }}>
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

function Tag({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <span className="text-[11px] px-2 py-0.5 rounded font-medium"
      style={{
        backgroundColor: highlight ? "hsl(var(--accent-muted) / 0.4)" : "hsl(var(--surface-2))",
        color: highlight ? "hsl(var(--accent))" : "hsl(var(--text-muted))",
      }}>
      {children}
    </span>
  );
}

function InfoRow({ icon: Icon, label, value, sub }: {
  icon: React.ElementType; label: string; value?: string | null; sub?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "hsl(var(--text-faint))" }} />
      <div>
        <p className="text-[11px]" style={{ color: "hsl(var(--text-faint))" }}>{label}</p>
        <p className="text-sm font-medium" style={{ color: "hsl(var(--text))" }}>{value}</p>
        {sub && <p className="text-[11px]" style={{ color: "hsl(var(--text-faint))" }}>{sub}</p>}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, trend, resultColor }: {
  label: string; value: string; sub?: string;
  trend?: number | null; resultColor?: "emerald" | "red";
}) {
  return (
    <div className="rounded-lg border p-4"
      style={{ backgroundColor: "hsl(var(--surface))", borderColor: "hsl(var(--border-subtle))" }}>
      <p className="text-[11px] mb-1" style={{ color: "hsl(var(--text-faint))" }}>{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-lg font-bold font-mono"
          style={{ color: resultColor === "emerald" ? "hsl(var(--emerald))" : resultColor === "red" ? "hsl(var(--red))" : "hsl(var(--text))" }}>
          {value}
        </p>
        {trend !== null && trend !== undefined && <GrowthBadge value={trend} />}
      </div>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: "hsl(var(--text-faint))" }}>{sub}</p>}
    </div>
  );
}

function GrowthBadge({ value }: { value: number }) {
  const isPos = value > 0;
  const isNeg = value < 0;
  const Icon = isPos ? TrendingUp : isNeg ? TrendingDown : Minus;
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium"
      style={{ color: isPos ? "hsl(var(--emerald))" : isNeg ? "hsl(var(--red))" : "hsl(var(--text-faint))" }}>
      <Icon className="w-3 h-3" />
      {isPos ? "+" : ""}{value}%
    </span>
  );
}

function LabelBadge({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium"
      title={desc}
      style={{ backgroundColor: "hsl(var(--surface-2))", borderColor: "hsl(var(--border))", color: "hsl(var(--text-muted))" }}>
      <span>{icon}</span>{label}
    </div>
  );
}

function SummaryPill({ color, label }: { color: "emerald" | "accent" | "amber" | "red"; label: string }) {
  const colors = {
    emerald: { bg: "hsl(158 60% 36% / 0.12)", color: "hsl(158 60% 46%)", border: "hsl(158 60% 36% / 0.3)" },
    accent:  { bg: "hsl(var(--accent-muted) / 0.4)", color: "hsl(var(--accent))", border: "hsl(var(--accent) / 0.3)" },
    amber:   { bg: "hsl(38 85% 50% / 0.12)", color: "hsl(38 85% 58%)", border: "hsl(38 85% 50% / 0.3)" },
    red:     { bg: "hsl(var(--red) / 0.10)", color: "hsl(var(--red))", border: "hsl(var(--red) / 0.3)" },
  };
  const s = colors[color];
  return (
    <span className="text-[11px] font-medium px-2 py-1 rounded border"
      style={{ backgroundColor: s.bg, color: s.color, borderColor: s.border }}>
      {label}
    </span>
  );
}

function ExternalLink_({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-center justify-between py-1.5 text-xs transition-colors hover:underline"
      style={{ color: "hsl(var(--text-muted))" }}>
      {label}
      <ExternalLink className="w-3 h-3" style={{ color: "hsl(var(--text-faint))" }} />
    </a>
  );
}

function buildCompanySummary(
  company: any,
  bodaccAnalysis: BodaccAnalysis,
  latestFinance: FinancialYear | null,
  caGrowth: number | null,
): {
  opportunity: string;
  risk: string;
  highlights: string[];
  lastActivity: string;
  context: string;
} {
  const highlights = [
    company.score >= 70 ? "score eleve" : null,
    company.finances?.length ? "finances publiees" : null,
    company.signals?.length ? `${company.signals.length} signaux` : null,
    company.nombreEtablissementsOuverts > 1 ? "multi-sites" : null,
  ].filter(Boolean) as string[];

  const opportunityParts = [
    company.nafLabel ? `Secteur ${company.nafLabel.toLowerCase()}` : null,
    latestFinance?.ca ? `CA ${formatCurrency(latestFinance.ca)}` : null,
    caGrowth && caGrowth > 0 ? `croissance ${caGrowth}%` : null,
    company.employeeRange && company.employeeRange !== "NN" ? `effectif ${EMPLOYEE_RANGES[company.employeeRange] ?? company.employeeRange}` : null,
  ].filter(Boolean);

  const opportunity =
    opportunityParts.length > 0
      ? opportunityParts.join(" · ")
      : "Profil exploitable pour qualification commerciale, meme sans donnees financieres detaillees.";

  const risk = !company.isActive
    ? "Entreprise inactive ou fermee."
    : bodaccAnalysis.hasCollectiveProcedure
      ? "Procedure collective detectee au BODACC, verification recommandee."
      : latestFinance?.resultatNet !== null && latestFinance?.resultatNet !== undefined && latestFinance.resultatNet < 0
        ? "Dernier resultat net negatif, a mettre en balance avec le chiffre d'affaires."
        : "Pas de signal de risque majeur detecte dans les donnees publiques exploitees.";

  const lastActivity = company.lastBodaccEvent
    ? `${company.lastBodaccEvent}${company.lastBodaccDate ? ` · ${new Date(company.lastBodaccDate).toLocaleDateString("fr-FR")}` : ""}`
    : company.lastUpdate
      ? `Derniere mise a jour SIRENE · ${new Date(company.lastUpdate).toLocaleDateString("fr-FR")}`
      : "Aucune activite recente remontee par les sources publiques.";

  const contextParts = [
    company.conventionsCollectives?.length ? `${company.conventionsCollectives.length} convention(s) collective(s)` : null,
    company.dirigeants?.length ? `${company.dirigeants.length} dirigeant(s)` : null,
    company.beneficiairesEffectifs?.length ? `${company.beneficiairesEffectifs.length} beneficiaire(s) effectif(s)` : null,
  ].filter(Boolean);

  return {
    opportunity,
    risk,
    highlights: highlights.length ? highlights : ["a analyser"],
    lastActivity,
    context: contextParts.length ? contextParts.join(" · ") : "Lecture basee sur SIRENE, BODACC et enrichissements publics.",
  };
}

function hasAnyLabel(c: any): boolean {
  return !!(c.estEss || c.estRge || c.estBio || c.estQualiopi ||
    c.estOrganismeFormation || c.estEntrepreneurSpectacle ||
    c.estSocieteMission || c.estServicePublic || c.identifiantAssociation || c.egaproRenseignee);
}
