// Local-first database (IndexedDB via Dexie).
//
// This is the SINGLE source of truth on-device. The UI reads and writes here
// and never blocks on a network. When we add cloud sync later, a sync engine
// will push/pull between this store and a server — app code won't need to
// change, because everything already goes through repo.ts.

import Dexie, { type Table } from "dexie";
import type { Site, Zone, Photo } from "../types";

export class WetCheckDB extends Dexie {
  sites!: Table<Site, string>;
  zones!: Table<Zone, number>;
  photos!: Table<Photo, string>;

  constructor() {
    super("ssc-wet-check");
    this.version(1).stores({
      // Indexed fields only; the full object is stored regardless.
      sites: "id",
      zones: "id, siteId, status",
      photos: "id, zoneId, siteId",
    });
    // v2: multi-controller. Each controller (Site) groups by `location`; zones
    // gain `num` (per-controller position) and are queried by [siteId+num].
    // The primary key stays "id" so this is a pure index change. We clear the
    // old single-controller demo data on upgrade; ensureSeeded() then rebuilds
    // the new multi-controller seed on next launch.
    this.version(2)
      .stores({
        sites: "id, location",
        zones: "id, siteId, num, status, [siteId+num]",
        photos: "id, zoneId, siteId",
      })
      .upgrade(async (tx) => {
        await tx.table("photos").clear();
        await tx.table("zones").clear();
        await tx.table("sites").clear();
      });
  }
}

export const db = new WetCheckDB();
