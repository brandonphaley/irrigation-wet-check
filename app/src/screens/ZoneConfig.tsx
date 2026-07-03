import { useEffect, useState } from "react";
import type { ProgramKey, Programs, Zone } from "../types";
import { TopBar } from "../components/TopBar";
import { DAYS } from "../lib/constants";

interface Props {
  z: Zone;
  online: boolean;
  onBack: () => void;
  onSave: (patch: Partial<Zone>) => void;
}

export function ZoneConfig({ z, online, onBack, onSave }: Props) {
  const [name, setName] = useState(z.name);
  const [sprinkler, setSprinkler] = useState(z.sprinkler);
  const [plant, setPlant] = useState(z.plant);
  const [runtime, setRuntime] = useState(z.runtime);
  const [psi, setPsi] = useState(z.psi);
  const [gpm, setGpm] = useState(z.gpm);
  const [programs, setPrograms] = useState<Programs>(z.programs);

  useEffect(() => {
    setName(z.name);
    setSprinkler(z.sprinkler);
    setPlant(z.plant);
    setRuntime(z.runtime);
    setPsi(z.psi);
    setGpm(z.gpm);
    setPrograms(z.programs);
  }, [z.id]);

  const save = () =>
    onSave({ name, sprinkler, plant, runtime, psi, gpm, programs });

  const setProg = (k: ProgramKey, patch: Partial<Programs[ProgramKey]>) =>
    setPrograms((p) => ({ ...p, [k]: { ...p[k], ...patch } }));
  const toggleDay = (k: ProgramKey, d: (typeof DAYS)[number]) => {
    const cur = programs[k].days;
    const next = cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d];
    setProg(k, { days: next });
  };

  return (
    <>
      <TopBar online={online} queued={0} onBack={onBack} />
      <div className="scroll scroll-safe">
        <div className="z-head">
          <div className="num mono">{String(z.num).padStart(2, "0")}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2>Configure zone</h2>
            <div className="meta mono">{z.sprinkler} · {z.plant}</div>
          </div>
        </div>

        <div className="sec-hd"><span>Zone details</span></div>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--line)" }}>
          <span className="field-label">Zone name</span>
          <input className="tx-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. North lawn — main" />
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6 }}>Shown on controller, inspection form, and PDF.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid var(--line)" }}>
          <div style={{ padding: "10px 12px 10px 16px", borderRight: "1px solid var(--line)" }}>
            <span className="field-label">Head type</span>
            <input className="tx-input" value={sprinkler} placeholder="e.g. Rotor" onChange={(e) => setSprinkler(e.target.value)} />
          </div>
          <div style={{ padding: "10px 16px 10px 12px" }}>
            <span className="field-label">Plant / area</span>
            <input className="tx-input" value={plant} placeholder="e.g. Turf" onChange={(e) => setPlant(e.target.value)} />
          </div>
        </div>

        <div className="sec-hd"><span>Reference values</span></div>
        <NumRow label="Baseline runtime" unit="min" value={runtime} onChange={setRuntime} />
        <NumRow label="Expected pressure" unit="psi" value={psi} onChange={setPsi} />
        <NumRow label="Expected flow" unit="gpm" value={gpm} onChange={setGpm} />
        <div style={{ padding: "0 16px 12px", fontSize: 11, color: "var(--ink-3)" }}>
          Reference figures shown in the zone list; the wet check records actual readings separately.
        </div>

        <div className="sec-hd"><span>Programs</span></div>
        {(["A", "B", "C", "D"] as ProgramKey[]).map((k) => {
          const p = programs[k];
          return (
            <div key={k} className="prog-row">
              <div className={`tag ${p.enabled ? "on" : "off"}`}>{k}</div>
              <div>
                <div className="head">
                  <div className="name">
                    Program {k}
                    {!p.enabled && <span style={{ color: "var(--ink-3)", fontWeight: 400, marginLeft: 8, fontSize: 11 }}>not in use</span>}
                  </div>
                  <div className="yn" style={{ height: 28 }}>
                    <button className={p.enabled ? "on yes" : ""} style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => setProg(k, { enabled: true })}>On</button>
                    <button className={!p.enabled ? "on skip" : ""} style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => setProg(k, { enabled: false })}>Off</button>
                  </div>
                </div>
                {p.enabled && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span className="field-label" style={{ marginBottom: 0, flex: 1 }}>Run time</span>
                      <div className="num-input" style={{ height: 32 }}>
                        <button onClick={() => setProg(k, { runtime: Math.max(0, p.runtime - 1) })}>−</button>
                        <div className="val" style={{ padding: "6px 8px", fontSize: 13, minWidth: 56 }}>{p.runtime}<span className="unit">min</span></div>
                        <button onClick={() => setProg(k, { runtime: p.runtime + 1 })}>+</button>
                      </div>
                    </div>
                    <span className="field-label">Days</span>
                    <div className="days">
                      {DAYS.map((d) => (
                        <button key={d} className={`day ${p.days.includes(d) ? "on" : ""}`} onClick={() => toggleDay(k, d)}>
                          {d[0]}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="zbar">
        <button className="ghost" onClick={onBack}>Cancel</button>
        <button className="primary" onClick={save}>Save zone</button>
      </div>
    </>
  );
}

function NumRow({
  label, unit, value, onChange,
}: { label: string; unit: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
      <div className="num-input" style={{ height: 32 }}>
        <button onClick={() => onChange(Math.max(0, value - 1))}>−</button>
        <div className="val" style={{ padding: "6px 8px", fontSize: 13, minWidth: 64 }}>{value}<span className="unit">{unit}</span></div>
        <button onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  );
}
