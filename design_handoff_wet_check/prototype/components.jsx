// SSC Wet Check — screens
// Loaded after React, Babel, data.js, tweaks-panel, ios-frame.
// Exports App to window.

const { useState, useEffect, useRef, useMemo } = React;

// ── tiny icon helpers ─────────────────────────────────────────
const Ico = {
  chev: (d='right', s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{transform: d==='left'?'scaleX(-1)':'none'}}><polyline points="9 6 15 12 9 18"/></svg>,
  back: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 6 9 12 15 18"/></svg>,
  cam:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2l2-2h4l2 2h2a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="3.5"/></svg>,
  plus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  share:() => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>,
  cloud:() => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M7 18a5 5 0 0 1-.5-10 6 6 0 0 1 11.5 1.5A4 4 0 0 1 17 18z"/></svg>,
  off:  () => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M2 4l20 20-1.4 1.4-3.5-3.5a4 4 0 0 1-.6.1H7a5 5 0 0 1-1-9.9 6 6 0 0 1 .9-2L.6 5.4 2 4zm5 5l8.1 8.1H7a3 3 0 0 1-.3-6 4 4 0 0 1 .3-2.1z"/></svg>,
  drop: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2s7 8.5 7 13a7 7 0 0 1-14 0c0-4.5 7-13 7-13z"/></svg>,
};

// ── top bar inside the phone ──────────────────────────────────
function TopBar({ online, queued, onBack }) {
  return (
    <div className="tbar">
      {onBack && (
        <button onClick={onBack} style={{
          width: 32, height: 32, borderRadius: 8, border: '1px solid var(--line)',
          background: 'var(--paper)', display: 'grid', placeItems: 'center', color: 'var(--ink-2)'
        }} aria-label="Back">{Ico.back()}</button>
      )}
      <div className="logo"><Ico.drop /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="title">SSC Wet Check</div>
        <div className="sub">Grounds · South Sector</div>
      </div>
      <span className={`sync ${online ? 'online' : 'offline'}`}>
        {online ? <Ico.cloud /> : <Ico.off />}
        {online ? 'Synced' : `Queue · ${queued}`}
      </span>
    </div>
  );
}

// ── progress strip ────────────────────────────────────────────
function ProgressStrip({ zones }) {
  const counts = zones.reduce((a, z) => { a[z.status] = (a[z.status]||0)+1; return a; }, {});
  const total = zones.length;
  const done = (counts.pass||0) + (counts.issues||0) + (counts.skip||0);
  const pct = Math.round(done / total * 100);
  return (
    <div className="progress">
      <div className="row">
        <span className="pct">In progress · {pct}%</span>
        <span className="count mono">{done}/{total}</span>
      </div>
      <div className="bar">
        <span style={{ width: `${(counts.pass||0)/total*100}%`,   background: 'var(--ok)' }} />
        <span style={{ width: `${(counts.issues||0)/total*100}%`, background: 'var(--crit)' }} />
        <span style={{ width: `${(counts.skip||0)/total*100}%`,   background: 'var(--skip)' }} />
      </div>
    </div>
  );
}

// ── Site card (always on overview) ────────────────────────────
function SiteCard({ site }) {
  return (
    <div className="site-card">
      <div className="hd">
        <h2>{site.name}</h2>
        <div className="meta">
          <span className="code mono">{site.code}</span>
          <span>{site.address}</span>
        </div>
      </div>
      <div className="body">
        <div className="kv"><div className="k">Controller</div><div className="v">{site.controller.make} {site.controller.model} · prog {site.controller.program}</div></div>
        <div className="kv"><div className="k">Water</div><div className="v">{site.water} <span className="spill accent">{site.controller.zones} zones</span></div></div>
        <div className="kv"><div className="k">Master</div><div className="v">{site.master.value} <span className="spill ok">OK</span></div></div>
        <div className="kv"><div className="k">Rain sensor</div><div className="v">{site.rain.value} <span className="spill warn">Bypass</span></div></div>
        <div className="kv"><div className="k">Tech</div><div className="v">{site.tech.name} · <span className="mono" style={{color:'var(--ink-3)', fontSize: 11}}>{site.tech.id}</span></div></div>
        <div className="kv"><div className="k">Started</div><div className="v">{site.date}</div></div>
        <div className="kv"><div className="k">Weather</div><div className="v" style={{color:'var(--ink-2)'}}>{site.weather}</div></div>
      </div>
    </div>
  );
}

// ── zone grid (overview) ──────────────────────────────────────
function ZoneGrid({ zones, currentId, onPick }) {
  return (
    <div className="zone-grid">
      {zones.map(z => {
        const cls = z.id === currentId ? 'now' : z.status;
        return (
          <button key={z.id} className={`zg-cell ${cls}`} onClick={() => onPick(z.id)} aria-label={`Zone ${z.id}`}>
            {z.id}
            {z.issues.length > 0 && <span className="badge">{z.issues.reduce((s,i)=>s+i.n,0)}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ── zone list (overview, alt density) ─────────────────────────
function ZoneList({ zones, currentId, onPick }) {
  return (
    <div className="zone-list">
      {zones.map(z => (
        <button key={z.id} className={`zl-row ${z.id===currentId?'now':''}`} onClick={() => onPick(z.id)}>
          <div className="id">{String(z.id).padStart(2,'0')}</div>
          <div>
            <div className="name">{z.name}</div>
            <div className="meta mono">{z.sprinkler} · {z.plant} · {z.runtime}min · {z.psi}psi</div>
          </div>
          <div className={`stat ${z.id===currentId?'pending':z.status}`}>
            {z.id===currentId ? 'now' : z.status}
            {z.status==='issues' && ` · ${z.issues.reduce((s,i)=>s+i.n,0)}`}
          </div>
        </button>
      ))}
    </div>
  );
}

// ── per-zone form (used by all interaction modes) ─────────────
function ZoneForm({ z, adjustments, onAdjustChange, onClose, onLog, onComplete }) {
  const [active, setActive] = useState(z.status === 'pass' || z.status === 'issues' ? 'yes' : null);
  const [psi, setPsi] = useState(z.psi);
  const [runtime, setRuntime] = useState(z.runtime);
  const [gpm, setGpm] = useState(z.gpm);
  const [coverage, setCoverage] = useState(z.issues.length === 0 && z.status === 'pass' ? 'ok' : null);
  const [drainage, setDrainage] = useState(null);
  const [note, setNote] = useState('');
  const logged = z.issues || [];

  return (
    <>
      <div className="z-head">
        <div className="num mono">{String(z.id).padStart(2,'0')}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2>{z.name}</h2>
          <div className="meta mono">{z.sprinkler} · {z.plant}</div>
        </div>
      </div>

      <div className="sec-hd"><span>Programmed</span><span className="right" style={{color:'var(--ink-3)', letterSpacing:0, textTransform:'none', fontWeight:400, fontSize:11}}>from config</span></div>
      <ProgrammedFixed programs={z.programs} />

      <div className="sec-hd" style={{marginTop:14}}><span>Adjustments</span></div>
      <AdjustmentsEditor z={z} value={adjustments} onChange={onAdjustChange} />

      <div className="sec-hd" style={{marginTop:14}}><span>Activation & flow</span></div>

      <div className="check">
        <div className="label">Activates from controller
          <div className="hint">Confirm valve opens within 10s</div>
        </div>
        <div className="yn">
          <button className={active==='yes'?'on yes':''}  onClick={() => setActive('yes')}>Yes</button>
          <button className={active==='no'?'on no':''}    onClick={() => setActive('no')}>No</button>
          <button className={active==='skip'?'on skip':''} onClick={() => setActive('skip')}>Skip</button>
        </div>
      </div>

      <div className="check">
        <div className="label">Pressure
          <div className="hint">Static / dynamic at zone</div>
        </div>
        <div className="num-input">
          <button onClick={() => setPsi(p => Math.max(0, p-1))}>−</button>
          <div className="val">{psi}<span className="unit">psi</span></div>
          <button onClick={() => setPsi(p => p+1)}>+</button>
        </div>
      </div>

      <div className="check">
        <div className="label">Runtime observed
          <div className="hint">Actual minutes run during wet check</div>
        </div>
        <div className="num-input">
          <button onClick={() => setRuntime(r => Math.max(0, r-1))}>−</button>
          <div className="val">{runtime}<span className="unit">min</span></div>
          <button onClick={() => setRuntime(r => r+1)}>+</button>
        </div>
      </div>

      <div className="check">
        <div className="label">Flow
          <div className="hint">Measured GPM at flow meter</div>
        </div>
        <div className="num-input">
          <button onClick={() => setGpm(p => Math.max(0, p-1))}>−</button>
          <div className="val">{gpm}<span className="unit">gpm</span></div>
          <button onClick={() => setGpm(p => p+1)}>+</button>
        </div>
      </div>

      <div className="sec-hd"><span>Field observation</span></div>

      <div className="check" style={{flexDirection:'column', alignItems:'stretch', gap: 10}}>
        <div className="label">Head coverage & arc
          <div className="hint">Walk the zone, eyeball patterns</div>
        </div>
        <div className="seg">
          <button className={coverage==='ok'?'on ok':''}       onClick={() => setCoverage('ok')}>Uniform</button>
          <button className={coverage==='watch'?'on watch':''} onClick={() => setCoverage('watch')}>Minor</button>
          <button className={coverage==='fix'?'on fix':''}     onClick={() => setCoverage('fix')}>Adjust</button>
        </div>
      </div>

      <div className="check" style={{flexDirection:'column', alignItems:'stretch', gap: 10}}>
        <div className="label">Soil moisture & drainage
          <div className="hint">Probe + visual after 2 min</div>
        </div>
        <div className="seg">
          <button className={drainage==='ok'?'on ok':''}       onClick={() => setDrainage('ok')}>Healthy</button>
          <button className={drainage==='watch'?'on watch':''} onClick={() => setDrainage('watch')}>Dry</button>
          <button className={drainage==='fix'?'on fix':''}     onClick={() => setDrainage('fix')}>Pooling</button>
        </div>
      </div>

      <div className="sec-hd">
        <span>Issues · {logged.length}</span>
        <button className="right" style={{background:'none', border:'none', cursor:'pointer', font:'inherit', fontWeight:600, fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap:4}} onClick={() => onLog && onLog('__open__')}>
          <Ico.plus /> Log{logged.length ? ' another' : ' issue'}
        </button>
      </div>

      {logged.length > 0 && (
        <div className="logged">
          {logged.map((it, i) => (
            <div key={i} className={`logged-item ${it.sev==='watch'?'watch':it.sev==='ok'?'ok':''}`}>
              <span className={`spill ${it.sev==='fix'?'crit':it.sev==='watch'?'warn':'ok'}`}>×{it.n}</span>
              <span>{it.t}</span>
              <span className="ph">{it.sev}</span>
            </div>
          ))}
          <button onClick={() => onLog && onLog('__open__')} style={{
            padding:'10px 12px', borderRadius:'var(--radius)',
            border:'1px dashed var(--line-2)', background:'transparent',
            color:'var(--accent)', fontWeight:600, fontSize:12.5,
            cursor:'pointer', fontFamily:'inherit',
            display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6
          }}><Ico.plus /> Log another issue</button>
        </div>
      )}

      <div className="sec-hd"><span>Photos · {z.photos}</span></div>
      <div className="photos">
        {Array.from({length: z.photos}).map((_,i) => (
          <div key={i} className="photo-thumb mono">IMG_{String(i+1).padStart(2,'0')}</div>
        ))}
        <div className="photo-thumb add" style={{color:'var(--accent)'}}><Ico.cam /></div>
      </div>

      <div className="sec-hd"><span>Notes</span></div>
      <div style={{padding:'0 16px 14px'}}>
        <textarea className="notes" placeholder="Anything else worth flagging…" value={note} onChange={e=>setNote(e.target.value)} />
      </div>

      <div className="zbar">
        <button className="ghost" onClick={onClose}>Save & close</button>
        <button className="primary" onClick={onComplete}>Mark done →</button>
      </div>
    </>
  );
}

Object.assign(window, { Ico, TopBar, ProgressStrip, SiteCard, ZoneGrid, ZoneList, ZoneForm });
