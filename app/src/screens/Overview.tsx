import type { Site, Zone } from "../types";
import { TopBar } from "../components/TopBar";
import { ProgressStrip } from "../components/ProgressStrip";
import { SiteCard } from "../components/SiteCard";
import { ZoneList } from "../components/ZoneList";

interface Props {
  site: Site;
  zones: Zone[];
  currentId: number | null;
  online: boolean;
  onBack: () => void;
  onPickZone: (id: number) => void;
  onConfig: () => void;
  onSummary: () => void;
  onSettings: () => void;
  onEditSite: () => void;
}

export function Overview({ site, zones, currentId, online, onBack, onPickZone, onConfig, onSummary, onSettings, onEditSite }: Props) {
  return (
    <>
      <TopBar online={online} queued={0} sub={site.location} onBack={onBack} onSettings={onSettings} />
      <ProgressStrip zones={zones} />
      <div className="scroll scroll-safe">
        <SiteCard site={site} onEdit={onEditSite} />
        <div className="sec-hd">
          <span>Zones · {zones.length}</span>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <button className="link-btn" onClick={onConfig}>Config</button>
            <button className="link-btn accent" onClick={onSummary}>Finish &amp; export →</button>
          </div>
        </div>
        <ZoneList zones={zones} currentId={currentId} onPick={onPickZone} />
      </div>
    </>
  );
}
