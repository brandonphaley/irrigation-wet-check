import { useMemo, useState } from "react";
import type { Site } from "../types";
import { TopBar } from "../components/TopBar";
import { PlusIcon } from "../components/Icons";

export interface SiteProgress {
  done: number;
  total: number;
  issues: number; // zones flagged with issues
}

interface Props {
  sites: Site[];
  progress: Record<string, SiteProgress>;
  online: boolean;
  onPick: (siteId: string) => void;
  onNew: () => void;
  onSettings: () => void;
}

export function ControllerPicker({ sites, progress, online, onPick, onNew, onSettings }: Props) {
  const [q, setQ] = useState("");

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? sites.filter(
          (s) =>
            s.name.toLowerCase().includes(needle) ||
            s.location.toLowerCase().includes(needle) ||
            s.code.toLowerCase().includes(needle) ||
            `${s.controller.make} ${s.controller.model}`.toLowerCase().includes(needle)
        )
      : sites;

    const byLoc = new Map<string, Site[]>();
    for (const s of filtered) {
      const key = s.location || "Unfiled";
      if (!byLoc.has(key)) byLoc.set(key, []);
      byLoc.get(key)!.push(s);
    }
    return [...byLoc.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [sites, q]);

  return (
    <>
      <TopBar online={online} queued={0} onSettings={onSettings} sub="Controllers" />
      <div className="page-intro">
        <div className="eyebrow">Wet check</div>
        <h1>Controllers</h1>
        <p>Pick a controller to open its wet check, or add a new one.</p>
      </div>

      <div style={{ padding: "0 16px 8px" }}>
        <input
          className="tx-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, location, code…"
        />
      </div>

      <div className="scroll scroll-safe">
        {groups.length === 0 && (
          <div style={{ padding: "20px 16px", color: "var(--ink-3)", fontSize: 13 }}>
            {q.trim()
              ? <>No controllers match “{q}”.</>
              : <>No controllers yet — add your first one below.</>}
          </div>
        )}

        {groups.map(([loc, list]) => (
          <div key={loc}>
            <div className="sec-hd">
              <span>{loc} · {list.length}</span>
            </div>
            {list.map((s) => {
              const p = progress[s.id] ?? { done: 0, total: s.controller.zones, issues: 0 };
              const total = p.total || 1;
              const pct = Math.round((p.done / total) * 100);
              const complete = p.done >= total && total > 0;
              return (
                <button key={s.id} className="cfg-row" onClick={() => onPick(s.id)}>
                  <div className="id" style={{ fontSize: 11, letterSpacing: ".04em" }}>{s.code || "—"}</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="name">{s.name}</div>
                    <div className="meta">
                      {s.controller.make} {s.controller.model} · {p.total} zones
                      {p.issues > 0 && (
                        <span className="spill crit" style={{ marginLeft: 6 }}>{p.issues} w/ issues</span>
                      )}
                    </div>
                    <div className="bar" style={{ marginTop: 6, height: 5 }}>
                      <span
                        style={{
                          width: `${pct}%`,
                          background: complete ? "var(--ok)" : "var(--accent)",
                        }}
                      />
                    </div>
                  </div>
                  <div className="pcount" style={{ color: complete ? "var(--ok)" : "var(--accent)" }}>
                    {complete ? "done" : `${pct}%`}
                  </div>
                </button>
              );
            })}
          </div>
        ))}

        <div style={{ padding: "16px" }}>
          <button
            className="primary"
            style={{ width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            onClick={onNew}
          >
            <PlusIcon /> New controller
          </button>
        </div>
      </div>
    </>
  );
}
