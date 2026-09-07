import { clamp, computeDnaScore, weatherStability } from "./scoring";

/**
 * Raw sensor reading as produced by field hardware / lab sheets.
 * Concentrations are in the usual monitoring units (µg/m³, ppm, mg/L, NTU, °C, %, mm).
 */
export type SensorReading = {
  date: string;
  pm2_5?: number;
  pm10?: number;
  no2?: number;
  so2?: number;
  o3?: number;
  co?: number;
  ph?: number;
  turbidity?: number;
  dissolved_oxygen?: number;
  tds?: number;
  temperature?: number;
  humidity?: number;
  rainfall?: number;
  green_cover?: number;
};

export const SENSOR_REQUIRED = ["date"] as const;
export const SENSOR_AIR = ["pm2_5", "pm10", "no2", "so2", "o3", "co"] as const;
export const SENSOR_WATER = ["ph", "turbidity", "dissolved_oxygen", "tds"] as const;
export const SENSOR_WEATHER = ["temperature", "humidity", "rainfall", "green_cover"] as const;

/** US EPA AQI from a PM2.5 concentration (µg/m³). */
export function aqiFromPm25(pm25: number): number {
  const bp: [number, number, number, number][] = [
    [0, 12, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 500.4, 301, 500],
  ];
  for (const [cl, ch, il, ih] of bp) {
    if (pm25 <= ch) return Math.round(((ih - il) / (ch - cl)) * (pm25 - cl) + il);
  }
  return 500;
}

/** Convert a raw sensor reading into the platform's 0-100 environmental factors. */
export function sensorToFactors(r: SensorReading) {
  const pm25 = r.pm2_5 ?? 0;
  const pm10 = r.pm10 ?? pm25 * 1.8;
  const aqi = aqiFromPm25(pm25);
  const gasPenalty = (r.no2 ?? 0) * 0.25 + (r.so2 ?? 0) * 0.4 + Math.max(0, (r.o3 ?? 0) - 60) * 0.2 + (r.co ?? 0) * 0.5;
  const air = clamp(100 - aqi * 0.45 - gasPenalty);

  // Water: penalise pH drift from neutral, turbidity and dissolved solids; reward oxygen.
  const phPenalty = r.ph === undefined ? 0 : Math.abs(r.ph - 7.2) * 9;
  const turbPenalty = (r.turbidity ?? 0) * 1.6;
  const tdsPenalty = Math.max(0, (r.tds ?? 0) - 500) * 0.03;
  const doBonus = r.dissolved_oxygen === undefined ? 0 : (Math.min(r.dissolved_oxygen, 10) - 5) * 4;
  const water = clamp(88 - phPenalty - turbPenalty - tdsPenalty + doBonus);

  const waste = clamp(pm25 * 1.1 + pm10 * 0.45 + Math.max(0, aqi - 50) * 0.25);
  const greenCover = r.green_cover ?? clamp(38 + (r.rainfall ?? 0) * 0.5);
  const biodiversity = clamp(greenCover * 0.55 + air * 0.35 - Math.max(0, (r.o3 ?? 0) - 60) * 0.25 + 6);
  const weather = weatherStability(r.temperature ?? 28, r.humidity ?? 60, r.rainfall ?? 10);

  return { air, water, biodiversity, waste, greenCover, weather, aqi };
}

const round = (n: number, d = 1) => Number(n.toFixed(d));

/** Rows ready to insert into environmental_data / environmental_scores / historical_data. */
export function sensorRows(locationId: string, r: SensorReading) {
  const f = sensorToFactors(r);
  const score = computeDnaScore({
    air: f.air,
    water: f.water,
    biodiversity: f.biodiversity,
    waste: f.waste,
    weather: f.weather,
    greenCover: f.greenCover,
  });
  const data = {
    location_id: locationId,
    date: r.date,
    air_quality: round(f.air),
    water_quality: round(f.water),
    biodiversity: round(f.biodiversity),
    waste_level: round(f.waste),
    temperature: r.temperature ?? null,
    humidity: r.humidity ?? null,
    rainfall: r.rainfall ?? null,
    green_cover: round(f.greenCover),
  };
  const scores = {
    location_id: locationId,
    date: r.date,
    environmental_dna_score: score,
    air_score: round(f.air),
    water_score: round(f.water),
    biodiversity_score: round(f.biodiversity),
    waste_score: round(clamp(100 - f.waste)),
    weather_score: f.weather,
    green_cover_score: round(f.greenCover),
  };
  const history = {
    location_id: locationId,
    date: r.date,
    environmental_score: score,
    air_quality: round(f.air),
    water_quality: round(f.water),
    biodiversity: round(f.biodiversity),
    waste_level: round(f.waste),
    green_cover: round(f.greenCover),
  };
  return { data, scores, history, score, aqi: f.aqi };
}
