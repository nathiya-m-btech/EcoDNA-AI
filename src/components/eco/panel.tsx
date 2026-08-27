import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("glass glass-hover animate-rise rounded-3xl p-5 sm:p-6", className)}>
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-display text-base font-semibold sm:text-lg">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "emerald",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: "emerald" | "teal" | "lime" | "amber" | "red";
}) {
  const toneVar: Record<string, string> = {
    emerald: "var(--eco-emerald)",
    teal: "var(--eco-teal)",
    lime: "var(--eco-lime)",
    amber: "var(--risk-medium)",
    red: "var(--risk-high)",
  };
  return (
    <div className="glass glass-hover animate-rise relative overflow-hidden rounded-2xl p-4 sm:p-5">
      <div
        className="absolute -right-8 -top-10 h-24 w-24 rounded-full opacity-20 blur-2xl"
        style={{ background: toneVar[tone] }}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        {icon && (
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-secondary/60" style={{ color: toneVar[tone] }}>
            {icon}
          </span>
        )}
      </div>
      <p className="font-display mt-3 text-2xl font-semibold sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
