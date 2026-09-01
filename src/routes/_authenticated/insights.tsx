import { createFileRoute } from "@tanstack/react-router";
import { Activity, Leaf, Droplets, Wind, Trash2 } from "lucide-react";
import { AppShell } from "@/components/eco/app-shell";
import { Panel, StatCard } from "@/components/eco/panel";
import { ComparisonBars } from "@/components/eco/charts";
import { useLocationStore } from "@/lib/eco/location-store";
import { useLocationInsight } from "@/lib/eco/derive";
import { useEnvData } from "@/lib/eco/queries";
import { computeDnaScore, scoreStatus } from "@/lib/eco/scoring";
import { factorsFromRow } from "@/lib/eco/derive";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({
    meta: [
      { title: "AI Insights — EcoDNA AI" },
      { name: "description", content: "Automated environmental interpretation, weak factors and cross-location ranking." },
      { property: "og:title", content: "AI Insights — EcoDNA AI" },
      { property: "og:description", content: "Understand what the environmental data actually means." },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const { location, locationId, locations } = useLocationStore();
  const insight = useLocationInsight(locationId);
  const { data: allData } = useEnvData(undefined);

  const f = insight.factors;
  const status = scoreStatus(insight.score);

  const ranking = locations
    .map((l) => {
      const rows = (allData ?? []).filter((r) => r.location_id === l.id);
      const latest = [...rows].sort((a, b) => a.date.localeCompare(b.date)).pop();
      return { name: l.location_name, score: latest ? computeDnaScore(factorsFromRow(latest)) : 0 };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  const factorList = f
    ? [
        { label: "Air quality", value: f.air, icon: <Wind className="h-4 w-4" /> },
        { label: "Water quality", value: f.water, icon: <Droplets className="h-4 w-4" /> },
        { label: "Biodiversity", value: f.biodiversity, icon: <Leaf className="h-4 w-4" /> },
        { label: "Waste control", value: Math.max(0, 100 - f.waste), icon: <Trash2 className="h-4 w-4" /> },
      ]
    : [];
  const weakest = [...factorList].sort((a, b) => a.value - b.value)[0];
  const strongest = [...factorList].sort((a, b) => b.value - a.value)[0];

  const narrative = f
    ? `${location?.location_name ?? "This location"} scores ${insight.score}/100 (${status.label.toLowerCase()}). ` +
      `${strongest?.label ?? "—"} is the strongest signal at ${Math.round(strongest?.value ?? 0)}, while ${weakest?.label.toLowerCase() ?? "—"} ` +
      `is the limiting factor at ${Math.round(weakest?.value ?? 0)}. Prioritising that factor yields the highest marginal ` +
      `improvement to the composite DNA score.`
    : "No readings are available for this location yet. Upload a dataset in Data Management to generate insights.";

  return (
    <AppShell title="AI Insights" subtitle="Automated interpretation of the environmental signal">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="DNA score" value={insight.score} icon={<Activity className="h-4 w-4" />} />
        <StatCard label="Status" value={status.label} tone={insight.score >= 70 ? "emerald" : "amber"} />
        <StatCard label="Strongest factor" value={strongest?.label ?? "—"} tone="lime" hint={strongest ? `${Math.round(strongest.value)}/100` : ""} />
        <StatCard label="Limiting factor" value={weakest?.label ?? "—"} tone="red" hint={weakest ? `${Math.round(weakest.value)}/100` : ""} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Cross-location ranking" subtitle="Latest DNA score by monitored location">
          <ComparisonBars data={ranking} height={320} />
        </Panel>
        <Panel title="Narrative summary" subtitle="Generated from current readings">
          <p className="text-sm text-muted-foreground">{narrative}</p>
          <ul className="mt-4 space-y-3">
            {factorList.map((x) => (
              <li key={x.label} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3 text-sm">
                <span className="text-primary">{x.icon}</span>
                <span className="flex-1">{x.label}</span>
                <span className="text-muted-foreground">{Math.round(x.value)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
