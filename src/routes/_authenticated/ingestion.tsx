import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, Brain, Database, Loader2, Satellite, TimerReset } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/eco/app-shell";
import { Panel, StatCard } from "@/components/eco/panel";
import { ComparisonBars } from "@/components/eco/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAllPredictions, useEnvData, useHotspots, useLocations } from "@/lib/eco/queries";
import { computeDnaScore } from "@/lib/eco/scoring";
import { factorsFromRow } from "@/lib/eco/derive";
import { runEnvironmentalAI, syncLiveData } from "@/lib/eco/live-data.functions";


export const Route = createFileRoute("/_authenticated/ingestion")({
  head: () => ({
    meta: [
      { title: "Live Data Ingestion — EcoDNA AI" },
      {
        name: "description",
        content:
          "Monitor live environmental readings ingested per location, coverage charts and which locations are lagging behind.",
      },
      { property: "og:title", content: "Live Data Ingestion — EcoDNA AI" },
      { property: "og:description", content: "Ingestion coverage and freshness across all monitored locations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IngestionPage,
});

const daysSince = (iso: string) => Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);

function IngestionPage() {
  const { data: locations } = useLocations();
  const { data: env } = useEnvData();
  const { data: hotspots } = useHotspots();
  const { data: predictions } = useAllPredictions();
  const qc = useQueryClient();
  const sync = useServerFn(syncLiveData);
  const runAI = useServerFn(runEnvironmentalAI);
  const [busy, setBusy] = useState<null | "sync" | "ai" | "auto">(null);
  const [autoNote, setAutoNote] = useState<string | null>(null);
  const autoDone = useRef(false);

  const rows = (locations ?? []).map((l) => {
    const readings = (env ?? []).filter((r) => r.location_id === l.id).sort((a, b) => a.date.localeCompare(b.date));
    const latest = readings[readings.length - 1];
    return {
      id: l.id,
      name: l.location_name,
      region: l.region,
      count: readings.length,
      latestDate: latest?.date ?? null,
      staleDays: latest ? daysSince(latest.date) : null,
      score: latest ? computeDnaScore(factorsFromRow(latest)) : null,
      zones: (hotspots ?? []).filter((h) => h.name.startsWith(l.location_name)).length,
      aiPending: !(predictions ?? []).some((p) => p.location_id === l.id),
    };
  });

  const totalReadings = rows.reduce((a, b) => a + b.count, 0);
  const lagging = rows.filter((r) => r.count === 0 || (r.staleDays ?? 99) > 1).sort((a, b) => a.count - b.count);
  const fresh = rows.length - lagging.length;
  const needsAuto = rows.filter((r) => r.count === 0 || r.aiPending);

  // Auto-sync: any location with no live readings or no AI run gets filled in
  // automatically on first visit, so no location is ever left blank.
  useEffect(() => {
    if (autoDone.current) return;
    if (!locations || !env || !predictions) return;
    const pending = rows.filter((r) => r.count === 0 || r.aiPending);
    if (pending.length === 0) {
      autoDone.current = true;
      return;
    }
    autoDone.current = true;
    let cancelled = false;
    (async () => {
      setBusy("auto");
      setAutoNote(`Auto-syncing ${pending.length} location${pending.length === 1 ? "" : "s"} with missing data…`);
      let done = 0;
      for (const p of pending) {
        if (cancelled) return;
        try {
          await sync({ data: { locationId: p.id } });
          done += 1;
        } catch {
          /* keep going; a single provider failure must not stall the rest */
        }
      }
      if (cancelled) return;
      await qc.invalidateQueries();
      setBusy(null);
      setAutoNote(done > 0 ? `Auto-synced ${done} location${done === 1 ? "" : "s"}.` : "Auto-sync could not reach the data provider.");
      if (done > 0) toast.success(`Auto-synced ${done} location${done === 1 ? "" : "s"} with missing data`);
    })();
    return () => {
      cancelled = true;
    };
  }, [locations, env, predictions, rows, sync, qc]);


  const run = async (kind: "sync" | "ai") => {
    setBusy(kind);
    try {
      if (kind === "sync") {
        const res = await sync({ data: {} });
        toast.success(`Ingested live data for ${res.synced} location${res.synced === 1 ? "" : "s"}`);
      } else {
        const res = await runAI({ data: {} });
        toast.success(`Environmental AI re-ran for ${res.analysed} location${res.analysed === 1 ? "" : "s"}`);
      }
      await qc.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <AppShell title="Live Data Ingestion" subtitle="Coverage, freshness and AI processing per monitored location">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">
            Sources: Open-Meteo air quality, weather and satellite-derived vegetation/soil signals.
          </p>
          {(busy === "auto" || autoNote) && (
            <p className="mt-1 flex items-center gap-2 text-xs text-primary">
              {busy === "auto" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {autoNote}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => run("ai")} disabled={busy !== null}>
            {busy === "ai" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
            Re-run AI
          </Button>
          <Button size="sm" onClick={() => run("sync")} disabled={busy !== null}>
            {busy === "sync" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Satellite className="mr-2 h-4 w-4" />}
            Ingest live data
          </Button>
        </div>
      </div>


      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Monitored locations" value={rows.length} icon={<Database className="h-4 w-4" />} tone="teal" />
        <StatCard label="Total readings" value={totalReadings} icon={<Activity className="h-4 w-4" />} tone="emerald" />
        <StatCard label="Up to date" value={fresh} hint="synced within 24h" tone="lime" />
        <StatCard label="Lagging" value={lagging.length} icon={<TimerReset className="h-4 w-4" />} tone="amber" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Readings per location" subtitle="Volume of ingested live observations">
          {rows.length > 0 ? (
            <ComparisonBars data={rows.map((r) => ({ name: r.name, score: r.count }))} />
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">No locations yet.</p>
          )}
        </Panel>
        <Panel title="Data freshness" subtitle="Days since the last ingested reading (lower is better)">
          {rows.length > 0 ? (
            <ComparisonBars data={rows.map((r) => ({ name: r.name, score: r.staleDays ?? 30 }))} />
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">No locations yet.</p>
          )}
        </Panel>
      </div>

      <Panel className="mt-4" title="Ingestion ledger" subtitle="Per-location coverage, freshness and AI output">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                <th className="pb-2">Location</th>
                <th className="pb-2">Readings</th>
                <th className="pb-2">Last reading</th>
                <th className="pb-2">DNA score</th>
                <th className="pb-2">AI zones</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const stale = r.count === 0 || (r.staleDays ?? 99) > 1;
                return (
                  <tr key={r.id} className="border-t border-border/60">
                    <td className="py-2.5">
                      <p className="font-medium">{r.name}</p>
                      {r.region && <p className="text-xs text-muted-foreground">{r.region}</p>}
                    </td>
                    <td className="py-2.5">{r.count}</td>
                    <td className="py-2.5 text-muted-foreground">{r.latestDate ?? "—"}</td>
                    <td className="py-2.5 font-display">{r.score ?? "—"}</td>
                    <td className="py-2.5">{r.zones}</td>
                    <td className="py-2.5">
                      <Badge variant="outline" className="text-[10px]" style={{ color: stale ? "var(--risk-medium)" : "var(--eco-emerald)", borderColor: stale ? "var(--risk-medium)" : "var(--eco-emerald)" }}>
                        {r.count === 0 ? "No data" : stale ? `${r.staleDays}d behind` : "Current"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                    No locations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {lagging.length > 0 && (
        <Panel className="mt-4" title="Locations lagging behind" subtitle="Missing or stale live data">
          <ul className="space-y-2">
            {lagging.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-3 text-sm">
                <span>{r.name}</span>
                <span className="text-xs text-muted-foreground">
                  {r.count === 0 ? "never ingested" : `${r.count} readings · last ${r.latestDate}`}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </AppShell>
  );
}
