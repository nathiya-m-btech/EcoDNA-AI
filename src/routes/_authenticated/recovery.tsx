import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/eco/app-shell";
import { Panel, StatCard } from "@/components/eco/panel";
import { ScoreRing } from "@/components/eco/score-ring";
import { FactorRadar } from "@/components/eco/charts";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocationStore } from "@/lib/eco/location-store";
import { useLocationInsight } from "@/lib/eco/derive";
import { useRecoveryActions } from "@/lib/eco/queries";
import { RECOVERY_LEVERS, simulateRecovery, type LeverKey, type Factors } from "@/lib/eco/scoring";

export const Route = createFileRoute("/_authenticated/recovery")({
  head: () => ({
    meta: [
      { title: "Recovery Simulator — EcoDNA AI" },
      { name: "description", content: "Simulate restoration levers and see the projected environmental DNA score." },
      { property: "og:title", content: "Recovery Simulator — EcoDNA AI" },
      { property: "og:description", content: "Model restoration scenarios before investing." },
    ],
  }),
  component: RecoveryPage,
});

const ZERO = Object.fromEntries(RECOVERY_LEVERS.map((l) => [l.key, 0])) as Record<LeverKey, number>;

function RecoveryPage() {
  const { location, locationId } = useLocationStore();
  const insight = useLocationInsight(locationId);
  const { data: actions } = useRecoveryActions(locationId);
  const [levers, setLevers] = useState<Record<LeverKey, number>>(ZERO);

  const base: Factors = insight.factors ?? {
    air: 60,
    water: 60,
    biodiversity: 60,
    waste: 40,
    weather: 60,
    greenCover: 55,
  };
  const sim = simulateRecovery(base, levers);
  const gain = sim.score - insight.score;

  const radar = [
    { factor: "Air", value: sim.factors.air },
    { factor: "Water", value: sim.factors.water },
    { factor: "Biodiversity", value: sim.factors.biodiversity },
    { factor: "Waste", value: Math.max(0, 100 - sim.factors.waste) },
    { factor: "Weather", value: sim.factors.weather },
    { factor: "Green cover", value: sim.factors.greenCover },
  ];

  return (
    <AppShell
      title="Recovery Simulator"
      subtitle={location ? `Model interventions for ${location.location_name}` : "Model restoration interventions"}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Current score" value={insight.score} />
        <StatCard label="Simulated score" value={sim.score} tone="lime" icon={<Sparkles className="h-4 w-4" />} />
        <StatCard label="Projected gain" value={`${gain > 0 ? "+" : ""}${gain} pts`} tone={gain > 0 ? "emerald" : "amber"} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Intervention levers"
          subtitle="Adjust effort intensity for each restoration programme"
          action={
            <Button variant="outline" size="sm" onClick={() => setLevers(ZERO)}>
              Reset
            </Button>
          }
        >
          <div className="space-y-6">
            {RECOVERY_LEVERS.map((lever) => (
              <div key={lever.key}>
                <div className="flex items-center justify-between text-sm">
                  <span>{lever.label}</span>
                  <span className="text-muted-foreground">{levers[lever.key]}% effort</span>
                </div>
                <Slider
                  className="mt-3"
                  value={[levers[lever.key]]}
                  max={100}
                  step={5}
                  onValueChange={([v]) => setLevers((p) => ({ ...p, [lever.key]: v ?? 0 }))}
                />
                <p className="mt-1 text-xs text-muted-foreground">Up to +{lever.max} points at full deployment.</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Simulated DNA" subtitle="Outcome of the current scenario">
          <div className="flex flex-col items-center gap-4">
            <ScoreRing score={sim.score} size={180} />
            <FactorRadar data={radar} height={250} />
          </div>
        </Panel>
      </div>

      <Panel className="mt-4" title="Recommended actions" subtitle="AI-ranked interventions from stored analysis">
        <div className="grid gap-3 md:grid-cols-2">
          {(actions ?? []).map((a) => (
            <div key={a.id} className="rounded-2xl border border-border bg-secondary/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold">{a.action_name}</h3>
                <Badge variant="outline">{a.action_type ?? "action"}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{a.recommendation}</p>
              <p className="mt-3 text-xs">
                <span className="text-muted-foreground">Impact: </span>
                <span className="text-primary">+{a.expected_improvement ?? 0} pts</span>
                <span className="text-muted-foreground"> → {a.predicted_score ?? "—"}</span>
              </p>
            </div>
          ))}
          {(actions ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No stored recovery actions for this location yet.</p>
          )}
        </div>
      </Panel>
    </AppShell>
  );
}
