import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Brain,
  Dna,
  MapPin,
  Play,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import { EcoLogo } from "@/components/eco/logo";
import { Button } from "@/components/ui/button";
import heroVideo from "@/assets/Working_Model.mp4.asset.json";

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

/**
 * Full-screen front page: the original EcoDNA video covers the entire
 * viewport, autoplays muted and loops. A small welcome overlay sits on top.
 */
function VideoFrontPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [needsGesture, setNeedsGesture] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true; // autoplay only works muted in every browser
    video.play().catch(() => setNeedsGesture(true));
  }, []);

  const play = () => {
    const video = videoRef.current;
    if (!video) return;
    setNeedsGesture(false);
    video.play().catch(() => setNeedsGesture(true));
  };

  return (
    <section className="relative h-screen min-h-[560px] w-full overflow-hidden bg-background">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={heroVideo.url}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onError={() => setFailed(true)}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/25 to-background/55" />

      {failed && (
        <div className="absolute inset-0 grid place-items-center bg-background">
          <div className="text-center">
            <EcoLogo />
            <p className="mt-4 text-sm text-muted-foreground">
              The welcome video could not load on this connection.
            </p>
          </div>
        </div>
      )}

      {needsGesture && !failed && (
        <button
          onClick={play}
          aria-label="Play the welcome video"
          className="absolute bottom-8 right-8 z-20 grid h-14 w-14 place-items-center rounded-full border border-primary/40 bg-background/80 text-primary backdrop-blur transition-transform hover:scale-105"
        >
          <Play className="ml-0.5 h-6 w-6" />
        </button>
      )}

      <div className="pointer-events-none absolute inset-0 flex flex-col">
        <header className="pointer-events-auto flex items-center justify-between px-4 py-5 sm:px-6">
          <EcoLogo />
          <nav className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" className="rounded-xl backdrop-blur">
                Sign in
              </Button>
            </Link>
          </nav>
        </header>

        <div className="pointer-events-auto mt-auto px-4 pb-10 sm:px-6 sm:pb-14">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Dna className="h-3.5 w-3.5 text-primary" /> Environmental Digital DNA · v1.0
            </span>
            <h1 className="font-display mt-4 text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-emerald via-lime to-teal bg-clip-text text-transparent">
                EcoDNA AI
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
              Watch the platform come alive, then decode the environmental DNA of any place —
              forecasts, hotspots and recovery pathways in one console.
            </p>
            <div className="mt-6">
              <Link to="/welcome">
                <Button size="lg" className="rounded-xl">
                  Explore <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <VideoFrontPage />

      <main className="relative z-10">
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
            <Brain className="h-9 w-9 text-primary" />
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
