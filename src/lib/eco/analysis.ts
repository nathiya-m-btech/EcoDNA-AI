import { computeDnaScore, sourcePressure } from "./scoring";
import {
  buildRecoveryPlan,
  detectHotspots,
  factorPressures,
  modelConfidence,
  predictionNarrative,
  projectScore,
  readingFactors,
  type Reading,
} from "./engine";

type Sb = { from: (t: string) => any };

export type AnalysedLocation = {
  id: string;
  location_name: string;
  latitude: number;
  longitude: number;
};

/**
 * Environmental AI pass for one location: reads its real ingested history,
 * regenerates hotspots, forecasts and the recovery plan from that data.
 */
export async function analyzeLocation(supabase: Sb, location: AnalysedLocation) {
  const { data: rows, error } = await supabase
    .from("environmental_data")
    .select("date, air_quality, water_quality, biodiversity, waste_level, temperature, humidity, rainfall, green_cover")
    .eq("location_id", location.id)
    .order("date", { ascending: true });
  if (error) throw new Error(error.message);

  const readings = (rows ?? []) as Reading[];
  if (readings.length === 0) return { locationId: location.id, skipped: true as const };

  const { data: srcRows } = await supabase
    .from("pollution_sources")
    .select("name, source_type, latitude, longitude, intensity")
    .eq("status", "active");
  const sources = (srcRows ?? []) as {
    name: string;
    source_type: string;
    latitude: number;
    longitude: number;
    intensity: number | null;
  }[];
  const pressure = sourcePressure(location, sources);

  const latest = readings[readings.length - 1]!;
  const factors = readingFactors(latest);
  const current = computeDnaScore(factors, pressure);
  const history = readings.map((r) => ({ date: r.date, score: computeDnaScore(readingFactors(r), pressure) }));


  const p30 = projectScore(history, 30);
  const p90 = projectScore(history, 90);
  const confidence = modelConfidence(history);
  const weakest = factorPressures(factors)[0]?.label ?? "Air quality";

  // Predictions — one live row per location.
  await supabase.from("ai_predictions").delete().eq("location_id", location.id);
  const { error: pe } = await supabase.from("ai_predictions").insert({
    location_id: location.id,
    current_score: current,
    predicted_score_30_days: p30,
    predicted_score_90_days: p90,
    confidence,
    prediction_summary: predictionNarrative(location.location_name, current, p30, p90, history.length, weakest),
  });
  if (pe) throw new Error(pe.message);

  // Hotspots derived from the latest live reading.
  await supabase.from("pollution_hotspots").delete().eq("location_id", location.id);
  const hotspots = detectHotspots(location, latest).map((h) => ({ ...h, location_id: location.id }));
  if (hotspots.length > 0) {
    const { error: he } = await supabase.from("pollution_hotspots").insert(hotspots);
    if (he) throw new Error(he.message);
  }

  // Recovery plan derived from real factor deficits.
  await supabase.from("recovery_actions").delete().eq("location_id", location.id);
  const plan = buildRecoveryPlan(factors).map((a) => ({ ...a, location_id: location.id }));
  if (plan.length > 0) {
    const { error: re } = await supabase.from("recovery_actions").insert(plan);
    if (re) throw new Error(re.message);
  }

  return {
    locationId: location.id,
    name: location.location_name,
    current,
    p30,
    p90,
    confidence,
    hotspots: hotspots.length,
    actions: plan.length,
    observations: history.length,
  };
}
