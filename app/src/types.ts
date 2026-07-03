// SSC Wet Check — core data model.
// Field names mirror the design handoff (README "Data Model") so the
// prototype and production stay cross-referenceable.

export type DayCode = "Su" | "M" | "Tu" | "W" | "Th" | "F" | "Sa";

export type ProgramKey = "A" | "B" | "C" | "D";

export type ZoneStatus = "pending" | "pass" | "issues" | "skip";

export type Severity = "fix" | "watch" | "ok";

/** A single watering program (A–D) on the controller. */
export interface Program {
  enabled: boolean;
  runtime: number; // minutes
  days: DayCode[];
}

export type Programs = Record<ProgramKey, Program>;

/** One logged issue. Many per zone. */
export interface Issue {
  t: string; // type label, e.g. "Broken head"
  n: number; // count
  sev: Severity;
  note?: string;
  photoIds?: string[];
}

/** A proposed change to one program, captured during inspection. */
export interface Adjustment {
  runtime: number;
  days: DayCode[];
  reason: string;
}

/** Only present for programs the tech actually changed. */
export type AdjustmentSet = Partial<Record<ProgramKey, Adjustment>>;

export type TriState = "ok" | "watch" | "fix" | null;
export type ActivationState = "yes" | "no" | "skip" | null;

/** Observations the tech records while inspecting a zone. */
export interface Observations {
  activates: ActivationState;
  psi: number;
  runtimeObserved: number;
  gpm: number;
  coverage: TriState; // Uniform / Minor / Adjust
  drainage: TriState; // Healthy / Dry / Pooling
  note: string;
}

export interface Zone {
  id: number; // globally-unique key across ALL controllers (do not display)
  num: number; // 1-indexed position WITHIN its controller; displayed "01".."60"
  siteId: string; // the controller this zone belongs to
  name: string;
  sprinkler: string; // head type
  plant: string;
  runtime: number; // baseline programmed minutes (legacy single value)
  psi: number; // expected/last pressure
  gpm: number; // expected/last flow
  status: ZoneStatus;
  programs: Programs;
  issues: Issue[];
  adjustments: AdjustmentSet | null;
  observations: Observations;
  photoIds: string[];
}

export interface Controller {
  make: string;
  model: string;
  program: string; // active program label, e.g. "B (Spring)"
  zones: number;
}

export interface DeviceStatus {
  value: string;
  ok: boolean;
}

// A "Site" is one controller job: its own zones, progress, photos and report.
// Many controllers can exist; they are grouped/searched by `location`.
export interface Site {
  id: string;
  name: string;
  code: string;
  location: string; // grouping bucket in the picker, e.g. "South Sector · SSC"
  address: string;
  campus: string;
  water: "Potable" | "Reclaimed" | "Well";
  controller: Controller;
  master: DeviceStatus;
  rain: DeviceStatus;
  tech: { name: string; id: string };
  date: string; // inspection start; auto-stamped, editable
  weather: string;
}

/** A captured photo, stored as a blob in the local DB. */
export interface Photo {
  id: string;
  zoneId: number;
  siteId: string;
  blob: Blob;
  takenAt: number; // epoch ms
}

export type ThemeName = "util" | "friendly" | "sun" | "dark";
