import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { analyzeLocation } from "@/lib/eco/analysis";

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const round = (n: number, d = 1) => Number(n.toFixed(d));

type LiveReading = {
  date: string;
  air_quality: number;
  water_quality: number;
  biodiversity: number;
  waste_level: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  green_cover: number;
  us_aqi: number;
};

/** Pull live air-quality, weather and satellite-derived vegetation signals for a coordinate. */
async function fetchLive(latitude: number, longitude: number): Promise<LiveReading> {
  const aqUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}` +
    `&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,sulphur_dioxide,us_aqi&timezone=auto`;
  const wxUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,soil_moisture_0_to_1cm` +
    `&daily=precipitation_sum&past_days=7&forecast_days=1&timezone=auto`;

  const [aqRes, wxRes] = await Promise.all([fetch(aqUrl), fetch(wxUrl)]);
  if (!aqRes.ok || !wxRes.ok) throw new Error("Live environmental data provider is unavailable right now.");
  const aq = (await aqRes.json()) as {
    current: Record<string, number> & { time: string };
  };
  const wx = (await wxRes.json()) as {
    current: Record<string, number> & { time: string };
    daily: { precipitation_sum: number[] };
  };

  const pm25 = aq.current["pm2_5"] ?? 0;
  const pm10 = aq.current["pm10"] ?? 0;
  const no2 = aq.current["nitrogen_dioxide"] ?? 0;
  const so2 = aq.current["sulphur_dioxide"] ?? 0;
  const o3 = aq.current["ozone"] ?? 0;
  const usAqi = aq.current["us_aqi"] ?? 0;

  const temperature = wx.current["temperature_2m"] ?? 28;
  const humidity = wx.current["relative_humidity_2m"] ?? 60;
  const soil = wx.current["soil_moisture_0_to_1cm"] ?? 0.15;
  const weekRain = (wx.daily.precipitation_sum ?? []).slice(0, 8).reduce((a, b) => a + (b ?? 0), 0);

  // Air quality index inverted from US AQI (0 = hazardous, 100 = pristine).
  const air = clamp(100 - usAqi * 0.45);

  // Satellite-derived vegetation proxy: surface soil moisture + weekly rainfall.
  const greenCover = clamp(soil * 220 + Math.min(weekRain, 60) * 0.55 + 18);

  // Water quality: rainfall recharge minus deposition load from SO2/NO2 and particulates.
  const water = clamp(72 + Math.min(weekRain, 50) * 0.45 - so2 * 0.9 - no2 * 0.35 - pm10 * 0.12);

  // Biodiversity pressure model from vegetation, air and ozone stress.
  const biodiversity = clamp(greenCover * 0.55 + air * 0.35 - Math.max(0, o3 - 60) * 0.25 + 6);

  // Waste / particulate burden (higher = worse).
  const waste = clamp(pm25 * 1.1 + pm10 * 0.45 + Math.max(0, usAqi - 50) * 0.25);

  return {
    date: (wx.current.time ?? new Date().toISOString()).slice(0, 10),
    air_quality: round(air),
    water_quality: round(water),
    biodiversity: round(biodiversity),
    waste_level: round(waste),
    temperature: round(temperature),
    humidity: round(humidity),
    rainfall: round(weekRain),
    green_cover: round(greenCover),
    us_aqi: Math.round(usAqi),
  };
}

const weatherStability = (t: number, h: number, r: number) =>
  clamp((100 - Math.abs(t - 27) * 4) * 0.4 + (100 - Math.abs(h - 62) * 1.4) * 0.3 + (55 + Math.min(r, 30) * 1.5) * 0.3);

const dnaScore = (r: LiveReading) =>
  Math.round(
    clamp(
      r.air_quality * 0.22 +
        r.water_quality * 0.2 +
        r.biodiversity * 0.18 +
        clamp(100 - r.waste_level) * 0.15 +
        weatherStability(r.temperature, r.humidity, r.rainfall) * 0.1 +
        r.green_cover * 0.15,
    ),
  );

type Sb = { from: (t: string) => any };

async function ingest(supabase: Sb, location: { id: string; location_name: string; latitude: number; longitude: number }) {
  const reading = await fetchLive(location.latitude, location.longitude);
  const score = dnaScore(reading);
  const weather = Math.round(weatherStability(reading.temperature, reading.humidity, reading.rainfall));

  await supabase.from("environmental_data").delete().eq("location_id", location.id).eq("date", reading.date);
  const { error: e1 } = await supabase.from("environmental_data").insert({
    location_id: location.id,
    date: reading.date,
    air_quality: reading.air_quality,
    water_quality: reading.water_quality,
    biodiversity: reading.biodiversity,
    waste_level: reading.waste_level,
    temperature: reading.temperature,
    humidity: reading.humidity,
    rainfall: reading.rainfall,
    green_cover: reading.green_cover,
  });
  if (e1) throw new Error(e1.message);

  await supabase.from("environmental_scores").delete().eq("location_id", location.id).eq("date", reading.date);
  const { error: e2 } = await supabase.from("environmental_scores").insert({
    location_id: location.id,
    date: reading.date,
    environmental_dna_score: score,
    air_score: reading.air_quality,
    water_score: reading.water_quality,
    biodiversity_score: reading.biodiversity,
    waste_score: clamp(100 - reading.waste_level),
    weather_score: weather,
    green_cover_score: reading.green_cover,
  });
  if (e2) throw new Error(e2.message);

  await supabase.from("historical_data").delete().eq("location_id", location.id).eq("date", reading.date);
  await supabase.from("historical_data").insert({
    location_id: location.id,
    date: reading.date,
    environmental_score: score,
    air_quality: reading.air_quality,
    water_quality: reading.water_quality,
    biodiversity: reading.biodiversity,
    waste_level: reading.waste_level,
    green_cover: reading.green_cover,
  });

  if (reading.us_aqi >= 100 || score < 55) {
    await supabase.from("alerts").insert({
      location_id: location.id,
      alert_type: reading.us_aqi >= 100 ? "Air quality exceedance" : "Environmental DNA decline",
      severity: score < 40 || reading.us_aqi >= 150 ? "high" : "medium",
      message: `${location.location_name}: live US AQI ${reading.us_aqi}, DNA score ${score}.`,
      factor: reading.us_aqi >= 100 ? "Air quality" : "Composite",
      recommendation:
        reading.us_aqi >= 100
          ? "Restrict combustion sources and intensify dust suppression in the affected zone."
          : "Prioritise green cover expansion and waste collection in the affected zone.",
    });
  }

  return { ...reading, locationId: location.id, name: location.location_name, score };
}

/** Refresh live readings for one location, or every location when no id is given. */
export const syncLiveData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ locationId: z.string().uuid().optional() }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase.from("locations").select("id, location_name, latitude, longitude");
    if (data.locationId) q = q.eq("id", data.locationId);
    const { data: locations, error } = await q;
    if (error) throw new Error(error.message);

    const results = [];
    const analyses = [];
    for (const loc of (locations ?? []) as any[]) {
      results.push(await ingest(supabase as unknown as Sb, loc));
      analyses.push(await analyzeLocation(supabase as unknown as Sb, loc));
    }
    return { synced: results.length, results, analyses };
  });

/** Create a monitored location from coordinates and immediately ingest live data for it. */
export const createLocationFromCoords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(80),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        region: z.string().trim().max(80).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: inserted, error } = await supabase
      .from("locations")
      .insert({
        location_name: data.name,
        latitude: data.latitude,
        longitude: data.longitude,
        region: data.region ?? null,
      })
      .select("id, location_name, latitude, longitude")
      .single();
    if (error) throw new Error(error.message);

    const result = await ingest(supabase as unknown as Sb, inserted as any);
    const analysis = await analyzeLocation(supabase as unknown as Sb, inserted as any);
    return { location: inserted, reading: result, analysis };
  });

/** Re-run the environmental AI (hotspots, forecasts, recovery plan) over stored live data. */
export const runEnvironmentalAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ locationId: z.string().uuid().optional() }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase.from("locations").select("id, location_name, latitude, longitude");
    if (data.locationId) q = q.eq("id", data.locationId);
    const { data: locations, error } = await q;
    if (error) throw new Error(error.message);

    const analyses = [];
    for (const loc of (locations ?? []) as any[]) {
      analyses.push(await analyzeLocation(supabase as unknown as Sb, loc));
    }
    return { analysed: analyses.length, analyses };
  });
