import { lazy, Suspense, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Pause, Play, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/eco/app-shell";
import { StatCard } from "@/components/eco/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useLocationStore } from "@/lib/eco/location-store";
import { useLocationInsight } from "@/lib/eco/derive";
import { DEFAULT_SETTINGS, ecosystemBaseline, INDICATORS, runEcosystemSimulation, SCENARIOS, SIMULATION_VERSION, simulationResources, type EcosystemState, type SimulationSettings } from "@/lib/eco/simulation";
import { useSaveSimulation, useSimulationHistory, type SimulationRecord } from "@/lib/eco/simulation-history";
import { exportSimulation } from "@/lib/eco/simulation-export";

const EcosystemScene = lazy(() => import("@/components/eco/ecosystem-scene"));
export const Route = createFileRoute("/_authenticated/recovery")({
  validateSearch: (search: Record<string, unknown>) => ({ target: typeof search.target === "string" ? search.target : undefined }),
  head: () => ({ meta: [
    { title: "Recovery Simulator — EcoDNA AI" },
    { name: "description", content: "Explore restoration scenarios with interactive ecosystems, before-and-after indicators and saved demonstration simulations." },
    { property: "og:title", content: "Recovery Simulator — EcoDNA AI" },
    { property: "og:description", content: "Compare and save environmental restoration scenarios." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: RecoveryPage,
});
const CONTROLS: { key: keyof SimulationSettings; label: string; max: number; min: number; unit: string }[] = [
  { key: "reforestation", label: "Reforestation effort", min: 0, max: 100, unit: "%" },
  { key: "waterSupport", label: "Water support", min: 0, max: 100, unit: "%" },
  { key: "pollutionReduction", label: "Pollution reduction", min: 0, max: 100, unit: "%" },
  { key: "rainfall", label: "Rainfall relative to baseline", min: 0, max: 200, unit: "%" },
  { key: "duration", label: "Simulation duration", min: 30, max: 365, unit: " days" },
];
function RecoveryPage() {
  const { location, locationId } = useLocationStore();
  const insight = useLocationInsight(locationId);
  const { target } = Route.useSearch();
  const history = useSimulationHistory(locationId);
  const save = useSaveSimulation();
  const [settings, setSettings] = useState<SimulationSettings>(DEFAULT_SETTINGS);
  const [name, setName] = useState("Restoration scenario");
  const [run, setRun] = useState<SimulationRecord | null>(null);
  const [day, setDay] = useState(0);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { setRun(null); setDay(0); setPlaying(false); setSelected([]); setSettings(DEFAULT_SETTINGS); }, [locationId]);
  const total = run?.settings.duration ?? settings.duration;
  useEffect(() => {
    if (!playing) return;
    const step = Math.max(1, Math.round(total / 60));
    const t = setInterval(() => setDay(d => {
      if (d + step >= total) { setPlaying(false); toast.success("Simulation complete — demonstration estimate"); return total; }
      return d + step;
    }), 80);
    return () => clearInterval(t);
  }, [playing, total]);
  const baseline = run?.baseline ?? (insight.factors ? ecosystemBaseline(insight.factors, insight.latest?.humidity) : null);
  const stage = run && baseline ? runEcosystemSimulation(baseline, run.settings, day) : baseline;
  const changed = !!run && JSON.stringify(settings) !== JSON.stringify(run.settings);
  const execute = () => {
    if (!baseline || !locationId || !name.trim()) return;
    const base = insight.factors ? ecosystemBaseline(insight.factors, insight.latest?.humidity) : baseline;
    setRun({ id: "", location_id: locationId, name: name.trim(), model_version: SIMULATION_VERSION, baseline_date: insight.latest?.date ?? null, baseline: base, settings: { ...settings }, result: runEcosystemSimulation(base, settings), target_name: target ?? null, created_at: new Date().toISOString() });
    setDay(0);
    setPlaying(true);
  };
  const phase = !run ? "1 · Adjust settings" : playing ? `2 · Simulating day ${day} of ${total}` : day >= total ? "3 · Result ready — save or export" : `Paused at day ${day}`;
  const persist = async () => {
    if (!run) return;
    setBusy(true);
    try { const { id: _id, created_at: _date, ...record } = run; setRun(await save(record)); toast.success("Simulation saved"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Could not save simulation"); }
    finally { setBusy(false); }
  };
  const exportReport = async (record: SimulationRecord, format: "csv" | "pdf") => {
    try { await exportSimulation(record, format); } catch { toast.error("Could not export report"); }
  };
  const open = (r: SimulationRecord) => { setRun(r); setSettings(r.settings); setName(r.name); setPlaying(false); setDay(r.settings.duration); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const comparisons = baseline ? SCENARIOS.map(s => ({ ...s, settings: { ...s.settings, rainfall: settings.rainfall, duration: settings.duration }, result: runEcosystemSimulation(baseline, { ...s.settings, rainfall: settings.rainfall, duration: settings.duration }) })) : [];
  return <AppShell title="Recovery Simulator" subtitle={location ? `Restoration scenarios for ${location.location_name}` : "Restoration scenarios"}>
    <p className="mb-5 text-sm text-muted-foreground">Demonstration model · {SIMULATION_VERSION} · Not a validated ecological forecast. Moisture and water availability are estimated proxies, not measured soil or water volumes.</p>
    {target && <p className="mb-4 text-sm text-primary">Hotspot target: {target}</p>}
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard label="Baseline DNA score" value={baseline?.score ?? "—"} />
      <StatCard label="Projected DNA score" value={run?.result.score ?? "—"} tone="lime" />
      <StatCard label="Projected change" value={run ? `${run.result.score - run.baseline.score >= 0 ? "+" : ""}${run.result.score - run.baseline.score} pts` : "—"} tone="teal" />
    </div>
    <section className="mt-8 grid gap-8 border-y border-border py-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="min-w-0 space-y-5">
        <h2 className="font-display text-lg font-semibold">Scenario settings</h2>
        <div className="space-y-2"><Label htmlFor="scenario-name">Scenario name</Label><Input id="scenario-name" value={name} maxLength={80} onChange={e => setName(e.target.value)} /></div>
        {CONTROLS.map(c => <div key={c.key}><div className="mb-3 flex justify-between gap-3 text-sm"><Label>{c.label}</Label><span className="shrink-0 tabular-nums text-primary">{settings[c.key]}{c.unit}</span></div><Slider aria-label={c.label} min={c.min} max={c.max} step={c.key === "duration" ? 5 : 10} value={[settings[c.key]]} onValueChange={v => setSettings(p => ({ ...p, [c.key]: v[0] ?? c.min }))} /></div>)}
        <div className="flex flex-wrap gap-2"><Button onClick={execute} disabled={!baseline || !name.trim() || insight.loading}><Play className="h-4 w-4" />Run Simulation</Button><Button aria-label="Reset simulation" title="Reset simulation" size="icon" variant="outline" onClick={() => { setSettings(DEFAULT_SETTINGS); setRun(null); setDay(0); setPlaying(false); }}><RotateCcw className="h-4 w-4" /></Button></div>
        {changed && <p className="text-xs text-risk-medium">Settings changed. Run again to update the projected result.</p>}
        {!baseline && <p className="text-sm text-muted-foreground">No baseline readings yet. Sync this location from the dashboard first.</p>}
      </div>
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-3"><span className="rounded-full border border-border px-3 py-1 text-xs text-primary">{phase}</span>{run && <Button size="sm" variant="outline" onClick={() => { if (day >= total) setDay(0); setPlaying(p => !p); }}>{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{playing ? "Pause" : day >= total ? "Replay" : "Resume"}</Button>}</div><div className="mb-2 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary transition-all" style={{ width: `${run ? (day / total) * 100 : 0}%` }} /></div><div className="flex justify-between gap-4 text-sm font-medium"><span>Before · baseline</span><span>After · day {day}</span></div>
        {baseline && stage && <Suspense fallback={<div className="h-[460px] animate-pulse bg-secondary/30" />}><EcosystemScene before={baseline} after={stage} /></Suspense>}
        <Slider aria-label="Simulation day" value={[day]} min={0} max={run?.settings.duration ?? settings.duration} step={1} disabled={!run} onValueChange={v => { setPlaying(false); setDay(v[0] ?? 0); }} />
        <div className="mt-3 flex justify-between text-xs text-muted-foreground"><span>Day 0</span><span>{run?.settings.duration ?? settings.duration} days · projected</span></div>
        <p className="mt-4 text-xs text-muted-foreground">Conceptual terrain, not satellite-derived geometry. Baseline factors use existing readings; soil moisture uses humidity as a proxy (50 if missing), and water availability is a demonstration proxy. No calibrated uncertainty range is available.</p>
      </div>
    </section>
    {baseline && stage && <section className="py-6"><h2 className="mb-5 font-display text-lg font-semibold">Before and after · indicators /100</h2><div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">{INDICATORS.map(i => <div key={i.label} className="border-b border-border pb-3"><p className="text-sm text-muted-foreground">{i.label}</p><div className="mt-2 flex justify-between text-xl tabular-nums"><span>{Math.round(i.value(baseline))}</span><span className="text-primary">{Math.round(i.value(stage))}</span></div></div>)}</div></section>}
    {run && <div className="mb-6 flex flex-wrap gap-2"><Button onClick={persist} disabled={busy || !!run.id}><Save className="h-4 w-4" />{run.id ? "Saved" : busy ? "Saving…" : "Save simulation"}</Button><Button variant="outline" onClick={() => exportReport(run, "csv")}><Download className="h-4 w-4" />CSV</Button><Button variant="outline" onClick={() => exportReport(run, "pdf")}><Download className="h-4 w-4" />PDF</Button></div>}
    <section className="border-y border-border py-6"><h2 className="mb-2 font-display text-lg font-semibold">Scenario comparison</h2><p className="mb-5 text-xs text-muted-foreground">Same baseline, {settings.duration} days, {settings.rainfall}% rainfall. Resource estimates are illustrative per hectare.</p><div className="grid gap-6 lg:grid-cols-3">{comparisons.map(s => { const resources = simulationResources(s.settings); return <article key={s.name} className="min-w-0 space-y-3 border-l-2 border-primary/40 pl-4"><h3 className="font-semibold">{s.name}</h3><p className="font-display text-2xl text-primary">{s.result.score} <span className="text-xs text-muted-foreground">DNA /100</span></p><dl className="space-y-1 text-xs">{INDICATORS.slice(1).map(i => <div key={i.label} className="flex justify-between gap-2"><dt>{i.label}</dt><dd>{Math.round(i.value(s.result))}</dd></div>)}</dl><p className="text-xs text-muted-foreground">{resources.seedlings} seedlings · {resources.water} m³ support water · {resources.effort} effort units / ha</p><p className="text-xs text-muted-foreground">{s.tradeoff}</p><Button size="sm" variant="outline" onClick={() => { setSettings(s.settings); setName(s.name); toast.success("Scenario settings loaded. Run Simulation to preview."); }}>Use scenario</Button></article>; })}</div></section>
    <section className="py-6"><h2 className="mb-4 font-display text-lg font-semibold">Saved simulations</h2>{history.isError && <Button variant="outline" onClick={() => history.refetch()}>Retry history</Button>}{!history.isLoading && !history.isError && !history.data?.length && <p className="text-sm text-muted-foreground">No saved simulations for this location.</p>}<div className="space-y-3">{history.data?.map(r => <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3"><div className="flex min-w-0 items-center gap-3"><input aria-label={`Compare ${r.name}`} type="checkbox" checked={selected.includes(r.id)} onChange={e => setSelected(p => e.target.checked ? [...p, r.id] : p.filter(id => id !== r.id))} /><div><p className="break-words text-sm font-medium">{r.name} · {r.baseline.score} → {r.result.score}</p><p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()} · {r.model_version}</p></div></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => open(r)}>Reopen</Button><Button size="sm" variant="ghost" onClick={() => exportReport(r, "csv")}>CSV</Button><Button size="sm" variant="ghost" onClick={() => exportReport(r, "pdf")}>PDF</Button></div></div>)}</div>{selected.length > 0 && <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><caption className="mb-3 text-left">Selected saved scenarios · each retains its original baseline</caption><thead><tr><th className="p-2">Scenario / baseline</th>{INDICATORS.map(i => <th className="p-2" key={i.label}>{i.label}</th>)}</tr></thead><tbody>{history.data?.filter(r => selected.includes(r.id)).map(r => <tr key={r.id}><td className="p-2">{r.name} / {r.baseline_date}</td>{INDICATORS.map(i => <td className="p-2" key={i.label}>{Math.round(i.value(r.result))}</td>)}</tr>)}</tbody></table></div>}</section>
  </AppShell>;
}
