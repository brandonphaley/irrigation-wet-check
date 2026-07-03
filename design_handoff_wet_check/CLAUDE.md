# CLAUDE.md — build guide for the SSC Wet Check app

You are implementing a production version of an irrigation **wet check** field app for
grounds crews. Read `README.md` in this folder first — it is the full spec (data model,
every screen, tokens, behavior). The HTML/React files here are a **working design
prototype**, not code to ship: all data is mocked and resets on refresh.

## Your job
Recreate the prototype's screens and workflows in a real, persistent, offline-capable app.

- If a codebase/stack already exists, use its patterns, component library, and design
  system. Match the prototype's **layout, tokens, and behavior**, not its literal CSS/JSX.
- If greenfield, build a **React + TypeScript PWA** (responsive phone/tablet/desktop,
  installable, offline-first). See "Recommended Architecture" in the README.

## Non-negotiable product requirements
- **Up to 60 zones per site**; mobile is the primary device.
- **Offline-first**: writes hit a local store immediately and sync when online; never block
  on network. A sync indicator reflects queue state.
- **Multiple issues per zone** (the issue sheet has a "+ Another" flow).
- **Manual + CSV controller-data entry** — the app does NOT integrate with the controller.
  Port the CSV parsing in `config.jsx` → `CsvImporter` (forgiving day formats, template
  download, per-row error reporting).
- **Programmed schedule shown read-only during inspection; proposed adjustments captured
  separately** and rolled into the report with reasons.
- **Summary → PDF emailed to the property manager.**
- **Four themes** (Utilitarian default, Friendly, Sun-readable, Dark) via CSS custom
  properties; persist the choice. Sun-readable and Dark are real field requirements.

## Styling
`theme.css` is the source of truth for color/spacing/type tokens. Port the tokens; don't
copy the file. Fonts: Space Grotesk (UI) + JetBrains Mono (numbers/ids). Keep motion
minimal — utility tool used in sunlight. Hit targets ≥ 44px.

## Do NOT port
`ios-frame.jsx` and `tweaks-panel.jsx` are browser-demo scaffolding only. The CDN React +
Babel setup in `SSC Wet Check.html` is for the prototype; use a real build toolchain.

## Suggested order
Data layer → Config (site/zone/CSV) → Overview (list) → Zone inspection form →
Issue modal (multi-add) → Summary + PDF/email → offline sync → camera/photos → auth/
multi-site → themes + PWA. (Expanded in README "Suggested build order".)
