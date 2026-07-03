import { useState, type ReactNode } from "react";
import type { Site } from "../types";
import { TopBar } from "../components/TopBar";

interface Props {
  mode: "create" | "edit";
  site?: Site; // present in edit mode
  prefill?: Partial<Site>; // create mode: carry over tech/location/etc.
  online: boolean;
  onBack: () => void;
  onCreate: (input: Omit<Site, "id">, zoneCount: number) => void;
  onSave: (site: Site) => void;
  onDelete: (id: string) => void;
}

function blankSite(prefill?: Partial<Site>): Site {
  return {
    id: "",
    name: "",
    code: "",
    location: prefill?.location ?? "",
    address: "",
    campus: prefill?.campus ?? "",
    controller: { make: "", model: "", program: "A (Spring)", zones: 12 },
    water: prefill?.water ?? "Potable",
    master: { value: "", ok: true },
    rain: { value: "", ok: true },
    tech: { name: prefill?.tech?.name ?? "", id: prefill?.tech?.id ?? "" },
    date: prefill?.date ?? "",
    weather: prefill?.weather ?? "",
  };
}

export function ControllerForm({ mode, site, prefill, online, onBack, onCreate, onSave, onDelete }: Props) {
  const [s, setS] = useState<Site>(() =>
    mode === "edit" && site ? JSON.parse(JSON.stringify(site)) : blankSite(prefill)
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const originalZones = mode === "edit" && site ? site.controller.zones : 0;

  const set = (path: string, value: unknown) => {
    setS((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let cur: Record<string, unknown> = next;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]] as Record<string, unknown>;
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const isCreate = mode === "create";
  const canSave = s.name.trim().length > 0 && s.location.trim().length > 0;

  const submit = () => {
    if (!canSave) return;
    if (isCreate) {
      const { id: _omit, ...input } = s; // eslint-disable-line @typescript-eslint/no-unused-vars
      onCreate(input, Math.max(1, s.controller.zones));
    } else {
      onSave(s);
    }
  };

  return (
    <>
      <TopBar online={online} queued={0} onBack={onBack} />
      <div className="scroll scroll-safe">
        <div className="z-head">
          <div className="num mono" style={{ width: 44, height: 44, fontSize: 13, letterSpacing: "-0.01em" }}>
            {isCreate ? "NEW" : "EDIT"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2>{isCreate ? "New controller" : "Edit controller"}</h2>
            <div className="meta mono">
              {isCreate ? "Set up a new wet check job" : "Reference for this wet check"}
            </div>
          </div>
        </div>

        <div className="sec-hd"><span>Controller</span></div>
        <Field label="Controller name" hint="What you'll see in the list, e.g. “Liberty Hall Quad”">
          <input className="tx-input" value={s.name} placeholder="Controller / site name" onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Location" hint="Used to group & search controllers in the list">
          <input className="tx-input" value={s.location} placeholder="e.g. South Sector · SSC" onChange={(e) => set("location", e.target.value)} />
        </Field>
        <Field label="Site code" hint="Short identifier on PDF header and filenames">
          <input className="tx-input mono" value={s.code} placeholder="e.g. LHQ-04" onChange={(e) => set("code", e.target.value)} />
        </Field>
        <Field label="Address">
          <textarea className="tx-input" style={{ minHeight: 48, fontFamily: "inherit", resize: "none" }} value={s.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <Field label="Campus / sector">
          <input className="tx-input" value={s.campus} onChange={(e) => set("campus", e.target.value)} />
        </Field>

        <div className="sec-hd" style={{ marginTop: 14 }}><span>Hardware</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid var(--line)" }}>
          <div style={{ padding: "10px 12px 10px 16px", borderRight: "1px solid var(--line)" }}>
            <span className="field-label">Make</span>
            <input className="tx-input" value={s.controller.make} placeholder="Hunter" onChange={(e) => set("controller.make", e.target.value)} />
          </div>
          <div style={{ padding: "10px 16px 10px 12px" }}>
            <span className="field-label">Model</span>
            <input className="tx-input mono" value={s.controller.model} placeholder="ACC2-1400" onChange={(e) => set("controller.model", e.target.value)} />
          </div>
        </div>
        <Field label="Active program">
          <div className="seg">
            {["A", "B", "C", "D"].map((p) => (
              <button key={p} className={s.controller.program?.startsWith(p) ? "on ok" : ""} onClick={() => set("controller.program", p + " (Spring)")}>{p}</button>
            ))}
          </div>
        </Field>
        <Row label={isCreate ? "Number of zones to create" : "Zones on this controller"}>
          <div className="num-input" style={{ height: 32 }}>
            <button onClick={() => set("controller.zones", Math.max(1, s.controller.zones - 1))}>−</button>
            <div className="val" style={{ padding: "6px 8px", fontSize: 13, minWidth: 56 }}>{s.controller.zones}</div>
            <button onClick={() => set("controller.zones", s.controller.zones + 1)}>+</button>
          </div>
        </Row>
        {isCreate && (
          <div style={{ padding: "0 16px 12px", fontSize: 11, color: "var(--ink-3)" }}>
            We'll create {s.controller.zones} blank zones (Zone 01…{String(s.controller.zones).padStart(2, "0")}).
            You can rename them or import a CSV afterwards.
          </div>
        )}
        {!isCreate && s.controller.zones > originalZones && (
          <div style={{ padding: "0 16px 12px", fontSize: 11, color: "var(--ink-3)" }}>
            Saving will add {s.controller.zones - originalZones} blank zone(s) at the end.
          </div>
        )}
        {!isCreate && s.controller.zones < originalZones && (
          <div style={{ padding: "0 16px 12px", fontSize: 11, color: "var(--crit)" }}>
            Saving will permanently remove the last {originalZones - s.controller.zones} zone(s)
            and any photos on them. To delete a specific zone instead, use the zone list on the previous screen.
          </div>
        )}

        <div className="sec-hd" style={{ marginTop: 14 }}><span>Water &amp; devices</span></div>
        <Field label="Water source">
          <div className="seg">
            {(["Potable", "Reclaimed", "Well"] as const).map((w) => (
              <button key={w} className={s.water === w ? "on ok" : ""} onClick={() => set("water", w)}>{w}</button>
            ))}
          </div>
        </Field>
        <Field label="Master valve">
          <input className="tx-input" value={s.master.value} placeholder="e.g. Open · 62 psi" onChange={(e) => set("master.value", e.target.value)} />
          <div style={{ marginTop: 8 }} className="yn">
            <button className={s.master.ok ? "on yes" : ""} onClick={() => set("master.ok", true)}>OK</button>
            <button className={!s.master.ok ? "on no" : ""} onClick={() => set("master.ok", false)}>Issue</button>
          </div>
        </Field>
        <Field label="Rain sensor">
          <input className="tx-input" value={s.rain.value} placeholder="e.g. Bypass · 24h" onChange={(e) => set("rain.value", e.target.value)} />
          <div style={{ marginTop: 8 }} className="yn">
            <button className={s.rain.ok ? "on yes" : ""} onClick={() => set("rain.ok", true)}>OK</button>
            <button className={!s.rain.ok ? "on no" : ""} onClick={() => set("rain.ok", false)}>Bypass</button>
          </div>
        </Field>

        <div className="sec-hd" style={{ marginTop: 14 }}><span>Crew &amp; conditions</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", borderBottom: "1px solid var(--line)" }}>
          <div style={{ padding: "10px 12px 10px 16px", borderRight: "1px solid var(--line)" }}>
            <span className="field-label">Tech name</span>
            <input className="tx-input" value={s.tech.name} onChange={(e) => set("tech.name", e.target.value)} />
          </div>
          <div style={{ padding: "10px 16px 10px 12px" }}>
            <span className="field-label">Tech ID</span>
            <input className="tx-input mono" value={s.tech.id} onChange={(e) => set("tech.id", e.target.value)} />
          </div>
        </div>
        <Field label="Started" hint="Auto-stamped when the wet check begins; editable for back-dated entries">
          <input className="tx-input mono" value={s.date} onChange={(e) => set("date", e.target.value)} />
        </Field>
        <Field label="Weather">
          <input className="tx-input" value={s.weather} onChange={(e) => set("weather", e.target.value)} />
        </Field>

        {!isCreate && (
          <>
            <div className="sec-hd" style={{ marginTop: 14 }}><span>Danger zone</span></div>
            <div style={{ padding: "12px 16px 20px" }}>
              {!confirmDelete ? (
                <button
                  className="ghost"
                  style={{ width: "100%", height: 44, borderRadius: "var(--radius)", border: "1px solid var(--crit)", background: "var(--crit-2)", color: "var(--crit)", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete this controller
                </button>
              ) : (
                <div style={{ border: "1px solid var(--crit)", borderRadius: "var(--radius)", padding: 12, background: "var(--crit-2)" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--crit)" }}>
                    Permanently delete “{s.name || "this controller"}”?
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-2)", margin: "4px 0 10px" }}>
                    This removes the controller and all {originalZones} of its zones, photos and inspection
                    data. This cannot be undone.
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      style={{ flex: 1, height: 40, borderRadius: "var(--radius)", border: "1px solid var(--line-2)", background: "var(--paper)", color: "var(--ink)", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </button>
                    <button
                      style={{ flex: 1, height: 40, borderRadius: "var(--radius)", border: "1px solid var(--crit)", background: "var(--crit)", color: "var(--paper)", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                      onClick={() => site && onDelete(site.id)}
                    >
                      Yes, delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="zbar">
        <button className="ghost" onClick={onBack}>Cancel</button>
        <button className="primary" disabled={!canSave} onClick={submit}>
          {isCreate ? "Create controller" : "Save controller"}
        </button>
      </div>
    </>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--line)" }}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
      {children}
    </div>
  );
}
