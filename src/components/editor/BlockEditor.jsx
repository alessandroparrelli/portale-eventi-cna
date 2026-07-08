/**
 * BlockEditor — editor a blocchi per landing page
 * Tipi: testo | stats | griglia | cta | separatore | immagine
 *        titolo | banner | timeline | accordion | video | testimonial | countdown | badge_list
 */
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import RichEditor from './RichEditor'
import ImageUploader from './ImageUploader'
import { BLOCK_ICONS, IconPicker, IconDisplay } from './BlockIcons'
import { supabase, getFreshJwt } from '../../lib/supabase'

const uid = () => Math.random().toString(36).slice(2, 9)

export function newBlock(tipo) {
  const base = { id: uid(), tipo }
  switch (tipo) {
    case 'testo':       return { ...base, html: '<p>Scrivi qui…</p>' }
    case 'stats':       return { ...base, items: [{ num: '100+', label: 'Partecipanti' }, { num: '10', label: 'Relatori' }], colore: '#003DA5', animato: true }
    case 'griglia':     return { ...base, cols: [{ icona:'target', icona_colore:'#003DA5', titolo: 'Titolo 1', testo: 'Descrizione.' }, { icona:'lightbulb', icona_colore:'#059669', titolo: 'Titolo 2', testo: 'Descrizione.' }, { icona:'rocket', icona_colore:'#7C3AED', titolo: 'Titolo 3', testo: 'Descrizione.' }] }
    case 'cta':         return { ...base, titolo: 'Pronti a iniziare?', testo_btn: 'Contattaci →', colore: '#003DA5', stile: 'pieno' }
    case 'separatore':  return { ...base, stile: 'linea' }
    case 'immagine':    return { ...base, src: '', didascalia: '' }
    case 'titolo':      return { ...base, testo: 'Titolo sezione', sottotitolo: '', allineamento: 'center', animazione: 'fadeup' }
    case 'banner':      return { ...base, testo: 'Messaggio importante', stile: 'info', icona: 'ℹ️' }
    case 'timeline':    return { ...base, items: [{ anno: '2020', titolo: 'Fondazione', testo: 'Descrizione step.' }, { anno: '2022', titolo: 'Crescita', testo: 'Descrizione step.' }, { anno: '2024', titolo: 'Oggi', testo: 'Descrizione step.' }] }
    case 'accordion':   return { ...base, items: [{ domanda: 'Prima domanda?', risposta: 'Risposta alla prima domanda.' }, { domanda: 'Seconda domanda?', risposta: 'Risposta alla seconda domanda.' }] }
    case 'video':       return { ...base, url: '', didascalia: '' }
    case 'testimonial': return { ...base, items: [{ testo: 'Un servizio eccellente, lo consiglio a tutti.', nome: 'Mario Rossi', ruolo: 'Artigiano' }] }
    case 'countdown':   return { ...base, data: '', titolo: 'Evento tra:', messaggio_scaduto: 'L\'evento è iniziato!' }
    case 'badge_list':  return { ...base, items: [{ icona: 'check', icona_colore:'#003DA5', testo: 'Vantaggio uno' }, { icona: 'check', icona_colore:'#003DA5', testo: 'Vantaggio due' }, { icona: 'check', icona_colore:'#003DA5', testo: 'Vantaggio tre' }], colore: '#003DA5', colonne: 2 }
    case 'carosello':   return { ...base, immagini: [], didascalia: '', rapporto: '1:1' }
    case 'social':      return { ...base, tipo_social: 'condivisione', url_post: '', mostra_condivisione: true }
    case 'programma':   return { ...base, titolo: 'Programma', colore_titoli: '#E91E8C', colore_orari: '#003DA5', cornice_stile: 'dotted', cornice_colore: '#D1D5DB', cornice_spessore: 1.5, cornice_radius: 16, cornice_gap: 6, sfondo: '#ffffff', voci: [
      { tipo: 'orario', orario: 'ORE 10.30', testo: 'Registrazione dei partecipanti' },
      { tipo: 'orario', orario: 'ORE 11.00', testo: 'Avvio dei lavori' },
      { tipo: 'sessione', titolo: 'Titolo intervento', relatori: [{ nome: 'Nome Cognome', ruolo: 'Ruolo / Ente' }] },
      { tipo: 'orario', orario: 'ORE 13.30', testo: 'Chiusura dei lavori' },
    ]}
    default:            return base
  }
}

const BLOCK_TYPES = [
  { tipo: 'testo',       label: 'Testo ricco',     group: 'Base' },
  { tipo: 'titolo',      label: 'Titolo sezione',  group: 'Base' },
  { tipo: 'immagine',    label: 'Immagine',        group: 'Base' },
  { tipo: 'separatore',  label: 'Separatore',      group: 'Base' },
  { tipo: 'stats',       label: 'Statistiche',     group: 'Contenuto' },
  { tipo: 'griglia',     label: 'Griglia card',    group: 'Contenuto' },
  { tipo: 'badge_list',  label: 'Lista vantaggi',  group: 'Contenuto' },
  { tipo: 'timeline',    label: 'Timeline',        group: 'Contenuto' },
  { tipo: 'accordion',   label: 'FAQ / Accordion', group: 'Contenuto' },
  { tipo: 'testimonial', label: 'Testimonial',     group: 'Contenuto' },
  { tipo: 'countdown',   label: 'Countdown',       group: 'Interattivo' },
  { tipo: 'video',       label: 'Video embed',     group: 'Interattivo' },
  { tipo: 'cta',         label: 'Call to action',  group: 'Interattivo' },
  { tipo: 'banner',      label: 'Banner avviso',   group: 'Interattivo' },
  { tipo: 'carosello',   label: 'Carosello foto',  group: 'Social' },
  { tipo: 'social',      label: 'Social & Condividi', group: 'Social' },
  { tipo: 'programma',   label: 'Programma evento', group: 'Contenuto' },
]

// ── Editors singoli blocchi ─────────────────────────────────────────

function TitoloEditor({ block, onChange }) {
  return (
    <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
      <div>
        <label style={lb}>Titolo</label>
        <input value={block.testo||''} onChange={e=>onChange({...block,testo:e.target.value})} style={inp} />
      </div>
      <div>
        <label style={lb}>Sottotitolo (opzionale)</label>
        <input value={block.sottotitolo||''} onChange={e=>onChange({...block,sottotitolo:e.target.value})} style={inp} />
      </div>
      <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
        <div style={{flex:1}}>
          <label style={lb}>Allineamento</label>
          <select value={block.allineamento||'center'} onChange={e=>onChange({...block,allineamento:e.target.value})} style={inp}>
            <option value="left">Sinistra</option>
            <option value="center">Centro</option>
            <option value="right">Destra</option>
          </select>
        </div>
        <div style={{flex:1}}>
          <label style={lb}>Animazione entrata</label>
          <select value={block.animazione||'fadeup'} onChange={e=>onChange({...block,animazione:e.target.value})} style={inp}>
            <option value="none">Nessuna</option>
            <option value="fadeup">Fade up</option>
            <option value="fadein">Fade in</option>
            <option value="slidein">Slide in</option>
          </select>
        </div>
      </div>
    </div>
  )
}

function StatsEditor({ block, onChange }) {
  return (
    <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
      <div style={{display:'flex',gap:'12px',alignItems:'center',flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
          <label style={lb}>Colore</label>
          <input type="color" value={block.colore||'#003DA5'} onChange={e=>onChange({...block,colore:e.target.value})} style={{width:'36px',height:'28px',border:'none',cursor:'pointer'}} />
        </div>
        <label style={{display:'flex',alignItems:'center',gap:'6px',cursor:'pointer',fontSize:'13px',fontWeight:'600',color:'#374151'}}>
          <input type="checkbox" checked={block.animato!==false} onChange={e=>onChange({...block,animato:e.target.checked})} />
          Anima contatori
        </label>
      </div>
      {(block.items||[]).map((item,i)=>(
        <div key={i} style={{display:'flex',gap:'8px',alignItems:'center'}}>
          <input value={item.num} onChange={e=>{const items=[...block.items];items[i]={...items[i],num:e.target.value};onChange({...block,items})}} placeholder="100+" style={{...inp,width:'80px',fontWeight:'700',fontSize:'16px'}} />
          <input value={item.label} onChange={e=>{const items=[...block.items];items[i]={...items[i],label:e.target.value};onChange({...block,items})}} placeholder="Partecipanti" style={{...inp,flex:1}} />
          <button onClick={()=>onChange({...block,items:block.items.filter((_,j)=>j!==i)})} style={btnDel}>✕</button>
        </div>
      ))}
      <button onClick={()=>onChange({...block,items:[...(block.items||[]),{num:'0',label:'Etichetta'}]})} style={btnAdd}>+ Aggiungi</button>
    </div>
  )
}

function GrigliaEditor({ block, onChange }) {
  return (
    <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
      <div style={{display:'flex',gap:'8px',alignItems:'center',marginBottom:'4px'}}>
        <label style={lb}>Colonne:</label>
        {[2,3,4].map(n=>(
          <button key={n} onClick={()=>{let cols=[...(block.cols||[])];while(cols.length<n)cols.push({titolo:`Titolo ${cols.length+1}`,testo:'Descrizione.'});onChange({...block,cols:cols.slice(0,n)})}} style={{...btnAdd,padding:'4px 12px',background:(block.cols||[]).length===n?'#003DA5':'#F3F4F6',color:(block.cols||[]).length===n?'#fff':'#374151'}}>{n}</button>
        ))}
      </div>
      {(block.cols||[]).map((col,i)=>(
        <div key={i} style={{border:'1px solid #E5E7EB',borderRadius:'8px',padding:'12px',display:'flex',flexDirection:'column',gap:'8px'}}>
          <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
            <IconPicker
              value={col.icona||''}
              color={col.icona_colore||'#003DA5'}
              onChangeIcon={id=>{const cols=[...block.cols];cols[i]={...cols[i],icona:id};onChange({...block,cols})}}
              onChangeColor={c=>{const cols=[...block.cols];cols[i]={...cols[i],icona_colore:c};onChange({...block,cols})}}
            />
          </div>
          <input value={col.titolo||''} onChange={e=>{const cols=[...block.cols];cols[i]={...cols[i],titolo:e.target.value};onChange({...block,cols})}} placeholder="Titolo" style={{...inp,fontWeight:'700'}} />
          <textarea value={col.testo||''} onChange={e=>{const cols=[...block.cols];cols[i]={...cols[i],testo:e.target.value};onChange({...block,cols})}} rows={2} style={{...inp,resize:'vertical',fontFamily:"'Inter',sans-serif"}} />
        </div>
      ))}
    </div>
  )
}

function CtaEditor({ block, onChange }) {
  return (
    <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'10px' }}>
      <div><label style={lb}>Titolo</label><input value={block.titolo||''} onChange={e=>onChange({...block,titolo:e.target.value})} style={inp} /></div>
      <div><label style={lb}>Testo pulsante</label><input value={block.testo_btn||''} onChange={e=>onChange({...block,testo_btn:e.target.value})} style={inp} /></div>
      <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
        <div><label style={lb}>Colore</label><input type="color" value={block.colore||'#003DA5'} onChange={e=>onChange({...block,colore:e.target.value})} style={{width:'36px',height:'28px',border:'none',cursor:'pointer'}} /></div>
        <div style={{flex:1}}><label style={lb}>Stile</label>
          <select value={block.stile||'pieno'} onChange={e=>onChange({...block,stile:e.target.value})} style={inp}>
            <option value="pieno">Pieno</option>
            <option value="contorno">Contorno</option>
            <option value="pill">Pill arrotondato</option>
          </select>
        </div>
      </div>
    </div>
  )
}

function ImmagineEditor({ block, onChange }) {
  return (
    <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
      <ImageUploader value={block.src||null} onChange={url=>onChange({...block,src:url||''})} />
      <div style={{display:'flex',gap:'6px'}}>
        {[['left','◀ Sin'],['center','■ Ctr'],['right','▶ Dex']].map(([v,l])=>(
          <button key={v} onClick={()=>onChange({...block,align:v})} style={{flex:1,padding:'7px',border:`1px solid ${(block.align||'center')===v?'#003DA5':'#E5E7EB'}`,borderRadius:'6px',background:(block.align||'center')===v?'#EEF3FF':'#fff',cursor:'pointer',fontSize:'12px',fontWeight:'600',fontFamily:"'Inter',sans-serif",color:(block.align||'center')===v?'#003DA5':'#6B7280'}}>{l}</button>
        ))}
      </div>
      <div style={{display:'flex',gap:'6px'}}>
        {[['small','33%'],['medium','60%'],['large','100%']].map(([v,l])=>(
          <button key={v} onClick={()=>onChange({...block,size:v})} style={{flex:1,padding:'7px',border:`1px solid ${(block.size||'large')===v?'#003DA5':'#E5E7EB'}`,borderRadius:'6px',background:(block.size||'large')===v?'#EEF3FF':'#fff',cursor:'pointer',fontSize:'12px',fontWeight:'600',fontFamily:"'Inter',sans-serif",color:(block.size||'large')===v?'#003DA5':'#6B7280'}}>{l}</button>
        ))}
      </div>
      <input value={block.didascalia||''} onChange={e=>onChange({...block,didascalia:e.target.value})} placeholder="Didascalia opzionale" style={inp} />
    </div>
  )
}

function BannerEditor({ block, onChange }) {
  const stili = [['info','ℹ️ Info','#EFF6FF','#003DA5'],['success','✅ Successo','#D1FAE5','#065F46'],['warning','⚠️ Attenzione','#FFFBEB','#92400E'],['error','🚨 Errore','#FEF2F2','#991B1B']]
  return (
    <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'10px' }}>
      <div><label style={lb}>Messaggio</label><textarea value={block.testo||''} onChange={e=>onChange({...block,testo:e.target.value})} rows={2} style={{...inp,resize:'vertical',fontFamily:"'Inter',sans-serif"}} /></div>
      <div>
        <label style={lb}>Stile banner</label>
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
          {stili.map(([v,l,bg,color])=>(
            <button key={v} onClick={()=>onChange({...block,stile:v})} style={{padding:'6px 12px',border:`1px solid ${color}`,borderRadius:'6px',background:bg,color,fontWeight:'700',fontSize:'12px',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>{l}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

function TimelineEditor({ block, onChange }) {
  return (
    <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'10px' }}>
      {(block.items||[]).map((item,i)=>(
        <div key={i} style={{border:'1px solid #E5E7EB',borderRadius:'8px',padding:'12px',display:'flex',flexDirection:'column',gap:'6px'}}>
          <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
            <input value={item.anno||''} onChange={e=>{const items=[...block.items];items[i]={...items[i],anno:e.target.value};onChange({...block,items})}} placeholder="2024" style={{...inp,width:'80px'}} />
            <input value={item.titolo||''} onChange={e=>{const items=[...block.items];items[i]={...items[i],titolo:e.target.value};onChange({...block,items})}} placeholder="Titolo step" style={{...inp,flex:1}} />
            <button onClick={()=>onChange({...block,items:block.items.filter((_,j)=>j!==i)})} style={btnDel}>✕</button>
          </div>
          <textarea value={item.testo||''} onChange={e=>{const items=[...block.items];items[i]={...items[i],testo:e.target.value};onChange({...block,items})}} rows={2} style={{...inp,resize:'vertical',fontFamily:"'Inter',sans-serif"}} placeholder="Descrizione" />
        </div>
      ))}
      <button onClick={()=>onChange({...block,items:[...(block.items||[]),{anno:'',titolo:'',testo:''}]})} style={btnAdd}>+ Aggiungi step</button>
    </div>
  )
}

function AccordionEditor({ block, onChange }) {
  return (
    <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'10px' }}>
      {(block.items||[]).map((item,i)=>(
        <div key={i} style={{border:'1px solid #E5E7EB',borderRadius:'8px',padding:'12px',display:'flex',flexDirection:'column',gap:'6px'}}>
          <div style={{display:'flex',gap:'6px'}}>
            <input value={item.domanda||''} onChange={e=>{const items=[...block.items];items[i]={...items[i],domanda:e.target.value};onChange({...block,items})}} placeholder="Domanda / Titolo" style={{...inp,flex:1,fontWeight:'700'}} />
            <button onClick={()=>onChange({...block,items:block.items.filter((_,j)=>j!==i)})} style={btnDel}>✕</button>
          </div>
          <textarea value={item.risposta||''} onChange={e=>{const items=[...block.items];items[i]={...items[i],risposta:e.target.value};onChange({...block,items})}} rows={3} style={{...inp,resize:'vertical',fontFamily:"'Inter',sans-serif"}} placeholder="Risposta" />
        </div>
      ))}
      <button onClick={()=>onChange({...block,items:[...(block.items||[]),{domanda:'',risposta:''}]})} style={btnAdd}>+ Aggiungi voce</button>
    </div>
  )
}

function VideoEditor({ block, onChange }) {
  return (
    <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'10px' }}>
      <div>
        <label style={lb}>URL video (YouTube o Vimeo)</label>
        <input value={block.url||''} onChange={e=>onChange({...block,url:e.target.value})} placeholder="https://www.youtube.com/watch?v=..." style={inp} />
        <p style={{fontSize:'11px',color:'#9CA3AF',margin:'4px 0 0'}}>Incolla il link normale di YouTube o Vimeo</p>
      </div>
      <div><label style={lb}>Didascalia</label><input value={block.didascalia||''} onChange={e=>onChange({...block,didascalia:e.target.value})} style={inp} /></div>
    </div>
  )
}

function TestimonialEditor({ block, onChange }) {
  return (
    <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'10px' }}>
      {(block.items||[]).map((item,i)=>(
        <div key={i} style={{border:'1px solid #E5E7EB',borderRadius:'8px',padding:'12px',display:'flex',flexDirection:'column',gap:'6px'}}>
          <div style={{display:'flex',gap:'6px',justifyContent:'flex-end'}}>
            <button onClick={()=>onChange({...block,items:block.items.filter((_,j)=>j!==i)})} style={btnDel}>✕</button>
          </div>
          <textarea value={item.testo||''} onChange={e=>{const items=[...block.items];items[i]={...items[i],testo:e.target.value};onChange({...block,items})}} rows={3} style={{...inp,resize:'vertical',fontFamily:"'Inter',sans-serif"}} placeholder="Testo testimonianza..." />
          <div style={{display:'flex',gap:'6px'}}>
            <input value={item.nome||''} onChange={e=>{const items=[...block.items];items[i]={...items[i],nome:e.target.value};onChange({...block,items})}} placeholder="Nome" style={{...inp,flex:1}} />
            <input value={item.ruolo||''} onChange={e=>{const items=[...block.items];items[i]={...items[i],ruolo:e.target.value};onChange({...block,items})}} placeholder="Ruolo / Azienda" style={{...inp,flex:1}} />
          </div>
        </div>
      ))}
      <button onClick={()=>onChange({...block,items:[...(block.items||[]),{testo:'',nome:'',ruolo:''}]})} style={btnAdd}>+ Aggiungi testimonianza</button>
    </div>
  )
}

function CountdownEditor({ block, onChange }) {
  return (
    <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'10px' }}>
      <div><label style={lb}>Titolo del countdown</label><input value={block.titolo||''} onChange={e=>onChange({...block,titolo:e.target.value})} style={inp} /></div>
      <div>
        <label style={lb}>Data e ora obiettivo</label>
        <input type="datetime-local" value={block.data||''} onChange={e=>onChange({...block,data:e.target.value})} style={inp} />
      </div>
      <div><label style={lb}>Messaggio dopo scadenza</label><input value={block.messaggio_scaduto||''} onChange={e=>onChange({...block,messaggio_scaduto:e.target.value})} style={inp} /></div>
    </div>
  )
}

function BadgeListEditor({ block, onChange }) {
  return (
    <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'10px' }}>
      <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
          <label style={lb}>Colore icona</label>
          <input type="color" value={block.colore||'#003DA5'} onChange={e=>onChange({...block,colore:e.target.value})} style={{width:'36px',height:'28px',border:'none',cursor:'pointer'}} />
        </div>
        <div>
          <label style={lb}>Colonne</label>
          <select value={block.colonne||2} onChange={e=>onChange({...block,colonne:parseInt(e.target.value)})} style={{...inp,width:'80px'}}>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>
      </div>
      {(block.items||[]).map((item,i)=>(
        <div key={i} style={{display:'flex',gap:'8px',alignItems:'center'}}>
          <IconPicker
            value={item.icona||'check'}
            color={item.icona_colore||block.colore||'#003DA5'}
            onChangeIcon={id=>{const items=[...block.items];items[i]={...items[i],icona:id};onChange({...block,items})}}
            onChangeColor={c=>{const items=[...block.items];items[i]={...items[i],icona_colore:c};onChange({...block,items})}}
          />
          <input value={item.testo||''} onChange={e=>{const items=[...block.items];items[i]={...items[i],testo:e.target.value};onChange({...block,items})}} placeholder="Descrizione vantaggio" style={{...inp,flex:1}} />
          <button onClick={()=>onChange({...block,items:block.items.filter((_,j)=>j!==i)})} style={btnDel}>✕</button>
        </div>
      ))}
      <button onClick={()=>onChange({...block,items:[...(block.items||[]),{icona:'✓',testo:''}]})} style={btnAdd}>+ Aggiungi</button>
    </div>
  )
}

function ProgrammaEditor({ block, onChange }) {
  const uid2 = () => Math.random().toString(36).slice(2, 8)

  function addVoce(tipo) {
    const defaults = {
      orario:    { id: uid2(), tipo: 'orario', orario: 'ORE 00.00', testo: 'Descrizione' },
      sessione:  { id: uid2(), tipo: 'sessione', titolo: 'Titolo sessione', relatori: [{ nome: '', ruolo: '' }] },
      intermezzo:{ id: uid2(), tipo: 'intermezzo', titolo: 'Intermezzi di imprese', relatori: [{ nome: '', ruolo: '' }] },
      modera:    { id: uid2(), tipo: 'modera', nome: '', ruolo: '' },
    }
    onChange({ ...block, voci: [...(block.voci || []), defaults[tipo]] })
  }

  function updateVoce(i, voce) {
    const voci = [...(block.voci || [])]; voci[i] = voce; onChange({ ...block, voci })
  }

  function removeVoce(i) {
    onChange({ ...block, voci: (block.voci || []).filter((_, j) => j !== i) })
  }

  function moveVoce(i, dir) {
    const voci = [...(block.voci || [])]; const j = i + dir
    if (j < 0 || j >= voci.length) return
    ;[voci[i], voci[j]] = [voci[j], voci[i]]
    onChange({ ...block, voci })
  }

  const tipoLabel = { orario: '⏰ Orario', sessione: '▶ Sessione', intermezzo: '🔖 Intermezzo', modera: '🎙 Modera' }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Impostazioni generali */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '12px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
        <div>
          <label style={lb}>Titolo sezione</label>
          <input value={block.titolo || 'Programma'} onChange={e => onChange({ ...block, titolo: e.target.value })} style={{ ...inp, width: '160px' }} />
        </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div>
              <label style={lb}>Colore sessioni</label>
              <input type="color" value={block.colore_titoli || '#E91E8C'} onChange={e => onChange({ ...block, colore_titoli: e.target.value })} style={{ width: '36px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={lb}>Colore orari</label>
              <input type="color" value={block.colore_orari || '#003DA5'} onChange={e => onChange({ ...block, colore_orari: e.target.value })} style={{ width: '36px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '4px' }} />
            </div>
          </div>
        </div>

        {/* ── Cornice ── */}
        <div style={{ padding: '12px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ ...lb, marginBottom: 0 }}>Cornice</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 120px' }}>
              <label style={lb}>Stile</label>
              <select value={block.cornice_stile || 'dotted'} onChange={e => onChange({ ...block, cornice_stile: e.target.value })} style={inp}>
                <option value="dotted">Puntini (dotted)</option>
                <option value="dashed">Trattini (dashed)</option>
                <option value="solid">Solida (solid)</option>
                <option value="double">Doppia (double)</option>
                <option value="none">Nessuna</option>
              </select>
            </div>
            <div>
              <label style={lb}>Colore</label>
              <input type="color" value={block.cornice_colore || '#D1D5DB'} onChange={e => onChange({ ...block, cornice_colore: e.target.value })} style={{ width: '36px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '4px' }} />
            </div>
            <div style={{ flex: '1 1 100px' }}>
              <label style={lb}>Spessore: <strong>{block.cornice_spessore || 1.5}px</strong></label>
              <input type="range" min="1" max="6" step="0.5" value={block.cornice_spessore || 1.5} onChange={e => onChange({ ...block, cornice_spessore: parseFloat(e.target.value) })} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: '1 1 100px' }}>
              <label style={lb}>Arrotondamento: <strong>{block.cornice_radius ?? 16}px</strong></label>
              <input type="range" min="0" max="28" step="2" value={block.cornice_radius ?? 16} onChange={e => onChange({ ...block, cornice_radius: parseInt(e.target.value) })} style={{ width: '100%' }} />
            </div>
          </div>
          {(block.cornice_stile === 'dotted' || block.cornice_stile === 'dashed' || !block.cornice_stile) && (
            <div>
              <label style={lb}>Gap tra simboli: <strong>{block.cornice_gap ?? 6}px</strong></label>
              <input type="range" min="1" max="24" step="1" value={block.cornice_gap ?? 6} onChange={e => onChange({ ...block, cornice_gap: parseInt(e.target.value) })} style={{ width: '100%' }} />
            </div>
          )}
        </div>

        {/* ── Sfondo ── */}
        <div style={{ padding: '12px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ ...lb, marginBottom: 0 }}>Sfondo box</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {['#ffffff','#EEF3FF','#FFF0F7','#F9FAFB','#FFF8E6','#E8F5E9','#003DA5','#0A0A0A'].map(c => (
              <button key={c} type="button" onClick={() => onChange({ ...block, sfondo: c })} style={{
                width: '28px', height: '28px', borderRadius: '6px', border: `2px solid ${(block.sfondo || '#ffffff') === c ? '#003DA5' : '#E5E7EB'}`,
                background: c, cursor: 'pointer', padding: 0, flexShrink: 0,
              }} title={c} />
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
              <label style={{ ...lb, marginBottom: 0 }}>Custom</label>
              <input type="color" value={block.sfondo || '#ffffff'} onChange={e => onChange({ ...block, sfondo: e.target.value })} style={{ width: '36px', height: '28px', border: 'none', cursor: 'pointer', borderRadius: '4px' }} />
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{block.sfondo || '#ffffff'}</span>
            </div>
          </div>
        </div>

      {/* Lista voci */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {(block.voci || []).map((voce, i) => (
          <div key={voce.id || i} style={{ border: '1px solid #E5E7EB', borderRadius: '8px', background: '#fff', overflow: 'hidden' }}>
            {/* Header voce */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', flex: 1 }}>{tipoLabel[voce.tipo] || voce.tipo}</span>
              <button onClick={() => moveVoce(i, -1)} disabled={i === 0} style={{ ...btnIcon, opacity: i === 0 ? .3 : 1 }}>↑</button>
              <button onClick={() => moveVoce(i, 1)} disabled={i === (block.voci || []).length - 1} style={{ ...btnIcon, opacity: i === (block.voci || []).length - 1 ? .3 : 1 }}>↓</button>
              <button onClick={() => removeVoce(i)} style={{ ...btnIcon, color: '#DC2626', borderColor: '#FECACA' }}>✕</button>
            </div>

            {/* Corpo voce */}
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {voce.tipo === 'orario' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input value={voce.orario || ''} onChange={e => updateVoce(i, { ...voce, orario: e.target.value })} placeholder="ORE 10.30" style={{ ...inp, width: '120px', fontWeight: '700', fontSize: '13px' }} />
                  <input value={voce.testo || ''} onChange={e => updateVoce(i, { ...voce, testo: e.target.value })} placeholder="Descrizione" style={{ ...inp, flex: 1 }} />
                </div>
              )}

              {(voce.tipo === 'sessione' || voce.tipo === 'intermezzo') && (
                <>
                  <input value={voce.titolo || ''} onChange={e => updateVoce(i, { ...voce, titolo: e.target.value })} placeholder="Titolo sessione" style={{ ...inp, fontWeight: '700', fontSize: '13px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(voce.relatori || []).map((rel, ri) => (
                      <div key={ri} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input value={rel.nome || ''} onChange={e => { const r = [...voce.relatori]; r[ri] = { ...r[ri], nome: e.target.value }; updateVoce(i, { ...voce, relatori: r }) }} placeholder="Nome Cognome" style={{ ...inp, flex: '0 0 170px', fontWeight: '600', fontSize: '13px' }} />
                        <input value={rel.ruolo || ''} onChange={e => { const r = [...voce.relatori]; r[ri] = { ...r[ri], ruolo: e.target.value }; updateVoce(i, { ...voce, relatori: r }) }} placeholder="Ruolo / Ente" style={{ ...inp, flex: 1, fontSize: '13px' }} />
                        <button onClick={() => updateVoce(i, { ...voce, relatori: voce.relatori.filter((_, j) => j !== ri) })} style={btnDel}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => updateVoce(i, { ...voce, relatori: [...(voce.relatori || []), { nome: '', ruolo: '' }] })} style={{ ...btnAdd, fontSize: '12px', padding: '5px 10px' }}>+ Relatore</button>
                  </div>
                </>
              )}

              {voce.tipo === 'modera' && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input value={voce.nome || ''} onChange={e => updateVoce(i, { ...voce, nome: e.target.value })} placeholder="Nome moderatore" style={{ ...inp, flex: '0 0 170px', fontWeight: '600', fontSize: '13px' }} />
                  <input value={voce.ruolo || ''} onChange={e => updateVoce(i, { ...voce, ruolo: e.target.value })} placeholder="Ruolo / Ente" style={{ ...inp, flex: 1, fontSize: '13px' }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Aggiungi voce */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {[['orario', '⏰ Orario'], ['sessione', '▶ Sessione'], ['intermezzo', '🔖 Intermezzo'], ['modera', '🎙 Modera']].map(([tipo, label]) => (
          <button key={tipo} onClick={() => addVoce(tipo)} style={{ ...btnAdd, fontSize: '12px', padding: '6px 12px' }}>{label}</button>
        ))}
      </div>
    </div>
  )
}

// ── Wrapper blocco ──────────────────────────────────────────────────
function CaroselloEditor({ block, onChange }) {
  const [uploading, setUploading] = useState({}) // { [index]: true }
  const fileRefs = useRef({})

  async function handleUpload(file, index) {
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) { alert('File troppo grande (max 5MB)'); return }
    setUploading(u => ({ ...u, [index]: true }))
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader()
        r.onload = () => res(r.result.split(',')[1])
        r.onerror = rej
        r.readAsDataURL(file)
      })
      const jwt = await getFreshJwt()
      if (!jwt) throw new Error('Non autenticato')
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-carosello-image`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, base64 }),
        }
      )
      const result = await res.json()
      if (!res.ok || result.error) throw new Error(result.error || 'Errore upload')
      const imgs = [...(block.immagini || [])]
      imgs[index] = { ...imgs[index], src: result.url }
      onChange({ ...block, immagini: imgs })
    } catch (e) {
      alert(e.message || 'Errore durante il caricamento')
    }
    setUploading(u => ({ ...u, [index]: false }))
  }

  return (
    <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'14px' }}>
      {/* Rapporto aspetto */}
      <div>
        <label style={{ fontSize:'12px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:'6px' }}>Formato immagini</label>
        <div style={{ display:'flex', gap:'8px' }}>
          {[['1:1','Quadrato'],['4:5','Portrait'],['16:9','Landscape']].map(([v,l])=>(
            <button key={v} type="button" onClick={()=>onChange({...block,rapporto:v})}
              style={{ flex:1, padding:'7px 4px', border:`1px solid ${(block.rapporto||'1:1')===v?'#003DA5':'#E5E7EB'}`, borderRadius:'6px', background:(block.rapporto||'1:1')===v?'#EEF3FF':'#fff', cursor:'pointer', fontSize:'12px', fontWeight:'600', color:(block.rapporto||'1:1')===v?'#003DA5':'#6B7280', fontFamily:"'Inter',sans-serif" }}>
              {l}
            </button>
          ))}
        </div>
      </div>
      {/* Lista immagini */}
      <div>
        <label style={{ fontSize:'12px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:'6px' }}>Immagini ({(block.immagini||[]).length})</label>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {(block.immagini||[]).map((img,i)=>(
            <div key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start', background:'#F9FAFB', borderRadius:'8px', padding:'8px 10px' }}>
              {/* Anteprima o dropzone */}
              <div
                onClick={() => fileRefs.current[i]?.click()}
                style={{
                  width:'64px', height:'64px', flexShrink:0, borderRadius:'8px',
                  border: img.src ? 'none' : '2px dashed #D1D5DB',
                  background: img.src ? 'transparent' : '#F3F4F6',
                  cursor:'pointer', overflow:'hidden', position:'relative',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}
              >
                {uploading[i] ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5"
                    style={{ animation:'spin .7s linear infinite' }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                ) : img.src ? (
                  <img src={img.src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                )}
              </div>
              <input ref={el => fileRefs.current[i] = el} type="file" accept="image/*" style={{ display:'none' }}
                onChange={e => handleUpload(e.target.files[0], i)} />
              <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:'4px' }}>
                <input value={img.src||''} onChange={e=>{const imgs=[...block.immagini];imgs[i]={...imgs[i],src:e.target.value};onChange({...block,immagini:imgs})}}
                  placeholder="URL immagine (o carica con il tasto ←)" style={{...inp, fontSize:'12px'}} />
                <input value={img.didascalia||''} onChange={e=>{const imgs=[...block.immagini];imgs[i]={...imgs[i],didascalia:e.target.value};onChange({...block,immagini:imgs})}}
                  placeholder="Didascalia opzionale" style={{...inp, fontSize:'12px'}} />
              </div>
              <button onClick={()=>onChange({...block,immagini:block.immagini.filter((_,j)=>j!==i)})} style={btnDel}>✕</button>
            </div>
          ))}
        </div>
        <button onClick={()=>onChange({...block,immagini:[...(block.immagini||[]),{src:'',didascalia:''}]})} style={{...btnAdd,marginTop:'8px'}}>+ Aggiungi immagine</button>
      </div>
      {/* Didascalia generale */}
      <div>
        <label style={{ fontSize:'12px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:'6px' }}>Didascalia generale (opzionale)</label>
        <input value={block.didascalia||''} onChange={e=>onChange({...block,didascalia:e.target.value})}
          placeholder="Es. Foto dall'evento" style={inp} />
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}

function SocialEditor({ block, onChange }) {
  const tipi = [
    { v:'condivisione', l:'Solo pulsanti condivisione' },
    { v:'instagram',    l:'Post Instagram' },
    { v:'facebook',     l:'Post Facebook' },
    { v:'x',            l:'Post X (Twitter)' },
  ]
  return (
    <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'14px' }}>
      <div>
        <label style={{ fontSize:'12px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:'6px' }}>Tipo</label>
        <select value={block.tipo_social||'condivisione'} onChange={e=>onChange({...block,tipo_social:e.target.value})} style={inp}>
          {tipi.map(t=><option key={t.v} value={t.v}>{t.l}</option>)}
        </select>
      </div>
      {block.tipo_social && block.tipo_social !== 'condivisione' && (
        <div>
          <label style={{ fontSize:'12px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:'6px' }}>URL del post</label>
          <input value={block.url_post||''} onChange={e=>onChange({...block,url_post:e.target.value})}
            placeholder={`Incolla l'URL del post ${block.tipo_social}`} style={inp} />
          <p style={{ fontSize:'11px', color:'#9CA3AF', margin:'4px 0 0' }}>
            {block.tipo_social==='instagram' && 'Es. https://www.instagram.com/p/CODICE/'}
            {block.tipo_social==='facebook'  && 'Es. https://www.facebook.com/permalink.php?...'}
            {block.tipo_social==='x'         && 'Es. https://x.com/utente/status/12345'}
          </p>
        </div>
      )}
      <div>
        <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontSize:'13px', fontWeight:'600', color:'#374151' }}>
          <input type="checkbox" checked={block.mostra_condivisione !== false}
            onChange={e=>onChange({...block,mostra_condivisione:e.target.checked})}
            style={{ width:'16px', height:'16px' }} />
          Mostra pulsanti di condivisione
        </label>
        <p style={{ fontSize:'11px', color:'#9CA3AF', margin:'4px 0 0 24px' }}>
          WhatsApp, email, copia link, Facebook, X
        </p>
      </div>
      <div>
        <label style={{ fontSize:'12px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.06em', display:'block', marginBottom:'6px' }}>Titolo sezione (opzionale)</label>
        <input value={block.titolo||''} onChange={e=>onChange({...block,titolo:e.target.value})}
          placeholder="Es. Seguici sui social" style={inp} />
      </div>
    </div>
  )
}

function Block({ block, index, total, onChange, onDelete, onMoveUp, onMoveDown }) {
  const [collapsed, setCollapsed] = useState(false)
  const typeInfo = BLOCK_TYPES.find(t=>t.tipo===block.tipo) || { label:block.tipo }
  const blockIcon = BLOCK_ICONS[block.tipo]
  return (
    <div style={{ border:'1.5px solid #E5E7EB', borderRadius:'10px', overflow:'hidden', marginBottom:'8px', background:'#fff' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background:'#FAFAFA', borderBottom:collapsed?'none':'1px solid #E5E7EB', cursor:'pointer' }} onClick={()=>setCollapsed(c=>!c)}>
        <span style={{ display:'flex', alignItems:'center', width:'20px', height:'20px', flexShrink:0 }}>{blockIcon}</span>
        <span style={{flex:1,fontSize:'13px',fontWeight:'700',color:'#374151'}}>{typeInfo.label}
          {block.tipo==='testo'&&block.html&&<span style={{fontSize:'11px',fontWeight:'400',color:'#9CA3AF',marginLeft:'8px'}}>{block.html.replace(/<[^>]+>/g,'').slice(0,50)}…</span>}
          {block.tipo==='titolo'&&block.testo&&<span style={{fontSize:'11px',fontWeight:'400',color:'#9CA3AF',marginLeft:'8px'}}>{block.testo.slice(0,50)}</span>}
        </span>
        <button onClick={e=>{e.stopPropagation();onMoveUp()}} disabled={index===0} style={{...btnIcon,opacity:index===0?.3:1}} title="Sposta su">↑</button>
        <button onClick={e=>{e.stopPropagation();onMoveDown()}} disabled={index===total-1} style={{...btnIcon,opacity:index===total-1?.3:1}} title="Sposta giù">↓</button>
        <button onClick={e=>{e.stopPropagation();onDelete()}} style={{...btnIcon,color:'#DC2626',borderColor:'#FECACA'}} title="Elimina">✕</button>
        <span style={{fontSize:'12px',color:'#9CA3AF'}}>{collapsed?'▶':'▼'}</span>
      </div>
      {!collapsed&&(
        <>
          {block.tipo==='testo'       && <RichEditor value={block.html||''} onChange={html=>onChange({...block,html})} minHeight="180px" />}
          {block.tipo==='stats'       && <StatsEditor block={block} onChange={onChange} />}
          {block.tipo==='griglia'     && <GrigliaEditor block={block} onChange={onChange} />}
          {block.tipo==='cta'         && <CtaEditor block={block} onChange={onChange} />}
          {block.tipo==='immagine'    && <ImmagineEditor block={block} onChange={onChange} />}
          {block.tipo==='titolo'      && <TitoloEditor block={block} onChange={onChange} />}
          {block.tipo==='banner'      && <BannerEditor block={block} onChange={onChange} />}
          {block.tipo==='timeline'    && <TimelineEditor block={block} onChange={onChange} />}
          {block.tipo==='accordion'   && <AccordionEditor block={block} onChange={onChange} />}
          {block.tipo==='video'       && <VideoEditor block={block} onChange={onChange} />}
          {block.tipo==='testimonial' && <TestimonialEditor block={block} onChange={onChange} />}
          {block.tipo==='countdown'   && <CountdownEditor block={block} onChange={onChange} />}
          {block.tipo==='badge_list'  && <BadgeListEditor block={block} onChange={onChange} />}
          {block.tipo==='carosello'   && <CaroselloEditor block={block} onChange={onChange} />}
          {block.tipo==='social'      && <SocialEditor block={block} onChange={onChange} />}
          {block.tipo==='programma'   && <ProgrammaEditor block={block} onChange={onChange} />}
          {block.tipo==='separatore'  && <div style={{padding:'16px',color:'#9CA3AF',fontSize:'13px',textAlign:'center'}}>— Linea separatrice —</div>}
        </>
      )}
    </div>
  )
}

// ── Componente principale ───────────────────────────────────────────
export default function BlockEditor({ blocks = [], onChange }) {
  const [showAddMenu, setShowAddMenu] = useState(false)
  const groups = [...new Set(BLOCK_TYPES.map(t=>t.group))]

  function addBlock(tipo) { onChange([...blocks, newBlock(tipo)]); setShowAddMenu(false) }
  function updateBlock(i, block) { const next=[...blocks]; next[i]=block; onChange(next) }
  function deleteBlock(i) { onChange(blocks.filter((_,j)=>j!==i)) }
  function moveBlock(i, dir) { const next=[...blocks]; const j=i+dir; if(j<0||j>=next.length)return; [next[i],next[j]]=[next[j],next[i]]; onChange(next) }

  return (
    <div>
      {blocks.length===0&&(
        <div style={{textAlign:'center',padding:'32px',border:'2px dashed #E5E7EB',borderRadius:'10px',color:'#9CA3AF',marginBottom:'12px'}}>
          <p style={{margin:'0 0 4px',fontSize:'15px',fontWeight:'600'}}>Nessun blocco</p>
          <p style={{margin:0,fontSize:'13px'}}>Aggiungi il primo blocco qui sotto</p>
        </div>
      )}
      {blocks.map((block,i)=>(
        <Block key={block.id} block={block} index={i} total={blocks.length}
          onChange={b=>updateBlock(i,b)} onDelete={()=>deleteBlock(i)}
          onMoveUp={()=>moveBlock(i,-1)} onMoveDown={()=>moveBlock(i,1)} />
      ))}
      <div style={{position:'relative',marginTop:'4px'}}>
        <button type="button" onClick={()=>setShowAddMenu(o=>!o)} style={{
          display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',
          width:'100%',padding:'13px',
          border:`2px dashed ${showAddMenu?'#003DA5':'#D1D5DB'}`,
          borderRadius:'8px',background:showAddMenu?'#EEF3FF':'#FAFAFA',
          cursor:'pointer',fontSize:'14px',fontWeight:'700',
          color:showAddMenu?'#003DA5':'#6B7280',fontFamily:"'Inter',sans-serif",transition:'all .15s',
        }}>
          <span style={{fontSize:'18px'}}>+</span>
          Aggiungi blocco
        </button>
        {showAddMenu && createPortal(
          <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,.45)', backdropFilter:'blur(2px)' }}
            onClick={e=>{ if(e.target===e.currentTarget) setShowAddMenu(false) }}>
            <div style={{ background:'#fff', borderRadius:'14px', width:'360px', maxWidth:'90vw', maxHeight:'80vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}>
              <div style={{ position:'sticky', top:0, background:'#fff', borderBottom:'1px solid #E5E7EB', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderRadius:'14px 14px 0 0', zIndex:1 }}>
                <span style={{ fontSize:'14px', fontWeight:'800', color:'#0A0A0A' }}>Aggiungi blocco</span>
                <button onClick={()=>setShowAddMenu(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'20px', color:'#6B7280', lineHeight:1, padding:'2px 6px' }}>✕</button>
              </div>
              {groups.map(group=>(
              <div key={group}>
                <div style={{padding:'8px 18px',background:'#F9FAFB',borderBottom:'1px solid #F3F4F6'}}>
                  <span style={{fontSize:'11px',fontWeight:'700',color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.06em'}}>{group}</span>
                </div>
                {BLOCK_TYPES.filter(t=>t.group===group).map(({tipo,label})=>(
                  <button key={tipo} type="button" onClick={()=>addBlock(tipo)} style={{
                    display:'flex',alignItems:'center',gap:'14px',width:'100%',padding:'12px 18px',
                    border:'none',borderBottom:'1px solid #F3F4F6',background:'#fff',cursor:'pointer',
                    fontFamily:"'Inter',sans-serif",textAlign:'left',transition:'background .1s',
                  }}
                  onMouseEnter={e=>e.currentTarget.style.background='#EEF3FF'}
                  onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                    <span style={{display:'flex',alignItems:'center',width:'22px',height:'22px',flexShrink:0}}>
                      {BLOCK_ICONS[tipo]}
                    </span>
                    <span style={{fontSize:'13px',fontWeight:'600',color:'#0A0A0A'}}>{label}</span>
                  </button>
                ))}
              </div>
              ))}
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  )
}

const lb     = { fontSize:'12px', fontWeight:'600', color:'#6B7280', display:'block', marginBottom:'4px' }
const inp    = { width:'100%', padding:'8px 12px', border:'1px solid #E5E7EB', borderRadius:'6px', fontSize:'14px', fontFamily:"'Inter',sans-serif", outline:'none', boxSizing:'border-box' }
const btnAdd = { padding:'8px 14px', border:'1px solid #E5E7EB', borderRadius:'6px', cursor:'pointer', fontSize:'13px', fontFamily:"'Inter',sans-serif", fontWeight:'600', background:'#F9FAFB', color:'#374151' }
const btnDel = { width:'28px', height:'28px', border:'1px solid #FECACA', borderRadius:'6px', cursor:'pointer', background:'#FEF2F2', color:'#DC2626', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }
const btnIcon= { background:'none', border:'1px solid #E5E7EB', borderRadius:'5px', cursor:'pointer', width:'26px', height:'26px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', color:'#6B7280', flexShrink:0 }
