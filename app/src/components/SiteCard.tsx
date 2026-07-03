import type { Site } from "../types";

export function SiteCard({ site, onEdit }: { site: Site; onEdit?: () => void }) {
  return (
    <div className="site-card">
      <div className="hd">
        <div className="hd-row">
          <h2>{site.name}</h2>
          {onEdit && (
            <button className="link-btn accent site-edit" onClick={onEdit}>Edit</button>
          )}
        </div>
        <div className="meta">
          <span className="code mono">{site.code}</span>
          <span>{site.address}</span>
        </div>
      </div>
      <div className="body">
        <div className="kv">
          <div className="k">Controller</div>
          <div className="v">
            {site.controller.make} {site.controller.model} · prog {site.controller.program}
          </div>
        </div>
        <div className="kv">
          <div className="k">Water</div>
          <div className="v">
            {site.water} <span className="spill accent">{site.controller.zones} zones</span>
          </div>
        </div>
        <div className="kv">
          <div className="k">Master</div>
          <div className="v">
            {site.master.value} <span className={`spill ${site.master.ok ? "ok" : "crit"}`}>{site.master.ok ? "OK" : "Issue"}</span>
          </div>
        </div>
        <div className="kv">
          <div className="k">Rain sensor</div>
          <div className="v">
            {site.rain.value} <span className={`spill ${site.rain.ok ? "ok" : "warn"}`}>{site.rain.ok ? "OK" : "Bypass"}</span>
          </div>
        </div>
        <div className="kv">
          <div className="k">Tech</div>
          <div className="v">
            {site.tech.name} · <span className="mono" style={{ color: "var(--ink-3)", fontSize: 11 }}>{site.tech.id}</span>
          </div>
        </div>
        <div className="kv">
          <div className="k">Started</div>
          <div className="v">{site.date}</div>
        </div>
        <div className="kv">
          <div className="k">Weather</div>
          <div className="v" style={{ color: "var(--ink-2)" }}>{site.weather}</div>
        </div>
      </div>
    </div>
  );
}
