import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/eco/app-shell";
import { Panel } from "@/components/eco/panel";
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
  const r = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n);
  return { x, y };
}

function Satellite({ loc }: { loc?: LocationRow }) {
  if (!loc) return <div className="aspect-square rounded-2xl bg-secondary/40" />;
  const { x, y } = tile(loc.latitude, loc.longitude);
  const cells = [-1, 0, 1].flatMap((dy) => [-1, 0, 1].map((dx) => ({ dx, dy })));
  return (
    <div className="grid aspect-square grid-cols-3 overflow-hidden rounded-2xl border border-border">
      {cells.map(({ dx, dy }) => (
        <img
          key={`${dx}${dy}`}
          src={`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${Z}/${y + dy}/${x + dx}`}
          alt={`Satellite view of ${loc.location_name}`}
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
  const idA = a ?? locationId;
  const idB = b ?? locations.find((l) => l.id !== idA)?.id;
  const locA = locations.find((l) => l.id === idA);
  const locB = locations.find((l) => l.id === idB);
  const { data: all } = useScores();
  const latest = useMemo(() => {
    const m = new Map<string, ScoreRow>();
    for (const s of all ?? []) m.set(s.location_id, s);
    return m;
  }, [all]);
  const sA = idA ? latest.get(idA) : undefined;
  const sB = idB ? latest.get(idB) : undefined;

  const picker = (v: string | undefined, set: (v: string) => void) => (
    <Select value={v ?? ""} onValueChange={set}>
      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pick a place" /></SelectTrigger>
      <SelectContent>
        {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.location_name}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <AppShell title="Location Comparison" subtitle="Scores and satellite images side by side">
      <div className="grid gap-4 md:grid-cols-2">
        {picker(idA, setA)}
        {picker(idB, setB)}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Satellite images" subtitle={`${locA?.location_name ?? "—"} vs ${locB?.location_name ?? "—"}`}>
          <div className="grid grid-cols-2 gap-3">
            <Satellite loc={locA} />
            <Satellite loc={locB} />
          </div>
          <p className="mt-4 mb-2 text-xs text-muted-foreground">Overlay slider — drag to compare</p>
          <div className="relative">
            <Satellite loc={locB} />
            <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
              <Satellite loc={locA} />
            </div>
            <div className="absolute inset-y-0 w-0.5 bg-primary" style={{ left: `${split}%` }} />
          </div>
          <input type="range" min={0} max={100} value={split} onChange={(e) => setSplit(+e.target.value)} className="mt-3 w-full accent-primary" />
        </Panel>
        <Panel title="Factor comparison">
          <div className="space-y-4">
            {FACTORS.map((f) => {
              const va = Number(sA?.[f.key] ?? 0);
              const vb = Number(sB?.[f.key] ?? 0);
              return (
                <div key={f.key}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-primary">{Math.round(va)}</span>
                    <span className="text-muted-foreground">{f.label}</span>
                    <span className="text-accent-foreground">{Math.round(vb)}</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="flex h-2 flex-1 justify-end rounded bg-secondary"><div className="rounded bg-primary" style={{ width: `${va}%` }} /></div>
                    <div className="h-2 flex-1 rounded bg-secondary"><div className="h-2 rounded bg-accent" style={{ width: `${vb}%` }} /></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
