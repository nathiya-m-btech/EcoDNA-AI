import { clamp, computeDnaScore, type Factors } from './scoring';

/** Replaceable demonstration model, not a calibrated ecological forecast.
 * Inputs are normalized indices; resource units are illustrative per hectare.
 * Changes saturate over 180 days, with moisture limited by rainfall/support.
 * No inference of actual species counts, soil surveys, or water volume.
 */
export const SIMULATION_VERSION = 'eco-demo-1.0';
export type SimulationSettings = { reforestation: number; waterSupport: number; pollutionReduction: number; rainfall: number; duration: number };
export type EcosystemState = { factors: Factors; score: number; soilMoisture: number; waterAvailability: number };
export const DEFAULT_SETTINGS: SimulationSettings = { reforestation: 50, waterSupport: 40, pollutionReduction: 40, rainfall: 100, duration: 90 };
export function ecosystemBaseline(factors: Factors, humidity: number | null = null): EcosystemState {
  return { factors: { ...factors }, score: computeDnaScore(factors), soilMoisture: clamp(humidity ?? 50), waterAvailability: clamp(factors.water * 0.7 + 15) };
}
export function runEcosystemSimulation(base: EcosystemState, input: SimulationSettings, day = input.duration): EcosystemState {
  const t = 1 - Math.exp(-clamp(day, 0, 365) / 180);
  const forest = clamp(input.reforestation) / 100;
  const water = clamp(input.waterSupport) / 100;
  const pollution = clamp(input.pollutionReduction) / 100;
  const rain = (clamp(input.rainfall, 0, 200) - 100) / 100;
  const moisture = clamp(base.soilMoisture + t * (water * 34 + rain * 30 - forest * 9));
  const growth = forest * (0.35 + moisture / 100 * 0.65);
  const factors: Factors = {
    air: clamp(base.factors.air + t * (pollution * 30 + growth * 9)),
    water: clamp(base.factors.water + t * (water * 25 + pollution * 12 + rain * 8)),
    biodiversity: clamp(base.factors.biodiversity + t * (growth * 30 + water * 8 + rain * 5)),
    waste: clamp(base.factors.waste - t * pollution * 35),
    weather: base.factors.weather,
    greenCover: clamp(base.factors.greenCover + t * (growth * 38 + rain * 5)),
  };
  return { factors, score: computeDnaScore(factors), soilMoisture: moisture, waterAvailability: clamp(base.waterAvailability + t * (water * 32 + rain * 25 - growth * 6)) };
}
export function simulationResources(s: SimulationSettings) {
  return { seedlings: Math.round(s.reforestation * 10), water: Math.round(s.waterSupport * s.duration * 0.02), effort: Math.round((s.reforestation + s.waterSupport + s.pollutionReduction) * s.duration / 900) };
}
export const SCENARIOS: { name: string; settings: SimulationSettings; tradeoff: string }[] = [
  { name: 'Natural recovery', settings: { ...DEFAULT_SETTINGS, reforestation: 0, waterSupport: 0, pollutionReduction: 0 }, tradeoff: 'No intervention cost; no assumed improvement without changing environmental conditions.' },
  { name: 'Reforestation', settings: { ...DEFAULT_SETTINGS, reforestation: 80, waterSupport: 0, pollutionReduction: 20 }, tradeoff: 'Lower water demand, but vegetation growth remains moisture-limited.' },
  { name: 'Forest + water management', settings: { ...DEFAULT_SETTINGS, reforestation: 80, waterSupport: 70, pollutionReduction: 50 }, tradeoff: 'Stronger modeled recovery with higher water and maintenance requirements.' },
];
export const INDICATORS: { label: string; value: (s: EcosystemState) => number }[] = [
  { label: 'DNA score', value: s => s.score },
  { label: 'Vegetation', value: s => s.factors.greenCover },
  { label: 'Soil moisture proxy', value: s => s.soilMoisture },
  { label: 'Water availability proxy', value: s => s.waterAvailability },
  { label: 'Biodiversity', value: s => s.factors.biodiversity },
  { label: 'Pollution burden ↓', value: s => (100 - s.factors.air + s.factors.waste) / 2 },
];