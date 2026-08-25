import { cn } from "@/lib/utils";
import { scoreStatus } from "@/lib/eco/scoring";
import { useCountUp } from "./count-up";

export function ScoreRing({
  score,
  size = 220,
  stroke = 14,
  label,
  className,
  compact = false,
}: {
  score: number;
  size?: number;
  stroke?: number;
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  const animated = useCountUp(score, 1500);
  const status = scoreStatus(score);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (animated / 100) * c;
  const id = `ring-${Math.round(size)}-${Math.round(score)}`;

  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={status.color} />
            <stop offset="100%" stopColor="var(--eco-teal)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="stroke-border/70"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          stroke={`url(#${id})`}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          fill="none"
          style={{ filter: "drop-shadow(0 0 10px oklch(0.74 0.19 152 / 45%))" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div
            className={cn("font-display font-semibold leading-none", compact ? "text-2xl" : "text-5xl")}
          >
            {Math.round(animated)}
          </div>
          <div className={cn("text-muted-foreground", compact ? "text-[10px]" : "text-xs mt-1")}>
            /100
          </div>
          {!compact && (
            <div
              className="mt-2 text-xs font-semibold tracking-[0.18em]"
              style={{ color: status.color }}
            >
              {label ?? status.label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
