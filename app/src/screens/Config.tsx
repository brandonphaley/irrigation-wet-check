import { useState } from "react";
import type { ProgramKey, Site, Zone } from "../types";
import { TopBar } from "../components/TopBar";
import { CsvImporter } from "../components/CsvImporter";
import type { CsvUpdate } from "../lib/csv";

interface Props {
  site: Site;
  zones: Zone[];
  online: boolean;
  onBack: () => void;
  onImport: (updates: CsvUpdate[]) => void;
  onAddZone: () => void;
  onDeleteZone: (id: number) => void;
  onEditSite: () => void;
  onEditZone: (id: number) => void;
}

export function Config({ site, zones, online, onBack, onImport, onAddZone, onDeleteZone, onEditSite, onEditZone }: Props) {
  const [confirmId, setConfirmId] = useState<number | null>(null);
  return (
    <>
      <TopBar online={online} queued={0} onBack={onBack} />
      <div className="page-intro">
        <div className="eyebrow">Pre-inspection setup</div>
        <h1>Configuration</h1>
        <p>Enter site and controller details once — they auto-populate every inspection.</p>
      </div>
      <div className="scroll scroll-safe">
        <div className="sec-hd"><span>Bulk import</span></div>
        <CsvImporter zones={zones} onImport={onImport} />

        <div className="sec-hd" style={{ marginTop: 14 }}><span>Controller &amp; site</span></div>
        <button className="cfg-row" onClick={onEditSite}>
          <div className="id" style={{ fontSize: 11, letterSpacing: ".05em" }}>{site.code || "SITE"}</div>
          <div>
            <div className="name">{site.name}</div>
            <div className="meta">
              {site.location} · {site.controller.make} {site.controller.model} · {site.controller.zones} zones
            </div>
          </div>
          <div className="pcount" style={{ color: "var(--accent)" }}>Edit →</div>
        </button>

        <div className="sec-hd">
          <span>All zones · {zones.length}</span>
          <button className="link-btn accent" onClick={onAddZone}>+ Add zone</button>
        </div>
        {zones.map((z) => {
          const active = (Object.entries(z.programs) as [ProgramKey, Zone["programs"][ProgramKey]][]).filter(([, p]) => p.enabled);
          return (
            <div key={z.id} className="cfg-row-wrap">
              <button className="cfg-row" style={{ borderBottom: "none" }} onClick={() => onEditZone(z.id)}>
                <div className="id">{String(z.num).padStart(2, "0")}</div>
                <div>
                  <div className="name">{z.name}</div>
                  <div className="meta">
                    {active.length === 0
                      ? "— no programs —"
                      : active.map(([k, p]) => `${k}:${p.runtime}m·${p.days.join("") || "—"}`).join("  ")}
                  </div>
                </div>
                <div className="pcount">
                  <b>{active.length}</b> prog
                </div>
              </button>
              {confirmId === z.id ? (
                <button
                  className="zone-del confirm"
                  onClick={() => { onDeleteZone(z.id); setConfirmId(null); }}
                  aria-label="Confirm delete zone"
                >
                  Delete?
                </button>
              ) : (
                <button
                  className="zone-del"
                  onClick={() => setConfirmId(z.id)}
                  aria-label="Delete zone"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
