import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { VIRTUAL_PLACES, virtualMetrics, type VirtualPlaceId, type VirtualScenarioId } from './virtual-model';

function useVirtualState() {
  const [placeId, setPlaceId] = useState<VirtualPlaceId>('industrial');
  const [scenario, setScenario] = useState<VirtualScenarioId>('normal');
  const [day, setDay] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setDay(d => Math.min(90, d + 1)), 120);
    return () => clearInterval(timer);
  }, [playing]);
  useEffect(() => { if (day >= 90) setPlaying(false); }, [day]);
  const choosePlace = (id: VirtualPlaceId) => { setPlaceId(id); setDay(0); setPlaying(false); };
  const chooseScenario = (id: VirtualScenarioId) => { setScenario(id); setDay(0); setPlaying(false); };
  return { placeId, place: VIRTUAL_PLACES.find(p => p.id === placeId) ?? VIRTUAL_PLACES[0], choosePlace, scenario, chooseScenario, day, setDay, playing, setPlaying, metrics: useMemo(() => virtualMetrics(placeId, scenario, day), [placeId, scenario, day]) };
}
const VirtualContext = createContext<ReturnType<typeof useVirtualState> | null>(null);
export function VirtualProvider({ children }: { children: ReactNode }) { const value = useVirtualState(); return <VirtualContext.Provider value={value}>{children}</VirtualContext.Provider>; }
export function useVirtualSimulation() { const context = useContext(VirtualContext); if (!context) throw new Error('VirtualProvider is required'); return context; }