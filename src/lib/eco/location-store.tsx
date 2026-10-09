import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useLocations, type LocationRow } from "./queries";
import { createLocationFromCoords } from "./live-data.functions";

type GeoState = "idle" | "locating" | "ready" | "denied";

type Ctx = {
  locations: LocationRow[];
  loading: boolean;
  locationId: string | undefined;
  location: LocationRow | undefined;
  setLocationId: (id: string) => void;
  currentId: string | undefined;
  geo: GeoState;
  useCurrent: () => void;
};

const LocationCtx = createContext<Ctx>({
  locations: [],
  loading: true,
  locationId: undefined,
  location: undefined,
  setLocationId: () => {},
  currentId: undefined,
  geo: "idle",
  useCurrent: () => {},
});

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const r = Math.PI / 180;
  const dLat = (bLat - aLat) * r;
  const dLng = (bLng - aLng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

const NEAR_KM = 15;

export function LocationProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useLocations();
  const qc = useQueryClient();
  const create = useServerFn(createLocationFromCoords);
  const [locationId, setLocationId] = useState<string | undefined>(undefined);
  const [currentId, setCurrentId] = useState<string | undefined>(undefined);
  const [geo, setGeo] = useState<GeoState>("idle");
  const started = useRef(false);

  const resolveCurrent = useCallback(
    (list: LocationRow[]) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        setGeo("denied");
        return;
      }
      setGeo("locating");
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          let best: LocationRow | undefined;
          let bestD = Infinity;
          for (const l of list) {
            const d = distanceKm(latitude, longitude, l.latitude, l.longitude);
            if (d < bestD) {
              bestD = d;
              best = l;
            }
          }
          if (best && bestD <= NEAR_KM) {
            setCurrentId(best.id);
            setLocationId(best.id);
            setGeo("ready");
            return;
          }
          try {
            const res = await create({
              data: {
                name: `My location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
                latitude,
                longitude,
                region: "Current location",
              },
            });
            await qc.invalidateQueries();
            setCurrentId(res.location.id);
            setLocationId(res.location.id);
            setGeo("ready");
          } catch {
            setGeo("denied");
          }
        },
        () => setGeo("denied"),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
      );
    },
    [create, qc],
  );

  useEffect(() => {
    if (!data) return;
    const first = data[0];
    if (!locationId && first) setLocationId(first.id);
    if (!started.current) {
      started.current = true;
      resolveCurrent(data);
    }
  }, [data, locationId, resolveCurrent]);

  const value = useMemo<Ctx>(
    () => ({
      locations: data ?? [],
      loading: isLoading,
      locationId,
      location: (data ?? []).find((l) => l.id === locationId),
      setLocationId,
      currentId,
      geo,
      useCurrent: () => {
        if (currentId) setLocationId(currentId);
        else resolveCurrent(data ?? []);
      },
    }),
    [data, isLoading, locationId, currentId, geo, resolveCurrent],
  );

  return <LocationCtx.Provider value={value}>{children}</LocationCtx.Provider>;
}

export const useLocationStore = () => useContext(LocationCtx);
