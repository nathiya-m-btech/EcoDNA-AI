import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { riskColor } from "@/lib/eco/scoring";
import type { HotspotRow, SourceRow } from "@/lib/eco/queries";

const SOURCE_COLOR: Record<string, string> = {
  factory: "#f97316",
  industry: "#f97316",
  traffic: "#38bdf8",
  waste: "#a855f7",
  landfill: "#a855f7",
  construction: "#facc15",
  quarry: "#fb7185",
  sewage: "#22d3ee",
  agriculture: "#84cc16",
  other: "#e2e8f0",
};

export default function HotspotMap({
  hotspots,
  sources = [],
  center,
  height = 520,
}: {
  hotspots: HotspotRow[];
  sources?: SourceRow[];
  center?: [number, number];
  height?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { scrollWheelZoom: false }).setView(center ?? [11.0168, 76.9558], 8);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
      className: "eco-tiles",
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layer = L.layerGroup().addTo(map);
    hotspots.forEach((h) => {
      const color = riskColor(h.risk_level);
      L.circleMarker([h.latitude, h.longitude], {
        radius: 9 + (100 - (h.environmental_score ?? 60)) / 12,
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.35,
      })
        .bindPopup(
          `<strong>${h.name}</strong><br/>Risk: ${h.risk_level}<br/>Pollution: ${h.pollution_level}<br/>Score: ${
            h.environmental_score ?? "—"
          }<br/>${h.recommended_action ?? ""}`,
        )
        .addTo(layer);
    });

    sources.forEach((s) => {
      const color = SOURCE_COLOR[s.source_type.toLowerCase()] ?? SOURCE_COLOR["other"]!;
      L.marker([s.latitude, s.longitude], {
        icon: L.divIcon({
          className: "",
          html: `<span style="display:block;width:14px;height:14px;transform:rotate(45deg);border:2px solid ${color};background:${color}55;box-shadow:0 0 10px ${color}"></span>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        }),
      })
        .bindPopup(
          `<strong>${s.name}</strong><br/>Source: ${s.source_type}<br/>Intensity: ${s.intensity ?? "—"}/100<br/>${
            s.notes ?? ""
          }`,
        )
        .addTo(layer);
    });

    const pts = [
      ...hotspots.map((h) => [h.latitude, h.longitude] as [number, number]),
      ...sources.map((s) => [s.latitude, s.longitude] as [number, number]),
    ];
    if (pts.length > 0) map.fitBounds(L.latLngBounds(pts).pad(0.3));
    return () => {
      layer.remove();
    };
  }, [hotspots, sources]);

  return <div ref={ref} className="eco-map overflow-hidden rounded-2xl" style={{ height }} />;
}
