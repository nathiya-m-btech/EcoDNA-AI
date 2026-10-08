import { useMemo } from "react";
import { useEnvData, useScores, type EnvDataRow, type ScoreRow } from "./queries";
import { computeDnaScore, weatherStability, type Factors } from "./scoring";

export function factorsFromRow(row: EnvDataRow): Factors {
  return {
    air: row.air_quality,
    water: row.water_quality,
    biodiversity: row.biodiversity,
    waste: row.waste_level,
    weather: weatherStability(row.temperature ?? 30, row.humidity ?? 60, row.rainfall ?? 12),
    greenCover: row.green_cover ?? 55,
  };
}

export type LocationInsight = {
  latest: EnvDataRow | undefined;
  factors: Factors | undefined;
  score: number;
  series: { date: string; score: number; air: number; water: number; biodiversity: number; waste: number }[];
  rows: EnvDataRow[];
  scores: ScoreRow[];
  loading: boolean;
};

export function useLocationInsight(locationId?: string): LocationInsight {
  const { data: env, isLoading: l1 } = useEnvData(locationId);
  const { data: scores, isLoading: l2 } = useScores(locationId);

  return useMemo(() => {
    const rows = [...(env ?? [])].sort((a, b) => a.date.localeCompare(b.date));
    const latest = rows[rows.length - 1];
    const factors = latest ? factorsFromRow(latest) : undefined;
    const series = rows.map((r) => ({
      date: r.date,
      score: computeDnaScore(factorsFromRow(r)),
      air: r.air_quality,
      water: r.water_quality,
      biodiversity: r.biodiversity,
      waste: r.waste_level,
    }));
    return {
      latest,
      factors,
      score: factors ? computeDnaScore(factors) : 0,
      series,
      scores: scores ?? [],
      loading: l1 || l2,
    };
  }, [env, scores, l1, l2]);
}
