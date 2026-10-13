import { clamp, computeDnaScore, type Factors } from './scoring';
import { ecosystemBaseline, runEcosystemSimulation, type EcosystemState, type SimulationSettings } from './simulation';

export const VIRTUAL_PLACES = [
  { id: 'industrial', name: 'Industrial Area', description: 'Fixed virtual pollution-monitoring device', factors: { air: 78, water: 74, biodiversity: 58, waste: 25, weather: 80, greenCover: 52 } },
  { id: 'river', name: 'Amaravathi River', description: 'Virtual water-quality and pollution monitoring', factors: { air: 85, water: 82, biodiversity: 72, waste: 18, weather: 80, greenCover: 68 } },
  { id: 'rural', name: 'Green Rural Landscape', description: 'Virtual restoration and ecosystem recovery', factors: { air: 91, water: 86, biodiversity: 87, waste: 10, weather: 80, greenCover: 90 } },
] as const;
export type VirtualPlaceId = typeof VIRTUAL_PLACES[number]['id'];
export const VIRTUAL_SCENARIOS = [
  { id: 'normal', name: 'Normal conditions' },
  { id: 'pollution', name: 'Industrial pollution' },
  { id: 'rainfall', name: 'Heavy rainfall' },
  { id: 'restoration', name: 'Environmental restoration' },
] as const;
export type VirtualScenarioId = typeof VIRTUAL_SCENARIOS[number]['id'];
export const VIRTUAL_VERSION = 'eco-virtual-1.0';
export function virtualState(place: VirtualPlaceId, scenario: VirtualScenarioId, day: number): EcosystemState {
  const p = VIRTUAL_PLACES.find(p => p.id === place) ?? VIRTUAL_PLACES[0];
  const baseline = ecosystemBaseline({ ...p.factors }, 60);
  const t = clamp(day, 0, 90) / 90;
  if (scenario === 'restoration') return runEcosystemSimulation(baseline, { reforestation: 80, waterSupport: 70, pollutionReduction: 80, rainfall: 100, duration: 90 }, day);
  const impact = place === 'industrial' ? 1 : place === 'river' ? 0.85 : 0.55;
  const f: Factors = { ...baseline.factors };
  if (scenario === 'pollution') {
    f.air = clamp(f.air - 48 * t * impact); f.water = clamp(f.water - 42 * t * impact);
    f.biodiversity = clamp(f.biodiversity - 30 * t * impact); f.waste = clamp(f.waste + 45 * t * impact); f.greenCover = clamp(f.greenCover - 22 * t * impact);
  } else if (scenario === 'rainfall') {
    const storm = Math.sin(Math.PI * t);
    f.water = clamp(f.water - 32 * storm); f.weather = clamp(f.weather - 50 * storm);
    f.air = clamp(f.air + 5 * storm); f.greenCover = clamp(f.greenCover + 5 * t);
  } else {
    f.air = clamp(f.air + Math.sin(day / 8)); f.water = clamp(f.water + Math.sin(day / 10));
  }
  return { factors: f, score: computeDnaScore(f), soilMoisture: clamp(60 + (scenario === 'rainfall' ? 32 * Math.sin(Math.PI * t) : -10 * t)), waterAvailability: clamp(baseline.waterAvailability + (scenario === 'rainfall' ? 20 * t : -8 * t)) };
}
export function virtualMetrics(place: VirtualPlaceId, scenario: VirtualScenarioId, day: number, solution?: SimulationSettings) {
  const baseline = virtualState(place, 'normal', 0);
  const current = virtualState(place, scenario, day);
  const projected = solution ? runEcosystemSimulation(current, solution) : virtualState(place, scenario, Math.min(90, day + 30));
  const drift = current.score - baseline.score;
  const pressure = (100 - projected.factors.air + 100 - projected.factors.water + projected.factors.waste) / 3;
  const risk = Math.round(clamp(pressure));
  const recovery = Math.round(clamp((projected.score - current.score) / Math.max(1, 100 - current.score) * 100));
  return { baseline, current, projected, drift, risk, recovery };
}