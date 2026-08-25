import { cn } from "@/lib/utils";

export function EcoLogo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl border border-primary/40 bg-primary/10">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M6 2c0 5 12 5 12 10S6 17 6 22"
            stroke="var(--eco-emerald)"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M18 2c0 5-12 5-12 10s12 5 12 10"
            stroke="var(--eco-teal)"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <circle cx="12" cy="7" r="1.4" fill="var(--eco-lime)" />
          <circle cx="12" cy="17" r="1.4" fill="var(--eco-lime)" />
        </svg>
      </span>
      {showText && (
        <span className="font-display text-lg font-semibold tracking-tight">
          Eco<span className="gradient-text">DNA</span> AI
        </span>
      )}
    </span>
  );
}
