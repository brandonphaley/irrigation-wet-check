import { useState } from "react";
import type { Issue, Severity, Zone } from "../types";
import { ISSUE_TYPES } from "../lib/constants";
import { CameraIcon } from "./Icons";

interface Props {
  z: Zone;
  onSave: (issue: Issue, andAnother: boolean) => void;
  onClose: () => void;
}

/** Bottom-sheet to log an issue; stays open to log more via "+ Another". */
export function IssueModal({ z, onSave, onClose }: Props) {
  const [type, setType] = useState<string | null>(null);
  const [sev, setSev] = useState<Severity>("fix");
  const [count, setCount] = useState(1);
  const [note, setNote] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  const commit = (andAnother: boolean) => {
    const label = ISSUE_TYPES.find((i) => i.k === type)?.label || "Issue";
    const issue: Issue = { t: label, n: count, sev, note: note.trim() || undefined };
    onSave(issue, andAnother);
    if (andAnother) {
      setFlash(label);
      setType(null);
      setSev("fix");
      setCount(1);
      setNote("");
      setTimeout(() => setFlash(null), 1400);
    }
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="mhd">
          <h3>Log issue · Zone {String(z.num).padStart(2, "0")}</h3>
          <p>
            {z.name}
            {z.issues.length > 0 && (
              <span style={{ marginLeft: 6, color: "var(--accent)" }}> · {z.issues.length} already logged</span>
            )}
          </p>
          {flash && <div className="flash">✓ Saved “{flash}” — log another below</div>}
        </div>
        <div className="mbody">
          <div className="sec-hd"><span>Type</span></div>
          <div className="iss-grid">
            {ISSUE_TYPES.map((it) => (
              <button key={it.k} className={`iss-chip ${type === it.k ? "on" : ""}`} onClick={() => setType(it.k)}>
                <span className="ico">{it.icon}</span>
                <span>{it.label}</span>
              </button>
            ))}
          </div>
          <div className="sec-hd"><span>Severity</span></div>
          <div style={{ padding: "0 16px 12px" }}>
            <div className="seg">
              <button className={sev === "ok" ? "on ok" : ""} onClick={() => setSev("ok")}>OK · monitor</button>
              <button className={sev === "watch" ? "on watch" : ""} onClick={() => setSev("watch")}>Watch</button>
              <button className={sev === "fix" ? "on fix" : ""} onClick={() => setSev("fix")}>Fix now</button>
            </div>
          </div>
          <div className="sec-hd"><span>Count</span></div>
          <div style={{ padding: "0 16px 12px" }}>
            <div className="num-input">
              <button onClick={() => setCount((c) => Math.max(1, c - 1))}>−</button>
              <div className="val">{count}</div>
              <button onClick={() => setCount((c) => c + 1)}>+</button>
            </div>
          </div>
          <div className="sec-hd"><span>Photo</span></div>
          <div className="photos">
            <div className="photo-thumb add" style={{ color: "var(--accent)", width: 72, height: 72 }}>
              <CameraIcon />
            </div>
            <div style={{ alignSelf: "center", fontSize: 12, color: "var(--ink-3)" }}>
              Add photos from the zone screen
            </div>
          </div>
          <div className="sec-hd"><span>Note</span></div>
          <div style={{ padding: "0 16px 16px" }}>
            <textarea
              className="notes"
              placeholder="e.g. head 3rd from path, snapped at riser"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <div className="mfoot">
          <button onClick={onClose}>Cancel</button>
          <button disabled={!type} onClick={() => commit(true)}>+ Another</button>
          <button className="primary" disabled={!type} onClick={() => commit(false)}>Save</button>
        </div>
      </div>
    </div>
  );
}
