import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Brain,
  Dna,
  Gauge,
  Leaf,
  MapPin,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import { EcoLogo } from "@/components/eco/logo";
import { Particles } from "@/components/eco/particles";
import { ScoreRing } from "@/components/eco/score-ring";
import { DnaHelix } from "@/components/eco/dna-helix";
import { CountUp } from "@/components/eco/count-up";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EcoDNA AI — Environmental Digital DNA Platform" },
      {
        name: "description",
        content:
          "EcoDNA AI turns air, water, biodiversity, waste and climate data into a living Environmental DNA score with AI forecasts, pollution hotspot maps and recovery simulations.",
      },
      { property: "og:title", content: "EcoDNA AI — Environmental Digital DNA Platform" },
      {
        property: "og:description",
        content:
          "A living Environmental DNA score for every location, with AI forecasts, hotspot mapping and recovery simulation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Dna,
    title: "Environmental DNA Score",
    body: "Every location gets a unique weighted genetic signature built from six environmental factors.",
  },
  {
    icon: Brain,
    title: "AI Forecasting",
    body: "30 and 90 day trajectory predictions with confidence bands derived from historical momentum.",
  },
  {
    icon: MapPin,
    title: "Pollution Hotspots",
    body: "Interactive risk mapping that pinpoints degradation zones and the dominant causal factor.",
  },
  {
    icon: Sparkles,
    title: "Recovery Simulator",
    body: "Model green cover, waste, water and emission interventions and watch the DNA score respond.",
  },
  {
    icon: Waves,
    title: "Historical Intelligence",
    body: "Multi-factor trend analytics that separate seasonal noise from structural decline.",
  },
  {
    icon: ShieldCheck,
    title: "Live Alerts",
    body: "Threshold-driven environmental alerts with recommended mitigation for every severity level.",
  },
] as const;

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="eco-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-primary/20 blur-[130px]" />
      <div className="pointer-events-none absolute -right-32 top-1/3 h-[380px] w-[380px] rounded-full bg-teal/20 blur-[130px]" />
      <Particles count={26} />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
        <EcoLogo />
        <nav className="flex items-center gap-2">
          <Link to="/auth">
            <Button variant="ghost" className="rounded-xl">
              Sign in
            </Button>
          </Link>
          <Link to="/auth">
            <Button className="rounded-xl">Launch console</Button>
          </Link>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-2 lg:pt-16">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
              <Leaf className="h-3.5 w-3.5 text-primary" /> Environmental Digital DNA · v1.0
            </span>
            <h1 className="font-display mt-5 text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
              Every place on earth has an{" "}
              <span className="bg-gradient-to-r from-emerald via-lime to-teal bg-clip-text text-transparent">
                environmental DNA
              </span>
              . We decode it.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              EcoDNA AI fuses air, water, biodiversity, waste, climate and green-cover data into a
              single living score — then predicts where it is heading and simulates how to heal it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg" className="rounded-xl">
                  Open the dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="rounded-xl">
                  Explore capabilities
                </Button>
              </a>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              {[
                { k: "Factors decoded", v: 6 },
                { k: "Forecast horizon", v: 90, suffix: "d" },
                { k: "Model confidence", v: 94, suffix: "%" },
              ].map((s) => (
                <div key={s.k} className="glass rounded-2xl px-4 py-3">
                  <dd className="font-display text-2xl font-semibold text-primary">
                    <CountUp value={s.v} />
                    {s.suffix ?? ""}
                  </dd>
                  <dt className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                    {s.k}
                  </dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="animate-rise glass relative rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
              <ScoreRing score={72} size={200} label="GOOD" />
              <DnaHelix
                className="w-[150px]"
                height={260}
                values={[
                  { label: "Air", value: 68 },
                  { label: "Water", value: 74 },
                  { label: "Biodiversity", value: 63 },
                  { label: "Waste", value: 58 },
                  { label: "Weather", value: 81 },
                  { label: "Green cover", value: 66 },
                ]}
              />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              {[
                ["Air quality", "68 / 100"],
                ["Water quality", "74 / 100"],
                ["Biodiversity", "63 / 100"],
                ["Green cover", "66 / 100"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-border bg-secondary/40 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</p>
                  <p className="font-display mt-0.5 font-semibold">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            A complete environmental intelligence loop
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Data ingestion, DNA scoring, AI prediction, hotspot detection and recovery planning —
            one continuous workflow.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article key={f.title} className="glass glass-hover animate-rise rounded-2xl p-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-secondary/60 text-primary">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="font-display mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          <div className="glass flex flex-col items-center gap-5 rounded-3xl px-6 py-12 text-center">
            <Gauge className="h-9 w-9 text-primary" />
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              Start decoding your region's environmental DNA
            </h2>
            <p className="max-w-xl text-muted-foreground">
              Upload datasets, monitor live scores, and simulate recovery pathways in one console.
            </p>
            <Link to="/auth">
              <Button size="lg" className="rounded-xl">
                Get started free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <EcoLogo />
          <p>© {new Date().getFullYear()} EcoDNA AI · Environmental Digital DNA Platform</p>
        </div>
      </footer>
    </div>
  );
}
