import React, { useEffect, useRef, useState } from 'react'
const DIM_MAP={'clamp(13px,1.5vw,16px)':'16px','clamp(15px,2vw,20px)':'22px','clamp(18px,2.5vw,26px)':'30px','clamp(22px,3vw,34px)':'40px'}
function normDim(v){return DIM_MAP[v]||v||'22px'}

// Converte una stringa ISO UTC in "YYYY-MM-DDTHH:MM" nell'orario locale del browser
function toLocalDatetimeStr(isoUtc) {
  if (!isoUtc) return ''
  const d = new Date(isoUtc)
  const pad = n => String(n).padStart(2,'0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
// Converte una stringa "YYYY-MM-DDTHH:MM" locale in ISO UTC per il salvataggio
function toUTCISOStr(localStr) {
  if (!localStr) return null
  return new Date(localStr).toISOString()
}

import { usePageTitle } from '../../hooks/usePageTitle'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useRole } from '../../hooks/useRole'
import { logAttivita } from '../../lib/activityLog'
import RichEditor from '../../components/editor/RichEditor'
import BlockEditor, { newBlock } from '../../components/editor/BlockEditor'
import ImageUploader from '../../components/editor/ImageUploader'
import LogoManager from '../../components/editor/LogoManager'
import AddressSearch from '../../components/editor/AddressSearch'
import HeroDragPreview from '../../components/editor/HeroDragPreview'
import IframePreview from '../../components/IframePreview'
import {
  Save, ArrowLeft, Eye, Plus, Trash2, GripVertical,
  Type, Image, Grid3x3,
  Hash, Minus, MousePointerClick, AlignLeft, AlignCenter, Wand2, Loader2,
} from 'lucide-react'
import { Field, Input, Select, Btn, StatoBadge } from '../../components/ui'
import EventEmailTab from '../../components/editor/EventEmailTab'
import CertificatoEditorTab from '../../components/editor/CertificatoEditorTab'
import IscrizioniTab from '../../components/editor/IscrizioniTab'
import AspettoTab from '../../components/editor/AspettoTab'
import SessioniTab from '../../components/editor/SessioniTab'
import QuestionarioTab from '../../components/editor/QuestionarioTab'
import MailUpExportTab from '../../components/editor/MailUpExportTab'
import TagInput from '../../components/editor/TagInput'
import EmbedWidget from '../../components/editor/EmbedWidget'
import GlowTabBar from '../../components/GlowTabBar'

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

// ── BARRA AGGIUNGI SEZIONE ───────────────────────────────
const SECTION_TYPES_LIST = [
  { tipo:'testo',      emoji:'📝', label:'Testo ricco' },
  { tipo:'immagine',   emoji:'🖼',  label:'Immagine' },
  { tipo:'griglia',    emoji:'⊞',   label:'Griglia colonne' },
  { tipo:'stats',      emoji:'📊',  label:'Statistiche' },
  { tipo:'separatore', emoji:'—',   label:'Separatore' },
  { tipo:'cta',        emoji:'🎯',  label:'Call to action' },
]

function AddSectionBar({ onAdd }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position:'relative', marginTop:'12px' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display:'flex', alignItems:'center', gap:'8px',
          width:'100%', padding:'12px 18px',
          border:`2px dashed ${open ? '#003DA5' : '#D1D5DB'}`,
          borderRadius:'8px', backgroundColor: open ? '#EEF3FF' : '#FAFAFA',
          cursor:'pointer', fontSize:'14px', fontWeight:'700',
          color: open ? '#003DA5' : '#6B7280',
          fontFamily:"'Inter',sans-serif", justifyContent:'center',
          transition:'all .15s',
        }}>
        <span style={{ fontSize:'18px', lineHeight:1 }}>{open ? '✕' : '+'}</span>
        {open ? 'Chiudi' : 'Aggiungi sezione'}
      </button>
      {open && (
        <div style={{
          marginTop:'8px', border:'1px solid #E5E7EB', borderRadius:'10px',
          backgroundColor:'#FFFFFF', overflow:'hidden',
          boxShadow:'0 4px 16px rgba(0,0,0,.08)',
        }}>
          {SECTION_TYPES_LIST.map(({ tipo, emoji, label }) => (
            <button key={tipo} type="button"
              onClick={() => { onAdd(tipo); setOpen(false) }}
              style={{
                display:'flex', alignItems:'center', gap:'12px',
                width:'100%', padding:'13px 18px',
                border:'none', borderBottom:'1px solid #F3F4F6',
                backgroundColor:'#FFF', cursor:'pointer',
                fontFamily:"'Inter',sans-serif", textAlign:'left',
                transition:'background-color .1s',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor='#EEF3FF'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor='#FFF'}>
              <span style={{ fontSize:'20px', flexShrink:0 }}>{emoji}</span>
              <span style={{ fontSize:'14px', fontWeight:'600', color:'#0A0A0A' }}>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Editor singola sezione ───────────────────────────────────






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

  const isNew = !id || id === 'novo' || id === 'nuovo'

  const [event, setEvent] = useState({
    titolo:'', slug:'', stato:'bozza', data_inizio:'', data_fine:'',
    luogo:'', sottotitolo:'', footer_testo:'', footer_html:'', footer_modalita:'semplice', descrizione_html:'', immagine_hero:null, logo_url:null,
      modalita:'presenza', link_riunione:null,
      teatro_abilitato:false, teatro_capienza:null, teatro_note:null,
      form_note:null,
      certificato_abilitato:false, certificato_titolo:null, certificato_invio_auto:true,
      certificato_colore:'#003DA5', certificato_logo_url:null, certificato_firma_nome:null, certificato_firma_ruolo:null,
      certificato_template:'laterale', certificato_config:{},
    colore_primario:'#003DA5', colore_sfondo:'#F4F5F7', tema:{},
    layout_hero:{ altezza:'380', overlay_opacita:'55', overlay_colore:'#000000', allineamento:'sinistra', titolo_colore:'#FFFFFF', titolo_dimensione:'clamp(26px,5vw,54px)', titolo_grassetto:true, titolo_maiuscolo:false },
    sezioni:[], mailup_blocchi:[], email_organizzatore:'', email_mittente:'', email_cc:'', nome_mittente:'',
  })
  const eventRef = useRef(null)   // sempre aggiornato — evita race condition nel save
  useEffect(() => { eventRef.current = event }, [event])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('info')
  const { canManage } = useRole()
  const canWrite = canManage('eventi')

  usePageTitle(event.titolo ? `Modifica — ${event.titolo}` : 'Nuovo evento')



  useEffect(() => {
    if (!isNew) loadEvent()
  }, [id])

  async function loadEvent() {
    const { data } = await supabase.from('events').select('*').eq('id', id).single()
    if (data) {
      let sezioni = data.sezioni || []
      // Migrazione automatica: se c'è descrizione_html ma nessun blocco, crea il primo blocco testo
      if (data.descrizione_html && sezioni.length === 0) {
        sezioni = [{ id: 'migrated-' + Date.now().toString(36), tipo: 'testo', html: data.descrizione_html }]
      }
      setEvent(prev => {
        const next = {
          ...data,
          data_inizio: data.data_inizio ? toLocalDatetimeStr(data.data_inizio) : '',
          data_fine:   data.data_fine   ? toLocalDatetimeStr(data.data_fine)   : '',
          layout_hero: data.layout_hero || { altezza:'380', overlay_opacita:'55', allineamento:'sinistra' },
          logo_url: data.logo_url || null,
          sottotitolo: data.sottotitolo || '',
          sottotitolo_bold: data.sottotitolo_bold || false,
          sottotitolo_size: data.sottotitolo_size || null,
          footer_testo: data.footer_testo || '',
          tema: data.tema || {},
          sezioni,
          descrizione_html: sezioni.length > 0 ? null : data.descrizione_html,
          email_organizzatore: data.email_organizzatore || '',
          email_mittente: data.email_mittente || '',
          email_cc: data.email_cc || '',
          footer_html: data.footer_html || '',
          footer_modalita: data.footer_modalita || 'semplice',
          mailup_blocchi: data.mailup_blocchi || [],
        tags: data.tags || [],
          nome_mittente: data.nome_mittente || '',
        }
        eventRef.current = next
        return next
      })
    }
  }

  function setH(k) {
    return v => {
      const val = typeof v === 'boolean' ? v : typeof v === 'string' ? v : v?.target?.value
      setEvent(p => {
        const next = { ...p, layout_hero: { ...p.layout_hero, [k]: val } }
        eventRef.current = next
        return next
      })
    }
  }

  // Wrapper setEvent che mantiene sempre il ref aggiornato
  function updEvent(updater) {
    setEvent(p => {
      const next = typeof updater === 'function' ? updater(p) : { ...p, ...updater }
      eventRef.current = next
      return next
    })
  }

  const contentRef = useRef(null)

  async function save() {
    const ev = eventRef.current || event   // usa sempre il valore più recente
    if (!ev.titolo.trim()) return alert('Il titolo è obbligatorio')
    // Salva la posizione di scroll prima del salvataggio
    const scrollTop = contentRef.current?.scrollTop || 0
    setSaving(true)
    const payload = {
      titolo:ev.titolo, slug:ev.slug||toSlug(ev.titolo),
      stato:ev.stato, data_inizio: toUTCISOStr(ev.data_inizio),
      data_fine: toUTCISOStr(ev.data_fine), luogo:ev.luogo||null,
        modalita:ev.modalita||'presenza', link_riunione:ev.link_riunione||null,
        teatro_abilitato:ev.teatro_abilitato||false, teatro_capienza:ev.teatro_capienza||null, teatro_note:ev.teatro_note||null,
        form_note:ev.form_note||null,
        certificato_abilitato:ev.certificato_abilitato||false, certificato_titolo:ev.certificato_titolo||null,
        certificato_invio_auto:ev.certificato_invio_auto!==false, certificato_colore:ev.certificato_colore||'#003DA5',
        certificato_logo_url:ev.certificato_logo_url||null, certificato_firma_nome:ev.certificato_firma_nome||null, certificato_firma_ruolo:ev.certificato_firma_ruolo||null,
        certificato_template:ev.certificato_template||'laterale', certificato_config:ev.certificato_config||{},
      descrizione_html:ev.descrizione_html||null,
      immagine_hero:ev.immagine_hero||null,
      colore_primario:ev.colore_primario,
      colore_sfondo:ev.colore_sfondo,
      layout_hero:ev.layout_hero,
      sezioni:ev.sezioni,
      capienza_max:ev.capienza_max||null,
      posti_per_utente:ev.posti_per_utente||1,
      logo_url:ev.logo_url||null,
      sottotitolo:ev.sottotitolo||null,
      sottotitolo_bold:ev.sottotitolo_bold||false,
      sottotitolo_size:ev.sottotitolo_size||null,
      footer_testo:ev.footer_testo||null,
        footer_html:ev.footer_html||null,
        footer_modalita:ev.footer_modalita||'semplice',
        mailup_blocchi:ev.mailup_blocchi||[],
      tags:ev.tags||[],
      tema:ev.tema||{},
      email_organizzatore:ev.email_organizzatore||null,
      email_mittente:ev.email_mittente||null,
      email_cc:ev.email_cc||null,
      nome_mittente:ev.nome_mittente||null,
      teatro_abilitato:ev.teatro_abilitato||false,
      teatro_capienza:ev.teatro_capienza||null,
      teatro_note:ev.teatro_note||null,
      form_note:ev.form_note||null,
    }
    if (isNew) {
      const { data } = await supabase.from('events').insert(payload).select().single()
      if (data) {
        // Inizializza i campi del form per il nuovo evento
        await supabase.rpc('init_form_fields', { p_event_id: data.id }).catch(() => {})
        logAttivita('evento_creato', { eventoId: data.id, eventoTitolo: data.titolo })
        navigate(`/admin/eventi/${data.id}/editor`, { replace:true })
      }
    } else {
      const { error: saveError } = await supabase.from('events').update(payload).eq('id', id)
      if (saveError) {
        console.error('SAVE ERROR:', saveError.message || JSON.stringify(saveError))
        alert(`Errore salvataggio: ${saveError.message}`)
        setSaving(false)
        return
      }
      logAttivita('evento_modificato', { eventoId: id, eventoTitolo: payload.titolo })
    }
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2500)
    // Ripristina la posizione di scroll dopo il salvataggio
    if (contentRef.current) contentRef.current.scrollTop = scrollTop
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
        updEvent(p=>({...p,immagine_hero:urlData.publicUrl}))
      }
    } catch(e) {
      alert('Errore nella generazione. Riprova.')
    }
    setGenerating(false)
  }

  function addSection(tipo) {
    const sec = newSection(tipo)
    updEvent(p => ({ ...p, sezioni: [...(p.sezioni||[]), sec] }))
  }
  function updateSection(idx, sec) { updEvent(p=>{ const s=[...p.sezioni]; s[idx]=sec; return {...p,sezioni:s} }) }
  function deleteSection(idx)     { updEvent(p=>({...p,sezioni:p.sezioni.filter((_,i)=>i!==idx)})) }
  function moveSection(idx, dir)  {
    updEvent(p=>{
      const s=[...p.sezioni]; const t=s[idx]; s[idx]=s[idx+dir]; s[idx+dir]=t
      return {...p,sezioni:s}
    })
  }

  const TABS = [
    { id:'info',         label:'Info & Date',    icon:'📋', color:'blue'   },
    { id:'hero',         label:'Hero',           icon:'🖼',  color:'cyan'   },
    { id:'contenuto',    label:'Contenuto',      icon:'📝', color:'green'  },
    { id:'aspetto',      label:'Aspetto',        icon:'🎨', color:'violet' },
    { id:'sessioni',     label:'Sessioni',       icon:'🗓', color:'amber'  },
    { id:'iscrizioni',   label:'Iscrizioni',     icon:'🎟', color:'coral'  },
    { id:'questionario', label:'Questionario',   icon:'⭐', color:'amber'  },
    { id:'certificato',  label:'Certificato',    icon:'🏆', color:'blue'   },
    { id:'email',        label:'Email',          icon:'✉️', color:'rose'   },
    { id:'mailup',       label:'MailUp',         icon:'📧', color:'teal'   },
    { id:'embed',        label:'Embed',          icon:'🔗', color:'indigo' },
    { id:'preview',      label:'Preview',        icon:'👁',  color:'amber'  },
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
            onChange={e=>updEvent(p=>({...p, titolo:e.target.value, slug:p.slug||toSlug(e.target.value)}))}
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

      {/* TAB BAR — glow pill */}
      <div style={{ padding:'8px 16px 0', backgroundColor:'#FFFFFF', flexShrink:0, overflowX:'auto' }} className="editor-tabbar">
        <GlowTabBar active={activeTab} onChange={setActiveTab} tabs={TABS} />
      </div>

      {/* CONTENT */}
      <div ref={contentRef} style={p.content}>

        {/* ── INFO ── */}
        {activeTab==='info' && (
          <div style={p.panel}>
            <h2 style={p.panelTitle}>Informazioni evento</h2>
            <div style={p.grid2}>
              <div style={{ gridColumn:'1/-1' }}>
                <Field label="Slug URL (generato automaticamente dal titolo)">
                  <div style={{ display:'flex', alignItems:'center', gap:'0' }}>
                    <span style={{ padding:'9px 12px', backgroundColor:'#F4F5F7', border:'1px solid #D1D5DB', borderRight:'none', borderRadius:'6px 0 0 6px', fontSize:'13px', color:'#9CA3AF', whiteSpace:'nowrap' }}>/eventi/</span>
                    <Input value={event.slug||''} onChange={e=>updEvent(p=>({...p,slug:toSlug(e.target.value)}))}
                      placeholder="slug-url-evento" style={{ borderRadius:'0 6px 6px 0' }}/>
                  </div>
                </Field>
              </div>
              <Field label="Data e ora inizio">
                <Input type="datetime-local" value={event.data_inizio||''} onChange={e=>updEvent(p=>({...p,data_inizio:e.target.value}))}/>
              </Field>
              <Field label="Data e ora fine">
                <Input type="datetime-local" value={event.data_fine||''} onChange={e=>updEvent(p=>({...p,data_fine:e.target.value}))}/>
              </Field>
              <div style={{ gridColumn:'1/-1' }}>
                <Field label="Sottotitolo evento">
                  <Input
                    value={event.sottotitolo||''}
                    onChange={e=>updEvent(p=>({...p,sottotitolo:e.target.value}))}
                    placeholder="es. Insieme da 80 anni, il futuro ha radici nelle persone"
                  />
                  <div style={{ display:'flex', gap:'8px', marginTop:'8px', alignItems:'center', flexWrap:'wrap' }}>
                    <button type="button"
                      onClick={() => updEvent(p => ({ ...p, sottotitolo_bold: !p.sottotitolo_bold }))}
                      style={{ padding:'5px 12px', borderRadius:'6px', border:'1px solid',
                        borderColor: event.sottotitolo_bold ? '#003DA5' : '#D1D5DB',
                        background: event.sottotitolo_bold ? '#EFF6FF' : '#fff',
                        color: event.sottotitolo_bold ? '#003DA5' : '#374151',
                        fontSize:'13px', fontWeight:'800', cursor:'pointer' }}>
                      <strong>B</strong> Grassetto
                    </button>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <span style={{ fontSize:'12px', color:'#6B7280', whiteSpace:'nowrap' }}>Dimensione:</span>
                      <button type="button" onClick={() => updEvent(p => ({ ...p, sottotitolo_size: Math.max(10, (p.sottotitolo_size||18)-1) }))}
                        style={{ width:'26px', height:'26px', border:'1px solid #D1D5DB', borderRadius:'5px', background:'#fff', cursor:'pointer', fontSize:'14px', fontWeight:'700' }}>−</button>
                      <span style={{ fontSize:'13px', fontWeight:'700', color:'#003DA5', minWidth:'32px', textAlign:'center' }}>{event.sottotitolo_size||18}px</span>
                      <button type="button" onClick={() => updEvent(p => ({ ...p, sottotitolo_size: Math.min(60, (p.sottotitolo_size||18)+1) }))}
                        style={{ width:'26px', height:'26px', border:'1px solid #D1D5DB', borderRadius:'5px', background:'#fff', cursor:'pointer', fontSize:'14px', fontWeight:'700' }}>+</button>
                    </div>
                    <span style={{ fontSize:'11px', color:'#9CA3AF' }}>Anteprima: <span style={{ fontWeight: event.sottotitolo_bold ? 700 : 400, fontSize: (event.sottotitolo_size||18)+'px', color:'#374151' }}>
                      {event.sottotitolo?.slice(0,30) || 'Sottotitolo…'}
                    </span></span>
                  </div>
                </Field>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <Field label="Sede / Indirizzo completo">
                  <AddressSearch
                    value={event.luogo||''}
                    onChange={(addr) => updEvent(p => ({ ...p, luogo: addr }))}
                  />
                </Field>
              </div>
              {/* ── Modalità evento ── */}
              <div style={{ gridColumn:'1/-1' }}>
                <Field label="Modalità evento">
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                    {[{v:'presenza',l:'🏛 In presenza'},{v:'online',l:'💻 Online'},{v:'ibrido',l:'🔀 Ibrido'}].map(opt => (
                      <button key={opt.v} type="button"
                        onClick={() => updEvent(p => ({ ...p, modalita: opt.v }))}
                        style={{ padding:'9px 18px', borderRadius:'7px', border:'1px solid',
                          borderColor: event.modalita===opt.v ? '#003DA5' : '#D1D5DB',
                          backgroundColor: event.modalita===opt.v ? '#EFF6FF' : '#ffffff',
                          color: event.modalita===opt.v ? '#003DA5' : '#374151',
                          fontSize:'13px', fontWeight:'700', cursor:'pointer',
                          fontFamily:"'Inter',sans-serif", transition:'all 0.15s' }}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
              {(event.modalita === 'online' || event.modalita === 'ibrido') && (
                <div style={{ gridColumn:'1/-1' }}>
                  <Field label="Link riunione (Zoom / Meet / Teams)" hint="Visibile solo agli iscritti — non appare nella pagina pubblica">
                    <Input
                      value={event.link_riunione||''}
                      onChange={e => updEvent(p => ({ ...p, link_riunione: e.target.value || null }))}
                      placeholder="https://zoom.us/j/... oppure https://meet.google.com/..."
                    />
                  </Field>
                </div>
              )}

              {/* ── Certificati (rimanda al tab dedicato) ── */}
              <div style={{ gridColumn:'1/-1' }}>
                <button type="button" onClick={()=>setActiveTab('certificato')}
                  style={{ width:'100%', textAlign:'left', background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'10px',
                    padding:'16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', cursor:'pointer' }}>
                  <div>
                    <p style={{ margin:'0 0 2px', fontSize:'14px', fontWeight:'700', color:'#0A0A0A' }}>🏆 Certificato di partecipazione</p>
                    <p style={{ margin:0, fontSize:'12px', color:'#9CA3AF' }}>
                      {event.certificato_abilitato ? 'Abilitato — modello, colori, testi e campi si configurano nel tab dedicato' : 'Vai al tab "Certificato" per abilitarlo e personalizzarlo'}
                    </p>
                  </div>
                  <span style={{ fontSize:'13px', fontWeight:'700', color:'#003DA5', whiteSpace:'nowrap' }}>Apri editor →</span>
                </button>
              </div>

              {/* ── Modalità teatro ── */}
              <div style={{ gridColumn:'1/-1' }}>
                <div style={{ background: event.teatro_abilitato ? '#EFF6FF' : '#F9FAFB', border:`1px solid ${event.teatro_abilitato ? '#BFDBFE' : '#E5E7EB'}`, borderRadius:'10px', padding:'16px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' }}>
                    <div>
                      <p style={{ margin:'0 0 2px', fontSize:'14px', fontWeight:'700', color:'#0A0A0A' }}>🎭 Modalità teatro</p>
                      <p style={{ margin:0, fontSize:'12px', color:'#6B7280' }}>
                        Attiva la gestione manuale dei posti a sedere con assegnazione numerica e conferma presenza via email.
                      </p>
                    </div>
                    <button type="button"
                      onClick={() => updEvent(p => ({ ...p, teatro_abilitato: !p.teatro_abilitato }))}
                      style={{ flexShrink:0, padding:'8px 18px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:'700', fontFamily:"'Inter',sans-serif",
                        background: event.teatro_abilitato ? '#003DA5' : '#E5E7EB',
                        color: event.teatro_abilitato ? '#fff' : '#374151' }}>
                      {event.teatro_abilitato ? '✓ Abilitato' : 'Abilita'}
                    </button>
                  </div>
                  {event.teatro_abilitato && (
                    <div style={{ marginTop:'12px', display:'grid', gridTemplateColumns:'1fr 2fr', gap:'12px' }}>
                      <Field label="Capienza teatro">
                        <Input type="number" min="1"
                          value={event.teatro_capienza||''}
                          onChange={e => updEvent(p => ({ ...p, teatro_capienza: e.target.value ? parseInt(e.target.value) : null }))}
                          placeholder="es. 1200"
                        />
                      </Field>
                      <Field label="Note interne (opzionale)">
                        <Input value={event.teatro_note||''}
                          onChange={e => updEvent(p => ({ ...p, teatro_note: e.target.value }))}
                          placeholder="Es. Platea A posti 1-600, Platea B 601-1200"
                        />
                      </Field>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Note nel form di iscrizione ── */}
              <div style={{ gridColumn:'1/-1', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:'10px', padding:'16px', display:'flex', flexDirection:'column', gap:'8px' }}>
                <p style={{ margin:0, fontSize:'12px', fontWeight:'700', color:'#92400E', textTransform:'uppercase', letterSpacing:'.06em' }}>⚠️ Avvisi nel modulo di iscrizione</p>
                <p style={{ margin:0, fontSize:'12px', color:'#78350F', lineHeight:'1.5' }}>Testo mostrato nella box di registrazione, sopra i campi. Usa "a capo" per separare più avvisi.</p>
                <textarea
                  value={event.form_note||''}
                  onChange={e => updEvent(p => ({ ...p, form_note: e.target.value }))}
                  placeholder={"Es.\nInserite un indirizzo email corretto: riceverete il QR code all'indirizzo indicato.\nInserite un numero di cellulare valido.\nVerificate i vostri dati prima di confermare."}
                  rows={4}
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #FCD34D', borderRadius:'6px', fontSize:'13px', fontFamily:"'Inter',sans-serif", resize:'vertical', background:'#FFFFF5', color:'#0A0A0A', outline:'none', boxSizing:'border-box', lineHeight:'1.6' }}
                />
              </div>

              {/* ── Impostazioni email ── */}
              <div style={{ gridColumn:'1/-1', background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'10px', padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
                <p style={{ margin:0, fontSize:'12px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em' }}>Impostazioni email</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                  <Field label="Indirizzo mittente" hint="Default: marketing@cnaroma.it">
                    <Input
                      type="email"
                      value={event.email_mittente||''}
                      onChange={e=>updEvent(p=>({...p,email_mittente:e.target.value}))}
                      placeholder="marketing@cnaroma.it"
                    />
                  </Field>
                  <Field label="Nome mittente" hint="Es. Agroalimentare CNA di Roma">
                    <Input
                      value={event.nome_mittente||''}
                      onChange={e=>updEvent(p=>({...p,nome_mittente:e.target.value}))}
                      placeholder="CNA Roma"
                    />
                  </Field>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                  <Field label="Destinatario principale" hint="Riceve ogni nuova iscrizione">
                    <Input
                      type="email"
                      value={event.email_organizzatore||''}
                      onChange={e=>updEvent(p=>({...p,email_organizzatore:e.target.value}))}
                      placeholder="es. responsabile@cnaroma.it"
                    />
                  </Field>
                </div>
                <Field label="Altri destinatari (CC)" hint="Separati da virgola — ricevono copia di ogni iscrizione">
                  <Input
                    value={event.email_cc||''}
                    onChange={e=>updEvent(p=>({...p,email_cc:e.target.value}))}
                    placeholder="es. direzione@cnaroma.it, segreteria@cnaroma.it"
                  />
                </Field>
              </div>
              <Field label="Tag" hint="Usati per filtrare nel calendario pubblico — premi Invio o virgola per aggiungere">
                <TagInput
                  value={event.tags||[]}
                  onChange={tags=>updEvent(p=>({...p,tags}))}
                />
              </Field>
              <Field label="Stato">
                <Select value={event.stato} onChange={e=>updEvent(p=>({...p,stato:e.target.value}))}>
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

            {/* Logo header */}
            <div style={{ marginBottom:'24px', padding:'16px', background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'10px' }}>
              <p style={{ fontSize:'12px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 6px' }}>
                🏷 Logo header
              </p>
              <p style={{ fontSize:'12px', color:'#9CA3AF', margin:'0 0 12px', lineHeight:'1.5' }}>
                Scegli il logo che apparirà nell'header della pagina evento.
              </p>
              <LogoManager
                value={event.logo_url}
                onChange={url => updEvent(p => ({ ...p, logo_url: url }))}
              />
              {/* Slider dimensione + sfondo logo */}
              <div style={{ marginTop:'14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                <Field label={`Dimensione logo: ${event.layout_hero?.logo_altezza||'48'}px`}>
                  <input type="range" min="28" max="300" step="4"
                    value={event.layout_hero?.logo_altezza||'48'}
                    onChange={e=>setH('logo_altezza')(e.target.value)}
                    style={{ width:'100%' }}/>
                </Field>
                <Field label="Sfondo logo" hint="Per logo leggibile su hero scuro">
                  <div style={{ display:'flex', gap:'6px' }}>
                    {[['trasparente','⬜ Nessuno'],['bianco','🤍 Bianco'],['colore_primario','🎨 Tema']].map(([v,l]) => (
                      <button key={v} onClick={()=>setH('logo_sfondo')(v)} style={{
                        flex:1, padding:'6px 4px', border:`1px solid ${(event.layout_hero?.logo_sfondo||'trasparente')===v?'#003DA5':'#E5E7EB'}`,
                        borderRadius:'6px', background:(event.layout_hero?.logo_sfondo||'trasparente')===v?'#EEF3FF':'#fff',
                        cursor:'pointer', fontSize:'11px', fontWeight:'600',
                        color:(event.layout_hero?.logo_sfondo||'trasparente')===v?'#003DA5':'#6B7280',
                        fontFamily:"'Inter',sans-serif"
                      }}>{l}</button>
                    ))}
                  </div>
                </Field>
              </div>
              {/* Anteprima logo live */}
              <div style={{ marginTop:'10px', padding:'10px', background:'#1a1a2e', borderRadius:'8px', textAlign:'center' }}>
                <div style={{
                  background: (event.layout_hero?.logo_sfondo||'trasparente')==='bianco' ? '#fff'
                            : (event.layout_hero?.logo_sfondo||'trasparente')==='colore_primario' ? (event.colore_primario||'#003DA5')
                            : 'transparent',
                  padding: (event.layout_hero?.logo_sfondo && event.layout_hero?.logo_sfondo!=='trasparente') ? '5px 12px' : 0,
                  borderRadius:'6px', display:'inline-flex', alignItems:'center'
                }}>
                  <img
                    src={event.logo_url || 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'}
                    alt="Logo preview"
                    style={{ height:(event.layout_hero?.logo_altezza||'48')+'px', objectFit:'contain', display:'block' }}
                  />
                </div>
                <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.4)', margin:'5px 0 0' }}>Anteprima su sfondo scuro</p>
              </div>
            </div>

            {/* Immagine hero */}
            <div style={{ marginBottom:'20px' }}>
              <ImageUploader value={event.immagine_hero} onChange={url=>updEvent(p=>({...p,immagine_hero:url}))}/>
            </div>

            {/* Controlli layout */}
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
              <Field label="Colore overlay">
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <input type="color" value={event.layout_hero?.overlay_colore||'#000000'}
                    onChange={e=>setH('overlay_colore')(e.target.value)}
                    style={{ width:'44px', height:'34px', border:'1px solid #E5E7EB', borderRadius:'6px', cursor:'pointer', padding:'2px' }}/>
                  <input value={event.layout_hero?.overlay_colore||'#000000'}
                    onChange={e=>setH('overlay_colore')(e.target.value)}
                    style={{ flex:1, padding:'7px 10px', border:'1px solid #E5E7EB', borderRadius:'6px', fontSize:'13px', fontFamily:'monospace' }}/>
                  <button type="button" onClick={()=>setH('overlay_colore')('#000000')}
                    style={{ padding:'6px 10px', border:'1px solid #E5E7EB', borderRadius:'6px', fontSize:'11px', cursor:'pointer', background:'#fff', color:'#6B7280', fontFamily:"'Inter',sans-serif" }}>
                    ⬛ Nero
                  </button>
                  <button type="button" onClick={()=>setH('overlay_colore')('#003DA5')}
                    style={{ padding:'6px 10px', border:'1px solid #E5E7EB', borderRadius:'6px', fontSize:'11px', cursor:'pointer', background:'#EEF3FF', color:'#003DA5', fontFamily:"'Inter',sans-serif" }}>
                    🔵 BLU CNA
                  </button>
                </div>
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

            {/* Testi hero */}
            <div style={{ marginTop:'16px', display:'grid', gridTemplateColumns:'1fr', gap:'12px' }}>
              <Field label="Titolo principale (H1)" hint="Uguale al titolo evento — modificalo dalla tab Info">
                <div style={{ padding:'10px 14px', background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'8px', fontSize:'14px', color:'#9CA3AF', fontStyle:'italic' }}>
                  {event.titolo || 'Titolo evento…'}
                </div>
              </Field>
              <Field label="Secondo titolo (H2 — opzionale)" hint="Appare sotto il titolo principale, più piccolo">
                <Input
                  value={event.layout_hero?.titolo2||''}
                  onChange={e=>setH('titolo2')(e.target.value)}
                  placeholder="Es. slogan, data, luogo in evidenza..."
                />
              </Field>
            </div>

            {/* Stile titolo H1 */}
            <div style={{ marginTop:'16px', padding:'16px', backgroundColor:'#F9FAFB', borderRadius:'8px', border:'1px solid #E5E7EB' }}>
              <p style={{ fontSize:'12px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 12px' }}>Stile titolo principale (H1)</p>
              <div style={p.grid3}>
                <Field label="Colore">
                  <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                    <input type="color"
                      value={/^#[0-9A-Fa-f]{6}$/.test(event.layout_hero?.titolo_colore||'') ? event.layout_hero?.titolo_colore : '#ffffff'}
                      onChange={e=>setH('titolo_colore')(e.target.value)}
                      style={{ width:'40px', height:'34px', border:'1px solid #D1D5DB', borderRadius:'6px', cursor:'pointer', padding:'2px', flexShrink:0 }}/>
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
                    <button onClick={()=>setH('titolo_grassetto')(event.layout_hero?.titolo_grassetto===false?true:false)}
                      style={{ flex:1, padding:'7px', border:`1px solid ${event.layout_hero?.titolo_grassetto!==false?'#003DA5':'#E5E7EB'}`,
                        borderRadius:'6px', backgroundColor:event.layout_hero?.titolo_grassetto!==false?'#EEF3FF':'#FFF',
                        cursor:'pointer', fontSize:'13px', fontWeight:'800', fontFamily:"'Inter',sans-serif",
                        color:event.layout_hero?.titolo_grassetto!==false?'#003DA5':'#6B7280' }}>B</button>
                    <button onClick={()=>setH('titolo_maiuscolo')(event.layout_hero?.titolo_maiuscolo?false:true)}
                      style={{ flex:1, padding:'7px', border:`1px solid ${event.layout_hero?.titolo_maiuscolo?'#003DA5':'#E5E7EB'}`,
                        borderRadius:'6px', backgroundColor:event.layout_hero?.titolo_maiuscolo?'#EEF3FF':'#FFF',
                        cursor:'pointer', fontSize:'12px', fontWeight:'600', fontFamily:"'Inter',sans-serif",
                        color:event.layout_hero?.titolo_maiuscolo?'#003DA5':'#6B7280' }}>AA</button>
                  </div>
                </Field>
              </div>

              {/* Stile H2 */}
              <div style={{ borderTop:'1px solid #E5E7EB', marginTop:'14px', paddingTop:'14px' }}>
                <p style={{ fontSize:'12px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 12px' }}>Stile secondo titolo (H2)</p>
                <div style={p.grid3}>
                  <Field label="Colore">
                    <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                      <input type="color"
                        value={/^#[0-9A-Fa-f]{6}$/.test(event.layout_hero?.titolo2_colore||'') ? event.layout_hero?.titolo2_colore : '#ffffff'}
                        onChange={e=>setH('titolo2_colore')(e.target.value)}
                        style={{ width:'40px', height:'34px', border:'1px solid #D1D5DB', borderRadius:'6px', cursor:'pointer', padding:'2px', flexShrink:0 }}/>
                      <Input value={event.layout_hero?.titolo2_colore||''}
                        onChange={e=>setH('titolo2_colore')(e.target.value)} placeholder="#ffffff"/>
                    </div>
                  </Field>
                  <Field label="Dimensione">
                    <Select value={normDim(event.layout_hero?.titolo2_dimensione)||'22px'}
                      onChange={e=>setH('titolo2_dimensione')(e.target.value)}>
                      <option value="16px">Piccolo (16px)</option>
                      <option value="22px">Medio (22px)</option>
                      <option value="30px">Grande (30px)</option>
                      <option value="40px">Extra Grande (40px)</option>
                    </Select>
                  </Field>
                  <Field label="Stile">
                    <button onClick={()=>setH('titolo2_grassetto')(event.layout_hero?.titolo2_grassetto?false:true)}
                      style={{ width:'100%', padding:'7px', border:`1px solid ${event.layout_hero?.titolo2_grassetto?'#003DA5':'#E5E7EB'}`,
                        borderRadius:'6px', backgroundColor:event.layout_hero?.titolo2_grassetto?'#EEF3FF':'#FFF',
                        cursor:'pointer', fontSize:'13px', fontWeight:'800', fontFamily:"'Inter',sans-serif",
                        color:event.layout_hero?.titolo2_grassetto?'#003DA5':'#6B7280' }}>B</button>
                  </Field>
                </div>
              </div>
            </div>

            {/* Anteprima con drag */}
            <div style={{ marginTop:'16px' }}>
              <HeroDragPreview event={event} setH={setH} />
            </div>
          </div>
        )}

        {/* ── CONTENUTO ── */}
        {activeTab==='contenuto' && (
          <div style={p.panel}>
            <h2 style={p.panelTitle}>Contenuto della landing page</h2>
            <p style={{ fontSize:'13px', color:'#6B7280', margin:'0 0 16px', lineHeight:'1.5' }}>
              Aggiungi blocchi con il pulsante <strong>+</strong>. Usa <strong>↑ ↓</strong> per riordinare.
            </p>
            <BlockEditor
              blocks={event.sezioni || []}
              onChange={blocks => updEvent(p => ({ ...p, sezioni: blocks }))}
            />
          </div>
        )}

        {/* ── ASPETTO ── */}
        {activeTab==='aspetto' && (
          <div style={p.panel}>
            <AspettoTab event={event} setEvent={updEvent} />
          </div>
        )}

        {/* ── ISCRIZIONI ── */}
        {activeTab==='iscrizioni' && (
          <div style={p.panel}>
            <IscrizioniTab event={event} setEvent={setEvent} eventId={id} />
          </div>
        )}

        {/* ── SESSIONI ── */}
        {activeTab==='sessioni' && (
          <div style={p.panel}>
            <h2 style={p.panelTitle}>Programma / Sessioni</h2>
            <SessioniTab event={event} setEvent={setEvent} />
          </div>
        )}

        {/* ── QUESTIONARIO ── */}
        {activeTab==='questionario' && (
          <div style={p.panel}>
            <h2 style={p.panelTitle}>Questionario post-evento</h2>
            <QuestionarioTab eventoId={id} />
          </div>
        )}

        {/* ── MAILUP ── */}
        {activeTab==='mailup' && (
          <div style={{ ...p.panel, maxWidth: '960px' }}>
            <MailUpExportTab event={event} setEvent={updEvent} />
          </div>
        )}

        {/* ── EMBED ── */}
        {activeTab==='embed' && (
          <div style={p.panel}>
            <h2 style={p.panelTitle}>Codice embed</h2>
            {!event.slug || event.stato !== 'pubblicato' ? (
              <div style={{backgroundColor:'#FEF3C7',border:'1px solid #FDE68A',borderRadius:'8px',padding:'16px 18px'}}>
                <p style={{fontSize:'14px',color:'#92400E',margin:0,fontWeight:'600'}}>
                  ⚠️ L&apos;evento deve essere <strong>pubblicato</strong> e avere uno <strong>slug</strong> per generare il codice embed.
                </p>
              </div>
            ) : (
              <EmbedWidget
                url={`${window.location.origin}/eventi/${event.slug}`}
                titolo={event.titolo}
              />
            )}
          </div>
        )}

        {/* ── CERTIFICATO ── */}
        {activeTab==='certificato' && (
          <div style={{ maxWidth:'1360px', margin:'0 auto' }}>
            <CertificatoEditorTab event={event} setEvent={updEvent} />
          </div>
        )}

        {/* ── EMAIL ── */}
        {activeTab==='email' && (
          <div style={{ ...p.panel, maxWidth:'none' }}>
            <h2 style={p.panelTitle}>Email per questo evento</h2>
            <EventEmailTab eventoId={id} />
          </div>
        )}

        {/* ── PREVIEW ── */}
        {activeTab==='preview' && (
          <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
            {!event.slug ? (
              <div style={{ padding:'48px', textAlign:'center', color:'#9CA3AF' }}>
                <p style={{ fontSize:'15px', fontWeight:'600', color:'#374151' }}>Nessuna anteprima disponibile</p>
                <p style={{ fontSize:'13px' }}>Salva l'evento prima di visualizzare l'anteprima.</p>
              </div>
            ) : (
              <>
                <div style={{ backgroundColor:'#F4F5F7', border:'1px solid #E5E7EB', borderRadius:'8px', padding:'10px 16px', marginBottom:'12px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'10px', flexShrink:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', flex:1, minWidth:0 }}>
                    <span style={{ fontSize:'12px', color:'#9CA3AF', backgroundColor:'#fff', border:'1px solid #E5E7EB', borderRadius:'4px', padding:'4px 10px', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
                      {window.location.origin}/eventi/{event.slug}
                    </span>
                  </div>
                  <a href={`/eventi/${event.slug}`} target="_blank" rel="noopener noreferrer"
                    style={{ display:'flex', alignItems:'center', gap:'6px', border:'1px solid #003DA5', color:'#003DA5', borderRadius:'6px', padding:'6px 14px', fontSize:'12px', fontWeight:'700', textDecoration:'none', fontFamily:"'Inter',sans-serif", whiteSpace:'nowrap', flexShrink:0 }}>
                    Apri in nuova tab ↗
                  </a>
                </div>
                <IframePreview
                  iframeKey={event.slug}
                  src={`/eventi/${event.slug}`}
                  style={{ flex:1, border:'none', borderRadius:'10px', minHeight:'600px', boxShadow:'0 1px 8px rgba(0,0,0,0.08)', display:'block', width:'100%' }}
                  title="Anteprima landing page"
                  fallbackUrl={`/eventi/${event.slug}`}
                />
              </>
            )}
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
