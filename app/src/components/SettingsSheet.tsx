import type { ThemeName } from "../types";
import { THEMES } from "../hooks/useTheme";

interface Props {
  theme: ThemeName;
  online: boolean;
  onTheme: (t: ThemeName) => void;
  onReset: () => void;
  onClose: () => void;
}

export function SettingsSheet({ theme, online, onTheme, onReset, onClose }: Props) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="mhd">
          <h3>Settings</h3>
          <p>Theme is saved on this device. Inspection data is stored offline on this device.</p>
        </div>
        <div className="mbody">
          <div className="sec-hd"><span>Theme</span></div>
          <div style={{ padding: "0 16px 12px", display: "grid", gap: 6 }}>
            {THEMES.map((t) => (
              <button
                key={t.value}
                className="cfg-row"
                style={{
                  borderRadius: "var(--radius)",
                  border: theme === t.value ? "1px solid var(--accent)" : "1px solid var(--line)",
                  background: theme === t.value ? "var(--accent-2)" : "var(--paper)",
                }}
                onClick={() => onTheme(t.value)}
              >
                <div className="id" style={{ fontSize: 11 }}>{theme === t.value ? "●" : "○"}</div>
                <div className="name">{t.label}</div>
                <div className="pcount" style={{ color: "var(--accent)" }}>{theme === t.value ? "Active" : ""}</div>
              </button>
            ))}
          </div>

          <div className="sec-hd"><span>Sync</span></div>
          <div className="set-row">
            <span className="lbl">Status</span>
            <span className={`sync ${online ? "online" : "offline"}`}>
              <span className="dot" />
              {online ? "Online" : "Offline"}
            </span>
          </div>
          <div style={{ padding: "10px 16px", fontSize: 11.5, color: "var(--ink-3)" }}>
            Cloud sync is not enabled in this version — everything is saved on this device. (Planned for a later release.)
          </div>

          <div className="sec-hd"><span>Demo data</span></div>
          <div style={{ padding: "0 16px 16px" }}>
            <button
              className="zbar-like"
              style={{
                width: "100%", height: 44, borderRadius: "var(--radius)", border: "1px solid var(--crit)",
                background: "var(--crit-2)", color: "var(--crit)", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              }}
              onClick={() => {
                if (confirm("Reset all data back to the demo site? This erases the current inspection on this device.")) {
                  onReset();
                }
              }}
            >
              Reset to demo data
            </button>
          </div>
        </div>
        <div style={{ padding: "0 16px 10px", fontSize: 10.5, color: "var(--ink-3)", textAlign: "center", fontFamily: "var(--font-mono)" }}>
          Version: built {__BUILD_STAMP__}
        </div>
        <div className="mfoot">
          <button className="primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
