import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db/db";
import {
  ensureSeeded,
  listSites,
  saveSite,
  createSite,
  deleteSite,
  setZoneCount,
  addZone,
  deleteZone,
  addIssue,
  removeIssue,
  setAdjustments,
  setObservations,
  completeZone,
  patchZone,
  applyCsvUpdates,
  addPhoto,
  resetToSeed,
} from "./db/repo";
import { CURRENT_ZONE_INDEX, PRIMARY_SITE_ID } from "./db/seed";
import type { AdjustmentSet, Issue, Observations, Site, Zone } from "./types";
import { useTheme } from "./hooks/useTheme";
import { useOnline } from "./hooks/useOnline";

import { ControllerPicker, type SiteProgress } from "./screens/ControllerPicker";
import { ControllerForm } from "./screens/ControllerForm";
import { Overview } from "./screens/Overview";
import { ZoneInspection } from "./screens/ZoneInspection";
import { Summary } from "./screens/Summary";
import { Config } from "./screens/Config";
import { ZoneConfig } from "./screens/ZoneConfig";
import { IssueModal } from "./components/IssueModal";
import { SettingsSheet } from "./components/SettingsSheet";
import type { CsvUpdate } from "./lib/csv";

type View =
  | "picker"
  | "overview"
  | "zone"
  | "summary"
  | "config"
  | "controllerForm"
  | "zoneConfig";

export default function App() {
  const [theme, setTheme] = useTheme();
  const online = useOnline();

  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("picker");
  const [activeSiteId, setActiveSiteId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [configId, setConfigId] = useState<number | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editReturn, setEditReturn] = useState<View>("config");
  const [zoneCfgReturn, setZoneCfgReturn] = useState<View>("config");
  const [modalOpen, setModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Reactive reads — re-render whenever the local DB changes.
  const sites = useLiveQuery(() => listSites(), [], [] as Site[]);
  const allZones = useLiveQuery(() => db.zones.toArray(), [], [] as Zone[]);

  useEffect(() => {
    ensureSeeded().then(() => setReady(true));
    // Ask the browser not to evict our data (inspections + photos) under
    // storage pressure. Best-effort; unsupported browsers just ignore it.
    navigator.storage?.persist?.().catch(() => {});
  }, []);

  // Zones for the controller currently open, ordered by position.
  const zones = useMemo(
    () =>
      activeSiteId
        ? allZones.filter((z) => z.siteId === activeSiteId).sort((a, b) => a.num - b.num)
        : [],
    [allZones, activeSiteId]
  );

  const site = useMemo(
    () => (activeSiteId ? sites.find((s) => s.id === activeSiteId) : undefined),
    [sites, activeSiteId]
  );

  // Per-controller progress for the picker.
  const progress = useMemo(() => {
    const map: Record<string, SiteProgress> = {};
    for (const s of sites) map[s.id] = { done: 0, total: 0, issues: 0 };
    for (const z of allZones) {
      const p = (map[z.siteId] ??= { done: 0, total: 0, issues: 0 });
      p.total += 1;
      if (z.status === "pass" || z.status === "issues" || z.status === "skip") p.done += 1;
      if (z.status === "issues") p.issues += 1;
    }
    return map;
  }, [sites, allZones]);

  // Keep the active zone pointing at a zone that belongs to the open controller.
  useEffect(() => {
    if (!activeSiteId) return;
    const siteZones = allZones
      .filter((z) => z.siteId === activeSiteId)
      .sort((a, b) => a.num - b.num);
    if (!siteZones.length) return;
    const inSite = activeId != null && siteZones.some((z) => z.id === activeId);
    if (!inSite) {
      const pick =
        activeSiteId === PRIMARY_SITE_ID
          ? siteZones[Math.min(CURRENT_ZONE_INDEX, siteZones.length - 1)]
          : siteZones.find((z) => z.status === "pending") ?? siteZones[0];
      setActiveId(pick.id);
    }
  }, [activeSiteId, allZones, activeId]);

  if (!ready) {
    return <div className={`app-root theme-${theme}`} />;
  }

  const current = activeId != null ? zones.find((z) => z.id === activeId) : undefined;
  const configZ = configId != null ? zones.find((z) => z.id === configId) : undefined;

  // ── Controller navigation ──
  const openController = (id: string) => {
    setActiveSiteId(id);
    setActiveId(null); // effect picks the right starting zone
    setView("overview");
  };

  const newController = () => {
    setFormMode("create");
    setView("controllerForm");
  };

  const onCreateController = async (input: Omit<Site, "id">, zoneCount: number) => {
    const id = await createSite(input, zoneCount);
    setActiveSiteId(id);
    setActiveId(null);
    setView("overview");
  };

  const onSaveSite = async (next: Site) => {
    await saveSite(next);
    // Reconcile the actual zone rows to the chosen count (adds/removes at end).
    await setZoneCount(next.id, next.controller.zones);
    setView(editReturn);
  };

  const onDeleteController = async (id: string) => {
    await deleteSite(id);
    setActiveSiteId(null);
    setActiveId(null);
    setView("picker");
  };

  const onAddZone = async () => {
    if (activeSiteId) await addZone(activeSiteId);
  };

  const onDeleteZone = async (id: number) => {
    await deleteZone(id);
  };

  // ── Zone actions ──
  const openZone = (id: number) => {
    setActiveId(id);
    setView("zone");
  };

  const onAdjustChange = async (next: AdjustmentSet | null) => {
    if (activeId != null) await setAdjustments(activeId, next);
  };

  const onSaveIssue = async (issue: Issue, andAnother: boolean) => {
    if (activeId != null) await addIssue(activeId, issue);
    if (!andAnother) setModalOpen(false);
  };

  const onDeleteIssue = async (index: number) => {
    if (activeId != null) await removeIssue(activeId, index);
  };

  const onCapturePhoto = async (file: File) => {
    if (activeId != null) await addPhoto(activeId, file);
  };

  const onSaveClose = async (obs: Observations) => {
    if (activeId != null) await setObservations(activeId, obs);
    setView("overview");
  };

  const onComplete = async (obs: Observations) => {
    if (activeId == null) return;
    await setObservations(activeId, obs);
    const next = await completeZone(activeId);
    if (next != null) {
      setActiveId(next);
      setView("zone");
    } else {
      setView("summary");
    }
  };

  const onSaveZoneConfig = async (patch: Partial<Zone>) => {
    if (configId != null) await patchZone(configId, patch);
    setView(zoneCfgReturn);
  };

  const onImport = async (updates: CsvUpdate[]) => {
    await applyCsvUpdates(updates);
  };

  const onReset = async () => {
    await resetToSeed();
    setSettingsOpen(false);
    setActiveSiteId(null);
    setActiveId(null);
    setView("picker");
  };

  // Most-recent controller, used to prefill a new one (tech, location, etc.).
  const prefill = site ?? sites[0];

  return (
    <div className={`app-root theme-${theme}`}>
      {view === "picker" && (
        <ControllerPicker
          sites={sites}
          progress={progress}
          online={online}
          onPick={openController}
          onNew={newController}
          onSettings={() => setSettingsOpen(true)}
        />
      )}

      {view === "controllerForm" && (
        <ControllerForm
          mode={formMode}
          site={formMode === "edit" ? site : undefined}
          prefill={formMode === "create" ? prefill : undefined}
          online={online}
          onBack={() => setView(formMode === "edit" ? editReturn : "picker")}
          onCreate={onCreateController}
          onSave={onSaveSite}
          onDelete={onDeleteController}
        />
      )}

      {view === "overview" && site && (
        <Overview
          site={site}
          zones={zones}
          currentId={activeId}
          online={online}
          onBack={() => setView("picker")}
          onPickZone={openZone}
          onConfig={() => setView("config")}
          onSummary={() => setView("summary")}
          onSettings={() => setSettingsOpen(true)}
          onEditSite={() => {
            setEditReturn("overview");
            setFormMode("edit");
            setView("controllerForm");
          }}
        />
      )}

      {view === "zone" && current && (
        <ZoneInspection
          key={current.id}
          z={current}
          online={online}
          onBack={() => setView("overview")}
          onEditZone={() => {
            setConfigId(current.id);
            setZoneCfgReturn("zone");
            setView("zoneConfig");
          }}
          onAdjustChange={onAdjustChange}
          onOpenIssueModal={() => setModalOpen(true)}
          onDeleteIssue={onDeleteIssue}
          onCapturePhoto={onCapturePhoto}
          onSaveClose={onSaveClose}
          onComplete={onComplete}
        />
      )}

      {view === "summary" && site && (
        <Summary site={site} zones={zones} online={online} onBack={() => setView("overview")} />
      )}

      {view === "config" && site && (
        <Config
          site={site}
          zones={zones}
          online={online}
          onBack={() => setView("overview")}
          onImport={onImport}
          onAddZone={onAddZone}
          onDeleteZone={onDeleteZone}
          onEditSite={() => {
            setEditReturn("config");
            setFormMode("edit");
            setView("controllerForm");
          }}
          onEditZone={(id) => {
            setConfigId(id);
            setZoneCfgReturn("config");
            setView("zoneConfig");
          }}
        />
      )}

      {view === "zoneConfig" && configZ && (
        <ZoneConfig key={configZ.id} z={configZ} online={online} onBack={() => setView(zoneCfgReturn)} onSave={onSaveZoneConfig} />
      )}

      {modalOpen && current && (
        <IssueModal z={current} onClose={() => setModalOpen(false)} onSave={onSaveIssue} />
      )}

      {settingsOpen && (
        <SettingsSheet
          theme={theme}
          online={online}
          onTheme={setTheme}
          onReset={onReset}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
