import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocations, type LocationRow } from "./queries";

type Ctx = {
  locations: LocationRow[];
  loading: boolean;
  locationId: string | undefined;
  location: LocationRow | undefined;
  setLocationId: (id: string) => void;
};

const LocationCtx = createContext<Ctx>({
  locations: [],
  loading: true,
  locationId: undefined,
  location: undefined,
  setLocationId: () => {},
});

export function LocationProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useLocations();
  const [locationId, setLocationId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!locationId && data && data.length > 0) setLocationId(data[0]!.id);
  }, [data, locationId]);

  const value = useMemo<Ctx>(
    () => ({
      locations: data ?? [],
      loading: isLoading,
      locationId,
      location: (data ?? []).find((l) => l.id === locationId),
      setLocationId,
    }),
    [data, isLoading, locationId],
  );

  return <LocationCtx.Provider value={value}>{children}</LocationCtx.Provider>;
}

export const useLocationStore = () => useContext(LocationCtx);
