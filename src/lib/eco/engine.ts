import { clamp, computeDnaScore, weatherStability, type Factors } from "./scoring";

export type Reading = {
  date: string;
  air_quality: number;
  water_quality: number;
  biodiversity: number;
  waste_level: number;
  temperature: number | null;
  humidity: number | null;
  rainfall: number | null;
  green_cover: number | null;
};

export function readingFactors(r: Reading): Factors {
  return {
    air: r.air_quality,
    water: r.water_quality,
    biodiversity: r.biodiversity,
    waste: r.waste_level,
    weather: weatherStability(r.temperature ?? 28, r.humidity ?? 60, r.rainfall ?? 10),
    greenCover: r.green_cover ?? 50,
  };
}

/** Ordinary least squares slope/intercept over an evenly spaced series. */
export function linearTrend(series: number[]): { slope: number; intercept: number; r2: number } {
  const n = series.length;
  if (n < 2) return { slope: 0, intercept: series[0] ?? 0, r2: 0 };
  const xs = series.map((_, i) => i);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = series.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i]! - mx) * (series[i]! - my);
    den += (xs[i]! - mx) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = my - slope * mx;
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const pred = intercept + slope * xs[i]!;
    ssRes += (series[i]! - pred) ** 2;
    ssTot += (series[i]! - my) ** 2;
  }
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);
  return { slope, intercept, r2 };
}

/**
 * Forecast the DNA score from real historical observations.
 * Uses a regression trend damped by mean reversion toward the historical mean —
 * environmental systems rarely extrapolate linearly for a full quarter.
 */
export function projectScore(history: { date: string; score: number }[], horizonDays: number): number {
  if (history.length === 0) return 0;
  const scores = history.map((h) => h.score);
  const last = scores[scores.length - 1]!;
  if (scores.length < 2) return Math.round(last);

  const spanDays = Math.max(
    1,
    (Date.parse(history[history.length - 1]!.date) - Date.parse(history[0]!.date)) / 86_400_000,
  );
  const { slope } = linearTrend(scores);
  const perDay = (slope * (scores.length - 1)) / spanDays;

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  // Damping: trend confidence decays with horizon, reversion pulls toward the mean.
  const trendWeight = 1 - Math.exp(-horizonDays / 45);
  // Cap plausible movement: real environmental systems shift slowly, and a short
  // observed series must not extrapolate into an implausible collapse or recovery.
  const maxMove = 4 + (horizonDays / 30) * 6;
  const rawDrift = perDay * horizonDays * (1 - trendWeight * 0.55);
  const drift = Math.max(-maxMove, Math.min(maxMove, rawDrift));
  const reversion = (mean - last) * 0.18 * trendWeight;
  return Math.round(clamp(last + drift + reversion));
}

/** Confidence from fit quality, sample size and volatility of the real series. */
export function modelConfidence(history: { score: number }[]): number {
  const scores = history.map((h) => h.score);
  if (scores.length < 2) return 55;
  const { r2 } = linearTrend(scores);
  const diffs = scores.slice(1).map((v, i) => v - scores[i]!);
  const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const sd = Math.sqrt(diffs.reduce((a, b) => a + (b - mean) ** 2, 0) / diffs.length);
  const sample = Math.min(1, scores.length / 14);
  return Math.round(clamp(45 + r2 * 25 + sample * 25 - sd * 2.5, 40, 96));
}

export type FactorPressure = { key: keyof Factors; label: string; value: number; deficit: number };

/** Rank factors by how far each sits below a healthy target — the real driver of risk. */
export function factorPressures(f: Factors): FactorPressure[] {
  const list: FactorPressure[] = [
    { key: "air", label: "Air quality", value: f.air, deficit: 100 - f.air },
    { key: "water", label: "Water quality", value: f.water, deficit: 100 - f.water },
    { key: "biodiversity", label: "Biodiversity", value: f.biodiversity, deficit: 100 - f.biodiversity },
    { key: "waste", label: "Waste burden", value: f.waste, deficit: f.waste },
    { key: "greenCover", label: "Green cover", value: f.greenCover, deficit: 100 - f.greenCover },
    { key: "weather", label: "Weather stability", value: f.weather, deficit: 100 - f.weather },
  ];
  return list.sort((a, b) => b.deficit - a.deficit);
}

export type DetectedHotspot = {
  name: string;
  latitude: number;
  longitude: number;
  pollution_level: string;
  risk_level: string;
  detected_factor: string;
  environmental_score: number;
  recommended_action: string;
};

const ACTION: Record<string, string> = {
  air: "Restrict combustion and construction dust sources; deploy roadside particulate barriers and street washing.",
  water: "Audit effluent discharge points and add wetland/biofiltration treatment before the receiving water body.",
  biodiversity: "Restore native vegetation corridors and protect remaining habitat fragments from encroachment.",
  waste: "Increase collection frequency, close open dumping sites and add segregation at source.",
  greenCover: "Plant native canopy species along the worst-affected wards and protect existing tree cover.",
  weather: "Add shade canopy and rainwater recharge structures to buffer heat and rainfall extremes.",
};

/** Derive hotspot zones for a location from its most recent live readings. */
export function detectHotspots(
  location: { location_name: string; latitude: number; longitude: number },
  reading: Reading,
): DetectedHotspot[] {
  const f = readingFactors(reading);
  const score = computeDnaScore(f);
  const pressures = factorPressures(f).filter((p) => p.deficit >= 35 && p.key !== "weather");
  if (pressures.length === 0) return [];

  // Offset each detected zone slightly so distinct stressors are distinguishable on the map.
  return pressures.slice(0, 3).map((p, i) => {
    const angle = (i * 2 * Math.PI) / 3;
    const zoneScore = Math.round(clamp(score - p.deficit * 0.25));
    const risk = zoneScore < 45 ? "High" : zoneScore < 62 ? "Medium" : "Recovering";
    const pollution = p.deficit >= 60 ? "Severe" : p.deficit >= 45 ? "High" : "Moderate";
    return {
      name: `${location.location_name} — ${p.label}`,
      latitude: Number((location.latitude + Math.cos(angle) * 0.045).toFixed(6)),
      longitude: Number((location.longitude + Math.sin(angle) * 0.045).toFixed(6)),
      pollution_level: pollution,
      risk_level: risk,
      detected_factor: p.label,
      environmental_score: zoneScore,
      recommended_action: ACTION[p.key] ?? "Investigate the dominant local stressor.",
    };
  });
}

export type RecoveryPlanItem = {
  action_name: string;
  action_type: string;
  current_score: number;
  predicted_score: number;
  expected_improvement: number;
  recommendation: string;
};

/** Build a prioritised recovery plan from the real factor deficits of a location. */
export function buildRecoveryPlan(factors: Factors): RecoveryPlanItem[] {
  const score = computeDnaScore(factors);
  const weights: Record<string, { type: string; name: string; gain: number }> = {
    air: { type: "Pollution control", name: "Emission & dust control programme", gain: 0.22 },
    water: { type: "Water treatment", name: "Effluent treatment and wetland buffer", gain: 0.2 },
    biodiversity: { type: "Habitat restoration", name: "Native habitat corridor restoration", gain: 0.18 },
    waste: { type: "Waste management", name: "Segregated collection & dump remediation", gain: 0.15 },
    greenCover: { type: "Afforestation", name: "Urban canopy expansion drive", gain: 0.15 },
    weather: { type: "Climate resilience", name: "Rainwater recharge & shade network", gain: 0.1 },
  };

  return factorPressures(factors)
    .filter((p) => p.deficit >= 20)
    .slice(0, 5)
    .map((p) => {
      const meta = weights[p.key]!;
      const improvement = Math.round(clamp(p.deficit * 0.4 * meta.gain * 2.2, 1, 18));
      return {
        action_name: meta.name,
        action_type: meta.type,
        current_score: score,
        predicted_score: Math.round(clamp(score + improvement)),
        expected_improvement: improvement,
        recommendation: `${p.label} sits at ${Math.round(p.value)} (deficit ${Math.round(p.deficit)}). ${
          ACTION[p.key] ?? ""
        }`,
      };
    });
}

export function predictionNarrative(
  name: string,
  current: number,
  p30: number,
  p90: number,
  observations: number,
  weakest: string,
): string {
  const dir = p90 - current;
  const trend = dir >= 2 ? "improving" : dir <= -2 ? "degrading" : "broadly stable";
  return `Modelled on ${observations} live observation${observations === 1 ? "" : "s"}, ${name} is ${trend}: the DNA score moves from ${current} to ${p30} in 30 days and ${p90} in 90 days. ${weakest} is the dominant limiting factor and drives most of the projected change.`;
}
