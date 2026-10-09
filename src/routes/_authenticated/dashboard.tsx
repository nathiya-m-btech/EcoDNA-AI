import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Brain, Droplets, Leaf, Pause, Play, Recycle, RotateCcw, Wind } from "lucide-react";
import { AppShell } from "@/components/eco/app-shell";
import { Panel, StatCard } from "@/components/eco/panel";
import { ScoreRing } from "@/components/eco/score-ring";
import { ScoreAreaChart, ComparisonBars, FactorRadar } from "@/components/eco/charts";
import { useLocationStore } from "@/lib/eco/location-store";
import { useLocationInsight, factorsFromRow } from "@/lib/eco/derive";
import { useAlerts, useEnvData, useHotspots, useLocations } from "@/lib/eco/queries";
import { computeDnaScore, forecast, riskColor, scoreStatus } from "@/lib/eco/scoring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { LiveDataControls } from "@/components/eco/live-data-controls";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — EcoDNA AI" },
      {
        name: "description",
        content: "Live Environmental DNA score, factor breakdown, hotspots and alerts for your monitored locations.",
      },
      { property: "og:title", content: "Dashboard — EcoDNA AI" },
      { property: "og:description", content: "Live Environmental DNA intelligence console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { location, locationId } = useLocationStore();
  const insight = useLocationInsight(locationId);
  const { data: hotspots } = useHotspots();
  const { data: alerts } = useAlerts();
  const { data: allLocations } = useLocations();
  const { data: allEnv } = useEnvData();

  // Simulation mode: replay the recorded readings step by step.
  const [simIndex, setSimIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const simulating = simIndex !== null;
  const stepCount = insight.rows.length;

  useEffect(() => {
    setSimIndex(null);
    setPlaying(false);
  }, [locationId]);

  useEffect(() => {
    if (!playing || simIndex === null) return;
    const t = setInterval(() => {
      setSimIndex((i) => {
        if (i === null) return i;
        if (i >= stepCount - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 900);
    return () => clearInterval(t);
  }, [playing, simIndex !== null, stepCount]);

  const activeRow = simulating ? insight.rows[simIndex] : insight.latest;
  const activeFactors = useMemo(() => (activeRow ? factorsFromRow(activeRow) : undefined), [activeRow]);
  const activeScore = activeFactors ? computeDnaScore(activeFactors) : 0;
  const visibleSeries = simulating ? insight.series.slice(0, simIndex + 1) : insight.series;

  const status = scoreStatus(activeScore);
  const scoreSeries = visibleSeries.map((s) => s.score);
  const next30 = forecast(scoreSeries, 30);

  const comparison = (allLocations ?? []).map((l) => {
    const rows = (allEnv ?? []).filter((r) => r.location_id === l.id);
    const last = rows.sort((a, b) => a.date.localeCompare(b.date))[rows.length - 1];
    return { name: l.location_name, score: last ? computeDnaScore(factorsFromRow(last)) : 0 };
  });

  const radar = activeFactors
    ? [
        { factor: "Air", value: activeFactors.air },
        { factor: "Water", value: activeFactors.water },
        { factor: "Biodiversity", value: activeFactors.biodiversity },
        { factor: "Waste", value: Math.max(0, 100 - activeFactors.waste) },
        { factor: "Weather", value: activeFactors.weather },
        { factor: "Green", value: activeFactors.greenCover },
      ]
    : [];

  const openAlerts = (alerts ?? []).filter((a) => a.status !== "resolved").slice(0, 5);

  const startSim = () => {
    if (stepCount === 0) return;
    setSimIndex(0);
    setPlaying(true);
  };
  const stopSim = () => {
    setSimIndex(null);
    setPlaying(false);
  };

  return (
    <AppShell
      title={location?.location_name ?? "Dashboard"}
      subtitle={location?.region ? `${location.region} · Environmental DNA overview` : "Environmental DNA overview"}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Live sources: Open-Meteo air quality, weather and satellite-derived vegetation signals.
        </p>
        <div className="flex items-center gap-2">
          <LiveDataControls />
          {simulating ? (
            <Button variant="outline" size="sm" onClick={stopSim}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Back to live
            </Button>
          ) : (
            <Button size="sm" onClick={startSim} disabled={stepCount === 0}>
              <Play className="mr-1.5 h-3.5 w-3.5" /> Simulate
            </Button>
          )}
        </div>
      </div>

      {simulating && (
        <Panel className="mb-4" title="Simulation replay" subtitle="Stepping through recorded readings">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause simulation" : "Play simulation"}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Slider
              className="min-w-40 flex-1"
              value={[simIndex]}
              max={Math.max(0, stepCount - 1)}
              step={1}
              onValueChange={([v]) => {
                setPlaying(false);
                setSimIndex(v ?? 0);
              }}
            />
            <Badge variant="outline" className="text-xs">
              {activeRow?.date ?? "—"} · reading {simIndex + 1}/{stepCount}
            </Badge>
          </div>
        </Panel>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Air quality" value={activeRow?.air_quality ?? "—"} hint="index /100" icon={<Wind className="h-4 w-4" />} tone="teal" />
        <StatCard label="Water quality" value={activeRow?.water_quality ?? "—"} hint="index /100" icon={<Droplets className="h-4 w-4" />} tone="teal" />
        <StatCard label="Biodiversity" value={activeRow?.biodiversity ?? "—"} hint="index /100" icon={<Leaf className="h-4 w-4" />} tone="lime" />
        <StatCard label="Waste level" value={activeRow?.waste_level ?? "—"} hint="lower is better" icon={<Recycle className="h-4 w-4" />} tone="amber" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Environmental DNA Score" subtitle="Weighted composite of six factors">
          <div className="flex flex-col items-center gap-4">
            <ScoreRing score={activeScore} size={210} />
            <Badge variant="outline" style={{ color: status.color, borderColor: status.color }}>
              {status.label}
            </Badge>
            <p className="text-center text-xs text-muted-foreground">
              30-day AI projection: <span className="font-semibold text-foreground">{next30}</span>{" "}
              ({next30 - activeScore >= 0 ? "+" : ""}
              {next30 - activeScore} pts)
            </p>
          </div>
        </Panel>

        <Panel className="lg:col-span-2" title="Score trajectory" subtitle="Historical DNA score evolution">
          {visibleSeries.length > 0 ? (
            <ScoreAreaChart data={visibleSeries} />
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">No data recorded for this location yet.</p>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Factor signature" subtitle="Normalised factor strengths">
          {radar.length > 0 ? <FactorRadar data={radar} /> : <p className="py-16 text-center text-sm text-muted-foreground">No factor data.</p>}
        </Panel>
        <Panel title="Location comparison" subtitle="Latest DNA score by monitored location">
          {comparison.length > 0 ? <ComparisonBars data={comparison} /> : <p className="py-16 text-center text-sm text-muted-foreground">No locations.</p>}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel
          title="Active alerts"
          subtitle={`${openAlerts.length} requiring attention`}
          action={
            <Link to="/alerts" className="text-xs text-primary hover:underline">
              View all
            </Link>
          }
        >
          <ul className="space-y-3">
            {openAlerts.map((a) => (
              <li key={a.id} className="rounded-xl border border-border bg-secondary/40 p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" style={{ color: riskColor(a.severity) }} />
                  <span className="text-sm font-medium">{a.alert_type}</span>
                  <Badge variant="outline" className="ml-auto text-[10px]" style={{ color: riskColor(a.severity) }}>
                    {a.severity}
                  </Badge>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{a.message}</p>
              </li>
            ))}
            {openAlerts.length === 0 && <p className="text-sm text-muted-foreground">No active alerts.</p>}
          </ul>
        </Panel>

        <Panel
          title="Critical hotspots"
          subtitle="High-risk zones detected"
          action={
            <Link to="/hotspots" className="text-xs text-primary hover:underline">
              Open map
            </Link>
          }
        >
          <ul className="space-y-3">
            {(hotspots ?? []).slice(0, 5).map((h) => (
              <li key={h.id} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: riskColor(h.risk_level) }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{h.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{h.detected_factor ?? h.pollution_level}</p>
                </div>
                <span className="font-display text-sm">{h.environmental_score ?? "—"}</span>
              </li>
            ))}
            {(hotspots ?? []).length === 0 && <p className="text-sm text-muted-foreground">No hotspots detected.</p>}
          </ul>
        </Panel>
      </div>

      <Panel className="mt-4" title="AI summary" subtitle="Generated from the latest readings">
        <div className="flex gap-3">
          <Brain className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            {location?.location_name ?? "This location"} currently holds an Environmental DNA score of{" "}
            <span className="font-semibold text-foreground">{activeScore}</span> ({status.label.toLowerCase()}).
            {activeFactors && (
              <>
                {" "}
                The weakest contributor is{" "}
                <span className="font-semibold text-foreground">{weakest(activeFactors)}</span>, while the strongest
                is <span className="font-semibold text-foreground">{strongest(activeFactors)}</span>. Modelled
                trajectory suggests the score will move toward <span className="font-semibold text-foreground">{next30}</span>{" "}
                within 30 days if current conditions persist.
              </>
            )}
          </p>
        </div>
      </Panel>
    </AppShell>
  );
}

function labelled(f: { air: number; water: number; biodiversity: number; waste: number; weather: number; greenCover: number }) {
  return [
    { label: "air quality", value: f.air },
    { label: "water quality", value: f.water },
    { label: "biodiversity", value: f.biodiversity },
    { label: "waste management", value: 100 - f.waste },
    { label: "weather stability", value: f.weather },
    { label: "green cover", value: f.greenCover },
  ];
}

function weakest(f: Parameters<typeof labelled>[0]) {
  return labelled(f).sort((a, b) => a.value - b.value)[0]!.label;
}
function strongest(f: Parameters<typeof labelled>[0]) {
  return labelled(f).sort((a, b) => b.value - a.value)[0]!.label;
}
