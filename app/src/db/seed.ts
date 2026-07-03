// Seed data ported from the prototype's data.js.
// Used to populate the local database on first launch so the app opens
// onto a realistic set of irrigation controllers — one of them mid-inspection.
// Each controller (Site) has its own zones. Replace/add via the app.

import type {
  Site,
  Zone,
  Programs,
  Issue,
  Observations,
  ZoneStatus,
  DayCode,
  AdjustmentSet,
} from "../types";
import { SITE_ID } from "../lib/constants";

// The primary controller is the one the app opens onto (mid-inspection).
export const PRIMARY_SITE_ID = SITE_ID;
// The zone index that is "now" (in progress) within the primary controller.
export const CURRENT_ZONE_INDEX = 22;

export const seedSites: Site[] = [
  {
    id: PRIMARY_SITE_ID,
    name: "Liberty Hall Quad",
    code: "LHQ-04",
    location: "South Sector · SSC",
    address: "1820 Campus Loop · Building 04",
    campus: "South Sector · SSC",
    controller: { make: "Hunter", model: "ACC2-1400", program: "B (Spring)", zones: 60 },
    water: "Reclaimed",
    master: { value: "Open · 62 psi", ok: true },
    rain: { value: "Bypass · 24h", ok: true },
    tech: { name: "M. Okafor", id: "T-118" },
    date: "May 22, 2026 · 7:42 AM",
    weather: "68°F · Clear · Wind 6 mph NE",
  },
  {
    id: "ctrl-memorial-ath",
    name: "Memorial Athletics",
    code: "MEM-12",
    location: "South Sector · SSC",
    address: "55 Stadium Way · Field House",
    campus: "South Sector · SSC",
    controller: { make: "Rain Bird", model: "ESP-LXME", program: "A (Default)", zones: 24 },
    water: "Potable",
    master: { value: "Open · 70 psi", ok: true },
    rain: { value: "Active", ok: true },
    tech: { name: "M. Okafor", id: "T-118" },
    date: "May 29, 2026 · 8:00 AM",
    weather: "71°F · Clear",
  },
  {
    id: "ctrl-welcome-ctr",
    name: "Welcome Center Grounds",
    code: "WC-01",
    location: "North Campus",
    address: "1 Gateway Drive",
    campus: "North Campus",
    controller: { make: "Toro", model: "TMC-212", program: "A (Default)", zones: 16 },
    water: "Potable",
    master: { value: "Open · 58 psi", ok: true },
    rain: { value: "Active", ok: true },
    tech: { name: "M. Okafor", id: "T-118" },
    date: "May 29, 2026 · 8:00 AM",
    weather: "71°F · Clear",
  },
];

const zoneNames = [
  "North lawn — main", "North lawn — hedge", "Quad center turf", "Quad east drip",
  "Quad west drip", "Library beds", "Library lawn", "Bell tower planters",
  "Walk to Bldg 5", "Walk to Bldg 6", "Memorial circle", "Memorial roses",
  "Athletic field A", "Athletic field B", "Track perimeter", "Track infield",
  "Dorm row beds", "Dorm row turf", "Cafeteria patio", "Cafeteria hedge",
  "Auditorium front", "Auditorium side", "Faculty lot island", "Visitor lot island",
  "Gym east", "Gym west", "Pool deck planters", "Pool service strip",
  "Greenhouse drip", "Greenhouse turf", "Chapel lawn", "Chapel beds",
  "Maintenance yard", "Compost area", "Trail head", "Trail mid",
  "Trail end", "Pond berm", "Pond island", "Boathouse strip",
  "Tennis east", "Tennis west", "Basketball court strip", "Soccer warm-up",
  "Stadium gate north", "Stadium gate south", "Press box planters", "Stadium concourse",
  "Admin front lawn", "Admin courtyard", "Admin parking island", "STEM building beds",
  "STEM courtyard", "STEM walk", "Arts building lawn", "Arts patio",
  "Loading dock strip", "Recycle yard", "South gate planters", "South gate lawn",
];

// status, issues for the PRIMARY controller — mirrors a tech ~22 zones in.
const primarySeed: Array<[ZoneStatus, Issue[]]> = [
  ["pass", []],
  ["pass", []],
  ["issues", [{ t: "Broken head", n: 2, sev: "fix" }, { t: "Clogged nozzle", n: 4, sev: "watch" }]],
  ["pass", []],
  ["issues", [{ t: "Broken lateral", n: 1, sev: "fix" }]],
  ["pass", []],
  ["pass", []],
  ["issues", [{ t: "Coverage gap", n: 1, sev: "watch" }]],
  ["pass", []],
  ["pass", []],
  ["pass", []],
  ["issues", [{ t: "Leak at valve", n: 1, sev: "fix" }, { t: "Low pressure", n: 1, sev: "fix" }]],
  ["pass", []],
  ["pass", []],
  ["issues", [{ t: "Blocked head", n: 3, sev: "watch" }]],
  ["pass", []],
  ["pass", []],
  ["pass", []],
  ["issues", [{ t: "Overspray", n: 2, sev: "watch" }]],
  ["pass", []],
  ["skip", []],
  ["pass", []],
];

function emptyObservations(psi: number, runtime: number, gpm: number): Observations {
  return {
    activates: null,
    psi,
    runtimeObserved: runtime,
    gpm,
    coverage: null,
    drainage: null,
    note: "",
  };
}

// Build one zone. `id` is the global key; `num` is the position in its controller.
export function buildZone(id: number, siteId: string, num: number, name: string): Zone {
  const i = num - 1;
  const isDrip = i % 3 === 2;
  const isTurf = i % 3 === 0;
  const base = [6, 8, 10, 12, 15, 18, 20, 25, 30][i % 9];
  const programs: Programs = {
    A: {
      enabled: true,
      runtime: isDrip ? Math.round(base * 2) : base,
      days: (isTurf ? ["M", "W", "F"] : isDrip ? ["Tu", "Sa"] : ["M", "W", "F", "Sa"]) as DayCode[],
    },
    B: { enabled: i % 4 === 0, runtime: Math.round(base * 0.6), days: ["Su", "Th"] as DayCode[] },
    C: { enabled: i % 11 === 0, runtime: Math.round(base * 0.4), days: ["Sa"] as DayCode[] },
    D: { enabled: false, runtime: 0, days: [] },
  };
  const psi = 58 + ((i * 7) % 14);
  const gpm = 8 + ((i * 3) % 22);
  return {
    id,
    num,
    siteId,
    name,
    sprinkler: isTurf ? "MP Rotator" : i % 3 === 1 ? "Rotor" : "Drip",
    plant: i % 4 === 0 ? "Bed/shrub" : i % 4 === 1 ? "Warm turf" : i % 4 === 2 ? "Cool turf" : "Tree well",
    runtime: base,
    psi,
    gpm,
    status: "pending",
    issues: [],
    programs,
    adjustments: null,
    observations: emptyObservations(psi, base, gpm),
    photoIds: [],
  };
}

/** A blank zone for a freshly-created controller (generic name, pending). */
export function buildBlankZone(id: number, siteId: string, num: number): Zone {
  const z = buildZone(id, siteId, num, `Zone ${String(num).padStart(2, "0")}`);
  // New controllers start with no programmed schedule beyond a default A.
  return z;
}

export function buildSeedZones(): Zone[] {
  const all: Zone[] = [];
  let nextId = 1; // global, unique across every controller

  for (const site of seedSites) {
    const count = site.controller.zones;
    for (let n = 1; n <= count; n++) {
      const name =
        site.id === PRIMARY_SITE_ID
          ? zoneNames[n - 1] ?? `Zone ${String(n).padStart(2, "0")}`
          : `${site.name.split(" ")[0]} zone ${String(n).padStart(2, "0")}`;
      const z = buildZone(nextId++, site.id, n, name);

      // Apply the in-progress status/issues to the primary controller only.
      if (site.id === PRIMARY_SITE_ID && primarySeed[n - 1]) {
        const [status, issues] = primarySeed[n - 1];
        z.status = status;
        z.issues = issues;
      }
      all.push(z);
    }
  }

  // Seed a couple of demo adjustments on the primary controller so Summary
  // shows them. zones 3 and 12 (num) of the primary controller.
  const p3 = all.find((z) => z.siteId === PRIMARY_SITE_ID && z.num === 3);
  const p12 = all.find((z) => z.siteId === PRIMARY_SITE_ID && z.num === 12);
  if (p3) {
    const adj3: AdjustmentSet = {
      A: { runtime: 14, days: ["M", "W", "F", "Sa"], reason: "Bumped 2min + added Sat after head repair" },
    };
    p3.adjustments = adj3;
  }
  if (p12) {
    const adj12: AdjustmentSet = {
      A: { runtime: 8, days: ["M", "W", "F"], reason: "Reduced 4min until valve replaced" },
      B: { runtime: 0, days: [], reason: "Suspend program B (oversaturation)" },
    };
    p12.adjustments = adj12;
  }

  return all;
}
