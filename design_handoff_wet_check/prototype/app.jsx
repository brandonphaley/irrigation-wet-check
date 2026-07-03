// SSC Wet Check — main app + issue modal + swipe mode + summary
const { useState: uS, useEffect: uE, useMemo: uM, useRef: uR } = React;

function IssueModal({ z, onSave, onClose }) {
  const [type, setType] = uS(null);
  const [sev, setSev]   = uS('fix');
  const [count, setCount] = uS(1);
  const [note, setNote] = uS('');
  const [flash, setFlash] = uS(null);

  const handleSave = (issue, andAnother) => {
    onSave(issue, andAnother);
    if (andAnother) {
      setFlash(issue.t);
      setType(null); setSev('fix'); setCount(1); setNote('');
      setTimeout(() => setFlash(null), 1400);
    }
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="grab" />
        <div className="mhd">
          <h3>Log issue · Zone {String(z.id).padStart(2,'0')}</h3>
          <p>{z.name}{z.issues && z.issues.length > 0 && <span style={{marginLeft:6, color:'var(--accent)'}}> · {z.issues.length} already logged</span>}</p>
          {flash && (
            <div style={{marginTop:8, padding:'6px 10px', borderRadius:6, background:'var(--ok-2)', color:'var(--ok)', fontSize:11.5, fontWeight:600}}>
              ✓ Saved “{flash}” — log another below
            </div>
          )}
        </div>
        <div className="mbody">
          <div className="sec-hd"><span>Type</span></div>
          <div className="iss-grid">
            {window.ISSUE_TYPES.map(it => (
              <button key={it.k} className={`iss-chip ${type===it.k?'on':''}`} onClick={() => setType(it.k)}>
                <span className="ico">{it.icon}</span>
                <span>{it.label}</span>
              </button>
            ))}
          </div>
          <div className="sec-hd"><span>Severity</span></div>
          <div style={{padding:'0 16px 12px'}}>
            <div className="seg">
              <button className={sev==='ok'?'on ok':''}       onClick={() => setSev('ok')}>OK · monitor</button>
              <button className={sev==='watch'?'on watch':''} onClick={() => setSev('watch')}>Watch</button>
              <button className={sev==='fix'?'on fix':''}     onClick={() => setSev('fix')}>Fix now</button>
            </div>
          </div>
          <div className="sec-hd"><span>Count</span></div>
          <div style={{padding:'0 16px 12px'}}>
            <div className="num-input">
              <button onClick={() => setCount(c => Math.max(1, c-1))}>−</button>
              <div className="val">{count}</div>
              <button onClick={() => setCount(c => c+1)}>+</button>
            </div>
          </div>
          <div className="sec-hd"><span>Photo</span></div>
          <div className="photos">
            <div className="photo-thumb add" style={{color:'var(--accent)', width:72, height:72}}><Ico.cam /></div>
            <div style={{alignSelf:'center', fontSize:12, color:'var(--ink-3)'}}>Tap to capture · GPS tagged</div>
          </div>
          <div className="sec-hd"><span>Note</span></div>
          <div style={{padding:'0 16px 16px'}}>
            <textarea className="notes" placeholder="e.g. head 3rd from path, snapped at riser" value={note} onChange={e=>setNote(e.target.value)} />
          </div>
        </div>
        <div className="mfoot">
          <button onClick={onClose}>Cancel</button>
          <button disabled={!type} style={!type?{opacity:0.45}:{}} onClick={() => {
            const tLabel = window.ISSUE_TYPES.find(i=>i.k===type)?.label || 'Issue';
            handleSave({ t: tLabel, n: count, sev }, /* andAnother */ true);
          }}>+ Another</button>
          <button className="primary" disabled={!type} style={!type?{opacity:0.45}:{}} onClick={() => {
            const tLabel = window.ISSUE_TYPES.find(i=>i.k===type)?.label || 'Issue';
            handleSave({ t: tLabel, n: count, sev });
          }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Swipe deck ───────────────────────────────────────────────
function SwipeDeck({ zones, currentId, onPick }) {
  const idx = Math.max(0, zones.findIndex(z => z.id === currentId));
  const z = zones[idx];
  const next = zones[idx+1];
  const prev = zones[idx-1];
  return (
    <div className="swipe-stage">
      <div className="swipe-card" style={{position:'relative'}}>
        {next && (
          <div className="swipe-card" style={{
            position:'absolute', inset:'8px 8px auto 8px',
            transform:'translateY(10px) scale(0.97)', opacity:0.55,
            padding:'10px 16px', zIndex:0
          }}>
            <div style={{fontSize:11, color:'var(--ink-3)', letterSpacing:'.06em', textTransform:'uppercase'}}>Next</div>
            <div style={{fontWeight:600, fontSize:14, marginTop:2}}>{String(next.id).padStart(2,'0')} · {next.name}</div>
          </div>
        )}
        <div style={{position:'relative', zIndex:1, background:'var(--paper)', borderRadius: 'var(--radius-l)', marginTop: next?24:0, padding: next?16:0}}>
          <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between'}}>
            <span className="num-lg mono">{String(z.id).padStart(2,'0')}</span>
            <span className="mono" style={{fontSize:11, color:'var(--ink-3)'}}>{idx+1} of {zones.length}</span>
          </div>
          <div style={{fontSize:17, fontWeight:600, marginTop:6, lineHeight:1.2}}>{z.name}</div>
          <div className="mono" style={{fontSize:11, color:'var(--ink-3)', marginTop:4}}>{z.sprinkler} · {z.plant} · {z.runtime}min · {z.psi}psi</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:14}}>
            <Stat k="Pressure" v={z.psi} u="psi" />
            <Stat k="Runtime" v={z.runtime} u="min" />
            <Stat k="Flow" v={z.gpm} u="gpm" />
          </div>
          <div style={{marginTop:14, display:'flex', gap:6, flexWrap:'wrap'}}>
            {z.issues.length === 0
              ? <span className="spill ok">No issues yet</span>
              : z.issues.map((i, k) => <span key={k} className={`spill ${i.sev==='fix'?'crit':'warn'}`}>{i.t} · ×{i.n}</span>)}
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:18}}>
            <SwBtn label="Skip"  color="var(--skip)" onClick={() => onPick(zones[Math.min(idx+1, zones.length-1)].id)} />
            <SwBtn label="Open"  color="var(--accent)" filled onClick={() => onPick(z.id, true)} />
            <SwBtn label="Pass"  color="var(--ok)" onClick={() => onPick(zones[Math.min(idx+1, zones.length-1)].id)} />
          </div>
        </div>
      </div>
      <div className="swipe-deck-hint">Swipe ← skip · → pass · tap to open</div>
      <div style={{display:'flex', justifyContent:'space-between', padding:'0 4px'}}>
        <button onClick={() => prev && onPick(prev.id)} disabled={!prev} style={navBtnStyle}>← Prev</button>
        <button onClick={() => next && onPick(next.id)} disabled={!next} style={navBtnStyle}>Next →</button>
      </div>
    </div>
  );
}
const navBtnStyle = { background:'none', border:'none', color:'var(--accent)', fontWeight:600, fontSize:13, padding:'10px 8px', cursor:'pointer', fontFamily:'inherit' };
function Stat({k,v,u}) {
  return (
    <div style={{background:'var(--paper-2)', borderRadius:'var(--radius)', padding:'8px 10px'}}>
      <div style={{fontSize:10, color:'var(--ink-3)', letterSpacing:'.06em', textTransform:'uppercase', fontWeight:600}}>{k}</div>
      <div className="mono" style={{fontWeight:600, fontSize:15, marginTop:2}}>{v}<span style={{color:'var(--ink-3)', fontSize:10, marginLeft:2}}>{u}</span></div>
    </div>
  );
}
function SwBtn({label, color, filled, onClick}) {
  return (
    <button onClick={onClick} style={{
      height: 40, borderRadius: 'var(--radius)',
      border: filled ? 'none' : `1.5px solid ${color}`,
      background: filled ? color : 'var(--paper)',
      color: filled ? 'var(--paper)' : color,
      fontWeight: 600, fontSize: 12, letterSpacing: '0.03em', textTransform:'uppercase',
      fontFamily:'inherit', cursor:'pointer'
    }}>{label}</button>
  );
}

// ── Summary / export screen ──────────────────────────────────
function Summary({ zones, site, online, onBack }) {
  const issues = zones.flatMap(z => z.issues.map(i => ({...i, zone: z.id, name: z.name})));
  const fix   = issues.filter(i => i.sev === 'fix');
  const watch = issues.filter(i => i.sev === 'watch');
  const cost  = fix.reduce((s,i) => s + i.n * 45, 0) + watch.reduce((s,i) => s + i.n * 18, 0);

  return (
    <>
      <TopBar online={online} queued={0} onBack={onBack} />
      <div style={{padding:'16px'}}>
        <div style={{fontSize:11, color:'var(--ink-3)', letterSpacing:'.08em', textTransform:'uppercase', fontWeight:600}}>Wet check complete</div>
        <h1 style={{margin:'6px 0 4px', fontSize:24, fontWeight:700, letterSpacing:'-0.02em'}}>{site.name}</h1>
        <div style={{fontSize:13, color:'var(--ink-2)'}}>{site.date}</div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, padding:'0 16px 12px'}}>
        <Tile label="Zones" value={zones.length} sub="inspected" />
        <Tile label="Issues" value={issues.length} sub={`${fix.length} fix · ${watch.length} watch`} accent="crit" />
        <Tile label="Adjustments" value={zones.reduce((s,z) => s + (z.adjustments ? Object.keys(z.adjustments).length : 0), 0)} sub={`across ${zones.filter(z => z.adjustments && Object.keys(z.adjustments).length).length} zone(s)`} accent="accent" />
        <Tile label="Est. labor" value={`$${cost}`} sub="materials separate" />
      </div>

      <div className="sec-hd"><span>Schedule adjustments</span></div>
      <div className="logged">
        {zones.filter(z => z.adjustments && Object.keys(z.adjustments).length).flatMap(z =>
          Object.entries(z.adjustments).map(([k, a]) => {
            const orig = z.programs[k];
            return (
              <div key={`${z.id}-${k}`} className="logged-item" style={{borderLeftColor:'var(--accent)', gridTemplateColumns:'auto 1fr', alignItems:'start', padding:'10px 12px'}}>
                <span className="spill accent mono">Z{String(z.id).padStart(2,'0')}·{k}</span>
                <div>
                  <div style={{fontWeight:600, fontSize:12.5}}>{z.name}</div>
                  <div className="adj-cmp" style={{marginTop:4}}>
                    <span className="from">{orig.runtime}m · {orig.days.join('·')||'—'}</span>
                    <span className="arrow">→</span>
                    <span className="to">{a.runtime}m · {a.days.join('·')||'—'}</span>
                  </div>
                  {a.reason && <div style={{fontSize:11.5, color:'var(--ink-2)', marginTop:4, fontStyle:'italic'}}>“{a.reason}”</div>}
                </div>
              </div>
            );
          })
        )}
        {zones.every(z => !z.adjustments || !Object.keys(z.adjustments).length) && <div style={{padding:'8px 4px', color:'var(--ink-3)', fontSize:12}}>No schedule changes proposed.</div>}
      </div>

      <div className="sec-hd"><span>Fix now · {fix.length}</span></div>
      <div className="logged">
        {fix.map((i, k) => (
          <div key={k} className="logged-item">
            <span className="spill crit mono">Z{String(i.zone).padStart(2,'0')}</span>
            <span>{i.t} <span style={{color:'var(--ink-3)'}}>· {i.name}</span></span>
            <span className="ph mono">×{i.n}</span>
          </div>
        ))}
        {fix.length === 0 && <div style={{padding:'8px 4px', color:'var(--ink-3)', fontSize:12}}>No critical issues found.</div>}
      </div>

      <div className="sec-hd"><span>Watch · {watch.length}</span></div>
      <div className="logged">
        {watch.map((i, k) => (
          <div key={k} className="logged-item watch">
            <span className="spill warn mono">Z{String(i.zone).padStart(2,'0')}</span>
            <span>{i.t} <span style={{color:'var(--ink-3)'}}>· {i.name}</span></span>
            <span className="ph mono">×{i.n}</span>
          </div>
        ))}
      </div>

      <div style={{height: 12}} />
      <div className="zbar">
        <button className="ghost">Save draft</button>
        <button className="primary" style={{display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8}}>
          <Ico.share /> Email PDF
        </button>
      </div>
    </>
  );
}
function Tile({label, value, sub, accent}) {
  return (
    <div style={{
      border:'1px solid var(--line)', borderRadius:'var(--radius-l)',
      padding:'12px 14px', background:'var(--paper)'
    }}>
      <div style={{fontSize:10.5, color:'var(--ink-3)', letterSpacing:'.08em', textTransform:'uppercase', fontWeight:600}}>{label}</div>
      <div className="mono" style={{
        fontSize: 26, fontWeight:700, marginTop:4, letterSpacing:'-0.02em',
        color: accent==='crit' ? 'var(--crit)' : accent==='accent' ? 'var(--accent)' : 'var(--ink)'
      }}>{value}</div>
      <div style={{fontSize:11, color:'var(--ink-3)', marginTop:2}}>{sub}</div>
    </div>
  );
}

// ── Main app shell ───────────────────────────────────────────
const DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "util",
  "interaction": "list",
  "online": false,
  "density": "regular",
  "view": "overview"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(DEFAULTS);
  const [zones, setZones] = uS(window.ZONES);
  const [site, setSite] = uS(window.SITE);
  const [view, setView] = uS('overview'); // overview | zone | summary | config | zoneConfig | siteConfig
  const [activeId, setActiveId] = uS(window.ZONES[window.CURRENT_ZONE_INDEX].id);
  const [configId, setConfigId] = uS(null);
  const [modalOpen, setModalOpen] = uS(false);

  const current = zones.find(z => z.id === activeId);
  const configZ = zones.find(z => z.id === configId);
  const online = !t.online ? false : true; // tweak toggles between offline-demo and online

  const openZone = (id, force) => {
    setActiveId(id);
    if (force || t.interaction === 'tap' || t.interaction === 'list') setView('zone');
    else setActiveId(id);
  };

  const completeZone = () => {
    setZones(zs => zs.map(z => z.id === activeId ? {...z, status: z.issues.length ? 'issues' : 'pass'} : z));
    const i = zones.findIndex(z => z.id === activeId);
    const next = zones[i+1];
    if (next) {
      setActiveId(next.id);
      if (t.interaction === 'swipe') setView('overview');
    } else {
      setView('summary');
    }
  };

  const onLog = (issue) => {
    if (issue === '__open__') { setModalOpen(true); return; }
    setZones(zs => zs.map(z => z.id === activeId ? {...z, issues: [...z.issues, issue]} : z));
  };

  const onAdjustChange = (next) => {
    setZones(zs => zs.map(z => z.id === activeId ? {...z, adjustments: next} : z));
  };

  const onSaveConfig = ({ name, programs }) => {
    setZones(zs => zs.map(z => z.id === configId ? {...z, name, programs} : z));
    setView('config');
  };

  const onSaveSite = (next) => {
    setSite(next);
    setView('config');
  };

  const onCsvImport = (updates) => {
    setZones(zs => zs.map(z => {
      const u = updates.find(up => up.id === z.id);
      if (!u) return z;
      return { ...z, name: u.name ?? z.name, programs: u.programs ?? z.programs };
    }));
  };

  return (
    <div className={`app-root theme-${t.theme}`}>
      {view === 'summary' && <Summary zones={zones} site={site} online={online} onBack={() => setView('overview')} />}

      {view === 'overview' && (
        <>
          <TopBar online={online} queued={3} />
          <ProgressStrip zones={zones} />
          <div className="scroll-safe" style={{overflow:'auto', flex:1}}>
            <SiteCard site={site} />
            <div className="sec-hd">
              <span>Zones · {zones.length}</span>
              <div style={{display:'flex', gap:14, alignItems:'center'}}>
                <button onClick={() => setView('config')} style={{background:'none', border:'none', color:'var(--ink-2)', fontWeight:600, fontSize:11, letterSpacing:'.08em', textTransform:'uppercase', cursor:'pointer', fontFamily:'inherit'}}>
                  Config
                </button>
                <button onClick={() => setView('summary')} style={{background:'none', border:'none', color:'var(--accent)', fontWeight:600, fontSize:11, letterSpacing:'.08em', textTransform:'uppercase', cursor:'pointer', fontFamily:'inherit'}}>
                  Finish & export →
                </button>
              </div>
            </div>

            {t.interaction === 'swipe'
              ? <SwipeDeck zones={zones} currentId={activeId} onPick={openZone} />
              : t.interaction === 'list'
                ? <ZoneList zones={zones} currentId={activeId} onPick={(id) => openZone(id, true)} />
                : <>
                    <ZoneGrid zones={zones} currentId={activeId} onPick={(id) => openZone(id, true)} />
                    <div style={{padding:'4px 16px 16px'}}>
                      <button onClick={() => setView('zone')} style={{
                        width:'100%', height:48, borderRadius:'var(--radius)',
                        background:'var(--accent)', color:'var(--paper)', border:'none',
                        fontWeight:600, fontSize:14, fontFamily:'inherit', cursor:'pointer'
                      }}>Resume zone {String(activeId).padStart(2,'0')} →</button>
                    </div>
                  </>
            }
          </div>
        </>
      )}

      {view === 'zone' && current && (
        <>
          <TopBar online={online} queued={3} onBack={() => setView('overview')} />
          <div className="scroll-safe" style={{overflow:'auto', flex:1}}>
            <ZoneForm
              key={current.id}
              z={current}
              adjustments={current.adjustments}
              onAdjustChange={onAdjustChange}
              onClose={() => setView('overview')}
              onLog={onLog}
              onComplete={completeZone}
            />
          </div>
        </>
      )}

      {view === 'config' && (
        <>
          <TopBar online={online} queued={3} onBack={() => setView('overview')} />
          <div style={{padding:'14px 16px 4px'}}>
            <div style={{fontSize:11, color:'var(--ink-3)', letterSpacing:'.08em', textTransform:'uppercase', fontWeight:600}}>Pre-inspection setup</div>
            <h1 style={{margin:'4px 0 4px', fontSize:20, fontWeight:700, letterSpacing:'-0.02em'}}>Configuration</h1>
            <div style={{fontSize:12, color:'var(--ink-2)'}}>Enter site and controller details once — they auto-populate every inspection.</div>
          </div>
          <div className="scroll-safe" style={{overflow:'auto', flex:1}}>
            <div className="sec-hd"><span>Bulk import</span></div>
            <CsvImporter zones={zones} onImport={onCsvImport} />

            <div className="sec-hd" style={{marginTop:14}}><span>Site & controller</span></div>
            <button className="cfg-row" onClick={() => setView('siteConfig')}>
              <div className="id" style={{fontSize:11, letterSpacing:'.05em'}}>SITE</div>
              <div>
                <div className="name">{site.name}</div>
                <div className="meta">{site.controller.make} {site.controller.model} · prog {site.controller.program} · {site.controller.zones} zones</div>
              </div>
              <div className="pcount" style={{color:'var(--accent)'}}>Edit →</div>
            </button>
            <ConfigList zones={zones} onPick={(id) => { setConfigId(id); setView('zoneConfig'); }} />
          </div>
        </>
      )}

      {view === 'siteConfig' && (
        <>
          <TopBar online={online} queued={3} onBack={() => setView('config')} />
          <div className="scroll-safe" style={{overflow:'auto', flex:1}}>
            <SiteConfigForm
              site={site}
              onSave={onSaveSite}
              onClose={() => setView('config')}
            />
          </div>
        </>
      )}

      {view === 'zoneConfig' && configZ && (
        <>
          <TopBar online={online} queued={3} onBack={() => setView('config')} />
          <div className="scroll-safe" style={{overflow:'auto', flex:1}}>
            <ZoneConfigForm
              key={configZ.id}
              z={configZ}
              onSave={onSaveConfig}
              onClose={() => setView('config')}
            />
          </div>
        </>
      )}

      {modalOpen && current && (
        <IssueModal
          z={current}
          onClose={() => setModalOpen(false)}
          onSave={(it, andAnother) => {
            onLog(it);
            if (!andAnother) setModalOpen(false);
          }}
        />
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Visual style" />
        <TweakSelect label="Theme" value={t.theme}
          options={[
            {value:'util',     label:'Utilitarian'},
            {value:'friendly', label:'Friendly modern'},
            {value:'sun',      label:'Sun-readable'},
            {value:'dark',     label:'Dark mode'},
          ]}
          onChange={(v) => setTweak('theme', v)} />
        <TweakSection label="Per-zone interaction" />
        <TweakSelect label="Mode" value={t.interaction}
          options={[
            {value:'list',  label:'List (default)'},
            {value:'tap',   label:'Tap grid'},
            {value:'swipe', label:'Swipe deck'},
          ]}
          onChange={(v) => setTweak('interaction', v)} />
        <TweakSection label="State" />
        <TweakToggle label="Online (vs offline demo)" value={t.online}
          onChange={(v) => setTweak('online', v)} />
        <TweakButton label="Reset progress" onClick={() => {
          setZones(window.ZONES); setActiveId(window.ZONES[window.CURRENT_ZONE_INDEX].id); setView('overview');
        }} />
        <TweakButton label="Open zone config" onClick={() => setView('config')} />
        <TweakButton label="Jump to summary" onClick={() => setView('summary')} />
      </TweaksPanel>
    </div>
  );
}

window.App = App;
