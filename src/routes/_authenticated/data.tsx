import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Database, FileUp, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/eco/app-shell";
import { Panel, StatCard } from "@/components/eco/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useLocationStore } from "@/lib/eco/location-store";
import { useEnvData } from "@/lib/eco/queries";

export const Route = createFileRoute("/_authenticated/data")({
  head: () => ({
    meta: [
      { title: "Data Management — EcoDNA AI" },
      { name: "description", content: "Upload, validate and manage environmental datasets feeding the DNA engine." },
      { property: "og:title", content: "Data Management — EcoDNA AI" },
      { property: "og:description", content: "Bring your own environmental datasets." },
    ],
  }),
  component: DataPage,
});

const REQUIRED = ["date", "air_quality", "water_quality", "biodiversity", "waste_level"] as const;
const OPTIONAL = ["temperature", "humidity", "rainfall", "green_cover"] as const;

type ParsedRow = Record<string, string>;

function parseCsv(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""])) as ParsedRow;
  });
  return { headers, rows };
}

function DataPage() {
  const { location, locationId } = useLocationStore();
  const { data: existing } = useEnvData(locationId);
  const qc = useQueryClient();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const onFile = async (file: File) => {
    const text = await file.text();
    const { headers, rows: parsed } = parseCsv(text);
    const issues: string[] = [];
    for (const col of REQUIRED) if (!headers.includes(col)) issues.push(`Missing required column: ${col}`);
    parsed.forEach((r, i) => {
      for (const col of REQUIRED) {
        if (col === "date") {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(r[col] ?? "")) issues.push(`Row ${i + 1}: invalid date "${r[col]}"`);
        } else {
          const n = Number(r[col]);
          if (Number.isNaN(n) || n < 0 || n > 100) issues.push(`Row ${i + 1}: ${col} must be 0-100`);
        }
      }
    });
    setRows(parsed);
    setErrors(issues.slice(0, 12));
    toast[issues.length ? "error" : "success"](
      issues.length ? `${issues.length} validation issue(s) found` : `${parsed.length} rows validated successfully`,
    );
  };

  const commit = async () => {
    if (!locationId) return toast.error("Select a location first");
    setSaving(true);
    const payload = rows.map((r) => ({
      location_id: locationId,
      date: r.date,
      air_quality: Number(r.air_quality),
      water_quality: Number(r.water_quality),
      biodiversity: Number(r.biodiversity),
      waste_level: Number(r.waste_level),
      temperature: r.temperature ? Number(r.temperature) : null,
      humidity: r.humidity ? Number(r.humidity) : null,
      rainfall: r.rainfall ? Number(r.rainfall) : null,
      green_cover: r.green_cover ? Number(r.green_cover) : null,
    }));
    const { error } = await supabase.from("environmental_data" as never).insert(payload as never);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Imported ${payload.length} readings`);
    setRows([]);
    setErrors([]);
    await qc.invalidateQueries({ queryKey: ["env-data"] });
  };

  return (
    <AppShell title="Data Management" subtitle="Upload and validate environmental datasets">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Stored readings" value={existing?.length ?? 0} icon={<Database className="h-4 w-4" />} />
        <StatCard label="Staged rows" value={rows.length} tone="teal" icon={<FileUp className="h-4 w-4" />} />
        <StatCard
          label="Validation"
          value={rows.length === 0 ? "Idle" : errors.length ? "Failed" : "Passed"}
          tone={rows.length === 0 ? "emerald" : errors.length ? "red" : "lime"}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Upload CSV" subtitle={location ? `Target: ${location.location_name}` : "Select a location"}>
          <Label htmlFor="csv" className="text-xs text-muted-foreground">
            CSV file
          </Label>
          <Input
            id="csv"
            type="file"
            accept=".csv,text/csv"
            className="mt-2"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
          <div className="mt-4 rounded-2xl border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
            <p className="text-foreground">Required columns</p>
            <p className="mt-1">{REQUIRED.join(", ")}</p>
            <p className="mt-2 text-foreground">Optional columns</p>
            <p className="mt-1">{OPTIONAL.join(", ")}</p>
          </div>
          <Button className="mt-4 w-full" disabled={!rows.length || !!errors.length || saving} onClick={commit}>
            {saving ? "Importing…" : `Import ${rows.length} rows`}
          </Button>
        </Panel>

        <Panel className="lg:col-span-2" title="Validation report" subtitle="Schema and range checks">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Upload a CSV to run validation.</p>
          ) : errors.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4" /> All {rows.length} rows passed validation.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {errors.map((e, i) => (
                <li key={i} className="flex items-start gap-2 text-destructive">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> {e}
                </li>
              ))}
            </ul>
          )}

          {rows.length > 0 && (
            <div className="mt-4 max-h-[280px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {REQUIRED.map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 25).map((r, i) => (
                    <TableRow key={i}>
                      {REQUIRED.map((h) => (
                        <TableCell key={h}>{r[h]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
