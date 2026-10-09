import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, BellRing, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/eco/app-shell";
import { Panel, StatCard } from "@/components/eco/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAlerts } from "@/lib/eco/queries";
import { useLocationStore } from "@/lib/eco/location-store";
import { riskColor } from "@/lib/eco/scoring";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({
    meta: [
      { title: "Environmental Alerts — EcoDNA AI" },
      { name: "description", content: "Real-time degradation alerts with severity, factor and recommended response." },
      { property: "og:title", content: "Environmental Alerts — EcoDNA AI" },
      { property: "og:description", content: "Monitor environmental risk events as they surface." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AlertsPage,
});

const FILTERS = ["all", "critical", "high", "medium", "low"] as const;

function AlertsPage() {
  const { data: alerts, isLoading } = useAlerts();
  const { locations } = useLocationStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const rows = useMemo(() => {
    const all = alerts ?? [];
    return filter === "all" ? all : all.filter((a) => a.severity.toLowerCase() === filter);
  }, [alerts, filter]);

  const count = (s: string) => (alerts ?? []).filter((a) => a.severity.toLowerCase() === s).length;
  const nameOf = (id: string | null) => locations.find((l) => l.id === id)?.location_name ?? "Network-wide";

  return (
    <AppShell title="Alerts" subtitle="Automated environmental degradation warnings">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total alerts" value={alerts?.length ?? 0} icon={<BellRing className="h-4 w-4" />} />
        <StatCard label="Critical" value={count("critical")} tone="red" icon={<AlertTriangle className="h-4 w-4" />} />
        <StatCard label="High" value={count("high")} tone="amber" />
        <StatCard
          label="Resolved"
          value={(alerts ?? []).filter((a) => a.status?.toLowerCase() === "resolved").length}
          tone="emerald"
          icon={<ShieldCheck className="h-4 w-4" />}
        />
      </div>

      <Panel
        className="mt-4"
        title="Alert feed"
        subtitle="Newest first"
        action={
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                className="h-7 rounded-lg px-2.5 text-xs capitalize"
                onClick={() => setFilter(f)}
              >
                {f}
              </Button>
            ))}
          </div>
        }
      >
        <ul className="space-y-3">
          {rows.map((a) => (
            <li key={a.id} className="rounded-2xl border border-border bg-secondary/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{a.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {nameOf(a.location_id)} · {a.alert_type} · {new Date(a.detected_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline" style={{ color: riskColor(a.severity), borderColor: riskColor(a.severity) }}>
                  {a.severity}
                </Badge>
              </div>
              {a.recommendation && (
                <p className="mt-3 rounded-xl border border-border/70 bg-background/40 p-3 text-xs text-muted-foreground">
                  <span className="text-foreground">Recommended: </span>
                  {a.recommendation}
                </p>
              )}
            </li>
          ))}
          {!isLoading && rows.length === 0 && (
            <p className="text-sm text-muted-foreground">No alerts match this filter.</p>
          )}
        </ul>
      </Panel>
    </AppShell>
  );
}
