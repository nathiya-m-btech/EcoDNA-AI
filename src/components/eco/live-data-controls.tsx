import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MapPin, RefreshCw, Satellite } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createLocationFromCoords, syncLiveData } from "@/lib/eco/live-data.functions";
import { useLocationStore } from "@/lib/eco/location-store";

function useRefreshAll() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}

export function LiveDataControls() {
  const { locationId, location, setLocationId } = useLocationStore();
  const sync = useServerFn(syncLiveData);
  const createLocation = useServerFn(createLocationFromCoords);
  const refresh = useRefreshAll();

  const [syncing, setSyncing] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", latitude: "", longitude: "", region: "" });

  const runSync = async (all: boolean) => {
    setSyncing(true);
    try {
      const res = await sync({ data: all || !locationId ? {} : { locationId } });
      toast.success(`Live data synced for ${res.synced} location${res.synced === 1 ? "" : "s"}`);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Live sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    if (!form.name.trim() || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      toast.error("Enter a name plus valid latitude and longitude");
      return;
    }
    setSaving(true);
    try {
      const res = await createLocation({
        data: {
          name: form.name.trim(),
          latitude,
          longitude,
          ...(form.region.trim() ? { region: form.region.trim() } : {}),
        },
      });
      toast.success(`${res.location.location_name} added with live readings`);
      setLocationId(res.location.id);
      setForm({ name: "", latitude: "", longitude: "", region: "" });
      setOpen(false);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add location");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" className="rounded-xl" disabled={syncing} onClick={() => runSync(false)}>
        {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
        Sync live data{location ? ` · ${location.location_name}` : ""}
      </Button>
      <Button variant="ghost" size="sm" className="rounded-xl" disabled={syncing} onClick={() => runSync(true)}>
        <Satellite className="mr-2 h-4 w-4" />
        Sync all
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="rounded-xl">
            <MapPin className="mr-2 h-4 w-4" />
            Add location
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a monitored location</DialogTitle>
            <DialogDescription>
              Enter coordinates — live air quality, weather and satellite-derived vegetation signals are ingested
              immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loc-name">Location name</Label>
              <Input
                id="loc-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ooty"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="loc-lat">Latitude</Label>
                <Input
                  id="loc-lat"
                  inputMode="decimal"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  placeholder="11.4102"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loc-lng">Longitude</Label>
                <Input
                  id="loc-lng"
                  inputMode="decimal"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  placeholder="76.6950"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc-region">Region (optional)</Label>
              <Input
                id="loc-region"
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                placeholder="Tamil Nadu"
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="rounded-xl" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add and ingest live data
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
