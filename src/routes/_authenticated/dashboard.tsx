import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Brain, Droplets, Leaf, Recycle, Wind } from "lucide-react";
import { AppShell } from "@/components/eco/app-shell";
import { Panel, StatCard } from "@/components/eco/panel";
import { ScoreRing } from "@/components/eco/score-ring";
import { ScoreAreaChart, ComparisonBars, FactorRadar } from "@/components/eco/charts";
import { useLocationStore } from "@/lib/eco/location-store";
import { useLocationInsight, factorsFromRow } from "@/lib/eco/derive";
import { useAlerts, useEnvData, useHotspots, useLocations } from "@/lib/eco/queries";
import { computeDnaScore, forecast, riskColor, scoreStatus } from "@/lib/eco/scoring";
import { Badge } from "@/components/ui/badge";
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

  const status = scoreStatus(insight.score);
  const scoreSeries = insight.series.map((s) => s.score);
  const next30 = forecast(scoreSeries, 30);
  const latest = insight.latest;

  const comparison = (allLocations ?? []).map((l) => {
    const rows = (allEnv ?? []).filter((r) => r.location_id === l.id);
    const last = rows.sort((a, b) => a.date.localeCompare(b.date))[rows.length - 1];
    return { name: l.location_name, score: last ? computeDnaScore(factorsFromRow(last)) : 0 };
  });

  const radar = insight.factors
    ? [
        { factor: "Air", value: insight.factors.air },
        { factor: "Water", value: insight.factors.water },
        { factor: "Biodiversity", value: insight.factors.biodiversity },
        { factor: "Waste", value: Math.max(0, 100 - insight.factors.waste) },
        { factor: "Weather", value: insight.factors.weather },
        { factor: "Green", value: insight.factors.greenCover },
      ]
    : [];

  const openAlerts = (alerts ?? []).filter((a) => a.status !== "resolved").slice(0, 5);
  const criticalHotspots = (hotspots ?? []).filter((h) => h.risk_level.toLowerCase().includes("high"));

  return (
    <AppShell
      title={location?.location_name ?? "Dashboard"}
      subtitle={location?.region ? `${location.region} · Environmental DNA overview` : "Environmental DNA overview"}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Live sources: Open-Meteo air quality, weather and satellite-derived vegetation signals.
        </p>
        <LiveDataControls />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Air quality" value={latest?.air_quality ?? "—"} hint="index /100" icon={<Wind className="h-4 w-4" />} tone="teal" />
        <StatCard label="Water quality" value={latest?.water_quality ?? "—"} hint="index /100" icon={<Droplets className="h-4 w-4" />} tone="teal" />
        <StatCard label="Biodiversity" value={latest?.biodiversity ?? "—"} hint="index /100" icon={<Leaf className="h-4 w-4" />} tone="lime" />
        <StatCard label="Waste level" value={latest?.waste_level ?? "—"} hint="lower is better" icon={<Recycle className="h-4 w-4" />} tone="amber" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Environmental DNA Score" subtitle="Weighted composite of six factors">
          <div className="flex flex-col items-center gap-4">
            <ScoreRing score={insight.score} size={210} />
            <Badge variant="outline" style={{ color: status.color, borderColor: status.color }}>
              {status.label}
            </Badge>
            <p className="text-center text-xs text-muted-foreground">
              30-day AI projection: <span className="font-semibold text-foreground">{next30}</span>{" "}
              ({next30 - insight.score >= 0 ? "+" : ""}
              {next30 - insight.score} pts)
            </p>
          </div>
        </Panel>

        <Panel className="lg:col-span-2" title="Score trajectory" subtitle="Historical DNA score evolution">
          {insight.series.length > 0 ? (
            <ScoreAreaChart data={insight.series} />
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
          subtitle={`${criticalHotspots.length} high-risk zones detected`}
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
            <span className="font-semibold text-foreground">{insight.score}</span> ({status.label.toLowerCase()}).
            {insight.factors && (
              <>
                {" "}
                The weakest contributor is{" "}
                <span className="font-semibold text-foreground">{weakest(insight.factors)}</span>, while the strongest
                is <span className="font-semibold text-foreground">{strongest(insight.factors)}</span>. Modelled
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
