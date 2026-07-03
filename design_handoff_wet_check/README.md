# Handoff: SSC Irrigation Wet Check (field inspection app)

## Overview

A mobile-first field tool for grounds crews ("SSC" = School/campus grounds, South Sector
in the demo data) to perform an **irrigation wet check**: walk a property zone-by-zone,
confirm each zone activates and runs correctly, log any issues with photos, propose
schedule adjustments to the controller's programs, and export a summary PDF to the
property manager.

The app does **not** talk to the irrigation controller directly. The tech enters the
controller's existing program data once (manually or via CSV import); during inspection
that programmed schedule appears as a fixed reference, and the tech records *proposed*
adjustments alongside it. Adjustments and issues roll up into the final report.

Typical site: **up to 60 zones**, one controller. Used on **phone (primary), tablet, and
desktop**. Must be **offline-capable** — techs lose signal behind buildings.

---

## About the Design Files

The files in this bundle are **design references created in HTML/React (via in-browser
Babel)** — a working prototype that demonstrates the intended look, layout, and behavior.
They are **not production code to ship**. All data is mocked in `data.js` and resets on
refresh; there is no backend, no persistence, no auth, no real camera or email.

Your task is to **recreate these designs in a production environment**. If the target
codebase already has a stack (React Native, Flutter, SwiftUI, a React PWA, etc.), use its
established patterns, component library, and design system. If there is no codebase yet,
**a React + TypeScript PWA is the recommended choice** for this app — it covers phone,
tablet, and desktop from one codebase and handles offline well (see "Recommended
Architecture" below).

The prototype's CSS (`theme.css`) is a faithful source of truth for spacing, color, and
typography — port the **tokens**, don't necessarily copy the CSS verbatim.

---

## Fidelity

**High-fidelity.** Colors, typography, spacing, radii, and interactions are all final and
considered. Recreate the UI to match, using your codebase's libraries. The four visual
themes (see Design Tokens) are a real product requirement: outdoor crews need a
sun-readable high-contrast mode and a dark mode, plus the default utilitarian look and a
friendlier option. Theme is a runtime switch, so implement it as CSS custom properties (or
your framework's theming equivalent), not hard-coded values.

The **per-zone interaction mode** had three prototyped variants (list / tap-grid /
swipe-deck). **The team has chosen List as the shipping interaction.** Build List. Grid and
swipe can be dropped unless you want grid as a quick "jump to zone" affordance.

---

## Recommended Architecture (if greenfield)

- **Frontend:** React + TypeScript, built as an installable **PWA** (service worker +
  manifest). One codebase serves phone/tablet/desktop responsively.
- **Offline-first data:** local store (IndexedDB via Dexie or similar) is the source of
  truth on-device; a sync engine pushes/pulls to the server when online. The UI reads/writes
  local only — never blocks on network. The "sync" pill in the top bar reflects queue state.
- **Backend:** any REST/GraphQL API + Postgres. Entities below.
- **Auth:** email/password or SSO; tech identity stamps each inspection.
- **Photos:** capture via device camera, store blobs locally, upload to object storage
  (S3/GCS) on sync; attach GPS + timestamp.
- **PDF + email:** generate server-side from the inspection record; email to the property
  manager. (Client-side PDF is possible but server-side is more reliable for archival.)
- **CSV import:** parse client-side (logic already written — see `config.jsx`
  `CsvImporter`), write rows to local store, sync up.

---

## Data Model

These are the core entities. Field names mirror the prototype's `data.js` and component
state so you can cross-reference.

### Site
```
Site {
  id            string
  name          string        // "Liberty Hall Quad"
  code          string        // "LHQ-04" — shown on PDF header & filenames
  address       string
  campus        string        // "South Sector · SSC"
  water         enum           // "Potable" | "Reclaimed" | "Well"
  controller    Controller
  master        DeviceStatus   // master valve  { value: string, ok: bool }
  rain          DeviceStatus   // rain sensor    { value: string, ok: bool }
  tech          { name: string, id: string }
  date          string         // inspection start; auto-stamped, editable
  weather       string
}

Controller {
  make          string         // "Hunter"
  model         string         // "ACC2-1400"
  program       string         // active program label, e.g. "B (Spring)"
  zones         int            // count on this controller (up to ~60)
}

DeviceStatus { value: string, ok: bool }
```

### Zone
```
Zone {
  id            int            // 1-indexed; displayed zero-padded "01".."60"
  name          string         // "North lawn — main"
  sprinkler     string         // "MP Rotator" | "Rotor" | "Drip"  (head type)
  plant         string         // "Bed/shrub" | "Warm turf" | "Cool turf" | "Tree well"
  runtime       int            // baseline programmed minutes (legacy single value)
  psi           int            // expected/last pressure
  gpm           int            // expected/last flow
  status        enum           // "pending" | "pass" | "issues" | "skip"
  programs      { A: Program, B: Program, C: Program, D: Program }
  issues        Issue[]        // MANY per zone
  adjustments   AdjustmentSet | null   // proposed schedule changes (see below)
  photos        int            // count in prototype; real app stores Photo[]
}

Program {
  enabled       bool
  runtime       int            // minutes
  days          string[]       // subset of ["Su","M","Tu","W","Th","F","Sa"]
}
```

### Issue (multiple per zone)
```
Issue {
  t             string         // type label, e.g. "Broken head"
  n             int            // count (e.g. 2 broken heads)
  sev           enum           // "fix" (fix now) | "watch" | "ok" (monitor)
  // production additions:
  note          string
  photoIds      string[]
}
```
Issue type picker options (`ISSUE_TYPES` in data.js): Broken head, Clogged nozzle,
Blocked head, Broken lateral, Leak at valve, Broken main, Coverage gap, Overspray,
Low pressure, Won't activate, Poor drainage, Drip emitter.

### Adjustments (proposed schedule changes, per program)
```
AdjustmentSet {
  // keyed by program letter; only present for changed programs
  A?: { runtime: int, days: string[], reason: string }
  B?: { ... }
  C?: { ... }
  D?: { ... }
}
```
An adjustment is "dirty" (shown as a change) when its runtime or days differ from the
zone's programmed values. The `reason` string is required-ish and **prints in the PDF**.

### Observations captured during inspection (per zone, currently local form state)
- Activates from controller: yes / no / skip
- Pressure (psi), Runtime observed (min), Flow (gpm) — numeric steppers
- Head coverage & arc: Uniform / Minor / Adjust (3-way)
- Soil moisture & drainage: Healthy / Dry / Pooling (3-way)
- Photos (camera), freeform note
These should persist on the inspection record in production.

---

## Screens / Views

The app is a single-column mobile layout (prototype canvas 402×874, iPhone frame). On
tablet/desktop, widen to a centered column or master-detail (zone list + form side-by-side).

### 1. Overview (home)
- **Purpose:** mission control for the in-progress wet check.
- **Layout, top to bottom:**
  1. **Top bar** — app logo (water-drop), "SSC Wet Check" / "Grounds · South Sector",
     and a **sync pill** on the right (green "Synced" when online; amber "Queue · N" when
     offline). Has top padding to clear the iOS status bar / dynamic island (~62px).
  2. **Progress strip** — "In progress · NN%" + count "22/60", and a segmented bar showing
     pass (green) / issues (red) / skip (grey) proportions.
  3. **Site card** — site name, code chip, address; key/value rows for Controller, Water
     (+ zone count chip), Master, Rain sensor, Tech, Started, Weather. Status pills:
     OK (green), Bypass (amber), etc.
  4. **Section header** "Zones · 60" with **"Config"** and **"Finish & export →"** links.
  5. **Zone list** (the shipping mode) — one row per zone: zero-padded id, name,
     mono meta line (`sprinkler · plant · Nmin · Npsi`), and a right-side status chip
     (now / pass / issues·N / pending / skip). The current zone has an accent left border.
- **Interactions:** tap a zone row → opens the inspection form for that zone. "Config" →
  Config screen. "Finish & export" → Summary.

### 2. Zone inspection form
- **Purpose:** the wet check for one zone.
- **Layout, top to bottom:**
  1. **Back** in top bar.
  2. **Zone header** — accent square with zero-padded id, zone name, mono meta
     (`sprinkler · plant`).
  3. **"Programmed"** section (read-only, sourced from config) — compact card listing each
     enabled program: letter tag, runtime, and a 7-dot day grid (active days filled).
     Labeled "from config" on the right.
  4. **"Adjustments"** section — accent-bordered card. For each enabled program: a runtime
     stepper, a 7-day toggle row, and when changed, a `from → to` diff line plus a reason
     textarea (prints to PDF). A header shows "N changes" / "no changes". A "Reset" link
     reverts a program.
  5. **"Activation & flow"** — Activates (yes/no/skip toggle), Pressure (psi stepper),
     Runtime observed (min stepper), Flow (gpm stepper).
  6. **"Field observation"** — Head coverage & arc (Uniform/Minor/Adjust segmented), Soil
     moisture & drainage (Healthy/Dry/Pooling segmented).
  7. **"Issues · N"** — header with a "Log issue / Log another" action. Each logged issue
     is a row: severity-colored ×count chip, type label, severity tag, left border colored
     by severity. A dashed **"+ Log another issue"** button sits below the list. **Multiple
     issues per zone are required.**
  8. **"Photos · N"** — thumbnails + an add (camera) tile.
  9. **"Notes"** — freeform textarea.
  10. **Sticky bottom bar** — "Save & close" (ghost) + "Mark done →" (primary). Has extra
      bottom padding to clear the home indicator (~34px). "Mark done" sets status to
      `issues` if any were logged else `pass`, and advances to the next zone (or Summary if
      last).

### 3. Issue modal (bottom sheet)
- **Purpose:** log one issue; stay open to log more.
- **Layout:** grabber handle; header "Log issue · Zone NN" + zone name + "N already logged";
  a success flash after each save ("✓ Saved '…' — log another below"); **Type** chip grid
  (2-col, 12 types, each icon + label); **Severity** segmented (OK·monitor / Watch / Fix now);
  **Count** stepper; **Photo** capture tile ("GPS tagged"); **Note** textarea.
- **Footer:** Cancel · **+ Another** (saves & resets form, sheet stays open) · **Save**
  (saves & closes). Save/Another disabled until a type is chosen.

### 4. Config screen
- **Purpose:** pre-inspection setup — enter controller data once.
- **Layout:** header "Pre-inspection setup / Configuration"; then:
  1. **"Bulk import"** — CSV importer card (see below).
  2. **"Site & controller"** — a single row → opens Site config form.
  3. **Zone list** — every zone with its program summary (`A:14m·MWF  B:…`) and a
     program count; tap → Zone config form.

### 5. Site & controller config form
- **Purpose:** edit the Site/Controller record.
- **Fields, grouped:** Site (name, code, address, campus); Controller (make, model, active
  program A/B/C/D segmented, zone-count stepper); Water & devices (source
  Potable/Reclaimed/Well segmented, master valve text + OK/Issue, rain sensor text +
  OK/Bypass); Crew & conditions (tech name, tech id, start datetime, weather). Sticky
  Cancel / Save site bar.

### 6. Zone config form
- **Purpose:** set a zone's name and its A/B/C/D programs.
- **Fields:** zone name text input; for each program A–D: On/Off toggle, runtime stepper,
  and 7-day picker (only shown when enabled). Sticky Cancel / Save zone bar.

### 7. CSV importer (card on Config)
- Dashed drop-zone card; tap to browse or drop a `.csv`. Expected header:
  `zone, name, A_runtime, A_days, B_runtime, B_days, …` (C/D supported). Day parsing is
  forgiving: `MWF`, `M;W;F`, `Mon,Wed`, full names all work; normalized to
  `Su M Tu W Th F Sa`. A runtime or day-set auto-enables that program. **"↓ Download
  template"** emits a sample CSV from the first 3 zones. After import, a pill reports
  `N updated · M skipped`, with per-row errors (bad id, unknown zone). Parsing logic is
  fully implemented in `config.jsx` → `CsvImporter` — port it.

### 8. Summary / export
- **Purpose:** review and send the report.
- **Layout:** "Wet check complete" + site name + date; a 2×2 tile grid (Zones inspected,
  Issues with fix/watch breakdown, Adjustments count across N zones, Est. labor $);
  **"Schedule adjustments"** list (each: `ZNN·X` chip, zone name, `from → to` diff, italic
  reason); **"Fix now · N"** list and **"Watch · N"** list (each issue: zone chip, type +
  zone name, ×count). Sticky **"Save draft"** + **"Email PDF"** bar.
- Est. labor in the prototype is a placeholder formula (`fix ×$45 + watch ×$18`); replace
  with your real rate logic or drop it.

---

## Interactions & Behavior

- **Navigation** is a simple view switch (`overview | zone | summary | config | zoneConfig |
  siteConfig`) plus a transient issue modal. In production use your router; preserve back
  behavior (zone → overview, siteConfig → config, etc.).
- **Mark done** computes status from issue count and auto-advances to the next zone; on the
  last zone it goes to Summary.
- **Adjustments** are diffed live against programmed values; only changed programs are saved
  and shown in the report.
- **Issue logging** must support many per zone; "+ Another" keeps the sheet open and shows a
  confirmation flash.
- **Offline:** all writes go to local store immediately; sync pill reflects queue. Nothing
  should block on the network.
- **Steppers** never go below 0 (runtime/count below 1 where noted).
- **Transitions:** cells/rows have a subtle `scale(0.96)` active press; modal is a
  bottom-sheet. Keep motion minimal — this is a utility tool used in sunlight.

---

## State Management

Prototype keeps everything in React component state in `app.jsx`:
- `zones[]`, `site`, `view`, `activeId` (current zone), `configId` (zone being configured),
  `modalOpen`, and Tweaks (`theme`, `interaction`, `online`).

Production state:
- **Persistent:** sites, zones (+ programs), inspections, issues, adjustments, photos —
  in local store, synced to server.
- **Session/UI:** current view/route, active zone, modal open, selected theme (persist
  theme to localStorage/user prefs).
- **Sync:** online/offline status, pending-write queue, last-synced timestamp.

---

## Design Tokens

Ported from `theme.css`. Implement as CSS custom properties / theme objects. Four themes;
default is **Utilitarian**. Values are OKLCH (as authored) — convert to your color system
if needed.

**Typography**
- UI font: **Space Grotesk** (400/500/600/700)
- Mono font (zone ids, numbers, meta): **JetBrains Mono** (400/500/600), tabular numerals
- Slide/print min sizes don't apply; this is an app. Body ~13px, labels ~11px uppercase
  tracked, big numbers (tiles) ~26px, zone header id ~18px mono.

**Utilitarian theme (default)**
```
paper   oklch(0.985 0.003 220)   ink    oklch(0.20 0.012 240)
paper-2 oklch(0.965 0.004 220)   ink-2  oklch(0.38 0.012 240)
paper-3 oklch(0.935 0.005 220)   ink-3  oklch(0.58 0.012 240)
line    oklch(0.88 0.006 230)    line-2 oklch(0.78 0.008 230)
accent  oklch(0.52 0.11 210)  (teal "water")   accent-2 oklch(0.94 0.03 210)
ok      oklch(0.58 0.13 155)  ok-2 oklch(0.93 0.04 155)
warn    oklch(0.72 0.16 75)   warn-2 oklch(0.94 0.06 75)
crit    oklch(0.55 0.20 25)   crit-2 oklch(0.93 0.05 25)
skip    oklch(0.65 0.01 240)
radius 8px   radius-l 12px
```

**Friendly modern** — warmer paper (hue 90), teal accent (hue 180), larger radii
(14 / 20px). **Sun-readable** — pure white paper, near-black ink, heavier borders, deep-blue
accent, hi-vis amber warn, bumped font-weight 500, tight radii (6 / 8px). **Dark** — dark
slate papers (L 0.16–0.26), light ink, brighter accents. Full values in `theme.css` under
`.theme-friendly`, `.theme-sun`, `.theme-dark`.

**Status color semantics (consistent across themes)**
- accent/teal = water / active / current zone / proposed adjustment
- ok/green = pass, healthy, uniform, device OK
- warn/amber = watch, dry, minor, bypass
- crit/red = fix-now, broken, pooling, device issue
- skip/grey = skipped / pending

**Spacing & shape**
- Screen gutters: 16px. Section header padding: 4px 16px 8px, tracked uppercase 11px.
- Cards: 1px `line` border, `radius-l`. Inputs/buttons: `radius`.
- Hit targets ≥ 44px (sticky-bar buttons are 44–48px; day toggles ~26px but in a row).
- Top bar clears status bar (~62px top pad); sticky bottom bar clears home indicator
  (~34px extra bottom pad).

---

## Assets

- **Icons:** inline SVG, drawn in `components.jsx` (`Ico` object: chevron, back, camera,
  plus, share, cloud, cloud-off, water-drop) and in `config.jsx` (CSV upload icon). All
  stroke-based, currentColor. Reuse your icon library's equivalents.
- **Fonts:** Space Grotesk + JetBrains Mono via Google Fonts (`@import` in `theme.css`).
- **No raster image assets.** Photo thumbnails are CSS hatch placeholders in the prototype;
  real app shows captured photos.
- The iPhone frame (`ios-frame.jsx`) and Tweaks panel (`tweaks-panel.jsx`) are **prototype
  scaffolding only — do not port.** They exist to demo the design in a browser.

---

## Files in this bundle

Design reference (port these):
- `SSC Wet Check.html` — entry; wires everything together. (Loads React + Babel via CDN;
  prototype only.)
- `theme.css` — **design tokens + all component styles. Primary styling source of truth.**
- `data.js` — mock data + the data shapes (Site, Zone, Program, Issue, ISSUE_TYPES, DAYS).
- `components.jsx` — TopBar, ProgressStrip, SiteCard, ZoneGrid, ZoneList, ZoneForm, `Ico`.
- `app.jsx` — view routing, IssueModal, SwipeDeck, Summary, Tile, and the App shell/state.
- `config.jsx` — ProgrammedFixed, AdjustmentsEditor, ZoneConfigForm, ConfigList,
  SiteConfigForm, **CsvImporter (port the parsing logic)**.

Prototype scaffolding (do NOT port):
- `ios-frame.jsx`, `tweaks-panel.jsx` — browser demo chrome only.

---

## Suggested build order

1. Data layer + local store + entities above; seed from `data.js`.
2. Config: Site form, Zone form, CSV import (port `CsvImporter`).
3. Overview: top bar, progress, site card, **zone list**.
4. Zone inspection form incl. Programmed + Adjustments + observations.
5. Issue modal with multi-add.
6. Summary + PDF generation + email.
7. Offline sync engine + sync indicator.
8. Camera/photo capture + upload.
9. Auth + multi-site.
10. Theme switching (4 themes) + PWA install.
