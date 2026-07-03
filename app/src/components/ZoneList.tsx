import type { Zone } from "../types";

interface Props {
  zones: Zone[];
  currentId: number | null;
  onPick: (id: number) => void;
}

export function ZoneList({ zones, currentId, onPick }: Props) {
  return (
    <div className="zone-list">
      {zones.map((z) => {
        const isNow = z.id === currentId;
        const issueCount = z.issues.reduce((s, i) => s + i.n, 0);
        return (
          <button key={z.id} className={`zl-row ${isNow ? "now" : ""}`} onClick={() => onPick(z.id)}>
            <div className="id">{String(z.num).padStart(2, "0")}</div>
            <div>
              <div className="name">{z.name}</div>
              <div className="meta mono">
                {z.sprinkler} · {z.plant} · {z.runtime}min · {z.psi}psi
              </div>
            </div>
            <div className={`stat ${isNow ? "pending" : z.status}`}>
              {isNow ? "now" : z.status}
              {z.status === "issues" && ` · ${issueCount}`}
            </div>
          </button>
        );
      })}
    </div>
  );
}
