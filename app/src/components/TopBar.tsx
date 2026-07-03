import { BackIcon, CloudIcon, CloudOffIcon, DropIcon, GearIcon } from "./Icons";

interface Props {
  online: boolean;
  queued?: number;
  sub?: string;
  onBack?: () => void;
  onSettings?: () => void;
}

export function TopBar({ online, queued = 0, sub = "Grounds · South Sector", onBack, onSettings }: Props) {
  return (
    <div className="tbar">
      {onBack && (
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <BackIcon />
        </button>
      )}
      <div className="logo">
        <DropIcon />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="title">SSC Wet Check</div>
        <div className="sub">{sub}</div>
      </div>
      <span className={`sync ${online ? "online" : "offline"}`} title={online ? "All changes saved locally; online" : "Working offline; changes saved on device"}>
        <span className="dot" />
        {online ? <CloudIcon /> : <CloudOffIcon />}
        {online ? "Synced" : `Queue · ${queued}`}
      </span>
      {onSettings && (
        <button className="icon-btn" onClick={onSettings} aria-label="Settings">
          <GearIcon />
        </button>
      )}
    </div>
  );
}
