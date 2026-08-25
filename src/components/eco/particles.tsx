import { useMemo } from "react";
import { cn } from "@/lib/utils";

export function Particles({ count = 26, className }: { count?: number; className?: string }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: (i * 37.5) % 100,
        top: (i * 61.3) % 100,
        size: 2 + ((i * 7) % 4),
        delay: (i % 9) * 0.7,
        duration: 7 + ((i * 3) % 7),
        teal: i % 3 === 0,
      })),
    [count],
  );

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {dots.map((d, i) => (
        <span
          key={i}
          className="animate-float absolute rounded-full"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            background: d.teal ? "var(--eco-teal)" : "var(--eco-emerald)",
            boxShadow: `0 0 12px ${d.teal ? "var(--eco-teal)" : "var(--eco-emerald)"}`,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
            opacity: 0.5,
          }}
        />
      ))}
    </div>
  );
}
