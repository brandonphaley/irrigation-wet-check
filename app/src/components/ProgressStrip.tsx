import type { Zone } from "../types";

export function ProgressStrip({ zones }: { zones: Zone[] }) {
  const counts = zones.reduce<Record<string, number>>((a, z) => {
    a[z.status] = (a[z.status] || 0) + 1;
    return a;
  }, {});
  const total = zones.length || 1;
  const done = (counts.pass || 0) + (counts.issues || 0) + (counts.skip || 0);
  const pct = Math.round((done / total) * 100);
  return (
    <div className="progress">
      <div className="row">
        <span className="pct">In progress · {pct}%</span>
        <span className="count mono">
          {done}/{zones.length}
        </span>
      </div>
      <div className="bar">
        <span style={{ width: `${((counts.pass || 0) / total) * 100}%`, background: "var(--ok)" }} />
        <span style={{ width: `${((counts.issues || 0) / total) * 100}%`, background: "var(--crit)" }} />
        <span style={{ width: `${((counts.skip || 0) / total) * 100}%`, background: "var(--skip)" }} />
      </div>
    </div>
  );
}
