import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const FEATURES = [
  {
    tag: "01",
    title: "Sources officielles",
    desc: "SIRENE, BODACC, DGFIP, RNE - donnees legales francaises. Aucune base achetee, aucun scraping.",
  },
  {
    tag: "02",
    title: "Scoring 6 criteres",
    desc: "Recence · Secteur · Taille · Stabilite · Finances · Signaux. Score pondere, transparent et explicable.",
  },
  {
    tag: "03",
    title: "Signaux business",
    desc: "Levees de fonds, creations recentes, multi-sites, resultat positif, CA publie, conventions collectives.",
  },
];

const STATS = [
  { value: "10M+", label: "Etablissements", delay: "0s" },
  { value: "0-100", label: "Score qualification", delay: "0.15s" },
  { value: "15+", label: "Signaux business", delay: "0.3s" },
  { value: "100%", label: "Donnees officielles", delay: "0.45s" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "hsl(var(--bg))" }}>
      <header className="border-b" style={{ borderColor: "hsl(var(--border-subtle))" }}>
        <div className="container-dashboard px-4 sm:px-6 h-11 flex items-center justify-between">
          <span className="text-base font-extrabold tracking-tight select-none">
            <span style={{ color: "hsl(var(--text))" }}>Gen</span>
            <span style={{ color: "hsl(var(--accent))" }}>_IT</span>
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/search"
              className="text-xs font-medium transition-colors"
              style={{ color: "hsl(var(--text-muted))" }}
            >
              Rechercher
            </Link>
            <Link
              href="/favorites"
              className="text-xs font-medium transition-colors"
              style={{ color: "hsl(var(--text-muted))" }}
            >
              Favoris
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section
        className="flex-1 grid-texture relative overflow-hidden flex items-center"
        style={{ minHeight: "calc(100vh - 44px - 1px)" }}
      >
        <div
          className="absolute left-[8%] top-[18%] w-40 h-40 rounded-full blur-3xl animate-drift"
          style={{ backgroundColor: "hsl(var(--accent) / 0.08)" }}
        />
        <div
          className="absolute right-[16%] bottom-[16%] w-56 h-56 rounded-full blur-3xl animate-pulse-soft"
          style={{ backgroundColor: "hsl(var(--accent) / 0.06)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 55% 45% at 50% 60%, hsl(var(--accent) / 0.06) 0%, transparent 70%)",
          }}
        />

        <div className="container-dashboard px-8 sm:px-10 lg:px-16 py-20 sm:py-24 w-full flex items-center justify-between gap-16">
          <div className="max-w-3xl animate-fade-up relative z-10 flex-1">
            <div className="flex items-center gap-2 mb-8 animate-fade-up">
              <span
                className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase px-3 py-1.5 rounded border animate-pulse-soft"
                style={{
                  color: "hsl(var(--accent))",
                  borderColor: "hsl(var(--accent) / 0.3)",
                  backgroundColor: "hsl(var(--accent-muted))",
                  boxShadow: "0 0 0 1px hsl(var(--accent) / 0.08), 0 14px 40px hsl(var(--bg) / 0.28)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: "hsl(var(--accent))" }}
                />
                Donnees officielles · data.gouv.fr
              </span>
            </div>

            <h1
              className="font-extrabold leading-[0.95] tracking-tight mb-6 animate-fade-up animate-delay-100"
              style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)", color: "hsl(var(--text))" }}
            >
              Intelligence
              <br />
              <span style={{ color: "hsl(var(--accent))" }}>commerciale</span>
              <br />
              B2B.
            </h1>

            <p
              className="text-base leading-relaxed mb-10 max-w-xl animate-fade-up animate-delay-200"
              style={{ color: "hsl(var(--text-muted))", fontWeight: 400 }}
            >
              10M+ entreprises francaises. Filtrez par secteur, localisation, effectif. Scoring
              automatique 0-100 base sur 6 criteres. Signaux business en temps reel.
            </p>

            <div className="flex flex-wrap items-center gap-3 animate-fade-up animate-delay-300">
              <Link
                href="/search"
                className="group inline-flex items-center gap-2.5 px-5 py-3 rounded font-semibold text-sm transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  backgroundColor: "hsl(var(--accent))",
                  color: "hsl(var(--accent-fg))",
                  boxShadow: "0 14px 36px hsl(var(--accent) / 0.18)",
                }}
              >
                Lancer une recherche
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <span className="text-xs font-mono" style={{ color: "hsl(var(--text-faint))" }}>
                SIRENE · BODACC · DGFIP
              </span>
            </div>

            <div
              className="mt-10 h-px w-full max-w-xl animate-fade-up animate-delay-400"
              style={{
                background:
                  "linear-gradient(90deg, hsl(var(--accent) / 0.0), hsl(var(--accent) / 0.45), hsl(var(--accent) / 0.0))",
              }}
            />
          </div>

          <div className="hidden xl:flex flex-col gap-4 animate-fade-up animate-delay-300 flex-shrink-0">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded border p-4 min-w-[148px] animate-fade-up"
                style={{
                  backgroundColor: "hsl(var(--surface))",
                  borderColor: "hsl(var(--border-subtle))",
                  boxShadow: "0 18px 50px hsl(var(--bg) / 0.24)",
                  animationDelay: s.delay,
                }}
              >
                <p
                  className="text-2xl font-extrabold font-mono leading-none"
                  style={{ color: "hsl(var(--accent))" }}
                >
                  {s.value}
                </p>
                <p
                  className="text-[11px] mt-1 tracking-wide"
                  style={{ color: "hsl(var(--text-faint))" }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t" style={{ borderColor: "hsl(var(--border-subtle))" }}>
        <div className="container-dashboard px-4 sm:px-6 py-10 sm:py-14">
          <div
            className="grid grid-cols-1 xl:grid-cols-3"
            style={{
              backgroundColor: "hsl(var(--border-subtle))",
              gap: "1px",
            }}
          >
            {FEATURES.map((f, index) => (
              <div
                key={f.tag}
                className="group p-7 sm:p-8 space-y-3 animate-fade-up transition-colors duration-300"
                style={{
                  backgroundColor: "hsl(var(--bg))",
                  animationDelay: `${0.12 * (index + 1)}s`,
                }}
              >
                <span className="font-mono text-xs font-bold" style={{ color: "hsl(var(--accent))" }}>
                  {f.tag}
                </span>
                <h3
                  className="font-bold text-base max-w-[18rem]"
                  style={{ color: "hsl(var(--text))" }}
                >
                  {f.title}
                </h3>
                <p
                  className="text-sm leading-relaxed max-w-[26rem]"
                  style={{ color: "hsl(var(--text-muted))" }}
                >
                  {f.desc}
                </p>
                <div
                  className="h-px w-16 transition-all duration-300 group-hover:w-24"
                  style={{ backgroundColor: "hsl(var(--accent) / 0.45)" }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-5" style={{ borderColor: "hsl(var(--border-subtle))" }}>
        <div className="container-dashboard px-4 sm:px-6 flex items-center justify-between">
          <span className="text-xs font-mono" style={{ color: "hsl(var(--text-faint))" }}>
            © 2026 Gen_IT
          </span>
          <a
            href="https://data.gouv.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono hover:underline"
            style={{ color: "hsl(var(--text-faint))" }}
          >
            data.gouv.fr
          </a>
        </div>
      </footer>
    </div>
  );
}
