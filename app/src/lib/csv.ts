// CSV import for controller program data.
// Parsing logic ported directly from the prototype config.jsx → CsvImporter,
// kept forgiving about day formats: "MWF", "M;W;F", "Mon,Wed", full names.

import type { DayCode, Programs, Zone } from "../types";
import { DAYS } from "./constants";

export interface CsvUpdate {
  id: number;
  name?: string;
  programs?: Programs;
}

export interface CsvResult {
  ok: boolean;
  count?: number;
  total?: number;
  errors?: string[];
  message?: string;
}

export function parseDays(s: string | undefined): DayCode[] {
  if (!s) return [];
  const tokens = s.replace(/\s+/g, "").split(/[,;|]/).filter(Boolean);
  const valid = new Set<string>(DAYS);
  const out: DayCode[] = [];
  if (tokens.length === 1 && tokens[0].length > 2) {
    // compact like MWF — split on capitals
    const compact = tokens[0].match(/[A-Z][a-z]?/g) || [];
    compact.forEach((t) => {
      if (valid.has(t)) out.push(t as DayCode);
    });
  } else {
    const map: Record<string, string> = {
      Sun: "Su", Mon: "M", Tue: "Tu", Wed: "W", Thu: "Th", Fri: "F", Sat: "Sa", S: "Sa",
    };
    tokens.forEach((t) => {
      const norm = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
      const v = map[norm] || norm;
      if (valid.has(v)) out.push(v as DayCode);
    });
  }
  return [...new Set(out)];
}

type ProgCol = Partial<Record<"runtime" | "min" | "minutes" | "days" | "enabled" | "on", number>>;

export function parseCsv(text: string, zones: Zone[]): { updates: CsvUpdate[]; result: CsvResult } {
  try {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) throw new Error("CSV has no data rows");

    const header = lines[0]
      .split(",")
      .map((h) => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""));
    const idIdx = header.findIndex(
      (h) => h === "zone" || h === "id" || h === "zone_id" || h === "zoneid"
    );
    const nameIdx = header.findIndex((h) => h === "name" || h === "zone_name");
    if (idIdx === -1) throw new Error('Missing required "zone" or "id" column');

    const progCols: Record<"A" | "B" | "C" | "D", ProgCol> = { A: {}, B: {}, C: {}, D: {} };
    header.forEach((h, i) => {
      const m = h.match(/^([abcd])_?(runtime|min|minutes|days|enabled|on)$/);
      if (m) {
        const key = m[1].toUpperCase() as "A" | "B" | "C" | "D";
        (progCols[key] as Record<string, number>)[m[2]] = i;
      }
    });

    const updates: CsvUpdate[] = [];
    const errors: string[] = [];
    for (let li = 1; li < lines.length; li++) {
      const row = lines[li].split(",").map((c) => c.trim());
      const num = parseInt(row[idIdx], 10);
      if (!num) {
        errors.push(`Row ${li + 1}: invalid zone number`);
        continue;
      }
      // CSV "zone" column is the per-controller position (1..N); match within
      // the controller's zones, then key the update by the real zone id.
      const zone = zones.find((z) => z.num === num);
      if (!zone) {
        errors.push(`Row ${li + 1}: zone ${num} not found`);
        continue;
      }
      const patch: CsvUpdate = { id: zone.id };
      if (nameIdx !== -1 && row[nameIdx]) patch.name = row[nameIdx];
      const programs: Programs = JSON.parse(JSON.stringify(zone.programs));
      (["A", "B", "C", "D"] as const).forEach((k) => {
        const c = progCols[k];
        if (!c) return;
        const rt =
          c.runtime != null ? parseInt(row[c.runtime], 10) :
          c.min != null ? parseInt(row[c.min], 10) :
          c.minutes != null ? parseInt(row[c.minutes], 10) : null;
        const ds = c.days != null ? parseDays(row[c.days]) : null;
        const en =
          c.enabled != null ? /^(1|true|yes|on)$/i.test(row[c.enabled]) :
          c.on != null ? /^(1|true|yes|on)$/i.test(row[c.on]) : null;
        if (rt != null && !isNaN(rt)) {
          programs[k].runtime = rt;
          if (rt > 0) programs[k].enabled = true;
        }
        if (ds != null) {
          programs[k].days = ds;
          if (ds.length > 0) programs[k].enabled = true;
        }
        if (en != null) programs[k].enabled = en;
      });
      patch.programs = programs;
      updates.push(patch);
    }
    return {
      updates,
      result: { ok: true, count: updates.length, errors, total: lines.length - 1 },
    };
  } catch (err) {
    return { updates: [], result: { ok: false, message: (err as Error).message } };
  }
}

/** Build a sample CSV from the first 3 zones (the "Download template" action). */
export function buildTemplate(zones: Zone[]): string {
  const sample = zones
    .slice(0, 3)
    .map((z) => {
      const A = z.programs.A;
      const B = z.programs.B;
      return [z.num, `"${z.name}"`, A.runtime, A.days.join(";"), B.runtime, B.days.join(";")].join(",");
    })
    .join("\n");
  return "zone,name,A_runtime,A_days,B_runtime,B_days\n" + sample;
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
