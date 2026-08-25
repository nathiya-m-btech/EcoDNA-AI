import { cn } from "@/lib/utils";

/** DNA-inspired environmental identity visualization. Each rung encodes one factor. */
export function DnaHelix({
  values,
  className,
  height = 320,
}: {
  values: { label: string; value: number }[];
  className?: string;
  height?: number;
}) {
  const rungs = 16;
  const width = 220;

  return (
    <div className={cn("relative", className)} style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="helix-a" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--eco-emerald)" />
            <stop offset="100%" stopColor="var(--eco-teal)" />
          </linearGradient>
          <linearGradient id="helix-b" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--eco-lime)" />
            <stop offset="100%" stopColor="var(--eco-emerald)" />
          </linearGradient>
        </defs>
        {[0, 1].map((strand) => {
          const pts = Array.from({ length: 60 }, (_, i) => {
            const t = i / 59;
            const y = t * height;
            const x = width / 2 + Math.sin(t * Math.PI * 3 + strand * Math.PI) * (width / 2 - 24);
            return `${x},${y}`;
          }).join(" ");
          return (
            <polyline
              key={strand}
              points={pts}
              fill="none"
              stroke={strand === 0 ? "url(#helix-a)" : "url(#helix-b)"}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.9"
            />
          );
        })}
        {Array.from({ length: rungs }, (_, i) => {
          const t = i / (rungs - 1);
          const y = t * height;
          const x1 = width / 2 + Math.sin(t * Math.PI * 3) * (width / 2 - 24);
          const x2 = width / 2 + Math.sin(t * Math.PI * 3 + Math.PI) * (width / 2 - 24);
          const v = values[i % Math.max(values.length, 1)]?.value ?? 60;
          const color =
            v >= 80 ? "var(--eco-lime)" : v >= 65 ? "var(--eco-emerald)" : v >= 50 ? "var(--risk-medium)" : "var(--risk-high)";
          return (
            <g key={i}>
              <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth="1.6" opacity="0.45" />
              <circle cx={x1} cy={y} r="3.2" fill={color} />
              <circle cx={x2} cy={y} r="3.2" fill={color} opacity="0.7" />
            </g>
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/10 to-transparent" />
    </div>
  );
}
