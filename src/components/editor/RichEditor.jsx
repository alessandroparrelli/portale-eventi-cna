import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextStyle, FontSize, LineHeight } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

export const RICH_CSS = `
  .rich-content { font-family:'Inter',sans-serif; font-size:15px; line-height:1.5; color:#374151; }
  .rich-content p  { margin:0 0 8px; }
  .rich-content h1 { font-size:2.2em; font-weight:900; color:#0A0A0A; letter-spacing:-0.04em; margin:20px 0 10px; line-height:1.1; }
  .rich-content h2 { font-size:1.7em; font-weight:800; color:#0A0A0A; letter-spacing:-0.03em; margin:16px 0 8px; line-height:1.15; }
  .rich-content h3 { font-size:1.35em; font-weight:700; color:#0A0A0A; letter-spacing:-0.02em; margin:12px 0 6px; }
  .rich-content h4 { font-size:1.1em; font-weight:700; color:#374151; margin:10px 0 5px; }
  .rich-content strong, .rich-content b { font-weight:800; color:#0A0A0A; }
  .rich-content em, .rich-content i { font-style:italic; }
  .rich-content u  { text-decoration:underline; text-underline-offset:3px; }
  .rich-content s  { text-decoration:line-through; }
  .rich-content ul { padding-left:26px; margin:6px 0; list-style-type:disc; }
  .rich-content ol { padding-left:26px; margin:6px 0; list-style-type:decimal; }
  .rich-content li { margin:3px 0; line-height:1.5; }
  .rich-content blockquote { border-left:4px solid #003DA5; padding:10px 18px; margin:12px 0; background:#EEF3FF; border-radius:0 8px 8px 0; color:#1d4ed8; font-style:italic; }
  .rich-content code { background:#F3F4F6; padding:2px 7px; border-radius:4px; font-family:'Courier New',monospace; font-size:.88em; color:#DC2626; }
  .rich-content pre { background:#1F2937; color:#F9FAFB; padding:14px 18px; border-radius:8px; overflow-x:auto; margin:12px 0; font-family:'Courier New',monospace; font-size:.9em; line-height:1.5; }
  .rich-content pre code { background:none; color:inherit; padding:0; }
  .rich-content hr { border:none; border-top:2px solid #E5E7EB; margin:18px 0; }
  .rich-content img { max-width:100%; border-radius:0; margin:10px 0; display:block; cursor:pointer; }
  .rich-content img[data-align=center] { margin-left:auto; margin-right:auto; }
  .rich-content img[data-align=right]  { margin-left:auto; margin-right:0; }
  .rich-content img[data-align=left]   { margin-left:0; margin-right:auto; }
  .rich-content img[data-size=small]   { max-width:30%; }
  .rich-content img[data-size=medium]  { max-width:60%; }
  .rich-content img[data-size=large]   { max-width:100%; }
  .rich-content a { color:#003DA5; text-decoration:underline; text-underline-offset:2px; font-weight:500; }
  .rich-content table { border-collapse:collapse; width:100%; margin:12px 0; border-radius:8px; overflow:hidden; }
  .rich-content th { background:#003DA5; color:#FFF; border:1px solid #1d4ed8; padding:8px 14px; font-weight:700; font-size:14px; text-align:left; }
  .rich-content td { border:1px solid #E5E7EB; padding:8px 14px; font-size:14px; }
  .rich-content tr:nth-child(even) td { background:#F9FAFB; }
  /* Spaziatura paragrafo */
  .rich-content .p-compact  { margin-bottom:2px !important; line-height:1.3 !important; }
  .rich-content .p-tight    { margin-bottom:4px !important; line-height:1.4 !important; }
  .rich-content .p-normal   { margin-bottom:8px !important; line-height:1.5 !important; }
  .rich-content .p-relaxed  { margin-bottom:18px !important; line-height:1.7 !important; }
  .rich-content .p-loose    { margin-bottom:32px !important; line-height:2 !important; }
  /* Box speciali */
  .rich-content .callout-info    { background:#EFF6FF; border:1px solid #93C5FD; border-radius:8px; padding:12px 16px; margin:12px 0; }
  .rich-content .callout-warning { background:#FFFBEB; border:1px solid #FCD34D; border-radius:8px; padding:12px 16px; margin:12px 0; }
  .rich-content .callout-success { background:#F0FDF4; border:1px solid #86EFAC; border-radius:8px; padding:12px 16px; margin:12px 0; }
  .rich-content .callout-error   { background:#FEF2F2; border:1px solid #FECACA; border-radius:8px; padding:12px 16px; margin:12px 0; }
  /* Variabili inline */
  .rich-content .var-pill { display:inline-block; background:#EEF3FF; color:#003DA5; border:1px solid #C7D9F8; border-radius:12px; padding:1px 8px; font-family:monospace; font-size:.85em; font-weight:600; white-space:nowrap; }
  /* Blocchi strutturati */
  .rich-content .block-stats { display:flex; flex-wrap:wrap; gap:20px; justify-content:center; padding:24px 0; }
  .rich-content .stat-item { text-align:center; flex:1 1 80px; }
  .rich-content .stat-num { display:block; font-size:clamp(32px,5vw,48px); font-weight:900; color:#003DA5; letter-spacing:-.04em; line-height:1; }
  .rich-content .stat-label { display:block; font-size:12px; color:#6B7280; font-weight:700; text-transform:uppercase; letter-spacing:.06em; margin-top:3px; }
  .rich-content .block-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:12px 0; }
  .rich-content .block-grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin:12px 0; }
  .rich-content .grid-card { background:#FFF; border:1px solid #E5E7EB; border-radius:8px; padding:16px; }
  .rich-content .block-cta { background:#EEF3FF; border:1px solid #C7D9F8; border-radius:10px; padding:24px; text-align:center; margin:16px 0; }
  .rich-content .cta-title { font-size:1.3em; font-weight:900; color:#0A0A0A; margin:0 0 12px; letter-spacing:-.02em; }
  .rich-content .cta-btn { display:inline-block; background:#003DA5; color:#FFF; border-radius:6px; padding:10px 28px; font-weight:800; font-size:14px; text-decoration:none; }
  /* Animazioni */
  .rich-content .animate-fade  { animation:richFadeIn .6s ease both; }
  .rich-content .animate-slide { animation:richSlideUp .5s ease both; }
  .rich-content mark { border-radius:3px; padding:1px 3px; }
  @keyframes richFadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes richSlideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
`

// ── Pulsante toolbar ────────────────────────────────────────
function Btn({ children, title, active, onClick, disabled }) {
  return (
    <button type="button" title={title} onClick={onClick} disabled={disabled}
      style={{ minWidth:'32px', height:'32px', padding:'0 7px', border:'none',
        background: active ? '#EEF3FF' : 'transparent',
        color: active ? '#003DA5' : disabled ? '#D1D5DB' : '#374151',
        borderRadius:'5px', cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize:'13px', fontWeight: active ? '700' : '500',
        display:'flex', alignItems:'center', justifyContent:'center', gap:'3px',
        fontFamily:"'Inter',sans-serif", transition:'background .1s', flexShrink:0,
      }}
      onMouseEnter={e => !disabled && !active && (e.currentTarget.style.background = '#F3F4F6')}
      onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent')}
    >{children}</button>
  )
}
function Sep() { return <div style={{ width:'1px', background:'#E5E7EB', margin:'3px 2px', flexShrink:0, alignSelf:'stretch' }}/> }

const FONTS = [
  { label:'Inter',     value:'Inter, sans-serif' },
  { label:'Georgia',   value:'Georgia, serif' },
  { label:'Arial',     value:'Arial, sans-serif' },
  { label:'Courier',   value:'"Courier New", monospace' },
  { label:'Times',     value:'"Times New Roman", serif' },
]

const FONT_SIZES = ['10','11','12','13','14','15','16','18','20','22','24','28','32','36','42','48','60']
const LINE_HEIGHTS = [
  { label:'Compatto', value:'1.2' },
  { label:'Stretto', value:'1.4' },
  { label:'Normale', value:'1.6' },
  { label:'Ampio', value:'1.9' },
  { label:'Doppio', value:'2.2' },
]

const COLORS = [
  '#003DA5','#1d4ed8','#16A34A','#DC2626','#D97706','#7C3AED',
  '#EC4899','#0891B2','#0A0A0A','#374151','#6B7280','#FFFFFF',
  '#FEF3C7','#F0FDF4','#EFF6FF','#FEF2F2',
]

const SPECIAL_BLOCKS = [
  { label:'📘 Box Info',    html:'<div class="callout-info"><p><strong>ℹ️ Info:</strong> Inserisci il testo qui.</p></div>' },
  { label:'⚠️ Box Avviso', html:'<div class="callout-warning"><p><strong>⚠️ Attenzione:</strong> Inserisci il testo qui.</p></div>' },
  { label:'✅ Box Successo',html:'<div class="callout-success"><p><strong>✅ Nota:</strong> Inserisci il testo qui.</p></div>' },
  { label:'❌ Box Errore',  html:'<div class="callout-error"><p><strong>❌ Importante:</strong> Inserisci il testo qui.</p></div>' },
  { label:'✨ Fade In',     html:'<p class="animate-fade">Testo con animazione fade.</p>' },
  { label:'⬆️ Slide Up',   html:'<p class="animate-slide">Testo con animazione slide.</p>' },
  { label:'🎯 CTA Button', html:'<div class="block-cta"><p class="cta-title">Partecipa all\'evento</p><a href="#form-iscrizione" class="cta-btn">Iscriviti ora →</a></div>' },
  { label:'— Separatore',  html:'<hr/>' },
]

export default function RichEditor({ value, onChange, placeholder = 'Scrivi qui…', minHeight = '300px', variables = [] }) {
  const [uploadingImg, setUploadingImg] = useState(false)
  const [showTablePicker, setShowTablePicker] = useState(false)
  const [tableHover, setTableHover] = useState({ r:0, c:0 })
  const [showSpecial, setShowSpecial] = useState(false)
  const [showVarPicker, setShowVarPicker] = useState(false)
  const [selectedImg, setSelectedImg] = useState(null)
  const fileRef = useRef()
  const editorRef = useRef()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading:{ levels:[1,2,3,4] } }),
      Underline,
      TextStyle,
      FontSize,
      LineHeight,
      Color,
      FontFamily,
      TextAlign.configure({ types:['heading','paragraph'] }),
      Highlight.configure({ multicolor:true }),
      Image.configure({ inline:false, allowBase64:true }),
      Link.configure({ openOnClick:false }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable:true }),
      TableRow, TableCell, TableHeader,
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'rich-content',
        style: `min-height:${minHeight}; padding:18px 22px; outline:none;`,
      },
      handleClickOn: (view, pos, node) => {
        if (node.type.name === 'image') { setSelectedImg({ pos, attrs: node.attrs }); return true }
        setSelectedImg(null); return false
      }
    }
  })

  useEffect(() => {
    if (editor && value !== undefined && editor.getHTML() !== value)
      editor.commands.setContent(value || '', false)
  }, [value])

  // Espone metodo per inserire testo al cursore dall'esterno
  useEffect(() => {
    if (editorRef) editorRef.current = { insertAtCursor: (text) => {
      editor?.chain().focus().insertContent(text).run()
    }}
  }, [editor])

  if (!editor) return null

  function updateImageAttr(attr, val) {
    if (!selectedImg || !editor) return
    const { pos, attrs } = selectedImg
    editor.chain().focus().setNodeSelection(pos).updateAttributes('image', { ...attrs, [attr]: val }).run()
    setSelectedImg(prev => prev ? { ...prev, attrs: { ...prev.attrs, [attr]: val } } : null)
  }

  async function handleImageUpload(file) {
    if (!file) return
    setUploadingImg(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `editor/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('eventi-immagini').upload(path, file, { upsert:true })
      if (!error) {
        const { data } = supabase.storage.from('eventi-immagini').getPublicUrl(path)
        editor.chain().focus().setImage({ src: data.publicUrl }).run()
      }
    } catch {}
    setUploadingImg(false)
  }

  function addLink() {
    const prev = editor.getAttributes('link').href || ''
    const url = prompt('URL del link:', prev)
    if (url === null) return
    if (url === '') { editor.chain().focus().unsetLink().run(); return }
    editor.chain().focus().setLink({ href: url }).run()
  }

  function insertSpecial(html) {
    editor.chain().focus().insertContent(html).run()
    setShowSpecial(false)
  }

  // Inserisce variabile come pillola colorata al cursore
  function insertVariable(v) {
    editor.chain().focus().insertContent(
      `<span class="var-pill">${v}</span>`
    ).run()
    setShowVarPicker(false)
  }

  // Inserisce QR code placeholder
  function insertQr() {
    editor.chain().focus().insertContent(
      `<p><img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data={{qr_code_url}}" alt="QR Code" data-size="small" data-align="left" /></p><p><em>Il QR code personale verrà generato automaticamente per ogni iscritto</em></p>`
    ).run()
    setShowVarPicker(false)
  }

  const closeAll = () => { setShowTablePicker(false); setShowSpecial(false); setShowVarPicker(false) }

  // Valore corrente fontSize
  const curFontSize = editor.getAttributes('textStyle').fontSize?.replace('px','') || '15'
  const curLineH   = editor.getAttributes('textStyle').lineHeight || ''

  return (
    <div style={st.wrap} onClick={closeAll} ref={editorRef}>

      {/* ── RIGA 1: Struttura + Font + Dimensione ── */}
      <div style={st.row}>
        <select value={
            editor.isActive('heading',{level:1}) ? 'h1' :
            editor.isActive('heading',{level:2}) ? 'h2' :
            editor.isActive('heading',{level:3}) ? 'h3' :
            editor.isActive('heading',{level:4}) ? 'h4' : 'p'}
          onChange={e => {
            const v = e.target.value
            if (v==='p') editor.chain().focus().setParagraph().run()
            else editor.chain().focus().setHeading({ level: parseInt(v[1]) }).run()
          }} style={st.sel}>
          <option value="p">Paragrafo</option>
          <option value="h1">Titolo 1</option>
          <option value="h2">Titolo 2</option>
          <option value="h3">Titolo 3</option>
          <option value="h4">Titolo 4</option>
        </select>

        <select onChange={e => editor.chain().focus().setFontFamily(e.target.value).run()}
          style={{ ...st.sel, minWidth:'90px' }} defaultValue="Inter, sans-serif">
          {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        {/* Font size */}
        <div style={{ display:'flex', alignItems:'center', gap:'2px' }}>
          <button type="button" title="Diminuisci font"
            onClick={() => { const s = Math.max(8, parseInt(curFontSize)-1); editor.chain().focus().setFontSize(`${s}px`).run() }}
            style={{ ...st.smallBtn }}>−</button>
          <select value={curFontSize}
            onChange={e => editor.chain().focus().setFontSize(`${e.target.value}px`).run()}
            style={{ ...st.sel, width:'58px', padding:'0 4px', textAlign:'center' }}>
            {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="button" title="Aumenta font"
            onClick={() => { const s = Math.min(96, parseInt(curFontSize)+1); editor.chain().focus().setFontSize(`${s}px`).run() }}
            style={{ ...st.smallBtn }}>+</button>
        </div>

        <Sep/>

        {/* Interlinea */}
        <div style={{ display:'flex', alignItems:'center', gap:'2px' }}>
          <span style={{ fontSize:'11px', color:'#9CA3AF', whiteSpace:'nowrap' }}>↕</span>
          <select value={curLineH}
            onChange={e => editor.chain().focus().setLineHeight(e.target.value).run()}
            style={{ ...st.sel, minWidth:'80px' }}>
            <option value="">Interlinea</option>
            {LINE_HEIGHTS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>

        <Sep/>

        <Btn title="Grassetto" active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></Btn>
        <Btn title="Corsivo" active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}><em style={{fontStyle:'italic'}}>I</em></Btn>
        <Btn title="Sottolineato" active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}><span style={{textDecoration:'underline'}}>U</span></Btn>
        <Btn title="Barrato" active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}><span style={{textDecoration:'line-through'}}>S</span></Btn>

        <Sep/>

        <Btn title="Allinea sinistra" active={editor.isActive({textAlign:'left'})}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeftIcon/></Btn>
        <Btn title="Centra" active={editor.isActive({textAlign:'center'})}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenterIcon/></Btn>
        <Btn title="Allinea destra" active={editor.isActive({textAlign:'right'})}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRightIcon/></Btn>
        <Btn title="Giustifica" active={editor.isActive({textAlign:'justify'})}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}><AlignJustifyIcon/></Btn>

        <Sep/>

        <Btn title="Annulla" disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}>↩</Btn>
        <Btn title="Ripeti" disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}>↪</Btn>
        <Btn title="Rimuovi formattazione"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}><RemoveFormatIcon/></Btn>
      </div>

      {/* ── RIGA 2: Liste + Media + Tabella + Speciali + Variabili ── */}
      <div style={st.row}>
        <Btn title="Elenco puntato" active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}><BulletListIcon/></Btn>
        <Btn title="Elenco numerato" active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}><OrderedListIcon/></Btn>
        <Btn title="Rientro +" onClick={() => editor.chain().focus().sinkListItem('listItem').run()}><IndentIcon/></Btn>
        <Btn title="Rientro -" onClick={() => editor.chain().focus().liftListItem('listItem').run()}><OutdentIcon/></Btn>

        <Sep/>

        <Btn title="Citazione" active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}><QuoteIcon/></Btn>
        <Btn title="Linea orizzontale"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}><HrIcon/></Btn>
        <Btn title="Link" active={editor.isActive('link')} onClick={addLink}><LinkIcon/></Btn>

        {/* Immagine */}
        <Btn title="Inserisci immagine" disabled={uploadingImg}
          onClick={e => { e.stopPropagation(); fileRef.current?.click() }}>
          <ImageIcon upload={uploadingImg}/>
        </Btn>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
          onChange={e => handleImageUpload(e.target.files[0])}/>

        <Sep/>

        {/* Tabella */}
        <div style={{ position:'relative' }} onClick={e => e.stopPropagation()}>
          <Btn title="Inserisci tabella" active={showTablePicker}
            onClick={() => { setShowTablePicker(!showTablePicker); setShowSpecial(false); setShowVarPicker(false) }}>
            <TableIcon/>
          </Btn>
          {showTablePicker && (
            <div style={st.picker}>
              <p style={st.pickerTitle}>{tableHover.r>0 ? `${tableHover.r}×${tableHover.c}` : 'Seleziona'}</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(8,20px)', gap:'2px', marginBottom:'6px' }}>
                {Array.from({length:40}).map((_,i) => {
                  const r=Math.floor(i/8)+1, c=(i%8)+1
                  const sel = r<=tableHover.r && c<=tableHover.c
                  return <div key={i} onMouseEnter={() => setTableHover({r,c})}
                    onClick={() => { editor.chain().focus().insertTable({rows:r,cols:c,withHeaderRow:true}).run(); setShowTablePicker(false) }}
                    style={{ width:'18px', height:'18px', border:`1px solid ${sel?'#003DA5':'#D1D5DB'}`,
                      backgroundColor:sel?'#EEF3FF':'#FFF', borderRadius:'2px', cursor:'pointer' }}/>
                })}
              </div>
              {editor.isActive('table') && (
                <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                  {[['+ Col', ()=>editor.chain().focus().addColumnAfter().run()],
                    ['+ Riga', ()=>editor.chain().focus().addRowAfter().run()],
                    ['- Col', ()=>editor.chain().focus().deleteColumn().run()],
                    ['- Riga', ()=>editor.chain().focus().deleteRow().run()],
                    ['✕ Tab', ()=>editor.chain().focus().deleteTable().run()],
                  ].map(([l,fn])=>
                    <button key={l} onClick={()=>{fn();setShowTablePicker(false)}} style={st.tblBtn}>{l}</button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Speciali */}
        <div style={{ position:'relative' }} onClick={e => e.stopPropagation()}>
          <Btn title="Blocchi speciali" active={showSpecial}
            onClick={() => { setShowSpecial(!showSpecial); setShowTablePicker(false); setShowVarPicker(false) }}>
            ✨
          </Btn>
          {showSpecial && (
            <div style={{ ...st.picker, width:'210px' }}>
              <p style={st.pickerTitle}>Blocchi & animazioni</p>
              {SPECIAL_BLOCKS.map(b =>
                <button key={b.label} onClick={() => insertSpecial(b.html)} style={st.specialBtn}>{b.label}</button>
              )}
            </div>
          )}
        </div>

        {/* Variabili — NUOVO PICKER */}
        {variables.length > 0 && (
          <div style={{ position:'relative' }} onClick={e => e.stopPropagation()}>
            <button type="button"
              onClick={() => { setShowVarPicker(!showVarPicker); setShowTablePicker(false); setShowSpecial(false) }}
              style={{ height:'32px', padding:'0 10px', border:'1px solid #C7D9F8', background: showVarPicker ? '#EEF3FF' : '#F8FAFF',
                borderRadius:'5px', cursor:'pointer', fontSize:'12px', fontWeight:'700', color:'#003DA5',
                fontFamily:"'Inter',sans-serif", display:'flex', alignItems:'center', gap:'4px', flexShrink:0 }}>
              {'{ }'} Variabili
            </button>
            {showVarPicker && (
              <div style={{ ...st.picker, width:'230px', right:0, left:'auto' }}>
                <p style={st.pickerTitle}>Inserisci al cursore</p>
                {/* QR code speciale */}
                <button onClick={insertQr} style={{ ...st.specialBtn, background:'#F0FDF4', color:'#166534', borderRadius:'6px', marginBottom:'6px', fontWeight:'700' }}>
                  📱 QR Code iscritto
                </button>
                <div style={{ height:'1px', background:'#E5E7EB', margin:'4px 0 8px' }}/>
                <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                  {variables.map(v =>
                    <button key={v} onClick={() => insertVariable(v)}
                      style={{ textAlign:'left', padding:'5px 8px', border:'none', borderRadius:'5px', cursor:'pointer',
                        fontSize:'12px', fontFamily:'monospace', fontWeight:'600', background:'transparent', color:'#003DA5' }}
                      onMouseEnter={e => e.currentTarget.style.background='#EEF3FF'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      {v}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── RIGA 3: Colori ── */}
      <div style={{ ...st.row, gap:'5px', paddingTop:'5px', paddingBottom:'5px' }}>
        <span style={{ fontSize:'11px', color:'#9CA3AF', marginRight:'2px' }}>A</span>
        {COLORS.map(col =>
          <button key={col} type="button"
            onClick={e => { e.stopPropagation(); editor.chain().focus().setColor(col).run() }}
            style={{ width:'20px', height:'20px', borderRadius:'50%', backgroundColor:col,
              border:`2px solid ${editor.isActive('textStyle',{color:col})?'#003DA5':'rgba(0,0,0,.15)'}`,
              cursor:'pointer', flexShrink:0, transition:'transform .1s' }}
            onMouseEnter={e => e.currentTarget.style.transform='scale(1.3)'}
            onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
            title={col}/>
        )}
        <Sep/>
        <span style={{ fontSize:'11px', color:'#9CA3AF', marginRight:'2px' }}>⬛</span>
        {COLORS.map(col =>
          <button key={`h${col}`} type="button"
            onClick={e => { e.stopPropagation(); editor.chain().focus().setHighlight({color:col}).run() }}
            style={{ width:'20px', height:'20px', borderRadius:'3px', backgroundColor:col,
              border:'1px solid rgba(0,0,0,.15)', cursor:'pointer', flexShrink:0, transition:'transform .1s' }}
            onMouseEnter={e => e.currentTarget.style.transform='scale(1.3)'}
            onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
            title={`Sfondo ${col}`}/>
        )}
        <Sep/>
        <Btn title="Rimuovi colori" onClick={() => editor.chain().focus().unsetColor().unsetHighlight().run()}>✕</Btn>
      </div>

      {/* ── TOOLBAR IMMAGINE ── */}
      {selectedImg && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', padding:'7px 10px', background:'#FFF7ED', borderBottom:'1px solid #FED7AA', alignItems:'center' }}>
          <span style={{ fontSize:'11px', fontWeight:'700', color:'#D97706' }}>🖼 IMMAGINE</span><Sep/>
          <span style={{ fontSize:'11px', color:'#6B7280' }}>Allinea:</span>
          {['left','center','right'].map(a =>
            <button key={a} type="button" onClick={() => updateImageAttr('data-align', a)}
              style={{ padding:'3px 9px', border:`1px solid ${selectedImg.attrs?.['data-align']===a?'#003DA5':'#E5E7EB'}`,
                borderRadius:'4px', background:selectedImg.attrs?.['data-align']===a?'#EEF3FF':'#FFF',
                cursor:'pointer', fontSize:'12px', fontWeight:'600', color:selectedImg.attrs?.['data-align']===a?'#003DA5':'#6B7280',
                fontFamily:"'Inter',sans-serif" }}>
              {a==='left'?'◀':a==='center'?'■':'▶'}
            </button>
          )}
          <Sep/>
          <span style={{ fontSize:'11px', color:'#6B7280' }}>Dim:</span>
          {[['small','30%'],['medium','60%'],['large','100%']].map(([sz,label]) =>
            <button key={sz} type="button" onClick={() => updateImageAttr('data-size', sz)}
              style={{ padding:'3px 9px', border:`1px solid ${selectedImg.attrs?.['data-size']===sz?'#003DA5':'#E5E7EB'}`,
                borderRadius:'4px', background:selectedImg.attrs?.['data-size']===sz?'#EEF3FF':'#FFF',
                cursor:'pointer', fontSize:'12px', fontWeight:'600', color:selectedImg.attrs?.['data-size']===sz?'#003DA5':'#6B7280',
                fontFamily:"'Inter',sans-serif" }}>
              {label}
            </button>
          )}
          <Sep/>
          <button onClick={() => { editor.chain().focus().deleteSelection().run(); setSelectedImg(null) }}
            style={{ padding:'3px 8px', border:'1px solid #FECACA', borderRadius:'4px', background:'#FEF2F2', cursor:'pointer', fontSize:'12px', color:'#DC2626', fontFamily:"'Inter',sans-serif", fontWeight:'600' }}>
            ✕ Elimina
          </button>
        </div>
      )}

      <EditorContent editor={editor}/>

      <style>{`
        ${RICH_CSS}
        .ProseMirror { outline:none; }
        .ProseMirror p.is-editor-empty:first-child::before { content:attr(data-placeholder); float:left; color:#9CA3AF; pointer-events:none; height:0; }
        .ProseMirror .selectedCell:after { background:rgba(0,61,165,.07); content:""; position:absolute; inset:0; pointer-events:none; z-index:2; }
        .ProseMirror .column-resize-handle { background:#003DA5; bottom:-2px; position:absolute; right:-2px; pointer-events:none; top:0; width:3px; }
        .ProseMirror table { position:relative; }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}

// ── SVG Icons ───────────────────────────────────────────────
const AlignLeftIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
const AlignCenterIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
const AlignRightIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
const AlignJustifyIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
const BulletListIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
const OrderedListIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="8" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">1.</text><text x="2" y="14" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">2.</text><text x="2" y="20" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">3.</text></svg>
const IndentIcon       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/><polyline points="3 9 7 12 3 15"/></svg>
const OutdentIcon      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/><polyline points="7 9 3 12 7 15"/></svg>
const QuoteIcon        = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
const HrIcon           = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="2" y1="12" x2="22" y2="12"/></svg>
const LinkIcon         = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
const ImageIcon        = ({upload}) => upload
  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:'spin .8s linear infinite'}}><circle cx="12" cy="12" r="9"/></svg>
  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
const TableIcon        = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
const RemoveFormatIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3h11l-4 9"/><path d="M3 21l18-18"/><line x1="6" y1="15" x2="6" y2="21"/><line x1="9" y1="21" x2="3" y2="21"/></svg>

const st = {
  wrap:       { border:'1px solid #D1D5DB', borderRadius:'10px', overflow:'hidden', background:'#FFF', fontFamily:"'Inter',sans-serif" },
  row:        { display:'flex', flexWrap:'wrap', gap:'2px', padding:'6px 8px', borderBottom:'1px solid #E5E7EB', background:'#FAFAFA', alignItems:'center' },
  sel:        { height:'32px', padding:'0 6px', border:'1px solid #E5E7EB', borderRadius:'5px', fontSize:'12px', fontFamily:"'Inter',sans-serif", background:'#FFF', cursor:'pointer' },
  smallBtn:   { width:'24px', height:'32px', border:'1px solid #E5E7EB', borderRadius:'5px', background:'#FFF', cursor:'pointer', fontSize:'16px', fontWeight:'700', fontFamily:"'Inter',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  picker:     { position:'absolute', top:'36px', left:0, background:'#FFF', border:'1px solid #E5E7EB', borderRadius:'10px', padding:'12px', zIndex:300, boxShadow:'0 8px 32px rgba(0,0,0,.12)', minWidth:'180px' },
  pickerTitle:{ fontSize:'11px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.05em', margin:'0 0 8px' },
  tblBtn:     { fontSize:'11px', padding:'3px 7px', border:'1px solid #E5E7EB', borderRadius:'4px', cursor:'pointer', background:'#FFF', fontFamily:"'Inter',sans-serif", fontWeight:'600' },
  specialBtn: { display:'block', width:'100%', textAlign:'left', padding:'6px 8px', border:'none', borderRadius:'5px', cursor:'pointer', fontSize:'12px', fontFamily:"'Inter',sans-serif", background:'transparent', color:'#374151', marginBottom:'1px' },
}
