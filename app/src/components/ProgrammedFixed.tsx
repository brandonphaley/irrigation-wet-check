import type { Programs } from "../types";
import { DAYS } from "../lib/constants";

/** Compact read-only "Programmed schedule" block (sourced from config). */
export function ProgrammedFixed({ programs }: { programs: Programs }) {
  const active = (Object.entries(programs) as [string, Programs[keyof Programs]][]).filter(
    ([, p]) => p.enabled
  );
  if (active.length === 0) {
    return <div className="prog-fixed empty">No active programs configured</div>;
  }
  return (
    <div className="prog-fixed">
      {active.map(([k, p]) => (
        <div key={k} className="pf-row">
          <div className="pf-tag">{k}</div>
          <div className="pf-rt">
            {p.runtime}
            <span style={{ color: "var(--ink-3)", fontWeight: 400, fontSize: 10, marginLeft: 2 }}>min</span>
          </div>
          <div className="pf-days">
            {DAYS.map((d) => (
              <div key={d} className={`pf-day ${p.days.includes(d) ? "on" : ""}`}>
                {d[0]}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
