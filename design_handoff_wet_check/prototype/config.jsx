// SSC Wet Check — config screens + programmed/adjustments components
const { useState: ucS } = React;

// ── compact read-only "Programmed schedule" block ────────────
function ProgrammedFixed({ programs }) {
  const active = Object.entries(programs).filter(([, p]) => p.enabled);
  if (active.length === 0) {
    return <div className="prog-fixed" style={{color:'var(--ink-3)', fontSize:12, textAlign:'center'}}>No active programs configured</div>;
  }
  return (
    <div className="prog-fixed">
      {active.map(([k, p]) => (
        <div key={k} className="pf-row">
          <div className="pf-tag">{k}</div>
          <div className="pf-rt">{p.runtime}<span style={{color:'var(--ink-3)', fontWeight:400, fontSize:10, marginLeft:2}}>min</span></div>
          <div className="pf-days">
            {window.DAYS.map(d => (
              <div key={d} className={`pf-day ${p.days.includes(d)?'on':''}`}>{d[0]}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── adjustments editor (per program override) ────────────────
function AdjustmentsEditor({ z, value, onChange }) {
  const active = Object.entries(z.programs).filter(([, p]) => p.enabled);
  const adj = value || {};

  const update = (k, patch) => {
    onChange({ ...adj, [k]: { ...(adj[k] || { runtime: z.programs[k].runtime, days: [...z.programs[k].days], reason: '' }), ...patch } });
  };
  const clear = (k) => {
    const next = { ...adj }; delete next[k]; onChange(Object.keys(next).length ? next : null);
  };
  const toggleDay = (k, d) => {
    const cur = (adj[k]?.days) ?? [...z.programs[k].days];
    const next = cur.includes(d) ? cur.filter(x => x !== d) : [...cur, d];
    update(k, { days: next });
  };

  const hasAny = Object.keys(adj).length > 0;

  return (
    <div className="adj-card">
      <div className="adj-hd">
        <span>Proposed adjustments</span>
        <span style={{color: hasAny ? 'var(--accent)' : 'var(--ink-3)'}}>{hasAny ? `${Object.keys(adj).length} change${Object.keys(adj).length>1?'s':''}` : 'no changes'}</span>
      </div>
      <div className="adj-body">
        {active.map(([k, p]) => {
          const a = adj[k];
          const rt = a?.runtime ?? p.runtime;
          const days = a?.days ?? p.days;
          const dirty = !!a && (a.runtime !== p.runtime || JSON.stringify([...a.days].sort()) !== JSON.stringify([...p.days].sort()));
          return (
            <div key={k} className="adj-prog">
              <div className="pf-tag" style={{background: a ? 'var(--accent)' : 'var(--paper-3)', color: a ? 'var(--paper)' : 'var(--ink-2)'}}>{k}</div>
              <div>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:8}}>
                  <div className="num-input" style={{height:32}}>
                    <button onClick={() => update(k, { runtime: Math.max(0, rt - 1) })}>−</button>
                    <div className="val" style={{padding:'6px 8px', minWidth: 56, fontSize: 13}}>{rt}<span className="unit">min</span></div>
                    <button onClick={() => update(k, { runtime: rt + 1 })}>+</button>
                  </div>
                  {dirty && (
                    <button onClick={() => clear(k)} style={{background:'none', border:'none', color:'var(--ink-3)', fontSize:11, cursor:'pointer', fontFamily:'inherit'}}>Reset</button>
                  )}
                </div>
                <div className="prog-row" style={{padding:0, border:'none', display:'block'}}>
                  <div className="days">
                    {window.DAYS.map(d => (
                      <button key={d} className={`day ${days.includes(d)?'on':''}`} onClick={() => toggleDay(k, d)}>{d[0]}</button>
                    ))}
                  </div>
                </div>
                {dirty && (
                  <div className="adj-cmp" style={{marginTop:8}}>
                    <span className="from">{p.runtime}m · {p.days.join('·')||'—'}</span>
                    <span className="arrow">→</span>
                    <span className="to">{rt}m · {days.join('·')||'—'}</span>
                  </div>
                )}
                {a && (
                  <textarea className="notes" placeholder="Reason (included in PDF)…"
                    value={a.reason || ''} onChange={e => update(k, { reason: e.target.value })} />
                )}
              </div>
            </div>
          );
        })}
        {active.length === 0 && (
          <div style={{padding:'8px 4px', color:'var(--ink-3)', fontSize:12}}>Configure a program first to propose adjustments.</div>
        )}
      </div>
    </div>
  );
}

// ── Zone-config form (full programs editor) ──────────────────
function ZoneConfigForm({ z, onSave, onClose }) {
  const [name, setName] = ucS(z.name);
  const [programs, setPrograms] = ucS(z.programs);

  const setProg = (k, patch) => setPrograms(p => ({ ...p, [k]: { ...p[k], ...patch } }));
  const toggleDay = (k, d) => {
    const cur = programs[k].days;
    const next = cur.includes(d) ? cur.filter(x => x !== d) : [...cur, d];
    setProg(k, { days: next });
  };

  return (
    <>
      <div className="z-head">
        <div className="num mono">{String(z.id).padStart(2,'0')}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2>Configure zone</h2>
          <div className="meta mono">{z.sprinkler} · {z.plant}</div>
        </div>
      </div>

      <div className="sec-hd"><span>Zone name</span></div>
      <div style={{padding:'0 16px 14px'}}>
        <input className="tx-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. North lawn — main" />
        <div style={{fontSize:11, color:'var(--ink-3)', marginTop:6}}>Shown on controller, inspection form, and PDF.</div>
      </div>

      <div className="sec-hd"><span>Programs</span></div>
      {['A','B','C','D'].map(k => {
        const p = programs[k];
        return (
          <div key={k} className="prog-row">
            <div className={`tag ${p.enabled?'on':'off'}`}>{k}</div>
            <div>
              <div className="head">
                <div className="name">Program {k}{!p.enabled && <span style={{color:'var(--ink-3)', fontWeight:400, marginLeft:8, fontSize:11}}>not in use</span>}</div>
                <div className="yn" style={{height:28}}>
                  <button className={p.enabled?'on yes':''} style={{padding:'4px 10px', fontSize:11}} onClick={() => setProg(k, {enabled:true})}>On</button>
                  <button className={!p.enabled?'on skip':''} style={{padding:'4px 10px', fontSize:11}} onClick={() => setProg(k, {enabled:false})}>Off</button>
                </div>
              </div>
              {p.enabled && (
                <>
                  <div style={{display:'flex', alignItems:'center', gap: 10, marginBottom: 10}}>
                    <span className="field-label" style={{marginBottom:0, flex:1}}>Run time</span>
                    <div className="num-input" style={{height:32}}>
                      <button onClick={() => setProg(k, {runtime: Math.max(0, p.runtime - 1)})}>−</button>
                      <div className="val" style={{padding:'6px 8px', fontSize:13, minWidth:56}}>{p.runtime}<span className="unit">min</span></div>
                      <button onClick={() => setProg(k, {runtime: p.runtime + 1})}>+</button>
                    </div>
                  </div>
                  <span className="field-label">Days</span>
                  <div className="days">
                    {window.DAYS.map(d => (
                      <button key={d} className={`day ${p.days.includes(d)?'on':''}`} onClick={() => toggleDay(k, d)}>{d[0]}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}

      <div className="zbar">
        <button className="ghost" onClick={onClose}>Cancel</button>
        <button className="primary" onClick={() => onSave({ name, programs })}>Save zone</button>
      </div>
    </>
  );
}

// ── Config list (overview of all zones with their schedules) ─
function ConfigList({ zones, onPick }) {
  return (
    <>
      <div className="sec-hd">
        <span>All zones · {zones.length}</span>
        <span style={{color:'var(--ink-3)', letterSpacing:0, textTransform:'none', fontWeight:400}}>Tap to edit</span>
      </div>
      {zones.map(z => {
        const active = Object.entries(z.programs).filter(([, p]) => p.enabled);
        return (
          <button key={z.id} className="cfg-row" onClick={() => onPick(z.id)}>
            <div className="id">{String(z.id).padStart(2,'0')}</div>
            <div>
              <div className="name">{z.name}</div>
              <div className="meta">
                {active.length === 0
                  ? '— no programs —'
                  : active.map(([k, p]) => `${k}:${p.runtime}m·${p.days.join('')||'—'}`).join('  ')}
              </div>
            </div>
            <div className="pcount"><b>{active.length}</b> prog</div>
          </button>
        );
      })}
    </>
  );
}

// ── Site & Controller config (editable site card) ────────────
function SiteConfigForm({ site, onSave, onClose }) {
  const [s, setS] = ucS(JSON.parse(JSON.stringify(site)));
  const set = (path, value) => {
    setS(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const Field = ({ label, hint, children }) => (
    <div style={{padding:'10px 16px', borderBottom:'1px solid var(--line)'}}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <div style={{fontSize:11, color:'var(--ink-3)', marginTop:6}}>{hint}</div>}
    </div>
  );
  const Row = ({ label, children }) => (
    <div style={{padding:'12px 16px', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12}}>
      <span style={{fontSize:13, fontWeight:500}}>{label}</span>
      {children}
    </div>
  );

  return (
    <>
      <div className="z-head">
        <div className="num mono" style={{width:44, height:44, fontSize:14, letterSpacing:'-0.01em'}}>SITE</div>
        <div style={{flex:1, minWidth:0}}>
          <h2>Site & controller</h2>
          <div className="meta mono">Fixed reference for every inspection</div>
        </div>
      </div>

      <div className="sec-hd"><span>Site</span></div>
      <Field label="Site name">
        <input className="tx-input" value={s.name} onChange={e => set('name', e.target.value)} />
      </Field>
      <Field label="Site code" hint="Short identifier on PDF header and filenames">
        <input className="tx-input mono" value={s.code} onChange={e => set('code', e.target.value)} />
      </Field>
      <Field label="Address">
        <textarea className="tx-input" style={{minHeight:48, fontFamily:'inherit', resize:'none'}}
          value={s.address} onChange={e => set('address', e.target.value)} />
      </Field>
      <Field label="Campus / sector">
        <input className="tx-input" value={s.campus} onChange={e => set('campus', e.target.value)} />
      </Field>

      <div className="sec-hd" style={{marginTop:14}}><span>Controller</span></div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:0, borderBottom:'1px solid var(--line)'}}>
        <div style={{padding:'10px 12px 10px 16px', borderRight:'1px solid var(--line)'}}>
          <span className="field-label">Make</span>
          <input className="tx-input" value={s.controller.make} onChange={e => set('controller.make', e.target.value)} />
        </div>
        <div style={{padding:'10px 16px 10px 12px'}}>
          <span className="field-label">Model</span>
          <input className="tx-input mono" value={s.controller.model} onChange={e => set('controller.model', e.target.value)} />
        </div>
      </div>
      <Field label="Active program">
        <div className="seg">
          {['A','B','C','D'].map(p => (
            <button key={p} className={s.controller.program?.startsWith(p)?'on ok':''}
              onClick={() => set('controller.program', p + ' (Spring)')}>{p}</button>
          ))}
        </div>
      </Field>
      <Row label="Zones on this controller">
        <div className="num-input" style={{height:32}}>
          <button onClick={() => set('controller.zones', Math.max(1, s.controller.zones - 1))}>−</button>
          <div className="val" style={{padding:'6px 8px', fontSize:13, minWidth:56}}>{s.controller.zones}</div>
          <button onClick={() => set('controller.zones', s.controller.zones + 1)}>+</button>
        </div>
      </Row>

      <div className="sec-hd" style={{marginTop:14}}><span>Water & devices</span></div>
      <Field label="Water source">
        <div className="seg">
          {['Potable','Reclaimed','Well'].map(w => (
            <button key={w} className={s.water===w?'on ok':''} onClick={() => set('water', w)}>{w}</button>
          ))}
        </div>
      </Field>
      <Field label="Master valve">
        <input className="tx-input" value={s.master.value} placeholder="e.g. Open · 62 psi"
          onChange={e => set('master.value', e.target.value)} />
        <div style={{marginTop:8}} className="yn">
          <button className={s.master.ok ? 'on yes' : ''} onClick={() => set('master.ok', true)}>OK</button>
          <button className={!s.master.ok ? 'on no' : ''} onClick={() => set('master.ok', false)}>Issue</button>
        </div>
      </Field>
      <Field label="Rain sensor">
        <input className="tx-input" value={s.rain.value} placeholder="e.g. Bypass · 24h"
          onChange={e => set('rain.value', e.target.value)} />
        <div style={{marginTop:8}} className="yn">
          <button className={s.rain.ok ? 'on yes' : ''} onClick={() => set('rain.ok', true)}>OK</button>
          <button className={!s.rain.ok ? 'on no' : ''} onClick={() => set('rain.ok', false)}>Bypass</button>
        </div>
      </Field>

      <div className="sec-hd" style={{marginTop:14}}><span>Crew & conditions</span></div>
      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', borderBottom:'1px solid var(--line)'}}>
        <div style={{padding:'10px 12px 10px 16px', borderRight:'1px solid var(--line)'}}>
          <span className="field-label">Tech name</span>
          <input className="tx-input" value={s.tech.name} onChange={e => set('tech.name', e.target.value)} />
        </div>
        <div style={{padding:'10px 16px 10px 12px'}}>
          <span className="field-label">Tech ID</span>
          <input className="tx-input mono" value={s.tech.id} onChange={e => set('tech.id', e.target.value)} />
        </div>
      </div>
      <Field label="Started" hint="Auto-stamped when the wet check begins; editable for back-dated entries">
        <input className="tx-input mono" value={s.date} onChange={e => set('date', e.target.value)} />
      </Field>
      <Field label="Weather">
        <input className="tx-input" value={s.weather} onChange={e => set('weather', e.target.value)} />
      </Field>

      <div className="zbar">
        <button className="ghost" onClick={onClose}>Cancel</button>
        <button className="primary" onClick={() => onSave(s)}>Save site</button>
      </div>
    </>
  );
}

// ── CSV import card ──────────────────────────────────────────
function CsvImporter({ zones, onImport }) {
  const fileRef = React.useRef(null);
  const [status, setStatus] = ucS(null); // {ok, count, errors}

  const parseDays = (s) => {
    if (!s) return [];
    // accept "MWF", "M W F", "M,W,F", "Mo Tu", "Su,M,Tu,W,Th,F,Sa"
    const tokens = s.replace(/\s+/g, '').split(/[,;|]/).filter(Boolean);
    const valid = new Set(window.DAYS); // Su M Tu W Th F Sa
    const out = [];
    if (tokens.length === 1 && tokens[0].length > 2) {
      // compact like MWF — split on capitals
      const compact = tokens[0].match(/[A-Z][a-z]?/g) || [];
      compact.forEach(t => valid.has(t) && out.push(t));
    } else {
      tokens.forEach(t => {
        const norm = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
        const map = { Sun:'Su', Mon:'M', Tue:'Tu', Wed:'W', Thu:'Th', Fri:'F', Sat:'Sa', S:'Sa' };
        const v = map[norm] || norm;
        if (valid.has(v)) out.push(v);
      });
    }
    return [...new Set(out)];
  };

  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) throw new Error('CSV has no data rows');
        const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g,''));
        const idIdx   = header.findIndex(h => h === 'zone' || h === 'id' || h === 'zone_id' || h === 'zoneid');
        const nameIdx = header.findIndex(h => h === 'name' || h === 'zone_name');
        if (idIdx === -1) throw new Error('Missing required "zone" or "id" column');

        const progCols = { A: {}, B: {}, C: {}, D: {} };
        header.forEach((h, i) => {
          const m = h.match(/^([abcd])_?(runtime|min|minutes|days|enabled|on)$/);
          if (m) progCols[m[1].toUpperCase()][m[2]] = i;
        });

        const updates = [];
        const errors = [];
        for (let li = 1; li < lines.length; li++) {
          const row = lines[li].split(',').map(c => c.trim());
          const id = parseInt(row[idIdx], 10);
          if (!id) { errors.push(`Row ${li+1}: invalid zone id`); continue; }
          const zone = zones.find(z => z.id === id);
          if (!zone) { errors.push(`Row ${li+1}: zone ${id} not found`); continue; }
          const patch = { id };
          if (nameIdx !== -1 && row[nameIdx]) patch.name = row[nameIdx];
          const programs = JSON.parse(JSON.stringify(zone.programs));
          ['A','B','C','D'].forEach(k => {
            const c = progCols[k];
            if (!c) return;
            const rt = c.runtime != null ? parseInt(row[c.runtime], 10) :
                       c.min != null     ? parseInt(row[c.min], 10) :
                       c.minutes != null ? parseInt(row[c.minutes], 10) : null;
            const ds = c.days != null ? parseDays(row[c.days]) : null;
            const en = c.enabled != null ? /^(1|true|yes|on)$/i.test(row[c.enabled]) :
                       c.on != null      ? /^(1|true|yes|on)$/i.test(row[c.on]) : null;
            if (rt != null && !isNaN(rt)) { programs[k].runtime = rt; if (rt > 0) programs[k].enabled = true; }
            if (ds != null) { programs[k].days = ds; if (ds.length > 0) programs[k].enabled = true; }
            if (en != null) programs[k].enabled = en;
          });
          patch.programs = programs;
          updates.push(patch);
        }
        onImport(updates);
        setStatus({ ok: true, count: updates.length, errors, total: lines.length - 1 });
      } catch (err) {
        setStatus({ ok: false, message: err.message });
      }
    };
    reader.readAsText(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const downloadTemplate = () => {
    const sample = zones.slice(0, 3).map(z => {
      const A = z.programs.A, B = z.programs.B;
      return [z.id, `"${z.name}"`, A.runtime, A.days.join(';'), B.runtime, B.days.join(';')].join(',');
    }).join('\n');
    const csv = 'zone,name,A_runtime,A_days,B_runtime,B_days\n' + sample;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ssc-zones-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{margin: '0 16px 8px'}}>
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          border: '1.5px dashed var(--line-2)',
          borderRadius: 'var(--radius)',
          padding: '14px 14px',
          background: 'var(--paper-2)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <div style={{
          width:36, height:36, borderRadius:8, background:'var(--accent)', color:'var(--paper)',
          display:'grid', placeItems:'center', flexShrink:0
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontWeight:600, fontSize:13}}>Import zones from CSV</div>
          <div style={{fontSize:11, color:'var(--ink-3)', marginTop:2}}>
            Tap to browse or drop a file · expects <span className="mono">zone, name, A_runtime, A_days, …</span>
          </div>
        </div>
      </div>
      <input ref={fileRef} type="file" accept=".csv,text/csv" style={{display:'none'}}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6, padding:'0 2px'}}>
        <button onClick={downloadTemplate} style={{
          background:'none', border:'none', color:'var(--accent)', fontFamily:'inherit',
          fontSize:11, fontWeight:600, letterSpacing:'0.04em', cursor:'pointer'
        }}>↓ Download template</button>
        {status && status.ok && (
          <span className="spill ok mono">{status.count} updated · {status.errors.length ? `${status.errors.length} skipped` : 'no errors'}</span>
        )}
        {status && !status.ok && (
          <span className="spill crit">{status.message}</span>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ProgrammedFixed, AdjustmentsEditor, ZoneConfigForm, ConfigList, SiteConfigForm, CsvImporter });
