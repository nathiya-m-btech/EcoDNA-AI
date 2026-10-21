import { virtualMetrics, type VirtualPlaceId } from './virtual-model';
import { runEcosystemSimulation } from './simulation';

export const INTRO_DURATION = 30;
export const INTRO_PHASES = ['Monitor', 'Detect change', 'Predict risk', 'Simulate solutions', 'Measure recovery'] as const;
export function introductionState(place: VirtualPlaceId, elapsed: number) {
  const phase = Math.min(4, Math.floor(Math.max(0, elapsed) / 6));
  const polluted = virtualMetrics(place, 'pollution', 70);
  const current = phase < 3
    ? virtualMetrics(place, 'pollution', Math.min(70, Math.max(0, elapsed) / 18 * 70)).current
    : runEcosystemSimulation(polluted.current, { reforestation: 80, waterSupport: 70, pollutionReduction: 80, rainfall: 100, duration: 90 }, Math.min(90, (elapsed - 18) / 12 * 90));
  const metrics = virtualMetrics(place, 'pollution', phase < 3 ? Math.min(70, elapsed / 18 * 70) : 70);
  const recovery = Math.round(Math.max(0, (current.score - polluted.current.score) / Math.max(1, 100 - polluted.current.score) * 100));
  return { phase, current, drift: current.score - metrics.baseline.score, risk: phase < 3 ? metrics.risk : Math.round((100 - current.factors.air + 100 - current.factors.water + current.factors.waste) / 3), recovery };
}