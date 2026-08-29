import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText } from "lucide-react";
import { AppShell } from "@/components/eco/app-shell";
import { Panel, StatCard } from "@/components/eco/panel";
import { Button } from "@/components/ui/button";
import { ScoreAreaChart } from "@/components/eco/charts";
import { useLocationStore } from "@/lib/eco/location-store";
import { useLocationInsight } from "@/lib/eco/derive";
import { useAlerts, useHotspots } from "@/lib/eco/queries";
import { forecast, scoreStatus } from "@/lib/eco/scoring";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — EcoDNA AI" },
      { name: "description", content: "Generate and export environmental DNA assessment reports for any location." },
      { property: "og:title", content: "Reports — EcoDNA AI" },
      { property: "og:description", content: "Export shareable environmental assessments." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { location, locationId } = useLocationStore();
  const insight = useLocationInsight(locationId);
  const { data: hotspots } = useHotspots();
  const { data: alerts } = useAlerts();
  const status = scoreStatus(insight.score);
  const p90 = forecast(insight.series.map((s) => s.score), 90);

  const exportCsv = () => {
    const header = "date,dna_score,air,water,biodiversity,waste\n";
    const body = insight.series.map((s) => `${s.date},${s.score},${s.air},${s.water},${s.biodiversity},${s.waste}`).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ecodna-${location?.location_name ?? "report"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell title="Reports" subtitle="Assessment summary and data export">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="DNA score" value={insight.score} hint={status.label} />
        <StatCard label="90-day outlook" value={p90} tone="teal" />
        <StatCard label="Active hotspots" value={hotspots?.length ?? 0} tone="amber" />
        <StatCard label="Open alerts" value={(alerts ?? []).filter((a) => a.status?.toLowerCase() !== "resolved").length} tone="red" />
      </div>

      <Panel
        className="mt-4"
        title="Environmental assessment report"
        subtitle={location ? location.location_name : "Select a location"}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
            </Button>
            <Button size="sm" onClick={() => window.print()}>
              <FileText className="mr-1.5 h-3.5 w-3.5" /> Print / PDF
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            <span className="text-foreground">Executive summary. </span>
            {location?.location_name ?? "The selected location"} currently holds an Environmental DNA score of{" "}
            <span className="text-primary">{insight.score}/100</span>, classified as {status.label.toLowerCase()}. The
            90-day model projection is {p90}, based on {insight.series.length} observations.
          </p>
          <p>
            <span className="text-foreground">Risk exposure. </span>
            {(hotspots ?? []).length} pollution hotspots are currently tracked across the network, and{" "}
            {(alerts ?? []).filter((a) => a.severity.toLowerCase() === "critical").length} critical alerts are open.
          </p>
          <p>
            <span className="text-foreground">Recommendation. </span>
            Prioritise the lowest-weighted factor identified in AI Insights and validate the projected uplift in the
            Recovery Simulator before committing budget.
          </p>
          <div className="rounded-2xl border border-border bg-secondary/40 p-4">
            <ScoreAreaChart data={insight.series.map((s) => ({ date: s.date, score: s.score }))} height={260} />
          </div>
        </div>
      </Panel>
    </AppShell>
  );
}
