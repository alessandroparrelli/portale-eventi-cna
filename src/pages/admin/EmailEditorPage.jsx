import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import RichEditor from '../../components/editor/RichEditor'
import { ArrowLeft, Save, Eye, EyeOff, Loader2, Mail, RefreshCw } from 'lucide-react'
import { Field, Input, Select, Btn } from '../../components/ui'

const TIPO_LABELS = {
  conferma:       { label:'Conferma iscrizione',  color:'#16A34A', bg:'#DCFCE7' },
  reminder:       { label:'Reminder evento',       color:'#2563EB', bg:'#DBEAFE' },
  questionario:   { label:'Questionario',          color:'#7C3AED', bg:'#F3E8FF' },
  notifica_admin: { label:'Notifica admin',         color:'#D97706', bg:'#FEF3C7' },
}

const VARIABILI = [
  { key:'{{nome}}',            desc:'Nome iscritto' },
  { key:'{{cognome}}',         desc:'Cognome iscritto' },
  { key:'{{ragione_sociale}}', desc:'Azienda' },
  { key:'{{email}}',           desc:'Email' },
  { key:'{{cellulare}}',       desc:'Cellulare' },
  { key:'{{nome_evento}}',     desc:'Nome evento' },
  { key:'{{data_evento}}',     desc:'Data evento' },
  { key:'{{luogo_evento}}',    desc:'Luogo evento' },
  { key:'{{qr_code}}',         desc:'Codice QR' },
  { key:'{{link_questionario}}',desc:'Link questionario' },
]

// Sostituisce variabili con valori di anteprima
function replaceVarsPreview(html) {
  return html
    .replace(/{{nome}}/g, 'Mario')
    .replace(/{{cognome}}/g, 'Rossi')
    .replace(/{{ragione_sociale}}/g, 'Rossi Falegnameria Srl')
    .replace(/{{email}}/g, 'mario.rossi@example.it')
    .replace(/{{cellulare}}/g, '333 1234567')
    .replace(/{{nome_evento}}/g, 'Convegno Artigianato Roma 2026')
    .replace(/{{data_evento}}/g, 'sabato 20 settembre 2026, ore 09:00')
    .replace(/{{luogo_evento}}/g, 'Palazzo dei Congressi, Roma')
    .replace(/{{qr_code}}/g, '<span style="font-family:monospace;font-weight:700;color:#003DA5;background:#EEF3FF;padding:4px 10px;border-radius:4px;">QR-ESEMPIO123</span>')
    .replace(/{{link_questionario}}/g, '<a href="#" style="color:#003DA5;">Clicca qui per il questionario</a>')
}

export default function EmailEditorPage() {
  const { id, eventId } = useParams() // id = template id oppure 'nuovo'
  const navigate = useNavigate()
  const isNew = id === 'nuovo'

  const [eventi,    setEventi]    = useState([])
  const [template,  setTemplate]  = useState({
    event_id:   eventId||'',
    tipo:       'conferma',
    oggetto:    '',
    corpo_html: '<p>Gentile {{nome}} {{cognome}},</p><p></p>',
    giorni_prima: '',
    attivo:     true,
  })
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    supabase.from('events').select('id,titolo').order('data_inizio',{ascending:false})
      .then(({data})=>setEventi(data||[]))
    if (!isNew) loadTemplate()
  }, [id])

  async function loadTemplate() {
    const { data } = await supabase.from('email_templates').select('*').eq('id', id).single()
    if (data) setTemplate({ ...data, giorni_prima: data.giorni_prima||'' })
  }

  async function save() {
    if (!template.oggetto.trim()) return alert('L\'oggetto è obbligatorio')
    if (!template.event_id)       return alert('Seleziona un evento')
    setSaving(true)
    const payload = {
      event_id:    template.event_id,
      tipo:        template.tipo,
      oggetto:     template.oggetto.trim(),
      corpo_html:  template.corpo_html,
      giorni_prima:template.tipo==='reminder'&&template.giorni_prima ? parseInt(template.giorni_prima) : null,
      attivo:      template.attivo,
    }
    if (isNew) {
      await supabase.from('email_templates').insert(payload)
    } else {
      await supabase.from('email_templates').update(payload).eq('id', id)
    }
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2500)
  }

  const eventName = eventi.find(e=>e.id===template.event_id)?.titolo || 'Evento'
  const tipoInfo = TIPO_LABELS[template.tipo] || {}

  return (
    <div style={s.root}>
      {/* TOP BAR */}
      <div style={s.topBar}>
        <button onClick={()=>navigate('/admin/email')} style={s.backBtn}>
          <ArrowLeft size={18}/> <span>Torna alle email</span>
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1, margin:'0 16px', minWidth:0 }}>
          <Mail size={18} style={{ color:'#003DA5', flexShrink:0 }}/>
          <span style={{ fontSize:'16px', fontWeight:'700', color:'#0A0A0A', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {isNew ? 'Nuovo template email' : `Email: ${template.oggetto||'…'}`}
          </span>
          {tipoInfo.label && (
            <span style={{ backgroundColor:tipoInfo.bg, color:tipoInfo.color, fontSize:'12px', fontWeight:'600', padding:'3px 10px', borderRadius:'20px', flexShrink:0 }}>
              {tipoInfo.label}
            </span>
          )}
        </div>
        <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
          <button onClick={()=>setShowPreview(!showPreview)}
            style={{ ...s.ghostBtn, backgroundColor: showPreview?'#EEF3FF':'transparent', color:showPreview?'#003DA5':'#374151' }}>
            {showPreview ? <><EyeOff size={16}/> Nascondi</> : <><Eye size={16}/> Anteprima</>}
          </button>
          <button onClick={save} disabled={saving} style={s.saveBtn}>
            {saving ? <><Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/>Salvataggio…</>
              : saved ? <>✓ Salvato!</>
              : <><Save size={16}/> Salva template</>}
          </button>
        </div>
      </div>

      {/* MAIN — Split view opzionale */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* PANNELLO EDITOR */}
        <div style={{ flex:1, overflowY:'auto', padding:'24px', minWidth:0 }}>
          <div style={s.panel}>

            {/* Configurazione */}
            <div style={s.configCard}>
              <h3 style={s.cardTitle}>Configurazione</h3>
              <div style={s.grid3}>
                <Field label="Evento">
                  <Select value={template.event_id} onChange={e=>setTemplate(p=>({...p,event_id:e.target.value}))}>
                    <option value="">— Seleziona evento —</option>
                    {eventi.map(ev=><option key={ev.id} value={ev.id}>{ev.titolo}</option>)}
                  </Select>
                </Field>
                <Field label="Tipo email">
                  <Select value={template.tipo} onChange={e=>setTemplate(p=>({...p,tipo:e.target.value}))}>
                    <option value="conferma">Conferma iscrizione</option>
                    <option value="reminder">Reminder evento</option>
                    <option value="questionario">Questionario post-evento</option>
                    <option value="notifica_admin">Notifica admin</option>
                  </Select>
                </Field>
                {template.tipo==='reminder' && (
                  <Field label="Giorni prima dell'evento">
                    <Input type="number" value={template.giorni_prima}
                      onChange={e=>setTemplate(p=>({...p,giorni_prima:e.target.value}))} placeholder="es. 3"/>
                  </Field>
                )}
              </div>
              <Field label="Oggetto email">
                <Input value={template.oggetto}
                  onChange={e=>setTemplate(p=>({...p,oggetto:e.target.value}))}
                  placeholder="es. Conferma iscrizione — {{nome_evento}}"/>
              </Field>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'12px' }}>
                <input type="checkbox" id="attivo" checked={template.attivo}
                  onChange={e=>setTemplate(p=>({...p,attivo:e.target.checked}))}
                  style={{ width:'16px', height:'16px', accentColor:'#003DA5' }}/>
                <label htmlFor="attivo" style={{ fontSize:'13px', color:'#374151', cursor:'pointer' }}>
                  Template attivo (inviato automaticamente)
                </label>
              </div>
            </div>

            {/* Variabili disponibili */}
            <div style={s.varsCard}>
              <p style={s.varsTitle}>Variabili disponibili — clicca per copiare</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                {VARIABILI.map(v=>(
                  <button key={v.key} type="button"
                    onClick={()=>navigator.clipboard.writeText(v.key)}
                    title={`Copia ${v.key} · ${v.desc}`}
                    style={s.varChip}>
                    <code>{v.key}</code>
                    <span style={{ fontSize:'10px', color:'#6B7280' }}>{v.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Rich editor corpo */}
            <div>
              <p style={{ fontSize:'13px', fontWeight:'700', color:'#374151', margin:'0 0 8px' }}>Corpo email</p>
              <RichEditor
                value={template.corpo_html}
                onChange={v=>setTemplate(p=>({...p,corpo_html:v}))}
                minHeight="500px"
                placeholder="Scrivi il corpo dell'email…"
              />
            </div>
          </div>
        </div>

        {/* PANNELLO ANTEPRIMA */}
        {showPreview && (
          <div style={s.previewPanel}>
            <div style={s.previewHeader}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <Eye size={16} style={{ color:'#003DA5' }}/>
                <span style={{ fontSize:'13px', fontWeight:'700', color:'#0A0A0A' }}>Anteprima email</span>
              </div>
              <span style={{ fontSize:'11px', color:'#9CA3AF' }}>Dati di esempio</span>
            </div>

            {/* Simulazione client email */}
            <div style={s.emailClient}>
              <div style={s.emailMeta}>
                <div style={s.emailMetaRow}>
                  <span style={s.emailMetaLbl}>Da:</span>
                  <span>CNA Roma &lt;eventi@cnaroma.it&gt;</span>
                </div>
                <div style={s.emailMetaRow}>
                  <span style={s.emailMetaLbl}>A:</span>
                  <span>Mario Rossi &lt;mario.rossi@example.it&gt;</span>
                </div>
                <div style={s.emailMetaRow}>
                  <span style={s.emailMetaLbl}>Oggetto:</span>
                  <strong>{replaceVarsPreview(template.oggetto) || '(nessun oggetto)'}</strong>
                </div>
              </div>

              {/* Corpo email stilizzato */}
              <div style={s.emailBody}>
                {/* Header email */}
                <div style={s.emailHeader}>
                  <img src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"
                    alt="CNA Roma" style={{ height:'40px', objectFit:'contain' }}/>
                </div>
                {/* Contenuto */}
                <div style={s.emailContent}
                  dangerouslySetInnerHTML={{ __html: replaceVarsPreview(template.corpo_html||'') }}/>
                {/* Footer email */}
                <div style={s.emailFooter}>
                  <p style={{ margin:'0 0 4px', fontWeight:'600' }}>CNA Roma</p>
                  <p style={{ margin:0, color:'#9CA3AF' }}>Via della Conciliazione 44, Roma</p>
                  <p style={{ margin:'8px 0 0', fontSize:'11px', color:'#9CA3AF' }}>
                    Hai ricevuto questa email perché sei iscritto a un evento CNA Roma.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        /* Stili dentro l'anteprima email */
        .email-preview-body h1 { font-size:24px; font-weight:800; color:#0A0A0A; margin:0 0 12px; }
        .email-preview-body h2 { font-size:20px; font-weight:700; color:#0A0A0A; margin:0 0 10px; }
        .email-preview-body p  { font-size:15px; color:#374151; line-height:1.6; margin:0 0 12px; }
        .email-preview-body a  { color:#003DA5; }
        .email-preview-body ul { padding-left:20px; }
        .email-preview-body li { font-size:15px; color:#374151; margin:4px 0; }
        .email-preview-body table { border-collapse:collapse; width:100%; }
        .email-preview-body td, .email-preview-body th { border:1px solid #E5E7EB; padding:8px 12px; font-size:13px; }
      `}</style>
    </div>
  )
}

const s = {
  root:         { display:'flex', flexDirection:'column', height:'100vh', backgroundColor:'#F4F5F7', fontFamily:"'Inter',sans-serif", overflow:'hidden' },
  topBar:       { display:'flex', alignItems:'center', backgroundColor:'#FFFFFF', borderBottom:'1px solid #E5E7EB', padding:'0 24px', height:'60px', flexShrink:0 },
  backBtn:      { display:'flex', alignItems:'center', gap:'6px', background:'none', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'7px 14px', cursor:'pointer', fontSize:'13px', fontWeight:'600', color:'#374151', fontFamily:"'Inter',sans-serif", flexShrink:0 },
  ghostBtn:     { display:'flex', alignItems:'center', gap:'6px', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'7px 14px', cursor:'pointer', fontSize:'13px', fontWeight:'600', fontFamily:"'Inter',sans-serif", background:'transparent' },
  saveBtn:      { display:'flex', alignItems:'center', gap:'6px', backgroundColor:'#003DA5', color:'#FFFFFF', border:'none', borderRadius:'6px', padding:'8px 20px', cursor:'pointer', fontSize:'14px', fontWeight:'700', fontFamily:"'Inter',sans-serif" },
  panel:        { maxWidth:'760px', margin:'0 auto', display:'flex', flexDirection:'column', gap:'20px' },
  configCard:   { backgroundColor:'#FFFFFF', borderRadius:'10px', border:'1px solid #E5E7EB', padding:'20px', display:'flex', flexDirection:'column', gap:'14px' },
  cardTitle:    { fontSize:'15px', fontWeight:'700', color:'#0A0A0A', margin:0, letterSpacing:'-.01em' },
  grid3:        { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px' },
  varsCard:     { backgroundColor:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:'10px', padding:'14px 16px' },
  varsTitle:    { fontSize:'12px', fontWeight:'600', color:'#1d4ed8', margin:'0 0 10px', textTransform:'uppercase', letterSpacing:'.04em' },
  varChip:      { display:'flex', flexDirection:'column', gap:'1px', padding:'5px 10px', backgroundColor:'#FFFFFF', border:'1px solid #BFDBFE', borderRadius:'6px', cursor:'pointer', textAlign:'left', fontFamily:"'Inter',sans-serif" },
  // Preview panel
  previewPanel: { width:'420px', flexShrink:0, borderLeft:'1px solid #E5E7EB', display:'flex', flexDirection:'column', backgroundColor:'#F4F5F7', overflowY:'auto' },
  previewHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid #E5E7EB', backgroundColor:'#FFFFFF', flexShrink:0 },
  emailClient:  { margin:'16px', borderRadius:'10px', overflow:'hidden', border:'1px solid #E5E7EB', boxShadow:'0 4px 16px rgba(0,0,0,.08)' },
  emailMeta:    { backgroundColor:'#F9FAFB', padding:'12px 16px', borderBottom:'1px solid #E5E7EB', display:'flex', flexDirection:'column', gap:'4px' },
  emailMetaRow: { display:'flex', gap:'8px', fontSize:'12px', color:'#374151' },
  emailMetaLbl: { fontWeight:'600', color:'#6B7280', width:'60px', flexShrink:0 },
  emailBody:    { backgroundColor:'#FFFFFF' },
  emailHeader:  { backgroundColor:'#003DA5', padding:'20px 24px', display:'flex', justifyContent:'center' },
  emailContent: { padding:'24px', fontSize:'15px', lineHeight:'1.6', color:'#374151' },
  emailFooter:  { backgroundColor:'#F4F5F7', borderTop:'1px solid #E5E7EB', padding:'16px 24px', fontSize:'13px', color:'#6B7280', textAlign:'center' },
}
