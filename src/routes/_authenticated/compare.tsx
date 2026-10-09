import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/eco/app-shell";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocationStore } from "@/lib/eco/location-store";
import { useScores, type LocationRow, type ScoreRow } from "@/lib/eco/queries";

export const Route = createFileRoute("/_authenticated/compare")({
  head: () => ({
    meta: [
      { title: "Location Comparison — EcoDNA AI" },
      { name: "description", content: "Compare two places side by side: DNA scores, factors and satellite images." },
      { property: "og:title", content: "Location Comparison — EcoDNA AI" },
      { property: "og:description", content: "Side-by-side environmental and satellite image comparison." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComparePage,
});

const Z = 14;
function tile(lat: number, lng: number) {
  const n = 2 ** Z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const r = (Math.max(-85.0511, Math.min(85.0511, lat)) * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n);
  return { x, y };
}

function Satellite({ loc }: { loc: LocationRow | undefined }) {
  if (!loc) return <div className="aspect-square rounded-lg bg-secondary/40" />;
  const { x, y } = tile(loc.latitude, loc.longitude);
  const cells = [-1, 0, 1].flatMap((dy) => [-1, 0, 1].map((dx) => ({ dx, dy })));
  return (
    <div role="img" aria-label={`Satellite view of ${loc.location_name}`} className="grid aspect-square grid-cols-3 overflow-hidden rounded-lg border border-border">
      {cells.map(({ dx, dy }) => (
        <img
          key={`${dx}${dy}`}
          src={`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${Z}/${y + dy}/${x + dx}`}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ))}
    </div>
  );
}

const FACTORS: { key: keyof ScoreRow; label: string }[] = [
  { key: "environmental_dna_score", label: "DNA score" },
  { key: "air_score", label: "Air" },
  { key: "water_score", label: "Water" },
  { key: "biodiversity_score", label: "Biodiversity" },
  { key: "waste_score", label: "Waste" },
  { key: "green_cover_score", label: "Green cover" },
];

function ComparePage() {
  const { locations, locationId } = useLocationStore();
  const [a, setA] = useState<string | undefined>();
  const [b, setB] = useState<string | undefined>();
  const [split, setSplit] = useState(50);
  const [imageMode, setImageMode] = useState<"side" | "swipe">("side");
  const idA = a ?? locationId;
  const idB = b ?? locations.find((l) => l.id !== idA)?.id;
  const locA = locations.find((l) => l.id === idA);
  const locB = locations.find((l) => l.id === idB);
  const { data: all } = useScores();
  const latest = useMemo(() => {
    const m = new Map<string, ScoreRow>();
    for (const s of all ?? []) {
      const previous = m.get(s.location_id);
      if (!previous || s.date >= previous.date) m.set(s.location_id, s);
    }
    return m;
  }, [all]);
  const sA = idA ? latest.get(idA) : undefined;
  const sB = idB ? latest.get(idB) : undefined;

  const picker = (label: string, v: string | undefined, set: (v: string) => void) => (
    <div className="min-w-0">
    <p className="mb-2 text-sm text-muted-foreground">{label}</p>
    <Select value={v ?? ""} onValueChange={set}>
      <SelectTrigger aria-label={label} className="h-11 w-full rounded-lg"><SelectValue placeholder="Pick a place" /></SelectTrigger>
      <SelectContent>
        {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.location_name}</SelectItem>)}
      </SelectContent>
    </Select>
    </div>
  );

  return (
    <AppShell title="Location Comparison" subtitle="Environmental scores and satellite views">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {picker("First location", idA, setA)}
          {picker("Second location", idB, setB)}
        </div>

        <section aria-labelledby="factor-heading" className="min-w-0 border-y border-border py-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 id="factor-heading" className="font-display text-lg font-semibold">Factor comparison</h2>
            <span className="text-xs text-muted-foreground">Score / 100</span>
          </div>
          <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-chart-1" />{locA?.location_name ?? "First location"}</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-chart-2" />{locB?.location_name ?? "Second location"}</span>
          </div>
          <div className="space-y-6">
            {FACTORS.map((f) => (
              <div key={f.key} className="grid gap-2 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-5">
                <h3 className="text-sm font-medium sm:pt-1">{f.label}</h3>
                <div className="space-y-2.5">
                  {[{ score: sA, loc: locA, color: "bg-chart-1" }, { score: sB, loc: locB, color: "bg-chart-2" }].map(({ score, loc, color }, i) => {
                    const raw = score?.[f.key];
                    const value = typeof raw === "number" ? Math.max(0, Math.min(100, raw)) : undefined;
                    return (
                      <div key={i} className="grid grid-cols-[minmax(0,1fr)_40px] items-center gap-3" aria-label={`${f.label}, ${loc?.location_name ?? "Location"}: ${value === undefined ? "No data" : Math.round(value)}`}>
                        <div className="h-3 overflow-hidden rounded-sm bg-secondary/70">
                          {value !== undefined && <div className={`h-full rounded-sm ${color}`} style={{ width: `${value}%` }} />}
                        </div>
                        <span className="text-right text-sm tabular-nums text-foreground">{value === undefined ? "—" : Math.round(value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
            <span>{locA?.location_name}: {sA?.date ?? "No readings"}</span>
            <span>{locB?.location_name}: {sB?.date ?? "No readings"}</span>
          </div>
        </section>

        <section aria-labelledby="satellite-heading" className="min-w-0 pb-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 id="satellite-heading" className="font-display text-lg font-semibold">Satellite comparison</h2>
            <div className="flex gap-1" role="group" aria-label="Image comparison mode">
              <Button size="sm" variant={imageMode === "side" ? "secondary" : "ghost"} aria-pressed={imageMode === "side"} onClick={() => setImageMode("side")}>Side by side</Button>
              <Button size="sm" variant={imageMode === "swipe" ? "secondary" : "ghost"} aria-pressed={imageMode === "swipe"} onClick={() => setImageMode("swipe")}>Swipe</Button>
            </div>
          </div>
          {imageMode === "side" ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {[locA, locB].map((loc, i) => <figure key={i} className="min-w-0"><Satellite loc={loc} /><figcaption className="mt-3 text-sm font-medium">{loc?.location_name ?? "Select a location"}</figcaption></figure>)}
            </div>
          ) : (
            <div className="mx-auto max-w-2xl">
              <div className="relative overflow-hidden rounded-lg">
                <Satellite loc={locB} />
                <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}><Satellite loc={locA} /></div>
                <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-foreground" style={{ left: `${split}%` }} />
              </div>
              <Slider className="mt-5" min={0} max={100} value={[split]} onValueChange={(values) => setSplit(values[0] ?? 50)} aria-label="Satellite image split" />
              <div className="mt-3 flex justify-between gap-4 text-sm"><span>{locA?.location_name}</span><span className="text-right">{locB?.location_name}</span></div>
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">Imagery © Esri, Maxar, Earthstar Geographics. Capture dates may vary.</p>
        </section>
      </div>
    </AppShell>
  );
}
