import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Brain,
  Dna,
  MapPin,
  Play,
  ShieldCheck,
  SlidersHorizontal,
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
  const [controlsOpen, setControlsOpen] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [textContrast, setTextContrast] = useState(100);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true; // autoplay only works muted in every browser
    video.play().catch(() => setNeedsGesture(true));
  }, []);

  // Restore saved video/text settings (browser storage only).
  useEffect(() => {
    const savedBrightness = Number(localStorage.getItem("ecodna-video-brightness"));
    const savedContrast = Number(localStorage.getItem("ecodna-text-contrast"));
    if (savedBrightness >= 40 && savedBrightness <= 160) setBrightness(savedBrightness);
    if (savedContrast >= 50 && savedContrast <= 160) setTextContrast(savedContrast);
  }, []);

  const changeBrightness = (value: number) => {
    setBrightness(value);
    localStorage.setItem("ecodna-video-brightness", String(value));
  };

  const changeTextContrast = (value: number) => {
    setTextContrast(value);
    localStorage.setItem("ecodna-text-contrast", String(value));
  };

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
        style={{ filter: `brightness(${brightness}%)` }}
        src={heroVideo.url}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onError={() => setFailed(true)}
      />
      {/* Welcome-text shade: scales with the text-contrast setting. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background/90 via-background/35 to-transparent"
        style={{ opacity: Math.min(textContrast / 100, 1) }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-background"
        style={{ opacity: Math.max(0, (textContrast - 100) / 100) * 0.45 }}
      />

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
            <Button
              variant="ghost"
              size="icon"
              aria-label={controlsOpen ? "Hide display settings" : "Adjust video brightness and text contrast"}
              aria-expanded={controlsOpen}
              onClick={() => setControlsOpen((open) => !open)}
              className="rounded-xl backdrop-blur"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
            <Link to="/auth">
              <Button variant="ghost" className="rounded-xl backdrop-blur">
                Sign in
              </Button>
            </Link>
          </nav>
        </header>

        {controlsOpen && (
          <div className="pointer-events-auto absolute right-4 top-16 z-30 w-64 rounded-2xl glass p-4 sm:right-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Display settings
            </p>
            <label className="mt-3 block text-xs text-foreground">
              <span className="flex items-center justify-between">
                Video brightness
                <span className="text-muted-foreground">{brightness}%</span>
              </span>
              <input
                type="range"
                min={40}
                max={160}
                step={5}
                value={brightness}
                onChange={(e) => changeBrightness(Number(e.target.value))}
                aria-label="Video brightness"
                className="mt-1.5 w-full accent-primary"
              />
            </label>
            <label className="mt-3 block text-xs text-foreground">
              <span className="flex items-center justify-between">
                Welcome text contrast
                <span className="text-muted-foreground">{textContrast}%</span>
              </span>
              <input
                type="range"
                min={50}
                max={160}
                step={5}
                value={textContrast}
                onChange={(e) => changeTextContrast(Number(e.target.value))}
                aria-label="Welcome text contrast"
                className="mt-1.5 w-full accent-primary"
              />
            </label>
            <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
              Settings are remembered on this device.
            </p>
          </div>
        )}

        <div className="pointer-events-auto mt-auto px-4 pb-10 sm:px-6 sm:pb-14">
          <div
            className="max-w-2xl"
            style={{ textShadow: `0 2px ${Math.round((textContrast / 100) * 10)}px oklch(0.08 0.03 160 / 75%)` }}
          >
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
