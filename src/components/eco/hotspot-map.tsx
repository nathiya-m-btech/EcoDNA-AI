import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { riskColor } from "@/lib/eco/scoring";
import type { HotspotRow } from "@/lib/eco/queries";

export default function HotspotMap({
  hotspots,
  center,
  height = 520,
}: {
  hotspots: HotspotRow[];
  center?: [number, number];
  height?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { scrollWheelZoom: false }).setView(center ?? [11.0168, 76.9558], 8);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap &copy; CARTO",
      maxZoom: 19,
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
    if (hotspots.length > 0) {
      map.fitBounds(L.latLngBounds(hotspots.map((h) => [h.latitude, h.longitude] as [number, number])).pad(0.3));
    }
    return () => {
      layer.remove();
    };
  }, [hotspots]);

  return <div ref={ref} className="eco-map overflow-hidden rounded-2xl" style={{ height }} />;
}
