import { useEffect, useState } from "react";
import type { AdjustmentSet, Observations, TriState, Zone } from "../types";
import { TopBar } from "../components/TopBar";
import { ProgrammedFixed } from "../components/ProgrammedFixed";
import { AdjustmentsEditor } from "../components/AdjustmentsEditor";
import { PhotoStrip } from "../components/PhotoStrip";
import { PlusIcon } from "../components/Icons";

interface Props {
  z: Zone;
  online: boolean;
  onBack: () => void;
  onEditZone: () => void;
  onAdjustChange: (next: AdjustmentSet | null) => void;
  onOpenIssueModal: () => void;
  onDeleteIssue: (index: number) => void;
  onCapturePhoto: (file: File) => void;
  onSaveClose: (obs: Observations) => void;
  onComplete: (obs: Observations) => void;
}

export function ZoneInspection({
  z, online, onBack, onEditZone, onAdjustChange, onOpenIssueModal, onDeleteIssue, onCapturePhoto, onSaveClose, onComplete,
}: Props) {
  const [obs, setObs] = useState<Observations>(z.observations);

  // Re-sync when switching to a different zone.
  useEffect(() => {
    setObs(z.observations);
  }, [z.id]);

  const set = <K extends keyof Observations>(k: K, v: Observations[K]) =>
    setObs((o) => ({ ...o, [k]: v }));

  const logged = z.issues;

  return (
    <>
      <TopBar online={online} queued={0} onBack={onBack} />
      <div className="scroll scroll-safe">
        <div className="z-head">
          <div className="num mono">{String(z.num).padStart(2, "0")}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2>{z.name}</h2>
            <div className="meta mono">
              {z.sprinkler} · {z.plant}
            </div>
          </div>
          <button className="link-btn accent" style={{ flexShrink: 0 }} onClick={onEditZone}>Edit</button>
        </div>

        <div className="sec-hd">
          <span>Programmed</span>
          <span style={{ color: "var(--ink-3)", letterSpacing: 0, textTransform: "none", fontWeight: 400, fontSize: 11 }}>
            from config
          </span>
        </div>
        <ProgrammedFixed programs={z.programs} />

        <div className="sec-hd" style={{ marginTop: 14 }}><span>Adjustments</span></div>
        <AdjustmentsEditor z={z} value={z.adjustments} onChange={onAdjustChange} />

        <div className="sec-hd" style={{ marginTop: 14 }}><span>Activation &amp; flow</span></div>

        <div className="check">
          <div className="label">
            Activates from controller
            <div className="hint">Confirm valve opens within 10s</div>
          </div>
          <div className="yn">
            <button className={obs.activates === "yes" ? "on yes" : ""} onClick={() => set("activates", "yes")}>Yes</button>
            <button className={obs.activates === "no" ? "on no" : ""} onClick={() => set("activates", "no")}>No</button>
            <button className={obs.activates === "skip" ? "on skip" : ""} onClick={() => set("activates", "skip")}>Skip</button>
          </div>
        </div>

        <Stepper label="Pressure" hint="Static / dynamic at zone" unit="psi" value={obs.psi} onChange={(v) => set("psi", v)} />
        <Stepper label="Runtime observed" hint="Actual minutes run during wet check" unit="min" value={obs.runtimeObserved} onChange={(v) => set("runtimeObserved", v)} />
        <Stepper label="Flow" hint="Measured GPM at flow meter" unit="gpm" value={obs.gpm} onChange={(v) => set("gpm", v)} />

        <div className="sec-hd"><span>Field observation</span></div>
        <TriSeg
          label="Head coverage & arc"
          hint="Walk the zone, eyeball patterns"
          value={obs.coverage}
          labels={["Uniform", "Minor", "Adjust"]}
          onChange={(v) => set("coverage", v)}
        />
        <TriSeg
          label="Soil moisture & drainage"
          hint="Probe + visual after 2 min"
          value={obs.drainage}
          labels={["Healthy", "Dry", "Pooling"]}
          onChange={(v) => set("drainage", v)}
        />

        <div className="sec-hd">
          <span>Issues · {logged.length}</span>
          <button
            className="link-btn accent"
            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            onClick={onOpenIssueModal}
          >
            <PlusIcon /> Log{logged.length ? " another" : " issue"}
          </button>
        </div>

        {logged.length > 0 && (
          <div className="logged">
            {logged.map((it, i) => (
              <div key={i} className={`logged-item ${it.sev === "watch" ? "watch" : it.sev === "ok" ? "ok" : ""}`}>
                <span className={`spill ${it.sev === "fix" ? "crit" : it.sev === "watch" ? "warn" : "ok"}`}>×{it.n}</span>
                <span>
                  {it.t}
                  {it.note && <span style={{ color: "var(--ink-3)" }}> · {it.note}</span>}
                </span>
                <button className="del-btn" onClick={() => onDeleteIssue(i)} aria-label="Remove issue">×</button>
              </div>
            ))}
            <button
              onClick={onOpenIssueModal}
              style={{
                padding: "10px 12px", borderRadius: "var(--radius)", border: "1px dashed var(--line-2)",
                background: "transparent", color: "var(--accent)", fontWeight: 600, fontSize: 12.5,
                cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center",
                justifyContent: "center", gap: 6,
              }}
            >
              <PlusIcon /> Log another issue
            </button>
          </div>
        )}

        <div className="sec-hd"><span>Photos · {z.photoIds.length}</span></div>
        <PhotoStrip photoIds={z.photoIds} onCapture={onCapturePhoto} />

        <div className="sec-hd"><span>Notes</span></div>
        <div style={{ padding: "0 16px 14px" }}>
          <textarea
            className="notes"
            placeholder="Anything else worth flagging…"
            value={obs.note}
            onChange={(e) => set("note", e.target.value)}
          />
        </div>
      </div>

      <div className="zbar">
        <button className="ghost" onClick={() => onSaveClose(obs)}>Save &amp; close</button>
        <button className="primary" onClick={() => onComplete(obs)}>Mark done →</button>
      </div>
    </>
  );
}

function Stepper({
  label, hint, unit, value, onChange,
}: { label: string; hint: string; unit: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="check">
      <div className="label">
        {label}
        <div className="hint">{hint}</div>
      </div>
      <div className="num-input">
        <button onClick={() => onChange(Math.max(0, value - 1))}>−</button>
        <div className="val">
          {value}
          <span className="unit">{unit}</span>
        </div>
        <button onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  );
}

function TriSeg({
  label, hint, value, labels, onChange,
}: { label: string; hint: string; value: TriState; labels: [string, string, string]; onChange: (v: TriState) => void }) {
  return (
    <div className="check" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
      <div className="label">
        {label}
        <div className="hint">{hint}</div>
      </div>
      <div className="seg">
        <button className={value === "ok" ? "on ok" : ""} onClick={() => onChange("ok")}>{labels[0]}</button>
        <button className={value === "watch" ? "on watch" : ""} onClick={() => onChange("watch")}>{labels[1]}</button>
        <button className={value === "fix" ? "on fix" : ""} onClick={() => onChange("fix")}>{labels[2]}</button>
      </div>
    </div>
  );
}
