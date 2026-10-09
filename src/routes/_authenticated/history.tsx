import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/eco/app-shell";
import { Panel, StatCard } from "@/components/eco/panel";
import { ScoreAreaChart, FactorLineChart } from "@/components/eco/charts";
import { useLocationStore } from "@/lib/eco/location-store";
import { useLocationInsight } from "@/lib/eco/derive";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Historical Trends — EcoDNA AI" },
      { name: "description", content: "Long-run environmental factor trends and raw observation history." },
      { property: "og:title", content: "Historical Trends — EcoDNA AI" },
      { property: "og:description", content: "Track how the ecosystem evolved over time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { location, locationId } = useLocationStore();
  const insight = useLocationInsight(locationId);
  const series = insight.series;
  const first = series[0]?.score ?? 0;
  const last = series[series.length - 1]?.score ?? 0;
  const best = series.reduce((m, s) => Math.max(m, s.score), 0);
  const worst = series.length ? series.reduce((m, s) => Math.min(m, s.score), 100) : 0;

  return (
    <AppShell
      title="Historical Trends"
      subtitle={location ? `Observation history for ${location.location_name}` : "Observation history"}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Observations" value={series.length} />
        <StatCard label="Net change" value={`${last - first > 0 ? "+" : ""}${last - first} pts`} tone={last >= first ? "emerald" : "red"} />
        <StatCard label="Best score" value={best} tone="lime" />
        <StatCard label="Lowest score" value={worst} tone="amber" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="DNA score over time" subtitle="Composite weighted score">
          <ScoreAreaChart data={series.map((s) => ({ date: s.date, score: s.score }))} height={300} />
        </Panel>
        <Panel title="Factor trends" subtitle="Air, water, biodiversity and waste">
          <FactorLineChart data={series} height={300} />
        </Panel>
      </div>

      <Panel className="mt-4" title="Raw observations" subtitle="Most recent readings first">
        <div className="max-h-[420px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Air</TableHead>
                <TableHead>Water</TableHead>
                <TableHead>Biodiversity</TableHead>
                <TableHead>Waste</TableHead>
                <TableHead className="text-right">DNA score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...series].reverse().map((s) => (
                <TableRow key={s.date}>
                  <TableCell>{s.date}</TableCell>
                  <TableCell>{s.air}</TableCell>
                  <TableCell>{s.water}</TableCell>
                  <TableCell>{s.biodiversity}</TableCell>
                  <TableCell>{s.waste}</TableCell>
                  <TableCell className="text-right font-medium text-primary">{s.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {series.length === 0 && <p className="py-6 text-sm text-muted-foreground">No readings recorded yet.</p>}
        </div>
      </Panel>
    </AppShell>
  );
}
