import { createFileRoute } from "@tanstack/react-router";
import { Brain, TrendingUp, Target, Gauge } from "lucide-react";
import { AppShell } from "@/components/eco/app-shell";
import { Panel, StatCard } from "@/components/eco/panel";
import { ScoreAreaChart } from "@/components/eco/charts";
import { useLocationStore } from "@/lib/eco/location-store";
import { useLocationInsight } from "@/lib/eco/derive";
import { usePrediction } from "@/lib/eco/queries";
import { forecast, predictionConfidence, scoreStatus } from "@/lib/eco/scoring";
import { CountUp } from "@/components/eco/count-up";

export const Route = createFileRoute("/_authenticated/predictions")({
  head: () => ({
    meta: [
      { title: "AI Predictions — EcoDNA AI" },
      { name: "description", content: "30 and 90 day environmental DNA score forecasts with model confidence." },
      { property: "og:title", content: "AI Predictions — EcoDNA AI" },
      { property: "og:description", content: "Forecast environmental trajectory with AI." },
    ],
  }),
  component: PredictionsPage,
});

function PredictionsPage() {
  const { location, locationId } = useLocationStore();
  const insight = useLocationInsight(locationId);
  const { data: stored } = usePrediction(locationId);

  const series = insight.series.map((s) => s.score);
  const p30 = stored?.predicted_score_30_days ?? forecast(series, 30);
  const p90 = stored?.predicted_score_90_days ?? forecast(series, 90);
  const confidence = stored?.confidence ?? predictionConfidence(series);
  const delta = p90 - insight.score;
  const status = scoreStatus(p90);

  const projected = [
    ...insight.series.map((s) => ({ date: s.date, score: s.score })),
    { date: "+30d", score: p30 },
    { date: "+90d", score: p90 },
  ];

  return (
    <AppShell
      title="AI Predictions"
      subtitle={location ? `Forecast trajectory for ${location.location_name}` : "Forecast trajectory"}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Current DNA score" value={<CountUp value={insight.score} />} icon={<Gauge className="h-4 w-4" />} />
        <StatCard label="30-day forecast" value={<CountUp value={p30} />} tone="teal" icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="90-day forecast" value={<CountUp value={p90} />} tone="lime" icon={<Target className="h-4 w-4" />} />
        <StatCard
          label="Model confidence"
          value={`${Math.round(confidence)}%`}
          tone={confidence >= 85 ? "emerald" : "amber"}
          icon={<Brain className="h-4 w-4" />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Projected trajectory" subtitle="Historical readings extended with model output">
          <ScoreAreaChart data={projected} height={320} />
        </Panel>

        <Panel title="Model narrative" subtitle="What the forecast implies">
          <p className="text-sm text-muted-foreground">
            {stored?.prediction_summary ??
              `Based on ${insight.series.length} observations, the ecosystem is trending ${
                delta >= 2 ? "upward" : delta <= -2 ? "downward" : "flat"
              }. The 90-day projection lands at ${p90}, classified as ${status.label.toLowerCase()}.`}
          </p>
          <div className="mt-4 rounded-2xl border border-border bg-secondary/40 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Expected change</p>
            <p className="font-display mt-1 text-3xl font-semibold" style={{ color: status.color }}>
              {delta > 0 ? "+" : ""}
              {delta} pts
            </p>
            <p className="mt-1 text-xs text-muted-foreground">over the next 90 days</p>
          </div>
          <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
            <li>• Weighted factor momentum across the last four readings</li>
            <li>• Variance-adjusted confidence band</li>
            <li>• Damped extrapolation to avoid over-projection</li>
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
