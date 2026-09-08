export type Factors = {
  air: number;
  water: number;
  biodiversity: number;
  waste: number; // waste level (higher = worse)
  weather: number;
  greenCover: number;
};

/** Baseline importance of each factor before the live data reshapes it. */
export const FACTOR_WEIGHTS = {
  air: 0.22,
  water: 0.2,
  biodiversity: 0.18,
  waste: 0.15,
  weather: 0.1,
  greenCover: 0.15,
} as const;

export const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

export type SubIndices = {
  air: number;
  water: number;
  biodiversity: number;
  waste: number;
  weather: number;
  greenCover: number;
};

/** Convert raw factor measurements into 0-100 sub-indices (higher = healthier). */
export function subIndices(f: Factors): SubIndices {
  return {
    air: clamp(f.air),
    water: clamp(f.water),
    biodiversity: clamp(f.biodiversity),
    waste: clamp(100 - f.waste),
    weather: clamp(f.weather),
    greenCover: clamp(f.greenCover),
  };
}

/**
 * Data-driven weighting: the baseline weight of each factor is amplified by how
 * far that factor sits below a healthy target, then renormalised. A city whose
 * air is collapsing is scored mostly on its air, not on a fixed textbook ratio.
 */
export function dynamicWeights(sub: SubIndices): SubIndices {
  const raw = {} as SubIndices;
  let total = 0;
  (Object.keys(FACTOR_WEIGHTS) as (keyof SubIndices)[]).forEach((k) => {
    const stress = (100 - sub[k]) / 100; // 0 healthy → 1 critical
    const w = FACTOR_WEIGHTS[k] * (1 + stress * 1.2);
    raw[k] = w;
    total += w;
  });
  (Object.keys(raw) as (keyof SubIndices)[]).forEach((k) => {
    raw[k] = raw[k] / total;
  });
  return raw;
}

/**
 * Environmental DNA Score (0-100).
 * Composite index = 75% stress-weighted mean of the sub-indices + 25% limiting
 * factor (the worst sub-index), minus pressure from mapped local pollution
 * sources. The limiting-factor term stops one collapsed medium from being
 * averaged away by healthy ones.
 */
export function computeDnaScore(f: Factors, sourcePressure = 0): number {
  const sub = subIndices(f);
  const w = dynamicWeights(sub);
  const keys = Object.keys(sub) as (keyof SubIndices)[];
  const weighted = keys.reduce((a, k) => a + sub[k] * w[k], 0);
  const limiting = Math.min(...keys.map((k) => sub[k]));
  const composite = weighted * 0.75 + limiting * 0.25;
  return Math.round(clamp(composite - clamp(sourcePressure, 0, 20)));
}

/**
 * Pressure (0-20 score points) from mapped local pollution sources, weighted by
 * declared intensity, source type and distance from the monitored location.
 */
export const SOURCE_IMPACT: Record<string, number> = {
  factory: 1,
  industry: 1,
  traffic: 0.8,
  waste: 0.9,
  landfill: 0.95,
  construction: 0.6,
  quarry: 0.7,
  sewage: 0.85,
  agriculture: 0.5,
  other: 0.5,
};

export function sourcePressure(
  location: { latitude: number; longitude: number },
  sources: { latitude: number; longitude: number; intensity: number | null; source_type: string }[],
): number {
  let total = 0;
  for (const s of sources) {
    const dLat = (s.latitude - location.latitude) * 111;
    const dLon = (s.longitude - location.longitude) * 111 * Math.cos((location.latitude * Math.PI) / 180);
    const km = Math.sqrt(dLat * dLat + dLon * dLon);
    if (km > 25) continue;
    const decay = 1 / (1 + (km / 6) ** 2);
    const impact = SOURCE_IMPACT[s.source_type.toLowerCase()] ?? 0.5;
    total += ((s.intensity ?? 50) / 100) * impact * decay * 6;
  }
  return clamp(total, 0, 20);
}


/** Weather stability index derived from temperature, humidity and rainfall. */
export function weatherStability(temperature = 30, humidity = 60, rainfall = 12): number {
  const tempScore = 100 - Math.abs(temperature - 27) * 4;
  const humScore = 100 - Math.abs(humidity - 62) * 1.4;
  const rainScore = 55 + Math.min(rainfall, 30) * 1.5;
  return Math.round(clamp(tempScore * 0.4 + humScore * 0.3 + rainScore * 0.3));
}

export type StatusKey = "excellent" | "good" | "moderate" | "poor" | "critical";

export function scoreStatus(score: number): { key: StatusKey; label: string; color: string } {
  if (score >= 85) return { key: "excellent", label: "EXCELLENT", color: "var(--eco-lime)" };
  if (score >= 70) return { key: "good", label: "GOOD", color: "var(--eco-emerald)" };
  if (score >= 55) return { key: "moderate", label: "MODERATE", color: "var(--risk-medium)" };
  if (score >= 40) return { key: "poor", label: "NEEDS IMPROVEMENT", color: "var(--risk-medium)" };
  return { key: "critical", label: "CRITICAL", color: "var(--risk-high)" };
}

export function riskColor(level: string): string {
  const l = level.toLowerCase();
  if (l.includes("high") || l === "critical") return "var(--risk-high)";
  if (l.includes("medium")) return "var(--risk-medium)";
  if (l.includes("recover")) return "var(--eco-teal)";
  if (l.includes("healthy")) return "var(--eco-emerald)";
  return "var(--risk-low)";
}

/** Simple AI-style forecast: momentum of recent trend, damped over the horizon. */
export function forecast(series: number[], days: number): number {
  if (series.length === 0) return 0;
  const last = series[series.length - 1]!;
  if (series.length < 2) return Math.round(last);
  const window = series.slice(-4);
  const slope = (window[window.length - 1]! - window[0]!) / Math.max(window.length - 1, 1);
  const damp = days <= 30 ? 1 : 1.8;
  return Math.round(clamp(last + slope * damp));
}

export function predictionConfidence(series: number[]): number {
  if (series.length < 3) return 78;
  const diffs = series.slice(1).map((v, i) => v - series[i]!);
  const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const variance = diffs.reduce((a, b) => a + (b - mean) ** 2, 0) / diffs.length;
  return Math.round(clamp(96 - Math.sqrt(variance) * 4, 68, 97));
}

/** Recovery model — each lever contributes weighted points to the DNA score. */
export const RECOVERY_LEVERS = [
  { key: "greenCover", label: "Green Cover", max: 14 },
  { key: "wasteReduction", label: "Waste Reduction", max: 10 },
  { key: "waterTreatment", label: "Water Treatment", max: 12 },
  { key: "pollutionControl", label: "Pollution Control", max: 13 },
  { key: "rainwaterRecharge", label: "Rainwater Recharge", max: 7 },
] as const;

export type LeverKey = (typeof RECOVERY_LEVERS)[number]["key"];

export function simulateRecovery(base: Factors, levers: Record<LeverKey, number>) {
  const f: Factors = {
    air: clamp(base.air + levers.pollutionControl * 0.22 + levers.greenCover * 0.08),
    water: clamp(base.water + levers.waterTreatment * 0.26 + levers.rainwaterRecharge * 0.12),
    biodiversity: clamp(base.biodiversity + levers.greenCover * 0.18 + levers.waterTreatment * 0.05),
    waste: clamp(base.waste - levers.wasteReduction * 0.32),
    weather: clamp(base.weather + levers.greenCover * 0.05 + levers.rainwaterRecharge * 0.08),
    greenCover: clamp(base.greenCover + levers.greenCover * 0.34),
  };
  return { factors: f, score: computeDnaScore(f) };
}
