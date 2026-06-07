import React, { useEffect, useRef, useState } from 'react'
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragOverlay
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../hooks/useRole'
import RichEditor from '../../components/editor/RichEditor'
import ImageUploader from '../../components/editor/ImageUploader'
import {
  Save, ArrowLeft, Eye, Plus, Trash2, GripVertical,
  Type, Image, Grid3x3,
  Hash, Minus, MousePointerClick, AlignLeft, AlignCenter, Wand2, Loader2,
} from 'lucide-react'
import { Field, Input, Select, Btn, StatoBadge } from '../../components/ui'

const toSlug = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')

const SECTION_TYPES = [
  { tipo:'testo',     label:'Blocco testo',     icon:Type },
  { tipo:'immagine',  label:'Immagine',          icon:Image },
  { tipo:'griglia',   label:'Griglia 2 colonne', icon:Grid3x3 },
  { tipo:'stats',     label:'Numeri / Statistiche', icon:Hash },
  { tipo:'separatore',label:'Separatore',        icon:Minus },
  { tipo:'cta',       label:'Call to Action',    icon:MousePointerClick },
]

function newSection(tipo) {
  const base = { id: Date.now().toString(36), tipo, colore_sfondo:'#FFFFFF', padding:'40' }
  switch(tipo) {
    case 'testo':     return { ...base, titolo:'', contenuto:'<p>Testo qui…</p>' }
    case 'immagine':  return { ...base, src:'', didascalia:'', larghezza:'full' }
    case 'griglia':   return { ...base, colonne:[
      { titolo:'', testo:'', icona:'✓' },
      { titolo:'', testo:'', icona:'✓' },
    ]}
    case 'stats':     return { ...base, items:[
      { numero:'100+', label:'Partecipanti' },
      { numero:'10',   label:'Relatori' },
    ], colore_numeri:'#003DA5' }
    case 'separatore':return { ...base, stile:'linea', colore:'#E5E7EB' }
    case 'cta':       return { ...base, testo:'Iscriviti ora', link:'#form', colore_btn:'#003DA5', colore_testo:'#FFFFFF', titolo:'Partecipa all\'evento' }
    default:          return base
  }
}

// ── Editor singola sezione ───────────────────────────────────



// ── SORTABLE WRAPPER ────────────────────────────────────
function SortableSectionItem({ sec, i, total, onChange, onDelete, onMoveUp, onMoveDown }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sec.id || String(i) })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
  }
  return (
    <div ref={setNodeRef} style={style}>
      {/* Handle di trascinamento */}
      <div {...attributes} {...listeners}
        style={{
          position:'absolute', left:'-28px', top:'50%', transform:'translateY(-50%)',
          cursor:'grab', color:'#D1D5DB', display:'flex', alignItems:'center',
          padding:'4px', borderRadius:'4px', zIndex:1,
          touchAction:'none',
        }}
        title="Trascina per riordinare">
        <svg width="16" height="24" viewBox="0 0 16 24" fill="currentColor">
          <circle cx="5" cy="6"  r="2"/><circle cx="11" cy="6"  r="2"/>
          <circle cx="5" cy="12" r="2"/><circle cx="11" cy="12" r="2"/>
          <circle cx="5" cy="18" r="2"/><circle cx="11" cy="18" r="2"/>
        </svg>
      </div>
      <SectionEditor
        sec={sec}
        onChange={onChange}
        onDelete={onDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        isFirst={i === 0}
        isLast={i === total - 1}
      />
    </div>
  )
}

function InsertZone({ onAdd }) {
  const [hover, setHover] = React.useState(false)
  const [open,  setOpen]  = React.useState(false)
  const TYPES = [
    { tipo:'testo',      emoji:'📝', label:'Testo',       desc:'Blocco rich text' },
    { tipo:'immagine',   emoji:'🖼', label:'Immagine',    desc:'Foto con didascalia' },
    { tipo:'griglia',    emoji:'⊞',  label:'Griglia',     desc:'Colonne affiancate' },
    { tipo:'stats',      emoji:'📊', label:'Statistiche', desc:'Numeri in evidenza' },
    { tipo:'separatore', emoji:'—',  label:'Separatore',  desc:'Linea divisoria' },
    { tipo:'cta',        emoji:'🎯', label:'CTA',          desc:'Pulsante azione' },
  ]
  return (
    <div
      style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', height: hover||open ? '44px' : '20px', transition:'height .2s', margin:'2px 0', cursor:'pointer' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false) }}>
      {/* Linea orizzontale */}
      <div style={{ position:'absolute', left:0, right:0, height:'2px', backgroundColor: hover||open ? '#003DA5' : '#E5E7EB', transition:'background-color .15s, opacity .15s', borderRadius:'2px' }}/>
      {/* Pulsante + */}
      {(hover || open) && (
        <button
          onClick={e => { e.stopPropagation(); setOpen(!open) }}
          style={{ position:'relative', zIndex:2, width:'32px', height:'32px', borderRadius:'50%', backgroundColor: open?'#003DA5':'#FFFFFF', border:'2px solid #003DA5', color: open?'#FFF':'#003DA5', fontSize:'20px', fontWeight:'300', lineHeight:'28px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,61,165,.2)', transition:'all .15s', flexShrink:0 }}>
          {open ? '×' : '+'}
        </button>
      )}
      {/* Dropdown tipi sezione */}
      {open && (
        <>
          <div onClick={()=>setOpen(false)} style={{ position:'fixed', inset:0, zIndex:10 }}/>
          <div style={{ position:'absolute', top:'100%', left:'50%', transform:'translateX(-50%)', marginTop:'6px', backgroundColor:'#FFF', border:'1px solid #E5E7EB', borderRadius:'12px', boxShadow:'0 8px 32px rgba(0,0,0,.14)', padding:'8px', zIndex:20, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'6px', minWidth:'360px' }}>
            <div style={{ gridColumn:'1/-1', fontSize:'11px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.06em', padding:'4px 6px 2px' }}>Scegli tipo di blocco</div>
            {TYPES.map(({ tipo, emoji, label, desc }) => (
              <button key={tipo}
                onClick={() => { onAdd(tipo); setOpen(false); setHover(false) }}
                style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', padding:'10px', border:'1px solid #E5E7EB', borderRadius:'8px', cursor:'pointer', backgroundColor:'#FFF', fontFamily:"'Inter',sans-serif", transition:'all .1s' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor='#EEF3FF'; e.currentTarget.style.borderColor='#003DA5' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor='#FFF'; e.currentTarget.style.borderColor='#E5E7EB' }}>
                <span style={{ fontSize:'18px', marginBottom:'4px' }}>{emoji}</span>
                <span style={{ fontSize:'12px', fontWeight:'700', color:'#0A0A0A' }}>{label}</span>
                <span style={{ fontSize:'10px', color:'#9CA3AF', marginTop:'1px' }}>{desc}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ContentBlock({ label, badge, badgeColor='#003DA5', children }) {
  return (
    <div style={{ border:'1px solid #E5E7EB', borderRadius:'10px', overflow:'hidden', marginBottom:'2px' }}>
      <div style={{ padding:'8px 16px', backgroundColor:'#F8F9FF', borderBottom:'1px solid #E5E7EB', display:'flex', alignItems:'center', gap:'8px' }}>
        <span style={{ fontSize:'13px', fontWeight:'700', color: badgeColor }}>{label}</span>
        {badge && <span style={{ fontSize:'10px', color:'#9CA3AF', backgroundColor:'#F3F4F6', padding:'1px 8px', borderRadius:'10px' }}>{badge}</span>}
      </div>
      {children}
    </div>
  )
}

function SectionInserter({ onAdd, label='+ Inserisci sezione qui' }) {
  const [open, setOpen] = React.useState(false)
  const TYPES = [
    { tipo:'testo',      label:'📝 Testo',      desc:'Blocco testo formattato' },
    { tipo:'immagine',   label:'🖼 Immagine',   desc:'Immagine con didascalia' },
    { tipo:'griglia',    label:'⊞ Griglia',    desc:'Colonne affiancate' },
    { tipo:'stats',      label:'📊 Statistiche', desc:'Numeri in evidenza' },
    { tipo:'separatore', label:'— Separatore',  desc:'Linea o spazio' },
    { tipo:'cta',        label:'🎯 CTA',         desc:'Pulsante call-to-action' },
  ]
  return (
    <div style={{ position:'relative', display:'flex', justifyContent:'center', margin:'6px 0', zIndex:10 }}>
      <button onClick={e=>{e.stopPropagation();setOpen(!open)}}
        style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 16px', border:'1.5px dashed #C7D9F8', borderRadius:'20px', backgroundColor:open?'#EEF3FF':'#FFF', cursor:'pointer', fontSize:'12px', color:open?'#003DA5':'#6B7280', fontFamily:"'Inter',sans-serif", fontWeight:'600', transition:'all .15s' }}
        onMouseEnter={e=>{if(!open){e.currentTarget.style.borderColor='#003DA5';e.currentTarget.style.color='#003DA5'}}}
        onMouseLeave={e=>{if(!open){e.currentTarget.style.borderColor='#C7D9F8';e.currentTarget.style.color='#6B7280'}}}>
        ＋ {label.replace('+ ','')}
      </button>
      {open && (
        <>
          <div onClick={()=>setOpen(false)} style={{ position:'fixed', inset:0, zIndex:9 }}/>
          <div style={{ position:'absolute', top:'100%', left:'50%', transform:'translateX(-50%)', marginTop:'6px', backgroundColor:'#FFF', border:'1px solid #E5E7EB', borderRadius:'10px', boxShadow:'0 8px 24px rgba(0,0,0,.12)', padding:'8px', zIndex:10, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px', minWidth:'280px' }}>
            {TYPES.map(({ tipo, label, desc }) => (
              <button key={tipo} onClick={()=>{onAdd(tipo);setOpen(false)}}
                style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', padding:'10px 12px', border:'1px solid #E5E7EB', borderRadius:'8px', cursor:'pointer', backgroundColor:'#FFF', textAlign:'left', transition:'background-color .1s', fontFamily:"'Inter',sans-serif" }}
                onMouseEnter={e=>e.currentTarget.style.backgroundColor='#EEF3FF'}
                onMouseLeave={e=>e.currentTarget.style.backgroundColor='#FFF'}>
                <span style={{ fontSize:'13px', fontWeight:'700', color:'#0A0A0A' }}>{label}</span>
                <span style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'2px' }}>{desc}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function SectionEditor({ sec, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [open, setOpen] = useState(true)
  const TypeIcon = SECTION_TYPES.find(t=>t.tipo===sec.tipo)?.icon || Type

  return (
    <div style={se.wrap}>
      {/* Header sezione */}
      <div style={se.header}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <GripVertical size={16} style={{ color:'#9CA3AF' }}/>
          <TypeIcon size={16} style={{ color:'#003DA5' }}/>
          <span style={{ fontSize:'13px', fontWeight:'700', color:'#0A0A0A' }}>
            {SECTION_TYPES.find(t=>t.tipo===sec.tipo)?.label}
          </span>
        </div>
        <div style={{ display:'flex', gap:'4px' }}>
          <button onClick={onMoveUp} disabled={isFirst} style={se.iconBtn} title="Sposta su">↑</button>
          <button onClick={onMoveDown} disabled={isLast} style={se.iconBtn} title="Sposta giù">↓</button>
          <button onClick={() => setOpen(!open)} style={se.iconBtn}>{open ? '▲':'▼'}</button>
          <button onClick={onDelete} style={{ ...se.iconBtn, color:'#DC2626' }}>✕</button>
        </div>
      </div>

      {open && (
        <div style={se.body}>
          {/* Sfondo sezione */}
          <div style={se.row}>
            <label style={se.lbl}>Colore sfondo</label>
            <input type="color" value={sec.colore_sfondo||'#FFFFFF'}
              onChange={e=>onChange({...sec,colore_sfondo:e.target.value})}
              style={se.colorPick}/>
            <input value={sec.colore_sfondo||'#FFFFFF'}
              onChange={e=>onChange({...sec,colore_sfondo:e.target.value})}
              style={se.smallInput} placeholder="#FFFFFF"/>
            <label style={{ ...se.lbl, marginLeft:'12px' }}>Padding (px)</label>
            <input type="number" value={sec.padding||'40'}
              onChange={e=>onChange({...sec,padding:e.target.value})}
              style={{ ...se.smallInput, width:'60px' }}/>
          </div>

          {/* Contenuto per tipo */}
          {sec.tipo==='testo' && (
            <>
              <div style={{ marginBottom:'10px' }}>
                <label style={se.lbl}>Titolo sezione</label>
                <input value={sec.titolo||''} onChange={e=>onChange({...sec,titolo:e.target.value})}
                  style={se.input} placeholder="Titolo (opzionale)"/>
              </div>
              <label style={se.lbl}>Contenuto</label>
              <RichEditor value={sec.contenuto||''} onChange={v=>onChange({...sec,contenuto:v})}
                minHeight="200px" placeholder="Scrivi il contenuto della sezione…"/>
            </>
          )}

          {sec.tipo==='immagine' && (
            <>
              <label style={se.lbl}>Immagine</label>
              <ImageUploader value={sec.src||null} onChange={url=>onChange({...sec,src:url||''})}/>
              <div style={se.row}>
                <label style={se.lbl}>Larghezza</label>
                <select value={sec.larghezza||'full'} onChange={e=>onChange({...sec,larghezza:e.target.value})} style={se.select}>
                  <option value="full">Piena larghezza</option>
                  <option value="large">Grande (80%)</option>
                  <option value="medium">Media (60%)</option>
                  <option value="small">Piccola (40%)</option>
                </select>
                <label style={{ ...se.lbl, marginLeft:'12px' }}>Didascalia</label>
                <input value={sec.didascalia||''} onChange={e=>onChange({...sec,didascalia:e.target.value})}
                  style={se.smallInput} placeholder="Didascalia…"/>
              </div>
            </>
          )}

          {sec.tipo==='griglia' && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                <label style={se.lbl}>Colonne ({sec.colonne?.length||0})</label>
                <button style={se.addBtn} onClick={()=>onChange({...sec,colonne:[...(sec.colonne||[]),{titolo:'',testo:'',icona:'✓'}]})}>
                  + Aggiungi colonna
                </button>
              </div>
              {(sec.colonne||[]).map((col,i)=>(
                <div key={i} style={{ backgroundColor:'#F9FAFB', borderRadius:'6px', padding:'12px', marginBottom:'8px', border:'1px solid #E5E7EB' }}>
                  <div style={{ display:'flex', gap:'8px', marginBottom:'8px' }}>
                    <input value={col.icona||''} onChange={e=>{const c=[...sec.colonne];c[i]={...c[i],icona:e.target.value};onChange({...sec,colonne:c})}}
                      style={{ ...se.smallInput, width:'50px' }} placeholder="✓"/>
                    <input value={col.titolo||''} onChange={e=>{const c=[...sec.colonne];c[i]={...c[i],titolo:e.target.value};onChange({...sec,colonne:c})}}
                      style={se.input} placeholder="Titolo colonna"/>
                    <button onClick={()=>onChange({...sec,colonne:sec.colonne.filter((_,j)=>j!==i)})}
                      style={{ ...se.iconBtn, color:'#DC2626', border:'1px solid #FECACA' }}>✕</button>
                  </div>
                  <textarea value={col.testo||''} onChange={e=>{const c=[...sec.colonne];c[i]={...c[i],testo:e.target.value};onChange({...sec,colonne:c})}}
                    rows={3} placeholder="Testo…"
                    style={{ width:'100%', padding:'8px', border:'1px solid #D1D5DB', borderRadius:'4px', fontSize:'13px', fontFamily:"'Inter',sans-serif", resize:'vertical' }}/>
                </div>
              ))}
            </>
          )}

          {sec.tipo==='stats' && (
            <>
              <div style={{ display:'flex', gap:'10px', marginBottom:'10px' }}>
                <label style={se.lbl}>Colore numeri</label>
                <input type="color" value={sec.colore_numeri||'#003DA5'}
                  onChange={e=>onChange({...sec,colore_numeri:e.target.value})} style={se.colorPick}/>
              </div>
              {(sec.items||[]).map((item,i)=>(
                <div key={i} style={{ display:'flex', gap:'8px', marginBottom:'6px', alignItems:'center' }}>
                  <input value={item.numero} onChange={e=>{const it=[...sec.items];it[i]={...it[i],numero:e.target.value};onChange({...sec,items:it})}}
                    style={{ ...se.smallInput, width:'80px', fontWeight:'700' }} placeholder="100+"/>
                  <input value={item.label} onChange={e=>{const it=[...sec.items];it[i]={...it[i],label:e.target.value};onChange({...sec,items:it})}}
                    style={se.input} placeholder="Label"/>
                  <button onClick={()=>onChange({...sec,items:sec.items.filter((_,j)=>j!==i)})}
                    style={{ ...se.iconBtn, color:'#DC2626' }}>✕</button>
                </div>
              ))}
              <button style={se.addBtn} onClick={()=>onChange({...sec,items:[...(sec.items||[]),{numero:'0',label:''}]})}>
                + Aggiungi statistica
              </button>
            </>
          )}

          {sec.tipo==='separatore' && (
            <div style={se.row}>
              <label style={se.lbl}>Stile</label>
              <select value={sec.stile||'linea'} onChange={e=>onChange({...sec,stile:e.target.value})} style={se.select}>
                <option value="linea">Linea</option>
                <option value="spazio">Solo spazio</option>
                <option value="wave">Onda</option>
              </select>
              <label style={{ ...se.lbl, marginLeft:'12px' }}>Colore</label>
              <input type="color" value={sec.colore||'#E5E7EB'} onChange={e=>onChange({...sec,colore:e.target.value})} style={se.colorPick}/>
            </div>
          )}

          {sec.tipo==='cta' && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
                <div><label style={se.lbl}>Titolo</label><input value={sec.titolo||''} onChange={e=>onChange({...sec,titolo:e.target.value})} style={se.input} placeholder="Partecipa all'evento"/></div>
                <div><label style={se.lbl}>Testo pulsante</label><input value={sec.testo||''} onChange={e=>onChange({...sec,testo:e.target.value})} style={se.input} placeholder="Iscriviti ora"/></div>
              </div>
              <div style={se.row}>
                <label style={se.lbl}>Colore bottone</label>
                <input type="color" value={sec.colore_btn||'#003DA5'} onChange={e=>onChange({...sec,colore_btn:e.target.value})} style={se.colorPick}/>
                <label style={{ ...se.lbl, marginLeft:'12px' }}>Colore testo</label>
                <input type="color" value={sec.colore_testo||'#FFFFFF'} onChange={e=>onChange({...sec,colore_testo:e.target.value})} style={se.colorPick}/>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const se = {
  wrap:      { border:'1px solid #E5E7EB', borderRadius:'8px', marginBottom:'12px', overflow:'hidden' },
  header:    { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', backgroundColor:'#FAFAFA', borderBottom:'1px solid #E5E7EB', cursor:'pointer' },
  body:      { padding:'16px' },
  row:       { display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'10px' },
  lbl:       { fontSize:'12px', fontWeight:'600', color:'#374151', whiteSpace:'nowrap' },
  input:     { flex:1, padding:'7px 10px', border:'1px solid #D1D5DB', borderRadius:'4px', fontSize:'13px', fontFamily:"'Inter',sans-serif", outline:'none' },
  smallInput:{ padding:'5px 8px', border:'1px solid #D1D5DB', borderRadius:'4px', fontSize:'13px', fontFamily:"'Inter',sans-serif", outline:'none', minWidth:'80px' },
  select:    { padding:'5px 8px', border:'1px solid #D1D5DB', borderRadius:'4px', fontSize:'13px', fontFamily:"'Inter',sans-serif", outline:'none' },
  colorPick: { width:'32px', height:'28px', border:'1px solid #D1D5DB', borderRadius:'4px', cursor:'pointer', padding:'1px' },
  iconBtn:   { background:'none', border:'1px solid #E5E7EB', borderRadius:'4px', padding:'3px 7px', cursor:'pointer', fontSize:'13px', color:'#6B7280' },
  addBtn:    { background:'none', border:'1px dashed #003DA5', borderRadius:'4px', padding:'5px 12px', cursor:'pointer', fontSize:'12px', color:'#003DA5', fontFamily:"'Inter',sans-serif", fontWeight:'600' },
}

// ── PAGINA EDITOR COMPLETO ───────────────────────────────────
export default function EventoEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const isNew = id === 'nuovo'

  const [event, setEvent] = useState({
    titolo:'', slug:'', stato:'bozza', data_inizio:'', data_fine:'',
    luogo:'', descrizione_html:'', immagine_hero:null,
    colore_primario:'#003DA5', colore_sfondo:'#F4F5F7',
    layout_hero:{ altezza:'380', overlay_opacita:'55', allineamento:'sinistra', titolo_colore:'#FFFFFF', titolo_dimensione:'clamp(26px,5vw,54px)', titolo_grassetto:true, titolo_maiuscolo:false },
    sezioni:[],
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('info') // info | hero | sezioni | aspetto
  const { canWrite } = useRole()

  useEffect(() => {
    if (!isNew) loadEvent()
  }, [id])

  async function loadEvent() {
    const { data } = await supabase.from('events').select('*').eq('id', id).single()
    if (data) setEvent({
      ...data,
      data_inizio: data.data_inizio?.slice(0,16)||'',
      data_fine:   data.data_fine?.slice(0,16)||'',
      layout_hero: data.layout_hero || { altezza:'380', overlay_opacita:'55', allineamento:'sinistra' },
      sezioni:     data.sezioni || [],
    })
  }

  function setH(k) { return v => setEvent(p=>({...p,layout_hero:{...p.layout_hero,[k]:typeof v==='string'?v:v?.target?.value}})) }

  async function save() {
    if (!event.titolo.trim()) return alert('Il titolo è obbligatorio')
    setSaving(true)
    const payload = {
      titolo:event.titolo, slug:event.slug||toSlug(event.titolo),
      stato:event.stato, data_inizio:event.data_inizio||null,
      data_fine:event.data_fine||null, luogo:event.luogo||null,
      descrizione_html:event.descrizione_html||null,
      immagine_hero:event.immagine_hero||null,
      colore_primario:event.colore_primario,
      colore_sfondo:event.colore_sfondo,
      layout_hero:event.layout_hero,
      sezioni:event.sezioni,
    }
    if (isNew) {
      const { data } = await supabase.from('events').insert(payload).select().single()
      if (data) navigate(`/admin/eventi/${data.id}`, { replace:true })
    } else {
      await supabase.from('events').update(payload).eq('id', id)
    }
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2500)
  }

  async function generateHeroImage() {
    if (!genPrompt.trim()) return
    setGenerating(true)
    try {
      // Usa l'API Anthropic per ottenere un prompt ottimizzato per la ricerca
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens:100,
          messages:[{
            role:'user',
            content:`Traduci in inglese questa richiesta di immagine per un motore di ricerca fotografico professionale. Restituisci SOLO le parole chiave in inglese, max 5 parole, niente altro: "${genPrompt}"`
          }]
        })
      })
      const aiData = await response.json()
      const englishQuery = aiData.content?.[0]?.text?.trim() || genPrompt

      // Usa Unsplash con il prompt ottimizzato
      const seed = englishQuery.replace(/\s+/g,',').toLowerCase()
      const imgUrl = `https://source.unsplash.com/1200x500/?${encodeURIComponent(seed)}`

      const res  = await fetch(imgUrl)
      const blob = await res.blob()
      const file = new File([blob], `hero-ai.jpg`, { type:'image/jpeg' })

      const ext  = 'jpg'
      const path = `hero/${Date.now()}-ai.${ext}`
      const { error } = await supabase.storage.from('eventi-immagini').upload(path, file, { upsert:true })
      if (!error) {
        const { data: urlData } = supabase.storage.from('eventi-immagini').getPublicUrl(path)
        setEvent(p=>({...p,immagine_hero:urlData.publicUrl}))
      }
    } catch(e) {
      alert('Errore nella generazione. Riprova.')
    }
    setGenerating(false)
  }

  // insertBefore = indice PRIMA del quale inserire (0 = all'inizio, sezioni.length = in fondo)
  function addSection(tipo, insertBefore) {
    const sec = newSection(tipo)
    setEvent(prev => {
      const arr = [...(prev.sezioni||[])]
      const pos = (insertBefore === undefined || insertBefore === null)
        ? arr.length          // in fondo
        : Math.max(0, Math.min(insertBefore, arr.length))
      arr.splice(pos, 0, sec)
      return { ...prev, sezioni: arr }
    })
  }
  function updateSection(idx, sec) { setEvent(p=>{ const s=[...p.sezioni]; s[idx]=sec; return {...p,sezioni:s} }) }
  function deleteSection(idx)     { setEvent(p=>({...p,sezioni:p.sezioni.filter((_,i)=>i!==idx)})) }
  function moveSection(idx, dir)  {
    setEvent(p=>{
      const s=[...p.sezioni]; const t=s[idx]; s[idx]=s[idx+dir]; s[idx+dir]=t
      return {...p,sezioni:s}
    })
  }

  const TABS = [
    { id:'info',    label:'📋 Info & Date' },
    { id:'hero',    label:'🖼 Hero' },
    { id:'contenuto', label:`📝 Contenuto` },
    { id:'aspetto', label:'🎨 Aspetto' },
  ]

  return (
    <div style={p.root}>
      {/* TOP BAR */}
      <div style={p.topBar}>
        <button onClick={()=>navigate('/admin/eventi')} style={p.backBtn}>
          <ArrowLeft size={18}/> <span>Torna agli eventi</span>
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', flex:1, minWidth:0, margin:'0 16px' }}>
          <input
            value={event.titolo}
            onChange={e=>setEvent(p=>({...p, titolo:e.target.value, slug:p.slug||toSlug(e.target.value)}))}
            placeholder="Titolo evento…"
            style={p.titleInput}
          />
          <StatoBadge stato={event.stato}/>
        </div>
        <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
          {event.slug && event.stato==='pubblicato' && (
            <a href={`/eventi/${event.slug}`} target="_blank" rel="noopener noreferrer" style={p.previewBtn}>
              <Eye size={16}/> Anteprima
            </a>
          )}
          <button onClick={save} disabled={saving||!canWrite} style={p.saveBtn}>
            {saving ? <><Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/> Salvataggio…</>
              : saved ? <>✓ Salvato!</>
              : <><Save size={16}/> Salva</>}
          </button>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={p.tabBar}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            style={{ ...p.tab, borderBottom:`2px solid ${activeTab===t.id?'#003DA5':'transparent'}`,
              color:activeTab===t.id?'#003DA5':'#6B7280', fontWeight:activeTab===t.id?'700':'500' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={p.content}>

        {/* ── INFO ── */}
        {activeTab==='info' && (
          <div style={p.panel}>
            <h2 style={p.panelTitle}>Informazioni evento</h2>
            <div style={p.grid2}>
              <div style={{ gridColumn:'1/-1' }}>
                <Field label="Slug URL (generato automaticamente dal titolo)">
                  <div style={{ display:'flex', alignItems:'center', gap:'0' }}>
                    <span style={{ padding:'9px 12px', backgroundColor:'#F4F5F7', border:'1px solid #D1D5DB', borderRight:'none', borderRadius:'6px 0 0 6px', fontSize:'13px', color:'#9CA3AF', whiteSpace:'nowrap' }}>/eventi/</span>
                    <Input value={event.slug||''} onChange={e=>setEvent(p=>({...p,slug:toSlug(e.target.value)}))}
                      placeholder="slug-url-evento" style={{ borderRadius:'0 6px 6px 0' }}/>
                  </div>
                </Field>
              </div>
              <Field label="Data e ora inizio">
                <Input type="datetime-local" value={event.data_inizio||''} onChange={e=>setEvent(p=>({...p,data_inizio:e.target.value}))}/>
              </Field>
              <Field label="Data e ora fine">
                <Input type="datetime-local" value={event.data_fine||''} onChange={e=>setEvent(p=>({...p,data_fine:e.target.value}))}/>
              </Field>
              <div style={{ gridColumn:'1/-1' }}>
                <Field label="Sede / Indirizzo completo">
                  <Input value={event.luogo||''} onChange={e=>setEvent(p=>({...p,luogo:e.target.value}))}
                    placeholder="es. Palazzo dei Congressi, Piazza J.F. Kennedy 1, Roma"/>
                </Field>
              </div>
              <Field label="Stato">
                <Select value={event.stato} onChange={e=>setEvent(p=>({...p,stato:e.target.value}))}>
                  <option value="bozza">📝 Bozza</option>
                  <option value="pubblicato">🟢 Pubblicato</option>
                  <option value="chiuso">🔴 Chiuso</option>
                  <option value="archiviato">📦 Archiviato</option>
                </Select>
              </Field>
            </div>
          </div>
        )}

        {/* ── HERO ── */}
        {activeTab==='hero' && (
          <div style={p.panel}>
            <h2 style={p.panelTitle}>Immagine Hero</h2>

            <div style={{ marginBottom:'20px' }}>
              <ImageUploader value={event.immagine_hero} onChange={url=>setEvent(p=>({...p,immagine_hero:url}))}/>
            </div>

            <div style={p.grid3}>
              <Field label={`Altezza hero: ${event.layout_hero?.altezza||'380'}px`}>
                <input type="range" min="200" max="700" step="20"
                  value={event.layout_hero?.altezza||'380'} onChange={e=>setH('altezza')(e.target.value)}
                  style={{ width:'100%' }}/>
              </Field>
              <Field label={`Opacità overlay: ${event.layout_hero?.overlay_opacita||'55'}%`}>
                <input type="range" min="0" max="90" step="5"
                  value={event.layout_hero?.overlay_opacita||'55'} onChange={e=>setH('overlay_opacita')(e.target.value)}
                  style={{ width:'100%' }}/>
              </Field>
              <Field label="Allineamento testo">
                <div style={{ display:'flex', gap:'8px' }}>
                  {['sinistra','centro'].map(a=>(
                    <button key={a} onClick={()=>setH('allineamento')(a)}
                      style={{ flex:1, padding:'8px', border:`1px solid ${event.layout_hero?.allineamento===a?'#003DA5':'#E5E7EB'}`,
                        borderRadius:'6px', backgroundColor:event.layout_hero?.allineamento===a?'#EEF3FF':'#FFFFFF',
                        cursor:'pointer', fontSize:'12px', fontWeight:'600', color:event.layout_hero?.allineamento===a?'#003DA5':'#6B7280',
                        fontFamily:"'Inter',sans-serif" }}>
                      {a==='sinistra'?'◀ Sinistra':'▶ Centro'}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {/* Stile titolo */}
            <div style={{ marginTop:'16px', padding:'16px', backgroundColor:'#F9FAFB', borderRadius:'8px', border:'1px solid #E5E7EB' }}>
              <p style={{ fontSize:'12px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 12px' }}>Stile titolo</p>
              <div style={p.grid3}>
                <Field label="Colore titolo">
                  <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                    <input type="color" value={event.layout_hero?.titolo_colore||'#FFFFFF'}
                      onChange={e=>setH('titolo_colore')(e.target.value)}
                      style={{ width:'40px', height:'34px', border:'1px solid #D1D5DB', borderRadius:'6px', cursor:'pointer', padding:'2px' }}/>
                    <Input value={event.layout_hero?.titolo_colore||'#FFFFFF'}
                      onChange={e=>setH('titolo_colore')(e.target.value)} placeholder="#FFFFFF"/>
                  </div>
                </Field>
                <Field label="Dimensione">
                  <Select value={event.layout_hero?.titolo_dimensione||'clamp(26px,5vw,54px)'}
                    onChange={e=>setH('titolo_dimensione')(e.target.value)}>
                    <option value="clamp(20px,3vw,32px)">Piccolo</option>
                    <option value="clamp(24px,4vw,42px)">Medio</option>
                    <option value="clamp(26px,5vw,54px)">Grande</option>
                    <option value="clamp(32px,6vw,68px)">Extra Grande</option>
                  </Select>
                </Field>
                <Field label="Stile">
                  <div style={{ display:'flex', gap:'8px' }}>
                    <button onClick={()=>setH('titolo_grassetto')(!event.layout_hero?.titolo_grassetto)}
                      style={{ flex:1, padding:'7px', border:`1px solid ${event.layout_hero?.titolo_grassetto?'#003DA5':'#E5E7EB'}`,
                        borderRadius:'6px', backgroundColor:event.layout_hero?.titolo_grassetto?'#EEF3FF':'#FFF',
                        cursor:'pointer', fontSize:'13px', fontWeight:'800', fontFamily:"'Inter',sans-serif",
                        color:event.layout_hero?.titolo_grassetto?'#003DA5':'#6B7280' }}>B</button>
                    <button onClick={()=>setH('titolo_maiuscolo')(!event.layout_hero?.titolo_maiuscolo)}
                      style={{ flex:1, padding:'7px', border:`1px solid ${event.layout_hero?.titolo_maiuscolo?'#003DA5':'#E5E7EB'}`,
                        borderRadius:'6px', backgroundColor:event.layout_hero?.titolo_maiuscolo?'#EEF3FF':'#FFF',
                        cursor:'pointer', fontSize:'12px', fontWeight:'600', fontFamily:"'Inter',sans-serif",
                        color:event.layout_hero?.titolo_maiuscolo?'#003DA5':'#6B7280' }}>AA</button>
                  </div>
                </Field>
              </div>
            </div>

            {/* Anteprima */}
            <div style={{ marginTop:'16px' }}>
              <p style={p.sectionLbl}>Anteprima hero</p>
              <div style={{
                borderRadius:'10px', overflow:'hidden', border:'1px solid #E5E7EB',
                height:`${Math.min(220, parseInt(event.layout_hero?.altezza||'380')/1.7)}px`,
                backgroundImage:event.immagine_hero?`url(${event.immagine_hero})`:undefined,
                background:event.immagine_hero?undefined:'linear-gradient(135deg,#003DA5,#001a50)',
                backgroundSize:'cover', backgroundPosition:'center', display:'flex', alignItems:'flex-end',
              }}>
                <div style={{ padding:'20px 24px', background:`rgba(0,0,0,${(event.layout_hero?.overlay_opacita||55)/100})`,
                  width:'100%', textAlign:event.layout_hero?.allineamento==='centro'?'center':'left' }}>
                  <p style={{ color:'rgba(255,255,255,.7)', fontSize:'11px', margin:'0 0 4px', fontWeight:'600' }}>EVENTO CNA ROMA</p>
                  <p style={{ color:event.layout_hero?.titolo_colore||'#FFF', fontSize:'18px', fontWeight:event.layout_hero?.titolo_grassetto?'900':'400', margin:0, textTransform:event.layout_hero?.titolo_maiuscolo?'uppercase':'none' }}>{event.titolo||'Titolo evento'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CONTENUTO ── */}
        {activeTab==='contenuto' && (() => {
          const sensors = useSensors(
            useSensor(PointerSensor, { activationConstraint:{ distance:6 } }),
            useSensor(TouchSensor,   { activationConstraint:{ delay:150, tolerance:5 } })
          )
          const sezioniIds = (event.sezioni||[]).map((s,i) => s.id || String(i))

          function handleDragEnd(e) {
            const { active, over } = e
            if (!active || !over || active.id === over.id) return
            const sezioni = event.sezioni || []
            const oldIdx = sezioni.findIndex((s,i) => (s.id||String(i)) === active.id)
            const newIdx = sezioni.findIndex((s,i) => (s.id||String(i)) === over.id)
            if (oldIdx !== -1 && newIdx !== -1) {
              setEvent(p => ({ ...p, sezioni: arrayMove(p.sezioni, oldIdx, newIdx) }))
            }
          }

          return (
            <div style={p.panel}>
              <h2 style={p.panelTitle}>Contenuto della landing page</h2>
              <p style={{ fontSize:'13px', color:'#6B7280', margin:'0 0 16px' }}>
                Usa il <strong>⠿</strong> a sinistra di ogni blocco per trascinarlo nel punto desiderato.
              </p>

              {/* Descrizione principale — non draggabile, sempre in cima */}
              <div style={{ border:'1px solid #C7D9F8', borderRadius:'10px', overflow:'hidden', marginBottom:'8px', backgroundColor:'#F8FAFF' }}>
                <div style={{ padding:'8px 16px', borderBottom:'1px solid #E5E7EB', display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ fontSize:'13px', fontWeight:'700', color:'#003DA5' }}>📝 Descrizione principale</span>
                  <span style={{ fontSize:'10px', color:'#9CA3AF', backgroundColor:'#EEF3FF', padding:'1px 8px', borderRadius:'10px' }}>sempre in cima</span>
                </div>
                <RichEditor
                  value={event.descrizione_html||''}
                  onChange={v=>setEvent(p=>({...p,descrizione_html:v}))}
                  minHeight="260px"
                  placeholder="Inserisci la descrizione dell'evento…"
                />
              </div>

              {/* Sezioni riordinabili */}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sezioniIds} strategy={verticalListSortingStrategy}>
                  <div style={{ display:'flex', flexDirection:'column', gap:'6px', paddingLeft:'32px' }}>
                    {(event.sezioni||[]).map((sec, i) => (
                      <SortableSectionItem
                        key={sec.id||String(i)}
                        sec={sec}
                        i={i}
                        total={(event.sezioni||[]).length}
                        onChange={s=>updateSection(i,s)}
                        onDelete={()=>deleteSection(i)}
                        onMoveUp={()=>moveSection(i,-1)}
                        onMoveDown={()=>moveSection(i,1)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Aggiungi sezione */}
              <div style={{ marginTop:'12px' }}>
                <InsertZone onAdd={(tipo) => addSection(tipo, (event.sezioni||[]).length)}/>
              </div>
            </div>
          )
        })()}

        {/* ── ASPETTO ── */}
        {activeTab==='aspetto' && (
          <div style={p.panel}>
            <h2 style={p.panelTitle}>Colori e aspetto</h2>
            <div style={p.grid2}>
              <Field label="Colore primario (pulsanti, link, accenti)">
                <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                  <input type="color" value={event.colore_primario||'#003DA5'}
                    onChange={e=>setEvent(p=>({...p,colore_primario:e.target.value}))}
                    style={{ width:'48px', height:'40px', border:'1px solid #D1D5DB', borderRadius:'6px', cursor:'pointer', padding:'2px' }}/>
                  <Input value={event.colore_primario||'#003DA5'}
                    onChange={e=>setEvent(p=>({...p,colore_primario:e.target.value}))}/>
                </div>
              </Field>
              <Field label="Colore sfondo sezioni">
                <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                  <input type="color" value={event.colore_sfondo||'#F4F5F7'}
                    onChange={e=>setEvent(p=>({...p,colore_sfondo:e.target.value}))}
                    style={{ width:'48px', height:'40px', border:'1px solid #D1D5DB', borderRadius:'6px', cursor:'pointer', padding:'2px' }}/>
                  <Input value={event.colore_sfondo||'#F4F5F7'}
                    onChange={e=>setEvent(p=>({...p,colore_sfondo:e.target.value}))}/>
                </div>
              </Field>
            </div>

            {/* Palette */}
            <div style={{ marginTop:'16px' }}>
              <p style={p.sectionLbl}>Palette preimpostate</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                {[
                  { nome:'CNA Roma',    primario:'#003DA5', sfondo:'#EEF3FF' },
                  { nome:'Verde',       primario:'#16A34A', sfondo:'#F0FDF4' },
                  { nome:'Rosso CNA',   primario:'#DC2626', sfondo:'#FEF2F2' },
                  { nome:'Viola',       primario:'#7C3AED', sfondo:'#F5F3FF' },
                  { nome:'Oro',         primario:'#D97706', sfondo:'#FFFBEB' },
                  { nome:'Grafite',     primario:'#1F2937', sfondo:'#F9FAFB' },
                  { nome:'Teal',        primario:'#0D9488', sfondo:'#F0FDFA' },
                  { nome:'Bianco puro', primario:'#003DA5', sfondo:'#FFFFFF' },
                ].map(pl=>(
                  <button key={pl.nome}
                    onClick={()=>setEvent(p=>({...p,colore_primario:pl.primario,colore_sfondo:pl.sfondo}))}
                    style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 14px',
                      border:`2px solid ${event.colore_primario===pl.primario?pl.primario:'#E5E7EB'}`,
                      borderRadius:'8px', backgroundColor:'#FFFFFF', cursor:'pointer',
                      fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:'600', color:'#374151' }}>
                    <span style={{ display:'flex', gap:'3px' }}>
                      <span style={{ width:'16px', height:'16px', borderRadius:'50%', backgroundColor:pl.primario }}/>
                      <span style={{ width:'16px', height:'16px', borderRadius:'50%', backgroundColor:pl.sfondo, border:'1px solid #E5E7EB' }}/>
                    </span>
                    {pl.nome}
                  </button>
                ))}
              </div>
            </div>

            {/* Anteprima */}
            <div style={{ marginTop:'20px', backgroundColor:event.colore_sfondo||'#F4F5F7', borderRadius:'10px', padding:'24px', border:'1px solid #E5E7EB' }}>
              <p style={{ fontSize:'11px', color:'#9CA3AF', margin:'0 0 12px', fontWeight:'600', textTransform:'uppercase' }}>Anteprima</p>
              <button style={{ backgroundColor:event.colore_primario||'#003DA5', color:'#FFFFFF', border:'none', borderRadius:'8px', padding:'12px 24px', fontSize:'14px', fontWeight:'700', fontFamily:"'Inter',sans-serif", cursor:'default' }}>
                Iscriviti ora →
              </button>
              <span style={{ marginLeft:'16px', fontSize:'14px', color:event.colore_primario||'#003DA5', fontWeight:'600', textDecoration:'underline', cursor:'default' }}>Scopri di più</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}

// Stili pagina
const p = {
  root:       { display:'flex', flexDirection:'column', height:'100vh', backgroundColor:'#F4F5F7', fontFamily:"'Inter',sans-serif", overflow:'hidden' },
  topBar:     { display:'flex', alignItems:'center', backgroundColor:'#FFFFFF', borderBottom:'1px solid #E5E7EB', padding:'0 24px', height:'60px', flexShrink:0, zIndex:10 },
  backBtn:    { display:'flex', alignItems:'center', gap:'6px', background:'none', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'7px 14px', cursor:'pointer', fontSize:'13px', fontWeight:'600', color:'#374151', fontFamily:"'Inter',sans-serif", flexShrink:0 },
  titleInput: { flex:1, border:'none', fontSize:'18px', fontWeight:'800', color:'#0A0A0A', letterSpacing:'-.02em', outline:'none', backgroundColor:'transparent', fontFamily:"'Inter',sans-serif", minWidth:0 },
  previewBtn: { display:'flex', alignItems:'center', gap:'6px', border:'1px solid #003DA5', color:'#003DA5', borderRadius:'6px', padding:'7px 14px', fontSize:'13px', fontWeight:'700', textDecoration:'none', fontFamily:"'Inter',sans-serif" },
  saveBtn:    { display:'flex', alignItems:'center', gap:'6px', backgroundColor:'#003DA5', color:'#FFFFFF', border:'none', borderRadius:'6px', padding:'8px 20px', cursor:'pointer', fontSize:'14px', fontWeight:'700', fontFamily:"'Inter',sans-serif" },
  tabBar:     { display:'flex', gap:'0', backgroundColor:'#FFFFFF', borderBottom:'1px solid #E5E7EB', padding:'0 24px', flexShrink:0, overflowX:'auto' },
  tab:        { padding:'14px 18px', background:'none', border:'none', borderBottom:'2px solid transparent', cursor:'pointer', fontSize:'13px', fontFamily:"'Inter',sans-serif", whiteSpace:'nowrap', transition:'color .15s' },
  content:    { flex:1, overflowY:'auto', padding:'24px' },
  panel:      { maxWidth:'860px', margin:'0 auto' },
  panelTitle: { fontSize:'22px', fontWeight:'900', color:'#0A0A0A', letterSpacing:'-.03em', margin:'0 0 20px' },
  grid2:      { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' },
  grid3:      { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'16px' },
  sectionAdder:{ backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'8px', padding:'16px', marginBottom:'16px' },
  sectionLbl: { fontSize:'11px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 10px' },
  addSecBtn:  { display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', border:'1px solid #E5E7EB', borderRadius:'6px', backgroundColor:'#FFFFFF', cursor:'pointer', fontSize:'12px', fontWeight:'600', color:'#374151', fontFamily:"'Inter',sans-serif", transition:'border-color .15s' },
  aiBox:      { backgroundColor:'#F8F4FF', border:'1px solid #E9D5FF', borderRadius:'10px', padding:'16px', marginBottom:'20px' },
  aiLabel:    { display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', fontWeight:'700', color:'#7C3AED', margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'.04em' },
}
