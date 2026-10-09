import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Database, FileUp, CheckCircle2, XCircle, Radio } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/eco/app-shell";
import { Panel, StatCard } from "@/components/eco/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { SENSOR_AIR, SENSOR_WATER, SENSOR_WEATHER, sensorRows, type SensorReading } from "@/lib/eco/sensors";
import { runEnvironmentalAI } from "@/lib/eco/live-data.functions";

export const Route = createFileRoute("/_authenticated/data")({
  head: () => ({
    meta: [
      { title: "Data Management — EcoDNA AI" },
      { name: "description", content: "Upload processed datasets or raw sensor readings and feed them to the environmental DNA engine." },
      { property: "og:title", content: "Data Management — EcoDNA AI" },
      { property: "og:description", content: "Bring your own environmental datasets and sensor feeds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DataPage,
});

const REQUIRED = ["date", "air_quality", "water_quality", "biodiversity", "waste_level"] as const;
const OPTIONAL = ["temperature", "humidity", "rainfall", "green_cover"] as const;
const SENSOR_COLS = [...SENSOR_AIR, ...SENSOR_WATER, ...SENSOR_WEATHER] as readonly string[];

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
  const analyse = useServerFn(runEnvironmentalAI);

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [sensorRowsParsed, setSensorRowsParsed] = useState<ParsedRow[]>([]);
  const [sensorCols, setSensorCols] = useState<string[]>([]);
  const [sensorErrors, setSensorErrors] = useState<string[]>([]);
  const [sensorSaving, setSensorSaving] = useState(false);

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

  const onSensorFile = async (file: File) => {
    const text = await file.text();
    const { headers, rows: parsed } = parseCsv(text);
    const issues: string[] = [];
    if (!headers.includes("date")) issues.push("Missing required column: date");
    const present = headers.filter((h) => SENSOR_COLS.includes(h));
    if (present.length === 0) issues.push(`No recognised sensor columns. Use any of: ${SENSOR_COLS.join(", ")}`);
    parsed.forEach((r, i) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(r["date"] ?? "")) issues.push(`Row ${i + 1}: invalid date "${r["date"]}"`);
      for (const col of present) {
        const raw = r[col];
        if (raw === undefined || raw === "") continue;
        const n = Number(raw);
        if (Number.isNaN(n) || n < 0) issues.push(`Row ${i + 1}: ${col} must be a positive number`);
      }
    });
    setSensorRowsParsed(parsed);
    setSensorCols(present);
    setSensorErrors(issues.slice(0, 12));
    toast[issues.length ? "error" : "success"](
      issues.length
        ? `${issues.length} sensor validation issue(s) found`
        : `${parsed.length} sensor readings validated (${present.length} channels)`,
    );
  };

  const commit = async () => {
    if (!locationId) {
      toast.error("Select a location first");
      return;
    }
    setSaving(true);
    const payload = rows.map((r) => ({
      location_id: locationId,
      date: r["date"],
      air_quality: Number(r["air_quality"]),
      water_quality: Number(r["water_quality"]),
      biodiversity: Number(r["biodiversity"]),
      waste_level: Number(r["waste_level"]),
      temperature: r["temperature"] ? Number(r["temperature"]) : null,
      humidity: r["humidity"] ? Number(r["humidity"]) : null,
      rainfall: r["rainfall"] ? Number(r["rainfall"]) : null,
      green_cover: r["green_cover"] ? Number(r["green_cover"]) : null,
    }));
    const { error } = await supabase.from("environmental_data" as never).insert(payload as never);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Imported ${payload.length} readings`);
    setRows([]);
    setErrors([]);
    await qc.invalidateQueries({ queryKey: ["env-data"] });
  };

  const commitSensors = async () => {
    if (!locationId) {
      toast.error("Select a location first");
      return;
    }
    setSensorSaving(true);
    const num = (v?: string) => (v === undefined || v === "" ? undefined : Number(v));
    const built = sensorRowsParsed.map((r) => {
      const reading: SensorReading = { date: r["date"] ?? "" };
      for (const col of sensorCols) {
        const v = num(r[col]);
        if (v !== undefined) (reading as Record<string, unknown>)[col] = v;
      }
      return sensorRows(locationId, reading);
    });

    const dates = built.map((b) => b.data.date);
    for (const table of ["environmental_data", "environmental_scores", "historical_data"] as const) {
      await supabase.from(table as never).delete().eq("location_id", locationId).in("date", dates);
    }

    const e1 = (await supabase.from("environmental_data" as never).insert(built.map((b) => b.data) as never)).error;
    const e2 = (await supabase.from("environmental_scores" as never).insert(built.map((b) => b.scores) as never)).error;
    await supabase.from("historical_data" as never).insert(built.map((b) => b.history) as never);

    if (e1 || e2) {
      setSensorSaving(false);
      toast.error((e1 ?? e2)!.message);
      return;
    }

    try {
      await analyse({ data: { locationId } });
    } catch {
      toast.message("Readings saved; AI re-analysis will run on the next sync.");
    }
    setSensorSaving(false);
    toast.success(`Ingested ${built.length} sensor readings and re-ran the environmental AI`);
    setSensorRowsParsed([]);
    setSensorCols([]);
    setSensorErrors([]);
    await qc.invalidateQueries();
  };

  const preview = sensorRowsParsed.slice(0, 8).map((r) => {
    const reading: SensorReading = { date: r["date"] ?? "" };
    for (const col of sensorCols) {
      const v = r[col];
      if (v) (reading as Record<string, unknown>)[col] = Number(v);
    }
    return { date: reading.date, ...sensorRows(locationId ?? "preview", reading) };
  });

  return (
    <AppShell title="Data Management" subtitle="Upload processed datasets or raw sensor readings">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Stored readings" value={existing?.length ?? 0} icon={<Database className="h-4 w-4" />} />
        <StatCard
          label="Staged rows"
          value={rows.length + sensorRowsParsed.length}
          tone="teal"
          icon={<FileUp className="h-4 w-4" />}
        />
        <StatCard
          label="Validation"
          value={
            rows.length + sensorRowsParsed.length === 0
              ? "Idle"
              : errors.length + sensorErrors.length
                ? "Failed"
                : "Passed"
          }
          tone={
            rows.length + sensorRowsParsed.length === 0
              ? "emerald"
              : errors.length + sensorErrors.length
                ? "red"
                : "lime"
          }
        />
      </div>

      <Tabs defaultValue="sensor" className="mt-4">
        <TabsList>
          <TabsTrigger value="sensor">Sensor feed</TabsTrigger>
          <TabsTrigger value="scores">Processed scores</TabsTrigger>
        </TabsList>

        <TabsContent value="sensor" className="mt-4 grid gap-4 lg:grid-cols-3">
          <Panel
            title="Upload sensor readings"
            subtitle={location ? `Target: ${location.location_name}` : "Select a location"}
          >
            <Label htmlFor="sensor-csv" className="text-xs text-muted-foreground">
              Raw sensor CSV (µg/m³, mg/L, NTU, °C, %, mm)
            </Label>
            <Input
              id="sensor-csv"
              type="file"
              accept=".csv,text/csv"
              className="mt-2"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onSensorFile(f);
              }}
            />
            <div className="mt-4 space-y-2 rounded-2xl border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
              <p className="text-foreground">Required</p>
              <p>date (YYYY-MM-DD)</p>
              <p className="text-foreground">Air channels</p>
              <p>{SENSOR_AIR.join(", ")}</p>
              <p className="text-foreground">Water channels</p>
              <p>{SENSOR_WATER.join(", ")}</p>
              <p className="text-foreground">Weather / land</p>
              <p>{SENSOR_WEATHER.join(", ")}</p>
              <p className="pt-1">Raw values are converted with EPA AQI and water-quality models, then scored and re-analysed by the AI.</p>
            </div>
            <Button
              className="mt-4 w-full"
              disabled={!sensorRowsParsed.length || !!sensorErrors.length || sensorSaving}
              onClick={commitSensors}
            >
              <Radio className="mr-2 h-4 w-4" />
              {sensorSaving ? "Ingesting…" : `Ingest ${sensorRowsParsed.length} readings`}
            </Button>
          </Panel>

          <Panel className="lg:col-span-2" title="Sensor conversion preview" subtitle="Raw channels → DNA factors">
            {sensorRowsParsed.length === 0 ? (
              <p className="text-sm text-muted-foreground">Upload a sensor CSV to see the derived environmental factors.</p>
            ) : sensorErrors.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {sensorErrors.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-destructive">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> {e}
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <p className="flex items-center gap-2 text-sm text-primary">
                  <CheckCircle2 className="h-4 w-4" /> {sensorRowsParsed.length} readings across {sensorCols.length} channels.
                </p>
                <div className="mt-4 max-h-[300px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>date</TableHead>
                        <TableHead>AQI</TableHead>
                        <TableHead>air</TableHead>
                        <TableHead>water</TableHead>
                        <TableHead>biodiversity</TableHead>
                        <TableHead>waste</TableHead>
                        <TableHead>DNA</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell>{p.date}</TableCell>
                          <TableCell>{p.aqi}</TableCell>
                          <TableCell>{p.data.air_quality}</TableCell>
                          <TableCell>{p.data.water_quality}</TableCell>
                          <TableCell>{p.data.biodiversity}</TableCell>
                          <TableCell>{p.data.waste_level}</TableCell>
                          <TableCell className="text-primary">{p.score}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="scores" className="mt-4 grid gap-4 lg:grid-cols-3">
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
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
