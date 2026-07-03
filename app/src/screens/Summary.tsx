import { useState } from "react";
import type { ProgramKey, Site, Zone } from "../types";
import { TopBar } from "../components/TopBar";
import { ShareIcon } from "../components/Icons";
import { LABOR_RATE } from "../lib/constants";
import { saveReport, shareReport } from "../lib/pdf";

interface Props {
  site: Site;
  zones: Zone[];
  online: boolean;
  onBack: () => void;
}

export function Summary({ site, zones, online, onBack }: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const issues = zones.flatMap((z) => z.issues.map((i) => ({ ...i, zone: z.num, name: z.name })));
  const fix = issues.filter((i) => i.sev === "fix");
  const watch = issues.filter((i) => i.sev === "watch");
  const cost = fix.reduce((s, i) => s + i.n * LABOR_RATE.fix, 0) + watch.reduce((s, i) => s + i.n * LABOR_RATE.watch, 0);
  const adjustedZones = zones.filter((z) => z.adjustments && Object.keys(z.adjustments).length);
  const adjCount = zones.reduce((s, z) => s + (z.adjustments ? Object.keys(z.adjustments).length : 0), 0);

  const onEmail = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const result = await shareReport({ site, zones });
      setMsg(result === "shared" ? "Opened the share sheet — pick Mail to send." : "PDF downloaded — attach it to an email to send.");
    } catch {
      setMsg("Could not create the PDF. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <TopBar online={online} queued={0} onBack={onBack} />
      <div className="scroll scroll-safe">
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 600 }}>
            Wet check complete
          </div>
          <h1 style={{ margin: "6px 0 4px", fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>{site.name}</h1>
          <div style={{ fontSize: 13, color: "var(--ink-2)" }}>{site.date}</div>
        </div>

        <div className="tiles">
          <Tile label="Zones" value={zones.length} sub="inspected" />
          <Tile label="Issues" value={issues.length} sub={`${fix.length} fix · ${watch.length} watch`} accent="crit" />
          <Tile label="Adjustments" value={adjCount} sub={`across ${adjustedZones.length} zone(s)`} accent="accent" />
          <Tile label="Est. labor" value={`$${cost}`} sub="materials separate" />
        </div>

        <div className="sec-hd"><span>Schedule adjustments</span></div>
        <div className="logged">
          {adjustedZones.flatMap((z) =>
            (Object.entries(z.adjustments!) as [ProgramKey, NonNullable<Zone["adjustments"]>[ProgramKey]][]).map(([k, a]) => {
              if (!a) return null;
              const orig = z.programs[k];
              return (
                <div
                  key={`${z.id}-${k}`}
                  className="logged-item"
                  style={{ borderLeftColor: "var(--accent)", gridTemplateColumns: "auto 1fr", alignItems: "start", padding: "10px 12px" }}
                >
                  <span className="spill accent mono">Z{String(z.num).padStart(2, "0")}·{k}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>{z.name}</div>
                    <div className="adj-cmp" style={{ marginTop: 4 }}>
                      <span className="from">{orig.runtime}m · {orig.days.join("·") || "—"}</span>
                      <span className="arrow">→</span>
                      <span className="to">{a.runtime}m · {a.days.join("·") || "—"}</span>
                    </div>
                    {a.reason && (
                      <div style={{ fontSize: 11.5, color: "var(--ink-2)", marginTop: 4, fontStyle: "italic" }}>“{a.reason}”</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {adjustedZones.length === 0 && (
            <div style={{ padding: "8px 4px", color: "var(--ink-3)", fontSize: 12 }}>No schedule changes proposed.</div>
          )}
        </div>

        <div className="sec-hd"><span>Fix now · {fix.length}</span></div>
        <div className="logged">
          {fix.map((i, k) => (
            <div key={k} className="logged-item">
              <span className="spill crit mono">Z{String(i.zone).padStart(2, "0")}</span>
              <span>{i.t} <span style={{ color: "var(--ink-3)" }}>· {i.name}</span></span>
              <span className="ph mono">×{i.n}</span>
            </div>
          ))}
          {fix.length === 0 && <div style={{ padding: "8px 4px", color: "var(--ink-3)", fontSize: 12 }}>No critical issues found.</div>}
        </div>

        <div className="sec-hd"><span>Watch · {watch.length}</span></div>
        <div className="logged">
          {watch.map((i, k) => (
            <div key={k} className="logged-item watch">
              <span className="spill warn mono">Z{String(i.zone).padStart(2, "0")}</span>
              <span>{i.t} <span style={{ color: "var(--ink-3)" }}>· {i.name}</span></span>
              <span className="ph mono">×{i.n}</span>
            </div>
          ))}
          {watch.length === 0 && <div style={{ padding: "8px 4px", color: "var(--ink-3)", fontSize: 12 }}>Nothing flagged to watch.</div>}
        </div>

        {msg && (
          <div style={{ margin: "8px 16px", padding: "10px 12px", borderRadius: "var(--radius)", background: "var(--ok-2)", color: "var(--ok)", fontSize: 12.5, fontWeight: 600 }}>
            {msg}
          </div>
        )}
        <div style={{ height: 12 }} />
      </div>

      <div className="zbar">
        <button className="ghost" onClick={() => saveReport({ site, zones })}>Save PDF</button>
        <button className="primary" disabled={busy} onClick={onEmail}>
          <ShareIcon /> {busy ? "Preparing…" : "Email PDF"}
        </button>
      </div>
    </>
  );
}

function Tile({ label, value, sub, accent }: { label: string; value: string | number; sub: string; accent?: "crit" | "accent" }) {
  return (
    <div className="tile">
      <div className="label">{label}</div>
      <div className={`value ${accent || ""}`}>{value}</div>
      <div className="sub">{sub}</div>
    </div>
  );
}
