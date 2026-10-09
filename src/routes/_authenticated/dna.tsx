import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/eco/app-shell";
import { Panel } from "@/components/eco/panel";
import { ScoreRing } from "@/components/eco/score-ring";
import { DnaHelix } from "@/components/eco/dna-helix";
import { FactorRadar } from "@/components/eco/charts";
import { useLocationStore } from "@/lib/eco/location-store";
import { useLocationInsight } from "@/lib/eco/derive";
import { FACTOR_WEIGHTS, scoreStatus } from "@/lib/eco/scoring";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/dna")({
  head: () => ({
    meta: [
      { title: "Eco DNA Profile — EcoDNA AI" },
      { name: "description", content: "The unique environmental genetic signature of a location, factor by factor." },
      { property: "og:title", content: "Eco DNA Profile — EcoDNA AI" },
      { property: "og:description", content: "Environmental genetic signature by factor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DnaPage,
});

function DnaPage() {
  const { location, locationId } = useLocationStore();
  const insight = useLocationInsight(locationId);
  const f = insight.factors;
  const status = scoreStatus(insight.score);

  const strands = f
    ? [
        { label: "Air quality", value: f.air, weight: FACTOR_WEIGHTS.air },
        { label: "Water quality", value: f.water, weight: FACTOR_WEIGHTS.water },
        { label: "Biodiversity", value: f.biodiversity, weight: FACTOR_WEIGHTS.biodiversity },
        { label: "Waste management", value: Math.max(0, 100 - f.waste), weight: FACTOR_WEIGHTS.waste },
        { label: "Weather stability", value: f.weather, weight: FACTOR_WEIGHTS.weather },
        { label: "Green cover", value: f.greenCover, weight: FACTOR_WEIGHTS.greenCover },
      ]
    : [];

  return (
    <AppShell
      title="Eco DNA Profile"
      subtitle={location ? `${location.location_name} — environmental genetic signature` : "Environmental genetic signature"}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="DNA signature" subtitle="Each strand rung encodes one factor">
          <div className="flex items-center justify-center gap-6">
            <DnaHelix className="w-[160px]" height={340} values={strands.map((s) => ({ label: s.label, value: s.value }))} />
            <div className="text-center">
              <ScoreRing score={insight.score} size={170} />
              <p className="mt-3 text-xs uppercase tracking-[0.2em]" style={{ color: status.color }}>
                {status.label}
              </p>
            </div>
          </div>
        </Panel>

        <Panel className="lg:col-span-2" title="Factor decomposition" subtitle="Weighted contribution to the composite score">
          <ul className="space-y-4">
            {strands.map((s) => (
              <li key={s.label}>
                <div className="flex items-center justify-between text-sm">
                  <span>{s.label}</span>
                  <span className="text-muted-foreground">
                    {Math.round(s.value)} / 100 · weight {Math.round(s.weight * 100)}%
                  </span>
                </div>
                <Progress value={s.value} className="mt-2 h-2" />
                <p className="mt-1 text-xs text-muted-foreground">
                  Contributes {(s.value * s.weight).toFixed(1)} points to the DNA score.
                </p>
              </li>
            ))}
            {strands.length === 0 && <p className="text-sm text-muted-foreground">No readings available for this location.</p>}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Signature radar" subtitle="Balance across all factors">
          {strands.length > 0 ? (
            <FactorRadar data={strands.map((s) => ({ factor: s.label.split(" ")[0]!, value: s.value }))} />
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">No data.</p>
          )}
        </Panel>
        <Panel title="Location profile" subtitle="Monitoring metadata">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Location", location?.location_name ?? "—"],
              ["Region", location?.region ?? "—"],
              ["Latitude", location?.latitude?.toFixed(4) ?? "—"],
              ["Longitude", location?.longitude?.toFixed(4) ?? "—"],
              ["Records", String(insight.series.length)],
              ["Last reading", insight.latest?.date ?? "—"],
              ["Temperature", insight.latest?.temperature != null ? `${insight.latest.temperature} °C` : "—"],
              ["Rainfall", insight.latest?.rainfall != null ? `${insight.latest.rainfall} mm` : "—"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-border bg-secondary/40 px-3 py-2">
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</dt>
                <dd className="font-display mt-0.5 font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </AppShell>
  );
}
