import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LocationRow = {
  id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  region: string | null;
};

export type ScoreRow = {
  id: string;
  location_id: string;
  date: string;
  environmental_dna_score: number;
  air_score: number | null;
  water_score: number | null;
  biodiversity_score: number | null;
  waste_score: number | null;
  weather_score: number | null;
  green_cover_score: number | null;
};

export type EnvDataRow = {
  id: string;
  location_id: string;
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

export type HotspotRow = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  pollution_level: string;
  risk_level: string;
  detected_factor: string | null;
  environmental_score: number | null;
  recommended_action: string | null;
  status: string;
  detected_at: string;
};

export type PredictionRow = {
  id: string;
  location_id: string;
  current_score: number | null;
  predicted_score_30_days: number | null;
  predicted_score_90_days: number | null;
  confidence: number | null;
  prediction_summary: string | null;
};

export type RecoveryRow = {
  id: string;
  location_id: string;
  action_name: string;
  action_type: string | null;
  current_score: number | null;
  predicted_score: number | null;
  expected_improvement: number | null;
  recommendation: string | null;
  status: string;
};

export type AlertRow = {
  id: string;
  location_id: string | null;
  alert_type: string;
  severity: string;
  message: string;
  factor: string | null;
  recommendation: string | null;
  detected_at: string;
  status: string;
};
export type SourceRow = {
  id: string;
  location_id: string | null;
  name: string;
  source_type: string;
  latitude: number;
  longitude: number;
  intensity: number | null;
  notes: string | null;
  status: string;
  created_at: string;
};

const table = (name: string) => supabase.from(name as never);

export function useSources() {
  return useQuery({
    queryKey: ["sources"],
    queryFn: async () => {
      const { data, error } = await table("pollution_sources").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SourceRow[];
    },
  });
}


export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const { data, error } = await table("locations").select("*").order("location_name");
      if (error) throw error;
      return (data ?? []) as unknown as LocationRow[];
    },
  });
}

export function useScores(locationId?: string) {
  return useQuery({
    queryKey: ["scores", locationId ?? "all"],
    queryFn: async () => {
      let q = table("environmental_scores").select("*").order("date");
      if (locationId) q = q.eq("location_id", locationId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ScoreRow[];
    },
  });
}

export function useEnvData(locationId?: string) {
  return useQuery({
    queryKey: ["env-data", locationId ?? "all"],
    queryFn: async () => {
      let q = table("environmental_data").select("*").order("date", { ascending: false });
      if (locationId) q = q.eq("location_id", locationId);
      const { data, error } = await q.limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as EnvDataRow[];
    },
  });
}

export function useHotspots() {
  return useQuery({
    queryKey: ["hotspots"],
    queryFn: async () => {
      const { data, error } = await table("pollution_hotspots")
        .select("*")
        .order("environmental_score");
      if (error) throw error;
      return (data ?? []) as unknown as HotspotRow[];
    },
  });
}

export function usePrediction(locationId?: string) {
  return useQuery({
    queryKey: ["prediction", locationId ?? "all"],
    queryFn: async () => {
      let q = table("ai_predictions").select("*").order("prediction_date", { ascending: false });
      if (locationId) q = q.eq("location_id", locationId);
      const { data, error } = await q.limit(1);
      if (error) throw error;
      return ((data ?? [])[0] ?? null) as unknown as PredictionRow | null;
    },
  });
}

export function useRecoveryActions(locationId?: string) {
  return useQuery({
    queryKey: ["recovery", locationId ?? "all"],
    queryFn: async () => {
      let q = table("recovery_actions").select("*").order("expected_improvement", {
        ascending: false,
      });
      if (locationId) q = q.eq("location_id", locationId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as RecoveryRow[];
    },
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const { data, error } = await table("alerts")
        .select("*")
        .order("detected_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AlertRow[];
    },
  });
}
