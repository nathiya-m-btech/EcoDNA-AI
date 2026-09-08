import { useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  Database,
  Dna,
  Factory,

  Gauge,
  History,
  LogOut,
  Map as MapIcon,
  Menu,
  Satellite,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { EcoLogo } from "./logo";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useLocationStore } from "@/lib/eco/location-store";
import { useAuthUser } from "@/lib/eco/use-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/dna", label: "Eco DNA Profile", icon: Dna },
  { to: "/hotspots", label: "Hotspot Map", icon: MapIcon },
  { to: "/sources", label: "Pollution Sources", icon: Factory },

  { to: "/predictions", label: "AI Predictions", icon: Brain },
  { to: "/recovery", label: "Recovery Simulator", icon: Sparkles },
  { to: "/history", label: "Historical Trends", icon: History },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle },
  { to: "/insights", label: "AI Insights", icon: Activity },
  { to: "/ingestion", label: "Live Data", icon: Satellite },
  { to: "/data", label: "Data Management", icon: Database },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { locations, locationId, setLocationId } = useLocationStore();
  const { user } = useAuthUser();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[268px] shrink-0 border-r border-border bg-sidebar/95 backdrop-blur-xl transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link to="/">
            <EcoLogo />
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="mt-2 flex h-[calc(100vh-8rem)] flex-col gap-1 overflow-y-auto px-3 pb-6">
          {NAV.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-primary/15 text-foreground shadow-[inset_0_0_0_1px_oklch(0.74_0.19_152/35%)]"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <item.icon className={cn("h-4 w-4", active && "text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-3 bottom-3 rounded-xl border border-border bg-secondary/50 p-3">
          <p className="truncate text-xs text-muted-foreground">{user?.email ?? "Guest analyst"}</p>
          <button
            onClick={signOut}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs hover:border-primary/50 hover:text-primary"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="font-display truncate text-lg font-semibold sm:text-xl">{title}</h1>
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <Select value={locationId ?? ""} onValueChange={setLocationId}>
              <SelectTrigger className="w-[190px] rounded-xl border-border bg-secondary/60">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.location_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
