import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axis = {
  stroke: "oklch(0.74 0.032 158)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  contentStyle: {
    background: "oklch(0.23 0.034 166)",
    border: "1px solid oklch(0.38 0.045 167 / 55%)",
    borderRadius: 14,
    fontSize: 12,
    color: "oklch(0.95 0.012 150)",
  },
  labelStyle: { color: "oklch(0.8 0.03 158)" },
} as const;

const fmtDate = (d: string) => (d?.length >= 10 ? d.slice(5) : d);

export function ScoreAreaChart({
  data,
  height = 280,
}: {
  data: { date: string; score: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="area-score" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--eco-emerald)" stopOpacity={0.55} />
            <stop offset="100%" stopColor="var(--eco-emerald)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 6" stroke="oklch(0.4 0.05 165 / 25%)" vertical={false} />
        <XAxis dataKey="date" tickFormatter={fmtDate} {...axis} />
        <YAxis domain={[0, 100]} {...axis} />
        <Tooltip {...tooltipStyle} />
        <Area
          type="monotone"
          dataKey="score"
          stroke="var(--eco-emerald)"
          strokeWidth={2.5}
          fill="url(#area-score)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function FactorLineChart({
  data,
  height = 300,
}: {
  data: { date: string; air: number; water: number; biodiversity: number; waste: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 6" stroke="oklch(0.4 0.05 165 / 25%)" vertical={false} />
        <XAxis dataKey="date" tickFormatter={fmtDate} {...axis} />
        <YAxis domain={[0, 100]} {...axis} />
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="air" stroke="var(--chart-1)" strokeWidth={2} dot={false} name="Air" />
        <Line type="monotone" dataKey="water" stroke="var(--chart-2)" strokeWidth={2} dot={false} name="Water" />
        <Line
          type="monotone"
          dataKey="biodiversity"
          stroke="var(--chart-3)"
          strokeWidth={2}
          dot={false}
          name="Biodiversity"
        />
        <Line type="monotone" dataKey="waste" stroke="var(--chart-4)" strokeWidth={2} dot={false} name="Waste" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function FactorRadar({
  data,
  height = 300,
}: {
  data: { factor: string; value: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="oklch(0.4 0.05 165 / 35%)" />
        <PolarAngleAxis dataKey="factor" tick={{ fill: "oklch(0.78 0.03 158)", fontSize: 11 }} />
        <Radar
          dataKey="value"
          stroke="var(--eco-emerald)"
          fill="var(--eco-emerald)"
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Tooltip {...tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function ComparisonBars({
  data,
  height = 300,
}: {
  data: { name: string; score: number }[];
  height?: number;
}) {
  const color = (v: number) =>
    v >= 80 ? "var(--eco-lime)" : v >= 65 ? "var(--eco-emerald)" : v >= 50 ? "var(--risk-medium)" : "var(--risk-high)";
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 6" stroke="oklch(0.4 0.05 165 / 25%)" vertical={false} />
        <XAxis dataKey="name" {...axis} interval={0} angle={-12} height={44} textAnchor="end" />
        <YAxis domain={[0, 100]} {...axis} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "oklch(0.4 0.05 165 / 12%)" }} />
        <Bar dataKey="score" radius={[8, 8, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={color(d.score)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
