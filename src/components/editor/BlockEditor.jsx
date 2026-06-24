/**
 * BlockEditor — editor a blocchi per landing page
 * Tipi: testo | stats | griglia | cta | separatore | immagine
 *        titolo | banner | timeline | accordion | video | testimonial | countdown | badge_list
 */
import { useState } from 'react'
import RichEditor from './RichEditor'
import ImageUploader from './ImageUploader'

const uid = () => Math.random().toString(36).slice(2, 9)

export function newBlock(tipo) {
  const base = { id: uid(), tipo }
  switch (tipo) {
    case 'testo':       return { ...base, html: '<p>Scrivi qui…</p>' }
    case 'stats':       return { ...base, items: [{ num: '100+', label: 'Partecipanti' }, { num: '10', label: 'Relatori' }], colore: '#003DA5', animato: true }
    case 'griglia':     return { ...base, cols: [{ icona:'🎯', titolo: 'Titolo 1', testo: 'Descrizione.' }, { icona:'💡', titolo: 'Titolo 2', testo: 'Descrizione.' }, { icona:'🚀', titolo: 'Titolo 3', testo: 'Descrizione.' }] }
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
    case 'badge_list':  return { ...base, items: [{ icona: '✓', testo: 'Vantaggio uno' }, { icona: '✓', testo: 'Vantaggio due' }, { icona: '✓', testo: 'Vantaggio tre' }], colore: '#003DA5', colonne: 2 }
    default:            return base
  }
}

const BLOCK_TYPES = [
  { tipo: 'testo',       emoji: '📝', label: 'Testo ricco',     group: 'Base' },
  { tipo: 'titolo',      emoji: '🔤', label: 'Titolo sezione',  group: 'Base' },
  { tipo: 'immagine',    emoji: '🖼',  label: 'Immagine',        group: 'Base' },
  { tipo: 'separatore',  emoji: '—',  label: 'Separatore',      group: 'Base' },
  { tipo: 'stats',       emoji: '📊', label: 'Statistiche',     group: 'Contenuto' },
  { tipo: 'griglia',     emoji: '⊞',  label: 'Griglia card',    group: 'Contenuto' },
  { tipo: 'badge_list',  emoji: '✅', label: 'Lista vantaggi',  group: 'Contenuto' },
  { tipo: 'timeline',    emoji: '📅', label: 'Timeline',        group: 'Contenuto' },
  { tipo: 'accordion',   emoji: '❓', label: 'FAQ / Accordion', group: 'Contenuto' },
  { tipo: 'testimonial', emoji: '💬', label: 'Testimonial',     group: 'Contenuto' },
  { tipo: 'countdown',   emoji: '⏱',  label: 'Countdown',       group: 'Interattivo' },
  { tipo: 'video',       emoji: '▶️', label: 'Video embed',     group: 'Interattivo' },
  { tipo: 'cta',         emoji: '🎯', label: 'Call to action',  group: 'Interattivo' },
  { tipo: 'banner',      emoji: '📣', label: 'Banner avviso',   group: 'Interattivo' },
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
          <input value={col.icona||''} onChange={e=>{const cols=[...block.cols];cols[i]={...cols[i],icona:e.target.value};onChange({...block,cols})}} placeholder="🎯 Emoji opzionale" style={{...inp,width:'140px'}} />
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
          <input value={item.icona||''} onChange={e=>{const items=[...block.items];items[i]={...items[i],icona:e.target.value};onChange({...block,items})}} placeholder="✓" style={{...inp,width:'50px',textAlign:'center'}} />
          <input value={item.testo||''} onChange={e=>{const items=[...block.items];items[i]={...items[i],testo:e.target.value};onChange({...block,items})}} placeholder="Descrizione vantaggio" style={{...inp,flex:1}} />
          <button onClick={()=>onChange({...block,items:block.items.filter((_,j)=>j!==i)})} style={btnDel}>✕</button>
        </div>
      ))}
      <button onClick={()=>onChange({...block,items:[...(block.items||[]),{icona:'✓',testo:''}]})} style={btnAdd}>+ Aggiungi</button>
    </div>
  )
}

// ── Wrapper blocco ──────────────────────────────────────────────────
function Block({ block, index, total, onChange, onDelete, onMoveUp, onMoveDown }) {
  const [collapsed, setCollapsed] = useState(false)
  const typeInfo = BLOCK_TYPES.find(t=>t.tipo===block.tipo) || { emoji:'📦', label:block.tipo }
  return (
    <div style={{ border:'1.5px solid #E5E7EB', borderRadius:'10px', overflow:'hidden', marginBottom:'8px', background:'#fff' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background:'#FAFAFA', borderBottom:collapsed?'none':'1px solid #E5E7EB', cursor:'pointer' }} onClick={()=>setCollapsed(c=>!c)}>
        <span style={{fontSize:'16px'}}>{typeInfo.emoji}</span>
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
          <span style={{fontSize:'18px'}}>{showAddMenu?'✕':'+'}</span>
          {showAddMenu?'Chiudi':'Aggiungi blocco'}
        </button>
        {showAddMenu&&(
          <div style={{marginTop:'6px',border:'1px solid #E5E7EB',borderRadius:'10px',overflow:'hidden',boxShadow:'0 4px 16px rgba(0,0,0,.08)'}}>
            {groups.map(group=>(
              <div key={group}>
                <div style={{padding:'8px 18px',background:'#F9FAFB',borderBottom:'1px solid #F3F4F6'}}>
                  <span style={{fontSize:'11px',fontWeight:'700',color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.06em'}}>{group}</span>
                </div>
                {BLOCK_TYPES.filter(t=>t.group===group).map(({tipo,emoji,label})=>(
                  <button key={tipo} type="button" onClick={()=>addBlock(tipo)} style={{
                    display:'flex',alignItems:'center',gap:'14px',width:'100%',padding:'12px 18px',
                    border:'none',borderBottom:'1px solid #F3F4F6',background:'#fff',cursor:'pointer',
                    fontFamily:"'Inter',sans-serif",textAlign:'left',transition:'background .1s',
                  }}
                  onMouseEnter={e=>e.currentTarget.style.background='#EEF3FF'}
                  onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                    <span style={{fontSize:'20px',flexShrink:0,width:'24px'}}>{emoji}</span>
                    <span style={{fontSize:'13px',fontWeight:'600',color:'#0A0A0A'}}>{label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
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
