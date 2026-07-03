// Mock wet-check data for SSC campus site
window.SITE = {
  name: "Liberty Hall Quad",
  code: "LHQ-04",
  address: "1820 Campus Loop · Building 04",
  campus: "South Sector · SSC",
  controller: { make: "Hunter", model: "ACC2-1400", program: "B (Spring)", zones: 60 },
  water: "Reclaimed",
  master: { value: "Open · 62 psi", ok: true },
  rain: { value: "Bypass · 24h", ok: true },
  tech: { name: "M. Okafor", id: "T-118" },
  date: "May 22, 2026 · 7:42 AM",
  weather: "68°F · Clear · Wind 6 mph NE",
};

// 60 zones with varied state for a realistic in-progress feel
const _zoneNames = [
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

// status: pending | pass | issues | skip
// state mirrors a tech ~22 zones in.
const _seed = [
  // 1-22 completed
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
  ["issues", [{ t: "Overspray on walk", n: 2, sev: "watch" }]],
  ["pass", []],
  ["skip", []],
  ["pass", []],
  // 23 current (in progress) — leave others pending
];

window.ZONES = _zoneNames.slice(0, 60).map((name, i) => {
  const seed = _seed[i] || ["pending", []];
  // Build a realistic per-zone program schedule.
  // A = primary, B = seasonal supplement (some zones), C/D rarely.
  const isDrip = i % 3 === 2;
  const isTurf = i % 3 === 0;
  const base = [6, 8, 10, 12, 15, 18, 20, 25, 30][i % 9];
  const programs = {
    A: { enabled: true,
         runtime: isDrip ? Math.round(base * 2) : base,
         days: isTurf ? ['M','W','F'] : isDrip ? ['Tu','Sa'] : ['M','W','F','Sa'] },
    B: { enabled: i % 4 === 0,
         runtime: Math.round(base * 0.6),
         days: ['Su','Th'] },
    C: { enabled: i % 11 === 0,
         runtime: Math.round(base * 0.4),
         days: ['Sa'] },
    D: { enabled: false, runtime: 0, days: [] },
  };
  return {
    id: i + 1,
    name,
    sprinkler: isTurf ? "MP Rotator" : i % 3 === 1 ? "Rotor" : "Drip",
    plant: i % 4 === 0 ? "Bed/shrub" : i % 4 === 1 ? "Warm turf" : i % 4 === 2 ? "Cool turf" : "Tree well",
    runtime: base,
    psi: 58 + ((i * 7) % 14),
    gpm: 8 + ((i * 3) % 22),
    status: seed[0],
    issues: seed[1],
    photos: seed[1].length > 0 ? Math.min(seed[1].length, 3) : 0,
    programs,
    adjustments: null,  // populated during inspection: { A: {runtime, days, reason}, ... }
  };
});

window.DAYS = ['Su','M','Tu','W','Th','F','Sa'];

// Seed a couple of demo adjustments so the prototype shows them in summary.
window.ZONES[2].adjustments = {  // zone 3 had broken head
  A: { runtime: 14, days: ['M','W','F','Sa'], reason: 'Bumped 2min + added Sat after head repair' }
};
window.ZONES[11].adjustments = {  // zone 12 leak at valve
  A: { runtime: 8,  days: ['M','W','F'], reason: 'Reduced 4min until valve replaced' },
  B: { runtime: 0,  days: [], reason: 'Suspend program B (oversaturation)' }
};

window.ISSUE_TYPES = [
  { k: "broken_head",   label: "Broken head",     icon: "✕" },
  { k: "clogged",       label: "Clogged nozzle",  icon: "◌" },
  { k: "blocked",       label: "Blocked head",    icon: "▣" },
  { k: "broken_lateral",label: "Broken lateral",  icon: "≣" },
  { k: "leak_valve",    label: "Leak at valve",   icon: "◐" },
  { k: "leak_main",     label: "Broken main",     icon: "✕✕" },
  { k: "coverage_gap",  label: "Coverage gap",    icon: "◯" },
  { k: "overspray",     label: "Overspray",       icon: "↗" },
  { k: "low_pressure",  label: "Low pressure",    icon: "↓" },
  { k: "no_activation", label: "Won't activate",  icon: "!" },
  { k: "drainage",      label: "Poor drainage",   icon: "▾" },
  { k: "drip_emitter",  label: "Drip emitter",    icon: "·" },
];

window.CURRENT_ZONE_INDEX = 22; // zone 23 (1-indexed) is "now"
