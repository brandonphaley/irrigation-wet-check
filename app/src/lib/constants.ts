import type { DayCode } from "../types";

export const DAYS: DayCode[] = ["Su", "M", "Tu", "W", "Th", "F", "Sa"];

export interface IssueType {
  k: string;
  label: string;
  icon: string;
}

// Ported from prototype data.js → ISSUE_TYPES.
export const ISSUE_TYPES: IssueType[] = [
  { k: "broken_head", label: "Broken head", icon: "✕" },
  { k: "clogged", label: "Clogged nozzle", icon: "◌" },
  { k: "blocked", label: "Blocked head", icon: "▣" },
  { k: "broken_lateral", label: "Broken lateral", icon: "≣" },
  { k: "leak_valve", label: "Leak at valve", icon: "◐" },
  { k: "leak_main", label: "Broken main", icon: "✕✕" },
  { k: "coverage_gap", label: "Coverage gap", icon: "◯" },
  { k: "overspray", label: "Overspray", icon: "↗" },
  { k: "low_pressure", label: "Low pressure", icon: "↓" },
  { k: "no_activation", label: "Won't activate", icon: "!" },
  { k: "drainage", label: "Poor drainage", icon: "▾" },
  { k: "drip_emitter", label: "Drip emitter", icon: "·" },
];

// Placeholder labor rates used on the Summary screen (README: replace later).
export const LABOR_RATE = { fix: 45, watch: 18 };

export const SITE_ID = "site-default"; // single site for the phone-only build
