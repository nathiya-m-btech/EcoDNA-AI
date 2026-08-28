import { lazy, Suspense, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/eco/app-shell";
import { Panel, StatCard } from "@/components/eco/panel";
import { useHotspots } from "@/lib/eco/queries";
import { riskColor } from "@/lib/eco/scoring";
import { Badge } from "@/components/ui/badge";

const HotspotMap = lazy(() => import("@/components/eco/hotspot-map"));

export const Route = createFileRoute("/_authenticated/hotspots")({
  head: () => ({
    meta: [
      { title: "Pollution Hotspot Map — EcoDNA AI" },
      { name: "description", content: "Interactive risk map of detected pollution hotspots with causal factors and recommended actions." },
      { property: "og:title", content: "Pollution Hotspot Map — EcoDNA AI" },
      { property: "og:description", content: "Geospatial environmental risk detection." },
    ],
  }),
  component: HotspotsPage,
});

function HotspotsPage() {
  const { data: hotspots, isLoading } = useHotspots();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const rows = hotspots ?? [];
  const count = (level: string) => rows.filter((h) => h.risk_level.toLowerCase().includes(level)).length;

  return (
    <AppShell title="Pollution Hotspot Map" subtitle="Geospatial environmental risk detection">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total hotspots" value={rows.length} tone="teal" />
        <StatCard label="High risk" value={count("high")} tone="red" />
        <StatCard label="Medium risk" value={count("medium")} tone="amber" />
        <StatCard label="Recovering" value={count("recover")} tone="lime" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Risk map" subtitle="Marker size scales with severity">
          {mounted ? (
            <Suspense fallback={<div className="h-[520px] animate-pulse rounded-2xl bg-secondary/50" />}>
              <HotspotMap hotspots={rows} />
            </Suspense>
          ) : (
            <div className="h-[520px] animate-pulse rounded-2xl bg-secondary/50" />
          )}
        </Panel>

        <Panel title="Detected zones" subtitle={isLoading ? "Loading…" : `${rows.length} zones`} bodyClassName="max-h-[520px] overflow-y-auto pr-1">
          <ul className="space-y-3">
            {rows.map((h) => (
              <li key={h.id} className="rounded-xl border border-border bg-secondary/40 p-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: riskColor(h.risk_level) }} />
                  <p className="text-sm font-medium">{h.name}</p>
                  <Badge variant="outline" className="ml-auto text-[10px]" style={{ color: riskColor(h.risk_level) }}>
                    {h.risk_level}
                  </Badge>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {h.detected_factor ?? "Multi-factor"} · pollution {h.pollution_level} · score {h.environmental_score ?? "—"}
                </p>
                {h.recommended_action && (
                  <p className="mt-1.5 text-xs text-primary">→ {h.recommended_action}</p>
                )}
              </li>
            ))}
            {rows.length === 0 && !isLoading && <p className="text-sm text-muted-foreground">No hotspots detected.</p>}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
