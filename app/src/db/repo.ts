// Data access layer. All reads/writes go through here so that:
//  1. components don't touch Dexie directly, and
//  2. cloud sync can be layered in later without changing screens.

import { db } from "./db";
import type {
  Site,
  Zone,
  Issue,
  AdjustmentSet,
  Observations,
  Programs,
  Photo,
} from "../types";
import { buildSeedZones, seedSites, buildBlankZone } from "./seed";

let initPromise: Promise<void> | null = null;

// Set once the demo data has been seeded, so that deleting every
// controller leaves the app empty instead of resurrecting the demo.
const SEEDED_FLAG = "ssc-wet-check-seeded";

/** Seed the database on the very first launch only. Safe to call repeatedly. */
export async function ensureSeeded(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (localStorage.getItem(SEEDED_FLAG)) return;
    const count = await db.sites.count();
    if (count === 0) {
      await db.transaction("rw", db.sites, db.zones, async () => {
        await db.sites.bulkPut(seedSites);
        await db.zones.bulkPut(buildSeedZones());
      });
    }
    localStorage.setItem(SEEDED_FLAG, "1");
  })();
  return initPromise;
}

// ── Sites (controllers) ─────────────────────────────────────────
/** All controllers, ordered by location then name (for the picker). */
export async function listSites(): Promise<Site[]> {
  const sites = await db.sites.toArray();
  return sites.sort(
    (a, b) => a.location.localeCompare(b.location) || a.name.localeCompare(b.name)
  );
}

export function getSite(id: string): Promise<Site | undefined> {
  return db.sites.get(id);
}

/** Save edits to an existing controller (keeps its id). */
export async function saveSite(site: Site): Promise<void> {
  await db.sites.put(site);
}

/**
 * Permanently delete a controller and everything that belongs to it
 * (all of its zones and their photos). Irreversible.
 */
export async function deleteSite(siteId: string): Promise<void> {
  await db.transaction("rw", db.sites, db.zones, db.photos, async () => {
    await db.photos.where("siteId").equals(siteId).delete();
    await db.zones.where("siteId").equals(siteId).delete();
    await db.sites.delete(siteId);
  });
}

/**
 * Create a brand-new controller with `zoneCount` blank zones.
 * Returns the new controller's id so the caller can open it.
 */
export async function createSite(
  input: Omit<Site, "id">,
  zoneCount: number
): Promise<string> {
  const id = `ctrl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const site: Site = {
    ...input,
    id,
    controller: { ...input.controller, zones: zoneCount },
  };
  await db.transaction("rw", db.sites, db.zones, async () => {
    await db.sites.put(site);
    const lastKey = (await db.zones.orderBy("id").lastKey()) as number | undefined;
    let nextId = (lastKey ?? 0) + 1;
    const zones: Zone[] = [];
    for (let n = 1; n <= zoneCount; n++) {
      zones.push(buildBlankZone(nextId++, id, n));
    }
    if (zones.length) await db.zones.bulkPut(zones);
  });
  return id;
}

// ── Zones ───────────────────────────────────────────────────────
/** All zones for one controller, ordered by their per-controller position. */
export function zonesForSite(siteId: string): Promise<Zone[]> {
  return db.zones.where("siteId").equals(siteId).sortBy("num");
}

/** Append one blank zone at the end of a controller. Returns the new zone id. */
export async function addZone(siteId: string): Promise<number> {
  return db.transaction("rw", db.sites, db.zones, async () => {
    const site = await db.sites.get(siteId);
    if (!site) throw new Error("Controller not found");
    const existing = await db.zones.where("siteId").equals(siteId).sortBy("num");
    const nextNum = existing.length ? existing[existing.length - 1].num + 1 : 1;
    const lastKey = (await db.zones.orderBy("id").lastKey()) as number | undefined;
    const id = (lastKey ?? 0) + 1;
    await db.zones.put(buildBlankZone(id, siteId, nextNum));
    await db.sites.put({
      ...site,
      controller: { ...site.controller, zones: existing.length + 1 },
    });
    return id;
  });
}

/**
 * Delete one zone (and its photos), then renumber the controller's remaining
 * zones so they stay contiguous (01..N), and keep the zone count in sync.
 */
export async function deleteZone(zoneId: number): Promise<void> {
  await db.transaction("rw", db.sites, db.zones, db.photos, async () => {
    const z = await db.zones.get(zoneId);
    if (!z) return;
    await db.photos.where("zoneId").equals(zoneId).delete();
    await db.zones.delete(zoneId);
    const rest = await db.zones.where("siteId").equals(z.siteId).sortBy("num");
    for (let i = 0; i < rest.length; i++) {
      if (rest[i].num !== i + 1) await db.zones.update(rest[i].id, { num: i + 1 });
    }
    const site = await db.sites.get(z.siteId);
    if (site) {
      await db.sites.put({ ...site, controller: { ...site.controller, zones: rest.length } });
    }
  });
}

/**
 * Reconcile a controller to `target` zones by adding blanks at the end or
 * removing zones (and their photos) from the end. Used by the edit form's
 * zone-count stepper.
 */
export async function setZoneCount(siteId: string, target: number): Promise<void> {
  const t = Math.max(0, Math.floor(target));
  await db.transaction("rw", db.sites, db.zones, db.photos, async () => {
    const site = await db.sites.get(siteId);
    if (!site) return;
    const existing = await db.zones.where("siteId").equals(siteId).sortBy("num");
    const cur = existing.length;
    if (t > cur) {
      const lastKey = (await db.zones.orderBy("id").lastKey()) as number | undefined;
      let id = (lastKey ?? 0) + 1;
      const add: Zone[] = [];
      for (let n = cur + 1; n <= t; n++) add.push(buildBlankZone(id++, siteId, n));
      if (add.length) await db.zones.bulkPut(add);
    } else if (t < cur) {
      const remove = existing.slice(t); // zones with num > t
      const ids = remove.map((z) => z.id);
      if (ids.length) {
        await db.photos.where("zoneId").anyOf(ids).delete();
        await db.zones.bulkDelete(ids);
      }
    }
    await db.sites.put({ ...site, controller: { ...site.controller, zones: t } });
  });
}

export function getZone(id: number): Promise<Zone | undefined> {
  return db.zones.get(id);
}

export async function patchZone(id: number, patch: Partial<Zone>): Promise<void> {
  await db.zones.update(id, patch);
}

export async function setZoneName(id: number, name: string, programs: Programs): Promise<void> {
  await db.zones.update(id, { name, programs });
}

export async function addIssue(id: number, issue: Issue): Promise<void> {
  const z = await db.zones.get(id);
  if (!z) return;
  await db.zones.update(id, { issues: [...z.issues, issue] });
}

export async function removeIssue(id: number, index: number): Promise<void> {
  const z = await db.zones.get(id);
  if (!z) return;
  await db.zones.update(id, { issues: z.issues.filter((_, i) => i !== index) });
}

export async function setAdjustments(id: number, adjustments: AdjustmentSet | null): Promise<void> {
  await db.zones.update(id, { adjustments });
}

export async function setObservations(id: number, observations: Observations): Promise<void> {
  await db.zones.update(id, { observations });
}

/**
 * Mark a zone done: status = issues if any logged, else pass.
 * Returns the next zone id WITHIN THE SAME CONTROLLER, or null if last.
 */
export async function completeZone(id: number): Promise<number | null> {
  const z = await db.zones.get(id);
  if (!z) return null;
  await db.zones.update(id, { status: z.issues.length ? "issues" : "pass" });
  const sameSite = await db.zones.where("siteId").equals(z.siteId).sortBy("num");
  const next = sameSite.find((x) => x.num > z.num);
  return next ? next.id : null;
}

/** Apply CSV import updates (name + programs per zone, keyed by real zone id). */
export async function applyCsvUpdates(
  updates: Array<{ id: number; name?: string; programs?: Programs }>
): Promise<void> {
  await db.transaction("rw", db.zones, async () => {
    for (const u of updates) {
      const patch: Partial<Zone> = {};
      if (u.name != null) patch.name = u.name;
      if (u.programs != null) patch.programs = u.programs;
      if (Object.keys(patch).length) await db.zones.update(u.id, patch);
    }
  });
}

// ── Photos ──────────────────────────────────────────────────────
export async function addPhoto(zoneId: number, blob: Blob): Promise<string> {
  const z = await db.zones.get(zoneId);
  if (!z) throw new Error(`Zone ${zoneId} not found`);
  const id = `ph_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const photo: Photo = { id, zoneId, siteId: z.siteId, blob, takenAt: Date.now() };
  await db.photos.put(photo);
  await db.zones.update(zoneId, { photoIds: [...z.photoIds, id] });
  return id;
}

export function getPhoto(id: string): Promise<Photo | undefined> {
  return db.photos.get(id);
}

/** Reset everything back to the seed state (used by Settings → Reset demo). */
export async function resetToSeed(): Promise<void> {
  await db.transaction("rw", db.sites, db.zones, db.photos, async () => {
    await db.photos.clear();
    await db.zones.clear();
    await db.sites.clear();
    await db.sites.bulkPut(seedSites);
    await db.zones.bulkPut(buildSeedZones());
  });
}
