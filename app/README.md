# SSC Wet Check — the app

A mobile-first field app for irrigation **wet checks**: walk a property zone by
zone, confirm each zone runs, log issues with photos, propose schedule
adjustments, and export a summary PDF you can email.

This is the **real, working app** built from the design in
`../design_handoff_wet_check/`. It runs in a browser, installs to your phone's
home screen, and works **offline** — everything is saved on your device.

---

## How to start the app (easiest way)

1. Open the `app` folder.
2. **Double-click `Start Wet Check.bat`.**
3. A black window opens (leave it open) and your browser opens the app.
4. To stop the app, close the black window.

That's it. The first launch takes a minute to set things up; after that it's
instant.

---

## How to open it on your phone

The app is designed for phones. To use it on your phone while it's running on
this computer (both on the same Wi‑Fi):

1. Start the app (above). The black window prints a line like
   `Network: http://192.168.x.x:5173/`.
2. On your phone's browser, type that exact address.
3. In the browser menu, choose **"Add to Home Screen"** — now it has an icon and
   opens full-screen like a normal app, and works offline.

(Later, we can publish it to the Apple App Store and Google Play Store — the app
is built so that's an add-on step, not a rewrite. See "For developers" below.)

---

## What works today

- **Overview** with live progress, site card, and the full zone list.
- **Zone inspection**: programmed schedule (read-only), proposed adjustments with
  reasons, activation/pressure/runtime/flow, coverage & drainage, **multiple
  issues per zone**, **photos from the camera**, and notes.
- **Config**: edit the site/controller, edit any zone's programs, and **import
  zones from a CSV** (with a downloadable template).
- **Summary → PDF**: generates the report on your device and opens the share
  sheet (or downloads the PDF) so you can email it.
- **Four themes** (Utilitarian, Friendly, Sun-readable, Dark) in **Settings**
  (gear icon, top-right). Sun-readable is for bright outdoor use.
- **Offline + saved on device**: close and reopen — your work is still there.

The app opens on demo data so you can try everything immediately. **Settings →
Reset to demo data** restores it.

---

## For developers

- Stack: React + TypeScript + Vite, installable PWA (`vite-plugin-pwa`).
- Local storage: IndexedDB via Dexie (`src/db/`). All reads/writes go through
  `src/db/repo.ts` so a cloud sync engine can be added later without touching
  screens.
- PDF: client-side via jsPDF (`src/lib/pdf.ts`), shared via the Web Share API.
- App-store packaging (later): wrap this web build with Capacitor
  (`npm i @capacitor/core @capacitor/cli`, `npx cap init`, add ios/android
  platforms, point webDir at `dist`). No app code changes required.

Commands (run inside `app/`):

```
npm install      # one-time setup
npm run dev      # start the dev server (what the .bat does)
npm run build    # production build into dist/
npm run preview  # preview the production build
```
