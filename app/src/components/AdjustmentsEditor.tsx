import type { AdjustmentSet, ProgramKey, Zone } from "../types";
import { DAYS } from "../lib/constants";

interface Props {
  z: Zone;
  value: AdjustmentSet | null;
  onChange: (next: AdjustmentSet | null) => void;
}

/** Proposed schedule changes per program, diffed live against programmed values. */
export function AdjustmentsEditor({ z, value, onChange }: Props) {
  const active = (Object.entries(z.programs) as [ProgramKey, Zone["programs"][ProgramKey]][]).filter(
    ([, p]) => p.enabled
  );
  const adj = value || {};

  const update = (k: ProgramKey, patch: Partial<{ runtime: number; days: typeof DAYS; reason: string }>) => {
    const base = adj[k] || { runtime: z.programs[k].runtime, days: [...z.programs[k].days], reason: "" };
    onChange({ ...adj, [k]: { ...base, ...patch } });
  };
  const clear = (k: ProgramKey) => {
    const next = { ...adj };
    delete next[k];
    onChange(Object.keys(next).length ? next : null);
  };
  const toggleDay = (k: ProgramKey, d: (typeof DAYS)[number]) => {
    const cur = adj[k]?.days ?? [...z.programs[k].days];
    const next = cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d];
    update(k, { days: next });
  };

  const changeCount = Object.keys(adj).length;
  const hasAny = changeCount > 0;

  return (
    <div className="adj-card">
      <div className="adj-hd">
        <span>Proposed adjustments</span>
        <span style={{ color: hasAny ? "var(--accent)" : "var(--ink-3)" }}>
          {hasAny ? `${changeCount} change${changeCount > 1 ? "s" : ""}` : "no changes"}
        </span>
      </div>
      <div className="adj-body">
        {active.map(([k, p]) => {
          const a = adj[k];
          const rt = a?.runtime ?? p.runtime;
          const days = a?.days ?? p.days;
          const dirty =
            !!a &&
            (a.runtime !== p.runtime ||
              JSON.stringify([...a.days].sort()) !== JSON.stringify([...p.days].sort()));
          return (
            <div key={k} className="adj-prog">
              <div
                className="pf-tag"
                style={{
                  background: a ? "var(--accent)" : "var(--paper-3)",
                  color: a ? "var(--paper)" : "var(--ink-2)",
                }}
              >
                {k}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                  <div className="num-input" style={{ height: 32 }}>
                    <button onClick={() => update(k, { runtime: Math.max(0, rt - 1) })}>−</button>
                    <div className="val" style={{ padding: "6px 8px", minWidth: 56, fontSize: 13 }}>
                      {rt}
                      <span className="unit">min</span>
                    </div>
                    <button onClick={() => update(k, { runtime: rt + 1 })}>+</button>
                  </div>
                  {dirty && (
                    <button className="reset-btn" onClick={() => clear(k)}>
                      Reset
                    </button>
                  )}
                </div>
                <div className="prog-row" style={{ padding: 0, border: "none", display: "block" }}>
                  <div className="days">
                    {DAYS.map((d) => (
                      <button key={d} className={`day ${days.includes(d) ? "on" : ""}`} onClick={() => toggleDay(k, d)}>
                        {d[0]}
                      </button>
                    ))}
                  </div>
                </div>
                {dirty && (
                  <div className="adj-cmp" style={{ marginTop: 8 }}>
                    <span className="from">
                      {p.runtime}m · {p.days.join("·") || "—"}
                    </span>
                    <span className="arrow">→</span>
                    <span className="to">
                      {rt}m · {days.join("·") || "—"}
                    </span>
                  </div>
                )}
                {a && (
                  <textarea
                    className="notes"
                    placeholder="Reason (included in PDF)…"
                    value={a.reason || ""}
                    onChange={(e) => update(k, { reason: e.target.value })}
                  />
                )}
              </div>
            </div>
          );
        })}
        {active.length === 0 && (
          <div style={{ padding: "8px 4px", color: "var(--ink-3)", fontSize: 12 }}>
            Configure a program first to propose adjustments.
          </div>
        )}
      </div>
    </div>
  );
}
