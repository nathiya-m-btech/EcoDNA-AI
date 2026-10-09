import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/eco/app-shell";
import { Panel } from "@/components/eco/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthUser } from "@/lib/eco/use-auth";
import { useLocationStore } from "@/lib/eco/location-store";
import { FACTOR_WEIGHTS } from "@/lib/eco/scoring";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — EcoDNA AI" },
      { name: "description", content: "Account details, monitored locations and scoring model configuration." },
      { property: "og:title", content: "Settings — EcoDNA AI" },
      { property: "og:description", content: "Manage your EcoDNA workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuthUser();
  const { locations, locationId, setLocationId } = useLocationStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <AppShell title="Settings" subtitle="Account, locations and model configuration">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Account" subtitle="Your EcoDNA identity">
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input className="mt-1.5" value={user?.email ?? ""} readOnly />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">User ID</Label>
              <Input className="mt-1.5 font-mono text-xs" value={user?.id ?? ""} readOnly />
            </div>
            <Button variant="outline" className="w-full" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </Panel>

        <Panel title="Scoring model" subtitle="Weights used by the Environmental DNA engine">
          <ul className="space-y-2 text-sm">
            {Object.entries(FACTOR_WEIGHTS).map(([k, v]) => (
              <li key={k} className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-3 py-2">
                <span className="capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                <Badge variant="outline">{Math.round(v * 100)}%</Badge>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="lg:col-span-2" title="Monitored locations" subtitle="Choose the default analysis target">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {locations.map((l) => (
              <button
                key={l.id}
                onClick={() => setLocationId(l.id)}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  l.id === locationId ? "border-primary/60 bg-primary/10" : "border-border bg-secondary/40 hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-semibold">{l.location_name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{l.region ?? "—"}</p>
                <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                  {l.latitude.toFixed(3)}, {l.longitude.toFixed(3)}
                </p>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
