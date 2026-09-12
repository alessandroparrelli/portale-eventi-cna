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
const LAT = {'1':99,'2':19,'3':21,'4':21,'5':23,'6':23,'7':25,'8':23,'9':25,'10':25,'10a':1,'11':25,'12':25,'13':25,'14':21,'15':19,'16':99,'17':99,'18':99,'19':99,'20':99}

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
  const cx = 550, cy = 1500, baseR = 720, rowGap = 36
  // Custom row indices: 10a at 9.6 (between 10 and 11), rows 11+ shifted by 0.6
  const rowIdx = {}
  PL.forEach(([f],i) => {
    if(i <= 9) rowIdx[f] = i            // rows 1-10: indices 0-9
    else if(f === '10a') rowIdx[f] = 9.6 // 10a: between 10 and 11
    else rowIdx[f] = i + 0.6            // rows 11-20: shifted down
  })
  const bySeat = {}; seats.forEach(s => { if(!bySeat[s.fila]) bySeat[s.fila]=[]; bySeat[s.fila].push(s) })

  Object.entries(bySeat).forEach(([fila, rs]) => {
    const i = rowIdx[fila]
    const r = baseR + i * rowGap
    const latThresh = fila in LAT ? LAT[fila] : 99

    const evens = rs.filter(s=>s.numero%2===0)
    const odds = rs.filter(s=>s.numero%2===1)

    const seatW = 18       // px between seats within a section
    const centerGap = 44   // wide center aisle for row numbers
    const latSep = 30      // wide gap between central and lateral sections

    // Left half: even numbers. Central sorted asc (2,4,6..), placed right-to-left from center
    const cE = evens.filter(e => e.numero < latThresh).sort((a,b)=>a.numero-b.numero)
    const lE = evens.filter(e => e.numero >= latThresh).sort((a,b)=>b.numero-a.numero)
    cE.forEach((s, j) => {
      const xOff = -(centerGap/2 + j * seatW)
      pos[s.id] = { x: cx + xOff, y: cy - Math.sqrt(Math.max(1, r*r - xOff*xOff)) }
    })
    // For rows with no central seats (e.g. 10a), align laterals with adjacent row's laterals
    const cEw = cE.length > 0 ? cE.length * seatW : 12 * seatW  // 12 = row 10 central even count
    lE.forEach((s, j) => {
      const xOff = -(centerGap/2 + cEw + latSep + j * seatW)
      pos[s.id] = { x: cx + xOff, y: cy - Math.sqrt(Math.max(1, r*r - xOff*xOff)) }
    })

    // Right half: odd numbers. Central sorted asc (1,3,5..), placed left-to-right from center
    const cO = odds.filter(e => e.numero < latThresh).sort((a,b)=>a.numero-b.numero)
    const lO = odds.filter(e => e.numero >= latThresh).sort((a,b)=>a.numero-b.numero)
    cO.forEach((s, j) => {
      const xOff = centerGap/2 + j * seatW
      pos[s.id] = { x: cx + xOff, y: cy - Math.sqrt(Math.max(1, r*r - xOff*xOff)) }
    })
    const cOw = cO.length > 0 ? cO.length * seatW : 12 * seatW
    lO.forEach((s, j) => {
      const xOff = centerGap/2 + cOw + latSep + j * seatW
      pos[s.id] = { x: cx + xOff, y: cy - Math.sqrt(Math.max(1, r*r - xOff*xOff)) }
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
  const [sort, setSort] = useState('data_desc') // sort key
  const [tip, setTip] = useState(null)
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null) // {person, seat}
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
    if(error){console.error('saveSeat error:',error);showToast('Errore: '+error.message,false);return false} return true
  },[showToast])

  const handleSeatClick = useCallback((seat) => {
    // Ignore if we were dragging
    if(dragRef.current?.dragging) return
    if(saving) return
    const occ = seatToReg[seat.id]
    if(occ && !selP){
      // Click occupied seat without selection → ask to remove
      setConfirmModal({type:'remove', person:occ, seat})
      return
    }
    if(!selP){showToast('Seleziona un iscritto dalla lista a destra',false);return}
    if(occ){showToast(`Posto già occupato da ${occ.nome} ${occ.cognome}`,false);return}
    // Open confirmation modal
    setConfirmModal({type:'assign', person:selP, seat})
  },[selP,seatToReg,saving,showToast])

  const doConfirm = useCallback(async () => {
    if(!confirmModal) return
    setSaving(true)
    const {type, person, seat} = confirmModal
    if(type==='remove'){
      if(await saveSeat(person.id,null)){showToast(`Posto liberato: ${seat.label}`);onReload?.()}
    } else {
      if(regToSeat[person.id]) await saveSeat(person.id,null)
      if(await saveSeat(person.id,seat.label)){showToast(`${person.cognome} ${person.nome} → ${seat.label}`);setSelP(null);onReload?.()}
    }
    setConfirmModal(null)
    setSaving(false)
  },[confirmModal,saveSeat,regToSeat,showToast,onReload])

  // Map id→name for capogruppo/referente
  const refMap = useMemo(() => {
    const m = {}
    registrations.forEach(r => { if(r.gruppo_id===r.id) m[r.id]=`${r.nome||''} ${r.cognome||''}`.trim() })
    return m
  },[registrations])

  const filtered = useMemo(() => {
    let l = [...registrations]
    if(filter==='assigned') l=l.filter(r=>r.numero_posto)
    else if(filter==='unassigned') l=l.filter(r=>!r.numero_posto)

    if(search){
      const q=search.toLowerCase()
      const match = r => `${r.nome} ${r.cognome} ${r.ragione_sociale||''} ${r.email||''} ${r.numero_posto||''}`.toLowerCase().includes(q)
      // Show matching + their group members (accompagnatori del capogruppo trovato)
      const gruppiMatch = new Set(l.filter(r=>match(r)&&r.gruppo_id).map(r=>r.gruppo_id))
      l = l.filter(r => match(r) || (r.gruppo_id && gruppiMatch.has(r.gruppo_id)))
    }

    // Sort: capogruppo first, then their accompagnatori grouped below
    const [sk, sd] = sort.split('_')
    const dir = sd === 'desc' ? -1 : 1
    l.sort((a, b) => {
      // Group accompaniers with their capogruppo
      const aKey = a.gruppo_id || a.id
      const bKey = b.gruppo_id || b.id
      if (aKey !== bKey) {
        // Sort groups by the capogruppo's sort field
        const aCapo = registrations.find(r=>r.id===aKey) || a
        const bCapo = registrations.find(r=>r.id===bKey) || b
        let va, vb
        if (sk==='cognome'){va=(aCapo.cognome||'').toLowerCase();vb=(bCapo.cognome||'').toLowerCase()}
        else if(sk==='nome'){va=(aCapo.nome||'').toLowerCase();vb=(bCapo.nome||'').toLowerCase()}
        else if(sk==='azienda'){va=(aCapo.ragione_sociale||'').toLowerCase();vb=(bCapo.ragione_sociale||'').toLowerCase()}
        else if(sk==='data'){va=aCapo.created_at||'';vb=bCapo.created_at||''}
        else if(sk==='posto'){va=aCapo.numero_posto||'zzz';vb=bCapo.numero_posto||'zzz'}
        else if(sk==='email'){va=(aCapo.email||'').toLowerCase();vb=(bCapo.email||'').toLowerCase()}
        else{va='';vb=''}
        if(va<vb)return -1*dir
        if(va>vb)return 1*dir
      }
      // Within same group: capogruppo first, then by name
      const aIsCapo = a.gruppo_id===a.id ? 0 : 1
      const bIsCapo = b.gruppo_id===b.id ? 0 : 1
      if(aIsCapo!==bIsCapo)return aIsCapo-bIsCapo
      return 0
    })
    return l
  },[registrations,filter,search,sort])

  const stats = useMemo(() => {
    const a = registrations.filter(r=>r.numero_posto).length
    return {tot:registrations.length,a,u:registrations.length-a,seats:allSeats.length,o:Object.keys(seatToReg).length}
  },[registrations,allSeats,seatToReg])

  // ── Zoom/Pan handlers ──
  const resetT = useCallback(() => setTransform({x:0,y:0,s:1}),[])
  const onWheel = useCallback(e => {
    e.preventDefault()
    setTip(null)
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
    setTip(null)
    if(e.button===0) dragRef.current = {sx:e.clientX-transform.x, sy:e.clientY-transform.y, ox:e.clientX, oy:e.clientY, dragging:false}
  },[transform])
  const onMM = useCallback(e => {
    if(!dragRef.current) return
    const dx=e.clientX-dragRef.current.ox, dy=e.clientY-dragRef.current.oy
    if(!dragRef.current.dragging && Math.abs(dx)+Math.abs(dy)>4) dragRef.current.dragging=true
    if(dragRef.current.dragging) setTransform(t=>({...t,x:e.clientX-dragRef.current.sx,y:e.clientY-dragRef.current.sy}))
  },[])
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
  const tipTimer = useRef(null)
  const Dot = useCallback(({seat,x,y,r=6}) => {
    const occ=seatToReg[seat.id], isSel=selP&&occ?.id===selP.id
    const fill = isSel?C.sel:occ?C.occ:selP?C.free:'#94a3b8'
    return <circle cx={x} cy={y} r={r} fill={fill} stroke={occ?'#fff':'#cbd5e1'} strokeWidth={0.8}
      style={{cursor:'pointer',transition:'fill .15s'}}
      onMouseEnter={e=>{
        clearTimeout(tipTimer.current)
        const rc=mapRef.current?.getBoundingClientRect()
        setTip({x:e.clientX-(rc?.left||0),y:e.clientY-(rc?.top||0),seat,occ})
        tipTimer.current=setTimeout(()=>setTip(null),3000)
      }}
      onMouseLeave={()=>{clearTimeout(tipTimer.current);tipTimer.current=setTimeout(()=>setTip(null),100)}}
      onClick={e=>{e.stopPropagation();setTip(null);handleSeatClick(seat)}} />
  },[seatToReg,selP,handleSeatClick])

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
          <text x={550} y={rowY+5} textAnchor="middle" fontSize={12} fontWeight={900} fill="#DC2626" fontFamily="Inter,sans-serif">{f}</text>
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
        const svgPlatea = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18h18M5 18V9a1 1 0 0 1 .553-.894l6-3a1 1 0 0 1 .894 0l6 3A1 1 0 0 1 19 9v9"/><rect x="9" y="13" width="6" height="5" rx="1"/></svg>
        const svgPalchi = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="4" height="10" rx="1"/><rect x="10" y="4" width="4" height="13" rx="1"/><rect x="18" y="7" width="4" height="10" rx="1"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
        const label = isP
          ? <span style={{display:'flex',alignItems:'center',gap:5}}>{svgPlatea} Platea (498)</span>
          : <span style={{display:'flex',alignItems:'center',gap:5}}>{svgPalchi} Palchi {v.split('-')[1]}° Piano</span>
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
    <div style={{display:'flex',height:'calc(100vh - 270px)',minHeight:550}}>
      <div ref={mapRef} style={{flex:1,overflow:'hidden',position:'relative',background:'#f8fafc',touchAction:'none'}}
        onWheel={onWheel} onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}
        onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}>
        <div style={{width:'100%',height:'100%',transform:`translate(${transform.x}px,${transform.y}px) scale(${transform.s})`,transformOrigin:'0 0',willChange:'transform'}}>
          {view==='platea'?PlateaSVG:PalchiSVG}
        </div>
        {tip && <div style={{position:'absolute',left:Math.min(tip.x+14,(mapRef.current?.offsetWidth||600)-280),top:tip.y-50,
          background:'#1e293b',color:'#fff',padding:'8px 12px',borderRadius:10,fontSize:12,whiteSpace:'nowrap',pointerEvents:'none',zIndex:100,
          boxShadow:'0 4px 16px rgba(0,0,0,.35)',fontFamily:"'Inter',sans-serif"}}>
          <div style={{fontWeight:700}}>{tip.seat.label}</div>
          {tip.occ ? <div style={{color:'#fca5a5'}}>✦ {tip.occ.cognome} {tip.occ.nome}{tip.occ.ragione_sociale?` — ${tip.occ.ragione_sociale}`:''}</div>
            : <div style={{color:'#15803d'}}>🟢 Disponibile</div>}
        </div>}
      </div>

      {/* Right panel */}
      <div style={{width:460,borderLeft:`1px solid ${C.brd}`,background:'#fff',display:'flex',flexDirection:'column',flexShrink:0}}>
        {/* Search + filters header */}
        <div style={{padding:'14px 16px 12px',background:'linear-gradient(to bottom,#fff,#fafbfd)',borderBottom:`1px solid ${C.brd}`}}>
          {/* Search */}
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:14,color:'#9CA3AF',pointerEvents:'none'}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca nome, azienda, email…"
              style={{width:'100%',padding:'10px 14px 10px 36px',borderRadius:12,border:`1.5px solid ${search?C.pri:C.brd}`,fontSize:13,outline:'none',
                boxSizing:'border-box',fontFamily:"'Inter',sans-serif",transition:'border-color .2s',background:'#fff'}}/>
            {search && <button onClick={()=>setSearch('')} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',
              background:'none',border:'none',cursor:'pointer',color:'#9CA3AF',fontSize:16,padding:0,lineHeight:1}}>×</button>}
          </div>
          {/* Filter pills + sort in one row */}
          <div style={{display:'flex',alignItems:'center',gap:6,marginTop:10}}>
            {[['all','Tutti',stats.tot,'#6B7280'],['unassigned','Senza',stats.u,'#f59e0b'],['assigned','Con',stats.a,'#22c55e']].map(([k,l,v,c])=>
              <button key={k} onClick={()=>setFilter(k)} style={{
                padding:'5px 10px',borderRadius:20,border:filter===k?'none':`1.5px solid ${C.brd}`,
                background:filter===k?'linear-gradient(90deg,#5B5FEF,#3730A3)':'#fff',
                color:filter===k?'#fff':C.txt,fontSize:11,cursor:'pointer',fontWeight:700,fontFamily:"'Inter',sans-serif",
                display:'flex',alignItems:'center',gap:4,transition:'all .2s',boxShadow:filter===k?'0 2px 8px rgba(91,95,239,.3)':'none'
              }}>{l} <span style={{
                background:filter===k?'rgba(255,255,255,.25)':c+'20',color:filter===k?'#fff':c,
                padding:'1px 6px',borderRadius:10,fontSize:10,fontWeight:800,minWidth:16,textAlign:'center'
              }}>{v}</span></button>
            )}
          </div>
          {/* Sort row */}
          <div style={{display:'flex',alignItems:'center',gap:8,marginTop:10}}>
            <span style={{fontSize:11,color:C.mut,fontWeight:600,whiteSpace:'nowrap'}}>Ordina:</span>
            <select value={sort} onChange={e=>setSort(e.target.value)} style={{
              flex:1,padding:'6px 10px',borderRadius:10,border:`1.5px solid ${C.brd}`,
              fontSize:11,color:C.txt,fontFamily:"'Inter',sans-serif",fontWeight:600,
              background:'#fff',cursor:'pointer',outline:'none'
            }}>
              <option value="data_desc">📅 Più recenti</option>
              <option value="data_asc">📅 Più vecchi</option>
              <option value="cognome_asc">🔤 Cognome A→Z</option>
              <option value="cognome_desc">🔤 Cognome Z→A</option>
              <option value="nome_asc">🔤 Nome A→Z</option>
              <option value="nome_desc">🔤 Nome Z→A</option>
              <option value="azienda_asc">🏢 Azienda A→Z</option>
              <option value="azienda_desc">🏢 Azienda Z→A</option>
              <option value="email_asc">📧 Email A→Z</option>
              <option value="posto_asc">🪑 Posto A→Z</option>
              <option value="posto_desc">🪑 Posto Z→A</option>
            </select>
          </div>
          {/* Results count */}
          {(search || filter !== 'all') ? (
            <div style={{marginTop:8,display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'linear-gradient(135deg,#fef3c7,#fde68a)',border:'1.5px solid #f59e0b',borderRadius:12}}>
              <span style={{fontSize:16}}>🔍</span>
              <span style={{fontSize:20,fontWeight:900,color:'#92400e',letterSpacing:'-0.02em'}}>{filtered.length}</span>
              <span style={{fontSize:11,color:'#78350f',fontWeight:600}}>
                {search ? `su ${stats.tot} — "${search}"` : `su ${stats.tot} filtrati`}
              </span>
              <button onClick={()=>{setSearch('');setFilter('all')}} style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'#92400e',fontSize:18,padding:0,lineHeight:1,fontWeight:700}}>×</button>
            </div>
          ) : (
            <div style={{marginTop:8,fontSize:11,color:C.mut,fontWeight:500}}>
              {filtered.length} iscritti
            </div>
          )}
        </div>
        {/* List */}
        <div style={{flex:1,overflowY:'auto'}}>
          {filtered.map(r=>{
            const isSel=selP?.id===r.id
            const hasPosto = !!r.numero_posto
            return <div key={r.id} onClick={()=>isSel?setSelP(null):setSelP(r)} style={{
              padding:'7px 12px',borderBottom:`1px solid #f1f5f9`,cursor:'pointer',
              background:isSel?'#eef2ff':hasPosto?'#f0fdf4':'transparent',
              borderLeft:isSel?`3px solid ${C.pri}`:'3px solid transparent',
              transition:'background .1s'}}>
              {/* Row 1: dot + name + posto badge inline */}
              <div style={{display:'flex',alignItems:'center',gap:7}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:hasPosto?C.free:'#f59e0b',flexShrink:0,
                  boxShadow:hasPosto?'0 0 0 2px #dcfce7':'0 0 0 2px #fef3c7'}}/>
                <span style={{fontWeight:700,fontSize:13,color:isSel?C.pri:C.txt,fontFamily:"'Inter',sans-serif",flex:1,lineHeight:1.3}}>
                  {r.cognome} {r.nome}
                  {r.gruppo_id===r.id && <span style={{marginLeft:5,fontSize:9,fontWeight:700,color:'#166534',background:'#dcfce7',padding:'1px 5px',borderRadius:6}}>CAP</span>}
                  {r.referente_id && r.referente_id!==r.id && <span style={{marginLeft:5,fontSize:9,color:'#6B7280'}}>↩</span>}
                </span>
                {hasPosto
                  ? <span style={{background:'#dcfce7',color:'#166534',padding:'2px 7px',borderRadius:7,fontWeight:700,fontSize:10,flexShrink:0,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>🪑 {r.numero_posto}</span>
                  : isSel
                    ? <span style={{fontSize:10,color:C.pri,fontWeight:700,flexShrink:0}}>👆 clicca mappa</span>
                    : <span style={{fontSize:10,color:'#d97706',flexShrink:0}}>senza posto</span>
                }
              </div>
              {/* Row 2: azienda */}
              {r.ragione_sociale && <div style={{fontSize:11,color:'#94a3b8',marginLeft:15,marginTop:1,lineHeight:1.2}}>{r.ragione_sociale}</div>}
              {/* Row 3: referente name (only if has ref) */}
              {r.referente_id && r.referente_id!==r.id && refMap[r.referente_id] && <div style={{fontSize:10,color:'#15803d',marginLeft:15,marginTop:1}}>↩ {refMap[r.referente_id]}</div>}
              {/* Rimuovi button only for assigned + selected */}
              {hasPosto && isSel && <div style={{marginLeft:15,marginTop:4}}>
                <button onClick={e=>{e.stopPropagation();if(confirm(`Rimuovere posto a ${r.nome} ${r.cognome}?`))saveSeat(r.id,null).then(ok=>{if(ok){showToast('Rimosso');onReload?.()}})}}
                  style={{padding:'2px 8px',borderRadius:7,border:'none',background:'#fef2f2',color:'#dc2626',fontSize:10,cursor:'pointer',fontWeight:700}}>✕ Rimuovi posto</button>
              </div>}
            </div>
          })}
          {!filtered.length && <div style={{padding:32,textAlign:'center',color:C.mut,fontSize:13}}>
            <div style={{fontSize:28,marginBottom:6}}>🔍</div>Nessun risultato
          </div>}
        </div>
      </div>
    </div>

    {/* Confirmation modal */}
    {confirmModal && <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center'}}
      onClick={()=>setConfirmModal(null)}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:20,padding:'28px 32px',maxWidth:420,width:'90%',boxShadow:'0 20px 60px rgba(0,0,0,.3)',fontFamily:"'Inter',sans-serif"}}>
        <h3 style={{margin:'0 0 16px',fontSize:18,fontWeight:800,color:'#1e293b'}}>
          {confirmModal.type==='assign' ? '✅ Conferma assegnazione' : '⚠️ Rimuovi posto'}
        </h3>
        <div style={{background:'#f8fafc',borderRadius:12,padding:'16px 20px',marginBottom:20}}>
          <p style={{margin:'0 0 8px',fontSize:15,fontWeight:700,color:'#1e293b'}}>
            {confirmModal.person.cognome} {confirmModal.person.nome}
          </p>
          {confirmModal.person.ragione_sociale && <p style={{margin:'0 0 8px',fontSize:13,color:'#6B7280'}}>{confirmModal.person.ragione_sociale}</p>}
          <div style={{background:'#003DA5',borderRadius:8,padding:'10px 16px',textAlign:'center',marginTop:8}}>
            <p style={{margin:0,fontSize:11,color:'rgba(255,255,255,.7)',textTransform:'uppercase',letterSpacing:'.06em',fontWeight:700}}>
              {confirmModal.type==='assign' ? 'POSTO DA ASSEGNARE' : 'POSTO DA RIMUOVERE'}
            </p>
            <p style={{margin:'4px 0 0',fontSize:20,fontWeight:900,color:'#fff'}}>{confirmModal.seat.label}</p>
          </div>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={()=>setConfirmModal(null)} style={{flex:1,padding:'12px',borderRadius:12,border:'1.5px solid #E8ECF4',background:'#fff',color:'#6B7280',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
            Annulla
          </button>
          <button onClick={doConfirm} disabled={saving} style={{flex:1,padding:'12px',borderRadius:12,border:'none',
            background:confirmModal.type==='assign'?'linear-gradient(90deg,#5B5FEF,#3730A3)':'#DC2626',
            color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif",
            opacity:saving?.6:1}}>
            {saving ? '...' : confirmModal.type==='assign' ? '✓ Assegna posto' : '✕ Rimuovi posto'}
          </button>
        </div>
      </div>
    </div>}

        {toast && <div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:toast.ok?'#065f46':'#991b1b',color:'#fff',
      padding:'12px 24px',borderRadius:14,fontSize:14,fontWeight:700,boxShadow:'0 6px 24px rgba(0,0,0,.35)',zIndex:9999,fontFamily:"'Inter',sans-serif"}}>
      {toast.ok?'✓':'✕'} {toast.m}
    </div>}
  </div>
}

const zB = {width:30,height:30,borderRadius:8,border:'1px solid #E8ECF4',background:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}
// rebuild 1788855850
