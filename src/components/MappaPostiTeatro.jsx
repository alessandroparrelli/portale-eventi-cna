import { useState, useMemo, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

// ── Seat data from Excel ──
const PL = [
  ['1',1,18],['2',1,24],['3',1,26],['4',1,26],['5',1,28],['6',1,28],
  ['7',1,30],['8',1,28],['9',1,30],['10',1,30],['10a',23,28],
  ['11',1,30],['12',1,30],['13',1,30],['14',1,26],['15',1,24],
  ['16',1,16],['17',1,18],['18',1,18],['19',1,18],['20',1,14]
]
// Lateral threshold: seats >= this number are lateral
const LAT = {'1':99,'2':19,'3':21,'4':21,'5':23,'6':23,'7':25,'8':23,'9':25,'10':25,'10a':0,'11':25,'12':25,'13':25,'14':21,'15':19,'16':99,'17':99,'18':99,'19':99,'20':99}

const PP = {1:4,2:4,3:4,4:4,5:4,6:4,7:4,8:4,9:4,10:5,11:5,12:6,13:6,14:6,15:6,16:6,17:6}
const PIANI = [1,2,3,4]
const LATI_P = ['sinistro','destro']
const MAX_P = {1:17,2:17,3:17,4:11}

function genPlatea() {
  const s = []
  PL.forEach(([f,a,b]) => { for (let n=a;n<=b;n++) s.push({id:`PL_${f}_${n}`,tipo:'platea',fila:f,numero:n,label:`Platea Fila ${f} Posto ${n}`}) })
  return s
}
function genPalchi() {
  const s = []
  PIANI.forEach(pi => LATI_P.forEach(la => {
    for (let pa=1;pa<=MAX_P[pi];pa++) for (let po=1;po<=PP[pa];po++) {
      const l = la==='sinistro'?'SX':'DX'
      s.push({id:`PA_${pi}_${l}_${pa}_${po}`,tipo:'palco',piano:pi,lato:la,palco:pa,posto:po,
        label:`${pi}° Ordine ${la==='sinistro'?'Sinistro':'Destro'} Palco ${pa} Posto ${po}`})
    }
  }))
  return s
}

// ── Platea positions: even LEFT desc, odd RIGHT asc, like real theater ──
function plateaPos(seats) {
  const pos = {}
  const cx = 550, cy = 1500, baseR = 720, gap = 33
  const rowIdx = {}; PL.forEach(([f],i) => rowIdx[f]=i)
  const bySeat = {}; seats.forEach(s => { if(!bySeat[s.fila]) bySeat[s.fila]=[]; bySeat[s.fila].push(s) })

  Object.entries(bySeat).forEach(([fila, rs]) => {
    const i = rowIdx[fila]
    const r = baseR + i * gap
    const latThresh = LAT[fila] || 99

    // Split into even (left) and odd (right)
    const evens = rs.filter(s=>s.numero%2===0).sort((a,b)=>b.numero-a.numero) // desc: highest even = leftmost
    const odds = rs.filter(s=>s.numero%2===1).sort((a,b)=>a.numero-b.numero) // asc: 1 = center-right

    // Place left half (even, going from left edge toward center)
    const nL = evens.length
    // Place right half (odd, going from center toward right edge)
    const nR = odds.length

    const seatW = 17 // px between seats
    const centerGap = 14 // gap between halves
    const latGap = 8 // gap before lateral seats

    // Left half: rightmost even (2) is closest to center
    evens.forEach((s, j) => {
      const distFromCenter = (nL - j - 1) // 0 = closest to center
      const isLat = s.numero >= latThresh
      const centralCount = evens.filter(e => e.numero < latThresh).length
      let xOff
      if (!isLat) {
        xOff = -(centerGap/2 + (nL - j - 1) * seatW) // removed: just offset from center
        // Recalc: position from center going left
        const posInCentral = evens.filter(e => e.numero < latThresh).sort((a,b)=>a.numero-b.numero).indexOf(s)
        xOff = -(centerGap/2 + posInCentral * seatW)
      } else {
        const latIdx = evens.filter(e => e.numero >= latThresh).sort((a,b)=>b.numero-a.numero).indexOf(s)
        const centralWidth = centralCount * seatW
        xOff = -(centerGap/2 + centralWidth + latGap + latIdx * seatW)
      }
      const angle = Math.atan2(-xOff, r) // negative because left side
      pos[s.id] = { x: cx + xOff, y: cy - Math.sqrt(r*r - xOff*xOff) }
    })

    // Right half: first odd (1) is closest to center
    odds.forEach((s, j) => {
      const isLat = s.numero >= latThresh
      const centralCount = odds.filter(e => e.numero < latThresh).length
      let xOff
      if (!isLat) {
        const posInCentral = odds.filter(e => e.numero < latThresh).sort((a,b)=>a.numero-b.numero).indexOf(s)
        xOff = centerGap/2 + posInCentral * seatW
      } else {
        const latIdx = odds.filter(e => e.numero >= latThresh).sort((a,b)=>a.numero-b.numero).indexOf(s)
        const centralWidth = centralCount * seatW
        xOff = centerGap/2 + centralWidth + latGap + latIdx * seatW
      }
      pos[s.id] = { x: cx + xOff, y: cy - Math.sqrt(Math.max(0, r*r - xOff*xOff)) }
    })
  })
  return pos
}

const C = { free:'#22c55e', occ:'#ef4444', sel:'#818cf8', bg:'#F7F8FC', pri:'#5B5FEF', blue:'#003DA5', brd:'#E8ECF4', txt:'#1e293b', mut:'#6B7280' }

export default function MappaPostiTeatro({ registrations, eventId, onReload }) {
  const [selP, setSelP] = useState(null)
  const [view, setView] = useState('platea')
  const [piano, setPiano] = useState(1)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [tip, setTip] = useState(null)
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const mapRef = useRef(null)

  // Zoom/pan state
  const [transform, setTransform] = useState({ x:0, y:0, s:1 })
  const dragRef = useRef(null)
  const lastTouchRef = useRef(null)

  const plSeats = useMemo(() => genPlatea(), [])
  const paSeats = useMemo(() => genPalchi(), [])
  const allSeats = useMemo(() => [...plSeats, ...paSeats], [plSeats, paSeats])
  const plP = useMemo(() => plateaPos(plSeats), [plSeats])

  const { seatToReg, regToSeat } = useMemo(() => {
    const byL = {}; registrations.forEach(r => { if(r.numero_posto) byL[r.numero_posto]=r })
    const s2r = {}; allSeats.forEach(s => { if(byL[s.label]) s2r[s.id]=byL[s.label] })
    const r2s = {}; registrations.forEach(r => { if(r.numero_posto) r2s[r.id]=r.numero_posto })
    return { seatToReg:s2r, regToSeat:r2s }
  }, [registrations, allSeats])

  const showToast = useCallback((m,ok=true) => { setToast({m,ok}); setTimeout(()=>setToast(null),3500) }, [])

  const saveSeat = useCallback(async (id,posto) => {
    const {error} = await supabase.from('registrations').update({numero_posto:posto}).eq('id',id)
    if(error){showToast('Errore: '+error.message,false);return false} return true
  },[showToast])

  const handleAssign = useCallback(async (seat) => {
    if(saving) return
    const occ = seatToReg[seat.id]
    if(occ && !selP){ if(confirm(`Rimuovere ${occ.nome} ${occ.cognome} da ${seat.label}?`)){ setSaving(true); if(await saveSeat(occ.id,null)){showToast(`Liberato: ${seat.label}`);onReload?.()} setSaving(false) } return }
    if(!selP){showToast('Seleziona un iscritto dalla lista',false);return}
    if(occ){showToast(`Occupato da ${occ.nome} ${occ.cognome}`,false);return}
    setSaving(true)
    if(regToSeat[selP.id]) await saveSeat(selP.id,null)
    if(await saveSeat(selP.id,seat.label)){showToast(`${selP.cognome} ${selP.nome} → ${seat.label}`);setSelP(null);onReload?.()}
    setSaving(false)
  },[selP,seatToReg,regToSeat,saving,saveSeat,showToast,onReload])

  const filtered = useMemo(() => {
    let l = registrations
    if(filter==='assigned') l=l.filter(r=>r.numero_posto)
    else if(filter==='unassigned') l=l.filter(r=>!r.numero_posto)
    if(search){const q=search.toLowerCase(); l=l.filter(r=>`${r.nome} ${r.cognome} ${r.ragione_sociale||''} ${r.email||''} ${r.numero_posto||''}`.toLowerCase().includes(q))}
    return l
  },[registrations,filter,search])

  const stats = useMemo(() => {
    const a = registrations.filter(r=>r.numero_posto).length
    return {tot:registrations.length,a,u:registrations.length-a,seats:allSeats.length,o:Object.keys(seatToReg).length}
  },[registrations,allSeats,seatToReg])

  // ── Zoom/Pan handlers ──
  const resetT = useCallback(() => setTransform({x:0,y:0,s:1}),[])
  const onWheel = useCallback(e => {
    e.preventDefault()
    const d = e.deltaY > 0 ? -0.12 : 0.12
    setTransform(t => {
      const ns = Math.max(0.3, Math.min(6, t.s + d))
      // Zoom toward mouse position
      const rect = mapRef.current?.getBoundingClientRect()
      if (!rect) return {...t, s:ns}
      const mx = e.clientX - rect.left, my = e.clientY - rect.top
      const ratio = ns / t.s
      return { s:ns, x: mx - ratio*(mx - t.x), y: my - ratio*(my - t.y) }
    })
  },[])
  const onMD = useCallback(e => {
    if(e.button===0) dragRef.current = {sx:e.clientX-transform.x, sy:e.clientY-transform.y}
  },[transform])
  const onMM = useCallback(e => { if(dragRef.current) setTransform(t=>({...t,x:e.clientX-dragRef.current.sx,y:e.clientY-dragRef.current.sy})) },[])
  const onMU = useCallback(() => { dragRef.current=null },[])
  // Touch zoom
  const onTS = useCallback(e => {
    if(e.touches.length===1) dragRef.current={sx:e.touches[0].clientX-transform.x,sy:e.touches[0].clientY-transform.y}
    if(e.touches.length===2){ const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY); lastTouchRef.current={d,s:transform.s} }
  },[transform])
  const onTM = useCallback(e => {
    if(e.touches.length===1 && dragRef.current) setTransform(t=>({...t,x:e.touches[0].clientX-dragRef.current.sx,y:e.touches[0].clientY-dragRef.current.sy}))
    if(e.touches.length===2 && lastTouchRef.current){
      const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY)
      const ns=Math.max(0.3,Math.min(6,lastTouchRef.current.s*(d/lastTouchRef.current.d)))
      setTransform(t=>({...t,s:ns}))
    }
  },[])
  const onTE = useCallback(()=>{dragRef.current=null;lastTouchRef.current=null},[])

  // ── Seat dot ──
  const Dot = useCallback(({seat,x,y,r=6}) => {
    const occ=seatToReg[seat.id], isSel=selP&&occ?.id===selP.id
    const fill = isSel?C.sel:occ?C.occ:selP?C.free:'#94a3b8'
    return <circle cx={x} cy={y} r={r} fill={fill} stroke={occ?'#fff':'#cbd5e1'} strokeWidth={0.8}
      style={{cursor:'pointer',transition:'fill .15s'}}
      onMouseEnter={e=>{const rc=mapRef.current?.getBoundingClientRect();setTip({x:e.clientX-(rc?.left||0),y:e.clientY-(rc?.top||0),seat,occ})}}
      onMouseLeave={()=>setTip(null)}
      onClick={e=>{e.stopPropagation();handleAssign(seat)}} />
  },[seatToReg,selP,handleAssign])

  // ── Platea SVG ──
  const PlateaSVG = useMemo(() => {
    // Compute bounding box
    let minY=9999,maxY=0,minX=9999,maxX=0
    plSeats.forEach(s=>{const p=plP[s.id];if(p){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y)}})
    const pad=40
    const vbX=minX-pad, vbY=minY-pad-50, vbW=maxX-minX+pad*2, vbH=maxY-minY+pad*2+60

    // Group by fila
    const byF={}; PL.forEach(([f])=>byF[f]=[]); plSeats.forEach(s=>{const p=plP[s.id];if(p)byF[s.fila].push({s,x:p.x,y:p.y})})

    return <svg viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} style={{width:'100%',height:'100%'}}>
      {/* Stage */}
      <rect x={550-160} y={maxY+18} width={320} height={36} rx={8} fill={C.blue}/>
      <text x={550} y={maxY+42} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={700} fontFamily="Inter,sans-serif">PALCOSCENICO</text>

      {PL.map(([f])=>{
        const seats=byF[f]; if(!seats.length) return null
        // Find center Y for row label
        const centerSeats = seats.filter(({s})=> s.numero<=2)
        const rowY = centerSeats.length ? centerSeats.reduce((a,c)=>a+c.y,0)/centerSeats.length : seats.reduce((a,c)=>a+c.y,0)/seats.length
        return <g key={f}>
          {/* Row label in center */}
          <text x={550} y={rowY+4} textAnchor="middle" fontSize={9} fontWeight={800} fill="#DC2626" fontFamily="Inter,sans-serif">{f}</text>
          {seats.map(({s,x,y})=><Dot key={s.id} seat={s} x={x} y={y}/>)}
        </g>
      })}
    </svg>
  },[plSeats,plP,Dot])

  // ── Palchi SVG ──
  const PalchiSVG = useMemo(() => {
    const max=MAX_P[piano], bx={sinistro:{},destro:{}}
    paSeats.filter(s=>s.piano===piano).forEach(s=>{if(!bx[s.lato][s.palco])bx[s.lato][s.palco]=[];bx[s.lato][s.palco].push(s)})
    const boxW=56,boxH=30,gV=5,startY=70,lx=60,rx=860
    const h = startY + max*(boxH+gV) + 20
    const els=[]
    els.push(<rect key="stg" x={340} y={38} width={250} height={28} rx={6} fill={C.blue} opacity={.2}/>)
    els.push(<text key="st" x={465} y={57} textAnchor="middle" fontSize={11} fill={C.blue} fontWeight={700} fontFamily="Inter,sans-serif">PALCOSCENICO</text>)
    LATI_P.forEach(side=>{
      const bxx=side==='sinistro'?lx:rx
      els.push(<text key={`l-${side}`} x={bxx+boxW/2} y={startY-10} textAnchor="middle" fontSize={11} fontWeight={800} fill={C.pri} fontFamily="Inter,sans-serif">{side==='sinistro'?'SINISTRO':'DESTRO'}</text>)
      for(let p=1;p<=max;p++){
        const ss=(bx[side][p]||[]).sort((a,b)=>a.posto-b.posto), y=startY+(p-1)*(boxH+gV), np=ss.length
        els.push(<rect key={`b-${side}-${p}`} x={bxx} y={y} width={boxW} height={boxH} rx={5} fill="#f1f5f9" stroke={C.brd} strokeWidth={1}/>)
        els.push(<text key={`n-${side}-${p}`} x={side==='sinistro'?bxx-10:bxx+boxW+10} y={y+boxH/2+4} textAnchor="middle" fontSize={9} fill={C.mut} fontWeight={700} fontFamily="Inter,sans-serif">{p}</text>)
        ss.forEach((s,i)=>{
          els.push(<Dot key={s.id} seat={s} x={bxx+9+i*(np<=4?11:np<=5?9:7.2)} y={y+boxH/2} r={np<=4?4.5:3.8}/>)
        })
      }
    })
    return <svg viewBox={`0 0 960 ${h}`} style={{width:'100%',height:'100%'}}>{els}</svg>
  },[piano,paSeats,Dot])

  // Map wrapper with zoom/pan
  const MapWrap = useCallback(({children}) =>
    <div ref={mapRef} style={{flex:1,overflow:'hidden',position:'relative',background:'#f8fafc',touchAction:'none'}}
      onWheel={onWheel} onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}
      onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}>
      <div style={{width:'100%',height:'100%',transform:`translate(${transform.x}px,${transform.y}px) scale(${transform.s})`,transformOrigin:'0 0',willChange:'transform'}}>
        {children}
      </div>
      {tip && <div style={{position:'absolute',left:Math.min(tip.x+14,(mapRef.current?.offsetWidth||600)-280),top:tip.y-50,
        background:'#1e293b',color:'#fff',padding:'8px 12px',borderRadius:10,fontSize:12,whiteSpace:'nowrap',pointerEvents:'none',zIndex:100,
        boxShadow:'0 4px 16px rgba(0,0,0,.35)',fontFamily:"'Inter',sans-serif"}}>
        <div style={{fontWeight:700}}>{tip.seat.label}</div>
        {tip.occ ? <div style={{color:'#fca5a5'}}>✦ {tip.occ.cognome} {tip.occ.nome}{tip.occ.ragione_sociale?` — ${tip.occ.ragione_sociale}`:''}</div>
          : <div style={{color:'#86efac'}}>🟢 Disponibile</div>}
      </div>}
    </div>
  ,[onWheel,onMD,onMM,onMU,onTS,onTM,onTE,transform,tip])

  return <div style={{background:C.bg,borderRadius:16,border:`1px solid ${C.brd}`,overflow:'hidden'}}>
    {/* Stats */}
    <div style={{display:'flex',gap:16,padding:'14px 20px',background:'#fff',borderBottom:`1px solid ${C.brd}`,flexWrap:'wrap'}}>
      {[['🎫 Iscritti',stats.tot,C.txt],['✅ Con posto',stats.a,C.free],['⏳ Senza posto',stats.u,'#f59e0b'],['🪑 Occupati',`${stats.o}/${stats.seats}`,C.pri]].map(([l,v,c])=>
        <div key={l} style={{textAlign:'center',minWidth:90}}><div style={{fontSize:22,fontWeight:900,color:c,letterSpacing:'-.02em'}}>{v}</div><div style={{fontSize:11,color:C.mut,fontWeight:500}}>{l}</div></div>
      )}
    </div>

    {/* Tabs */}
    <div style={{display:'flex',alignItems:'center',gap:6,padding:'8px 20px',background:'#fff',borderBottom:`1px solid ${C.brd}`,flexWrap:'wrap'}}>
      {['platea',...PIANI.map(p=>`palchi-${p}`)].map(v=>{
        const isP = v==='platea'
        const label = isP ? '🪑 Platea (498)' : `🎪 Palchi ${v.split('-')[1]}° Piano`
        const active = (isP&&view==='platea')||(!isP&&view==='palchi'&&piano===+v.split('-')[1])
        return <button key={v} onClick={()=>{if(isP)setView('platea');else{setView('palchi');setPiano(+v.split('-')[1])};resetT()}} style={{
          padding:'6px 14px',borderRadius:20,border:`1.5px solid ${active?C.pri:C.brd}`,
          background:active?'linear-gradient(90deg,#5B5FEF,#3730A3)':'#fff',color:active?'#fff':C.txt,
          fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif"
        }}>{label}</button>
      })}
      <div style={{marginLeft:'auto',display:'flex',gap:4,alignItems:'center'}}>
        <button onClick={()=>setTransform(t=>({...t,s:Math.min(6,t.s+0.3)}))} style={zB}>＋</button>
        <span style={{fontSize:11,color:C.mut,width:44,textAlign:'center'}}>{Math.round(transform.s*100)}%</span>
        <button onClick={()=>setTransform(t=>({...t,s:Math.max(0.3,t.s-0.3)}))} style={zB}>−</button>
        <button onClick={resetT} style={{...zB,fontSize:10,width:'auto',padding:'3px 10px'}}>Reset</button>
      </div>
    </div>

    {/* Selection banner */}
    {selP && <div style={{background:'#eef2ff',borderBottom:`2px solid ${C.pri}`,padding:'10px 20px',display:'flex',alignItems:'center',gap:10}}>
      <span style={{fontSize:18}}>👆</span>
      <span style={{fontSize:13,fontWeight:700,color:C.pri}}>Assegna: <u>{selP.cognome} {selP.nome}</u> — clicca un posto verde</span>
      <button onClick={()=>setSelP(null)} style={{marginLeft:'auto',padding:'5px 14px',borderRadius:14,border:`1.5px solid ${C.pri}`,background:'#fff',color:C.pri,fontSize:12,cursor:'pointer',fontWeight:700,fontFamily:"'Inter',sans-serif"}}>✕ Annulla</button>
    </div>}

    {/* Main */}
    <div style={{display:'flex',height:'calc(100vh - 340px)',minHeight:500}}>
      <MapWrap>{view==='platea'?PlateaSVG:PalchiSVG}</MapWrap>

      {/* Right panel */}
      <div style={{width:370,borderLeft:`1px solid ${C.brd}`,background:'#fff',display:'flex',flexDirection:'column',flexShrink:0}}>
        <div style={{padding:'12px 14px 8px',borderBottom:`1px solid ${C.brd}`}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Cerca nome, azienda, email…"
            style={{width:'100%',padding:'9px 14px',borderRadius:10,border:`1px solid ${C.brd}`,fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:"'Inter',sans-serif"}}/>
          <div style={{display:'flex',gap:5,marginTop:8}}>
            {[['all',`Tutti (${stats.tot})`],['unassigned',`Senza (${stats.u})`],['assigned',`Con (${stats.a})`]].map(([k,l])=>
              <button key={k} onClick={()=>setFilter(k)} style={{padding:'4px 10px',borderRadius:14,border:`1px solid ${filter===k?C.pri:C.brd}`,
                background:filter===k?C.pri:'#fff',color:filter===k?'#fff':C.txt,fontSize:11,cursor:'pointer',fontWeight:600,fontFamily:"'Inter',sans-serif"}}>{l}</button>
            )}
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          {filtered.map(r=>{
            const isSel=selP?.id===r.id
            return <div key={r.id} onClick={()=>isSel?setSelP(null):setSelP(r)} style={{
              padding:'9px 14px',borderBottom:`1px solid ${C.brd}`,cursor:'pointer',
              background:isSel?'#eef2ff':'transparent',borderLeft:isSel?`3px solid ${C.pri}`:'3px solid transparent'}}>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:r.numero_posto?C.free:'#f59e0b',flexShrink:0}}/>
                <span style={{fontWeight:700,fontSize:13,color:C.txt,fontFamily:"'Inter',sans-serif"}}>{r.cognome} {r.nome}</span>
              </div>
              {r.ragione_sociale && <div style={{fontSize:11,color:C.mut,marginLeft:14,marginTop:1}}>{r.ragione_sociale}</div>}
              {r.numero_posto ? <div style={{fontSize:11,color:C.free,fontWeight:700,marginLeft:14,marginTop:3,display:'flex',alignItems:'center',gap:4}}>
                🪑 {r.numero_posto}
                <button onClick={e=>{e.stopPropagation();if(confirm(`Rimuovere posto a ${r.nome} ${r.cognome}?`))saveSeat(r.id,null).then(ok=>{if(ok){showToast('Rimosso');onReload?.()}})}}
                  style={{marginLeft:'auto',padding:'2px 8px',borderRadius:8,border:'1px solid #fca5a5',background:'#fff0f0',color:C.occ,fontSize:10,cursor:'pointer',fontWeight:600}}>✕</button>
              </div> : <div style={{fontSize:11,color:isSel?C.pri:'#f59e0b',fontWeight:isSel?700:500,marginLeft:14,marginTop:3}}>
                {isSel?'👆 Clicca un posto sulla mappa...':'Senza posto'}
              </div>}
            </div>
          })}
          {!filtered.length && <div style={{padding:24,textAlign:'center',color:C.mut,fontSize:13}}>Nessun risultato</div>}
        </div>
      </div>
    </div>

    {toast && <div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:toast.ok?'#065f46':'#991b1b',color:'#fff',
      padding:'12px 24px',borderRadius:14,fontSize:14,fontWeight:700,boxShadow:'0 6px 24px rgba(0,0,0,.35)',zIndex:9999,fontFamily:"'Inter',sans-serif"}}>
      {toast.ok?'✓':'✕'} {toast.m}
    </div>}
  </div>
}

const zB = {width:30,height:30,borderRadius:8,border:'1px solid #E8ECF4',background:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}
