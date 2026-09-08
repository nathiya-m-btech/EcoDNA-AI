import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Factory, Loader2, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/eco/app-shell";
import { Panel, StatCard } from "@/components/eco/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useLocationStore } from "@/lib/eco/location-store";
import { useSources } from "@/lib/eco/queries";
import { runEnvironmentalAI } from "@/lib/eco/live-data.functions";

export const Route = createFileRoute("/_authenticated/sources")({
  head: () => ({
    meta: [
      { title: "Local Pollution Sources — EcoDNA AI" },
      {
        name: "description",
        content:
          "Record factories, traffic corridors and waste sites near each monitored location and see them plotted on the hotspot map.",
      },
      { property: "og:title", content: "Local Pollution Sources — EcoDNA AI" },
      { property: "og:description", content: "Map the real emitters driving each location's environmental DNA score." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SourcesPage,
});

const TYPES = [
  "factory",
  "industry",
  "traffic",
  "waste",
  "landfill",
  "construction",
  "quarry",
  "sewage",
  "agriculture",
  "other",
] as const;

function SourcesPage() {
  const { locations, locationId } = useLocationStore();
  const { data: sources, isLoading } = useSources();
  const qc = useQueryClient();
  const runAI = useServerFn(runEnvironmentalAI);

  const selected = useMemo(() => locations.find((l) => l.id === locationId), [locations, locationId]);
  const [form, setForm] = useState({
    name: "",
    source_type: "factory",
    latitude: "",
    longitude: "",
    intensity: "60",
    notes: "",
  });
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const useLocationCoords = () => {
    if (!selected) return;
    set("latitude", String(selected.latitude));
    set("longitude", String(selected.longitude));
  };

  const save = async () => {
    const lat = Number(form.latitude);
    const lon = Number(form.longitude);
    const intensity = Number(form.intensity);
    if (form.name.trim().length < 2) {
      toast.error("Give the source a name.");
      return;
    }
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      toast.error("Latitude must be between -90 and 90.");
      return;
    }
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      toast.error("Longitude must be between -180 and 180.");
      return;
    }
    if (!Number.isFinite(intensity) || intensity < 0 || intensity > 100) {
      toast.error("Intensity must be between 0 and 100.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.from("pollution_sources" as never).insert({
        location_id: locationId ?? null,
        name: form.name.trim(),
        source_type: form.source_type,
        latitude: lat,
        longitude: lon,
        intensity,
        notes: form.notes.trim() || null,
      } as never);
      if (error) throw new Error(error.message);
      if (locationId) await runAI({ data: { locationId } });
      await qc.invalidateQueries();
      setForm({ name: "", source_type: "factory", latitude: "", longitude: "", intensity: "60", notes: "" });
      toast.success("Source recorded and the map re-scored.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the source");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("pollution_sources" as never).delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (locationId) await runAI({ data: { locationId } });
    await qc.invalidateQueries();
    toast.success("Source removed.");
  };

  const rows = sources ?? [];
  const count = (t: string) => rows.filter((s) => s.source_type === t).length;

  return (
    <AppShell title="Local Pollution Sources" subtitle="Factories, traffic corridors and waste sites feeding the risk model">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Recorded sources" value={rows.length} icon={<Factory className="h-4 w-4" />} tone="teal" />
        <StatCard label="Industrial" value={count("factory") + count("industry")} tone="amber" />
        <StatCard label="Traffic" value={count("traffic")} tone="emerald" />
        <StatCard label="Waste sites" value={count("waste") + count("landfill")} tone="red" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Add a source" subtitle={selected ? `Linked to ${selected.location_name}` : "Select a location first"}>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. SIDCO dyeing unit" />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={form.source_type} onValueChange={(v) => set("source_type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Latitude</Label>
                <Input value={form.latitude} onChange={(e) => set("latitude", e.target.value)} placeholder="11.0168" />
              </div>
              <div>
                <Label className="text-xs">Longitude</Label>
                <Input value={form.longitude} onChange={(e) => set("longitude", e.target.value)} placeholder="76.9558" />
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={useLocationCoords} disabled={!selected}>
              <MapPin className="mr-2 h-3.5 w-3.5" /> Use {selected?.location_name ?? "location"} coordinates
            </Button>
            <div>
              <Label className="text-xs">Intensity (0-100)</Label>
              <Input value={form.intensity} onChange={(e) => set("intensity", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
            </div>
            <Button className="w-full" onClick={save} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save source & re-score
            </Button>
          </div>
        </Panel>

        <Panel
          className="lg:col-span-2"
          title="Recorded sources"
          subtitle={isLoading ? "Loading…" : `${rows.length} sources shown on the hotspot map`}
          bodyClassName="max-h-[620px] overflow-y-auto pr-1"
        >
          <ul className="space-y-3">
            {rows.map((s) => (
              <li key={s.id} className="rounded-xl border border-border bg-secondary/40 p-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{s.name}</p>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {s.source_type}
                  </Badge>
                  <span className="ml-auto text-xs text-muted-foreground">intensity {s.intensity ?? "—"}</span>
                  <button onClick={() => remove(s.id)} aria-label={`Remove ${s.name}`} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                  {s.notes ? ` · ${s.notes}` : ""}
                </p>
              </li>
            ))}
            {rows.length === 0 && !isLoading && (
              <p className="text-sm text-muted-foreground">No sources recorded yet. Add the first one on the left.</p>
            )}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
