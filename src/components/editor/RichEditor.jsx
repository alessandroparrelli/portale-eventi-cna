import { useEditor, EditorContent, Extension, Mark } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { FontSize, LineHeight } from '@tiptap/extension-text-style'
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
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

/* ─── CSS pubblico riutilizzabile ──────────────────────────────── */
export const RICH_CSS = `
  .rich-content { font-family:'Inter',sans-serif; font-size:15px; line-height:1.5; color:#374151; }
  .rich-content p  { margin:0 0 8px; }
  .rich-content h1 { font-size:2.2em; font-weight:900; color:#0A0A0A; letter-spacing:-0.04em; margin:20px 0 10px; line-height:1.1; }
  .rich-content h2 { font-size:1.7em; font-weight:800; color:#0A0A0A; letter-spacing:-0.03em; margin:16px 0 8px; line-height:1.15; }
  .rich-content h3 { font-size:1.35em; font-weight:700; color:#0A0A0A; letter-spacing:-0.02em; margin:12px 0 6px; }
  .rich-content h4 { font-size:1.1em; font-weight:700; color:#374151; margin:10px 0 5px; }
  .rich-content strong, .rich-content b { font-weight:800; }
  .rich-content em, .rich-content i { font-style:italic; }
  .rich-content u  { text-decoration:underline; text-underline-offset:3px; }
  .rich-content s  { text-decoration:line-through; }
  .rich-content ul { padding-left:26px; margin:6px 0; list-style-type:disc; }
  .rich-content ol { padding-left:26px; margin:6px 0; list-style-type:decimal; }
  .rich-content li { margin:3px 0; line-height:1.5; }
  .rich-content ul[data-type="taskList"] { list-style:none; padding-left:4px; }
  .rich-content ul[data-type="taskList"] li { display:flex; align-items:flex-start; gap:8px; }
  .rich-content ul[data-type="taskList"] li > label { margin-top:2px; }
  .rich-content ul[data-type="taskList"] li > div { flex:1; }
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
  .rich-content sub { font-size:.75em; vertical-align:sub; }
  .rich-content sup { font-size:.75em; vertical-align:super; }
  .rich-content .p-compact  { margin-bottom:2px !important; line-height:1.3 !important; }
  .rich-content .p-tight    { margin-bottom:4px !important; line-height:1.4 !important; }
  .rich-content .p-normal   { margin-bottom:8px !important; line-height:1.5 !important; }
  .rich-content .p-relaxed  { margin-bottom:18px !important; line-height:1.7 !important; }
  .rich-content .p-loose    { margin-bottom:32px !important; line-height:2 !important; }
  .rich-content .callout-info    { background:#EFF6FF; border:1px solid #93C5FD; border-radius:8px; padding:12px 16px; margin:12px 0; }
  .rich-content .callout-warning { background:#FFFBEB; border:1px solid #FCD34D; border-radius:8px; padding:12px 16px; margin:12px 0; }
  .rich-content .callout-success { background:#F0FDF4; border:1px solid #86EFAC; border-radius:8px; padding:12px 16px; margin:12px 0; }
  .rich-content .callout-error   { background:#FEF2F2; border:1px solid #FECACA; border-radius:8px; padding:12px 16px; margin:12px 0; }
  .rich-content .var-pill { display:inline-block; background:#EEF3FF; color:#003DA5; border:1px solid #C7D9F8; border-radius:12px; padding:1px 8px; font-family:monospace; font-size:.85em; font-weight:600; white-space:nowrap; }
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
  .rich-content .animate-fade  { animation:richFadeIn .6s ease both; }
  .rich-content .animate-slide { animation:richSlideUp .5s ease both; }
  .rich-content mark { border-radius:3px; padding:1px 3px; }
  @keyframes richFadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes richSlideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
`

/* ─── Pulsante toolbar ──────────────────────────────────────── */
function Btn({ children, title, active, onClick, disabled, danger }) {
  return (
    <button type="button" title={title} onClick={onClick} disabled={disabled}
      style={{ minWidth:'28px', height:'30px', padding:'0 6px', border:'none',
        background: active ? '#EEF3FF' : 'transparent',
        color: active ? '#003DA5' : disabled ? '#D1D5DB' : danger ? '#DC2626' : '#374151',
        borderRadius:'5px', cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize:'12px', fontWeight: active ? '700' : '500',
        display:'flex', alignItems:'center', justifyContent:'center', gap:'3px',
        fontFamily:"'Inter',sans-serif", transition:'background .1s, color .1s', flexShrink:0,
        position:'relative',
      }}
      onMouseEnter={e => { if(!disabled && !active) e.currentTarget.style.background='#F3F4F6' }}
      onMouseLeave={e => { if(!active) e.currentTarget.style.background='transparent' }}
    >{children}</button>
  )
}

function Sep() { return <div style={{ width:'1px', background:'#E5E7EB', margin:'2px 2px', flexShrink:0, alignSelf:'stretch' }}/> }

function RowLabel({ children }) {
  return <span style={{ fontSize:'10px', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.06em', whiteSpace:'nowrap', paddingRight:'2px' }}>{children}</span>
}

/* ─── Configurazioni ──────────────────────────────────────── */
const FONTS = [
  { label:'Inter',       value:'Inter, sans-serif' },
  { label:'Georgia',     value:'Georgia, serif' },
  { label:'Times New Roman', value:'"Times New Roman", serif' },
  { label:'Arial',       value:'Arial, sans-serif' },
  { label:'Helvetica',   value:'Helvetica, Arial, sans-serif' },
  { label:'Trebuchet',   value:'"Trebuchet MS", sans-serif' },
  { label:'Verdana',     value:'Verdana, sans-serif' },
  { label:'Courier New', value:'"Courier New", monospace' },
  { label:'Monaco',      value:'Monaco, monospace' },
  { label:'Impact',      value:'Impact, fantasy' },
  { label:'Palatino',    value:'"Palatino Linotype", serif' },
  { label:'Garamond',    value:'Garamond, serif' },
]

const FONT_SIZES = ['8','9','10','11','12','13','14','15','16','18','20','22','24','26','28','32','36','40','48','56','64','72','96']

const LINE_HEIGHTS = [
  { l:'1.0', v:'1' }, { l:'1.2', v:'1.2' }, { l:'1.4', v:'1.4' }, { l:'1.5', v:'1.5' },
  { l:'1.6', v:'1.6' }, { l:'1.8', v:'1.8' }, { l:'2.0', v:'2' }, { l:'2.5', v:'2.5' },
]

// Palette colori
const COLOR_PALETTE = {
  'Blu CNA': ['#001B4D','#002E7A','#003DA5','#1d4ed8','#3B82F6','#93C5FD','#BFDBFE','#EFF6FF'],
  'Verde':   ['#064E3B','#065F46','#16A34A','#22C55E','#4ADE80','#86EFAC','#BBF7D0','#F0FDF4'],
  'Rosso':   ['#7F1D1D','#991B1B','#B91C1C','#DC2626','#EF4444','#FCA5A5','#FECACA','#FEF2F2'],
  'Giallo':  ['#78350F','#92400E','#B45309','#D97706','#F59E0B','#FCD34D','#FDE68A','#FFFBEB'],
  'Viola':   ['#2E1065','#4C1D95','#5B21B6','#7C3AED','#8B5CF6','#A78BFA','#C4B5FD','#EDE9FE'],
  'Rosa':    ['#831843','#9D174D','#BE185D','#DB2777','#EC4899','#F9A8D4','#FBCFE8','#FDF2F8'],
  'Ciano':   ['#164E63','#155E75','#0E7490','#0891B2','#06B6D4','#67E8F9','#A5F3FC','#ECFEFF'],
  'Grigi':   ['#0A0A0A','#1F2937','#374151','#6B7280','#9CA3AF','#D1D5DB','#E5E7EB','#FFFFFF'],
}

const SPECIAL_BLOCKS = [
  { label:'📘 Box Info',     html:'<div class="callout-info"><p><strong>ℹ️ Info:</strong> Inserisci il testo qui.</p></div>' },
  { label:'⚠️ Box Avviso',  html:'<div class="callout-warning"><p><strong>⚠️ Attenzione:</strong> Inserisci il testo qui.</p></div>' },
  { label:'✅ Box Successo', html:'<div class="callout-success"><p><strong>✅ Nota:</strong> Inserisci il testo qui.</p></div>' },
  { label:'❌ Box Errore',   html:'<div class="callout-error"><p><strong>❌ Importante:</strong> Inserisci il testo qui.</p></div>' },
  { label:'🎯 CTA Button',  html:'<div class="block-cta"><p class="cta-title">Partecipa all\'evento</p><a href="#form-iscrizione" class="cta-btn">Iscriviti ora →</a></div>' },
  { label:'— Separatore',   html:'<hr/>' },
  { label:'✨ Fade In',      html:'<p class="animate-fade">Testo con animazione fade.</p>' },
  { label:'⬆️ Slide Up',    html:'<p class="animate-slide">Testo con animazione slide.</p>' },
]

/* ─── ColorPicker — picker nativo del sistema operativo ──────── */
function ColorPicker({ label = 'A', title = 'Colore testo', editor: ed, isHighlight = false }) {
  const inputRef = useRef()
  const savedSel = useRef(null)

  function applyColor(color) {
    if (!ed) return
    const sel = savedSel.current
    savedSel.current = null

    if (!sel) {
      if (isHighlight) {
        ed.chain().focus().setHighlight({ color }).run()
      } else {
        ed.chain().focus().setColor(color).run()
      }
      return
    }

    const { from, to } = sel

    if (isHighlight) {
      ed.chain().focus().setTextSelection({ from, to }).setHighlight({ color }).run()
      return
    }

    const { state, view } = ed
    const textStyleMark = state.schema.marks.textStyle
    if (!textStyleMark) {
      ed.chain().focus().setTextSelection({ from, to }).setColor(color).run()
      return
    }

    const tr = state.tr
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (!node.isText) return
      const nodeFrom = Math.max(from, pos)
      const nodeTo   = Math.min(to, pos + node.nodeSize)
      const existingMark = node.marks.find(m => m.type === textStyleMark)
      const existingAttrs = existingMark ? existingMark.attrs : {}
      tr.removeMark(nodeFrom, nodeTo, textStyleMark)
      tr.addMark(nodeFrom, nodeTo, textStyleMark.create({ ...existingAttrs, color }))
    })
    view.dispatch(tr)
    ed.commands.setTextSelection({ from, to })
  }

  function handleBtnMouseDown(e) {
    e.preventDefault() // non far perdere il focus all'editor
    // Salva la selezione prima che il picker del SO prenda il controllo
    if (ed) {
      const { from, to } = ed.state.selection
      savedSel.current = from !== to ? { from, to } : null
    }
    inputRef.current?.click()
  }

  return (
    <div style={{ position:'relative', flexShrink:0 }}>
      <button
        type="button"
        title={title}
        onMouseDown={handleBtnMouseDown}
        style={{ height:'30px', minWidth:'34px', padding:'0 5px', border:'1px solid #E5E7EB', borderRadius:'5px',
          background:'#fff', cursor:'pointer', fontSize:'13px', fontWeight:'700', color:'#374151',
          display:'flex', alignItems:'center', justifyContent:'center', gap:'3px', fontFamily:"'Inter',sans-serif" }}
      >
        <span style={{ fontSize:'14px' }}>{label}</span>
        <svg width="8" height="5" viewBox="0 0 8 5"><path d="M0 0l4 5 4-5z" fill="#9CA3AF"/></svg>
      </button>
      {/* input invisibile — aperto programmaticamente, onChange applica in tempo reale */}
      <input
        ref={inputRef}
        type="color"
        defaultValue="#000000"
        onChange={e => applyColor(e.target.value)}
        style={{ position:'absolute', width:'1px', height:'1px', opacity:0, pointerEvents:'none', top:0, left:0 }}
      />
    </div>
  )
}


/* ─── Componente principale ──────────────────────────────────── */
export default function RichEditor({ value, onChange, placeholder = 'Scrivi qui…', minHeight = '300px', variables = [] }) {
  const [uploadingImg, setUploadingImg] = useState(false)
  const [showTablePicker, setShowTablePicker] = useState(false)
  const [tableHover, setTableHover] = useState({ r:0, c:0 })
  const [showSpecial, setShowSpecial] = useState(false)
  const [showVarPicker, setShowVarPicker] = useState(false)
  const [selectedImg, setSelectedImg] = useState(null)
  const [showFontPicker, setShowFontPicker] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const fileRef = useRef()
  const editorRef = useRef()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels:[1,2,3,4,5,6] },
        // bold NON deve avere HTMLAttributes con color: lasciamo che TextStyle gestisca il colore
      }),
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
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested:true }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
      setCharCount(editor.storage?.characterCount?.characters?.() ?? editor.getText().length)
    },
    editorProps: {
      attributes: { class:'rich-content', style:`min-height:${minHeight}; padding:18px 22px; outline:none;` },
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

  useEffect(() => {
    if (editorRef) editorRef.current = { insertAtCursor: (text) => editor?.chain().focus().insertContent(text).run() }
  }, [editor])

  if (!editor) return null

  const closeAll = () => { setShowTablePicker(false); setShowSpecial(false); setShowVarPicker(false); setShowFontPicker(false) }

  function handleBoldClick() {
    // Legge i colori di TUTTI i nodi nel range prima del toggle
    const { state } = editor
    const { from, to } = state.selection
    const textStyleMark = state.schema.marks.textStyle

    // Mappa colore per ogni nodo di testo nel range
    const nodeColors = []
    if (from !== to && textStyleMark) {
      state.doc.nodesBetween(from, to, (node, pos) => {
        if (!node.isText) return
        const m = node.marks.find(mk => mk.type === textStyleMark)
        const color = m?.attrs?.color
        if (color) {
          nodeColors.push({
            from: Math.max(from, pos),
            to:   Math.min(to, pos + node.nodeSize),
            attrs: m.attrs, // tutti gli attributi, non solo il colore
            color,
          })
        }
      })
    }

    // Esegui il toggle bold
    editor.chain().focus().toggleBold().run()

    // Dopo il toggle, riapplica i colori preservando gli altri attributi textStyle
    if (nodeColors.length > 0) {
      const { state: newState, view } = editor
      const newMark = newState.schema.marks.textStyle
      if (newMark) {
        const tr = newState.tr
        for (const { from: nf, to: nt, attrs } of nodeColors) {
          tr.removeMark(nf, nt, newMark)
          tr.addMark(nf, nt, newMark.create(attrs))
        }
        view.dispatch(tr)
        editor.commands.setTextSelection({ from, to })
      }
    }
  }

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

  function insertVariable(v) {
    editor.chain().focus().insertContent(`<span class="var-pill">${v}</span>`).run()
    setShowVarPicker(false)
  }
  function insertQr() {
    editor.chain().focus().insertContent(
      `<p><img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data={{qr_code_url}}" alt="QR Code" data-size="small" data-align="left" /></p><p><em>Il QR code personale verrà generato automaticamente per ogni iscritto</em></p>`
    ).run()
    setShowVarPicker(false)
  }

  const curFontSize = editor.getAttributes('textStyle').fontSize?.replace('px','') || '15'
  const curFont = editor.getAttributes('textStyle').fontFamily || 'Inter, sans-serif'
  const curFontLabel = FONTS.find(f => f.value === curFont)?.label || 'Inter'

  return (
    <div style={st.wrap} onClick={closeAll} ref={editorRef}>

      {/* ══════════ RIGA 1: Struttura testo + Font ══════════ */}
      <div style={st.row}>
        <RowLabel>Stile</RowLabel>
        <select
          value={
            editor.isActive('heading',{level:1}) ? 'h1' :
            editor.isActive('heading',{level:2}) ? 'h2' :
            editor.isActive('heading',{level:3}) ? 'h3' :
            editor.isActive('heading',{level:4}) ? 'h4' :
            editor.isActive('heading',{level:5}) ? 'h5' :
            editor.isActive('heading',{level:6}) ? 'h6' :
            editor.isActive('codeBlock') ? 'code' : 'p'}
          onChange={e => {
            const v = e.target.value
            if (v==='p') editor.chain().focus().setParagraph().run()
            else if (v==='code') editor.chain().focus().toggleCodeBlock().run()
            else editor.chain().focus().setHeading({ level: parseInt(v[1]) }).run()
          }} style={{ ...st.sel, minWidth:'110px' }}>
          <option value="p">Paragrafo</option>
          <option value="h1">Titolo 1 — H1</option>
          <option value="h2">Titolo 2 — H2</option>
          <option value="h3">Titolo 3 — H3</option>
          <option value="h4">Titolo 4 — H4</option>
          <option value="h5">Titolo 5 — H5</option>
          <option value="h6">Titolo 6 — H6</option>
          <option value="code">Blocco codice</option>
        </select>

        <Sep/>
        <RowLabel>Font</RowLabel>

        {/* Font Picker custom */}
        <div style={{ position:'relative' }} onClick={e=>e.stopPropagation()}>
          <button type="button" onClick={() => setShowFontPicker(v=>!v)}
            style={{ ...st.sel, minWidth:'120px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'4px', height:'30px', cursor:'pointer', fontFamily: curFont }}>
            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, textAlign:'left' }}>{curFontLabel}</span>
            <svg width="8" height="5" viewBox="0 0 8 5" style={{ flexShrink:0 }}><path d="M0 0l4 5 4-5z" fill="#9CA3AF"/></svg>
          </button>
          {showFontPicker && (
            <div style={{ position:'absolute', top:'34px', left:0, zIndex:400, background:'#fff', border:'1px solid #E5E7EB',
              borderRadius:'10px', padding:'6px', boxShadow:'0 12px 40px rgba(0,0,0,.14)', width:'200px', maxHeight:'300px', overflowY:'auto' }}>
              {FONTS.map(f => (
                <button key={f.value} type="button" onClick={() => { editor.chain().focus().setFontFamily(f.value).run(); setShowFontPicker(false) }}
                  style={{ display:'block', width:'100%', textAlign:'left', padding:'7px 10px', border:'none', borderRadius:'6px', cursor:'pointer',
                    fontSize:'13px', fontFamily: f.value, background: curFont === f.value ? '#EFF6FF' : 'transparent',
                    color: curFont === f.value ? '#003DA5' : '#374151', fontWeight: curFont === f.value ? '700' : '400' }}
                  onMouseEnter={e => { if(curFont !== f.value) e.currentTarget.style.background='#F3F4F6' }}
                  onMouseLeave={e => { if(curFont !== f.value) e.currentTarget.style.background='transparent' }}>
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Sep/>
        <RowLabel>Dim</RowLabel>

        {/* Dimensione font */}
        <button type="button" title="Diminuisci" onClick={() => editor.chain().focus().setFontSize(`${Math.max(6,parseInt(curFontSize)-1)}px`).run()}
          style={st.smallBtn}>−</button>
        <select value={curFontSize} onChange={e => editor.chain().focus().setFontSize(`${e.target.value}px`).run()}
          style={{ ...st.sel, width:'52px', textAlign:'center' }}>
          {FONT_SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
        </select>
        <button type="button" title="Aumenta" onClick={() => editor.chain().focus().setFontSize(`${Math.min(120,parseInt(curFontSize)+1)}px`).run()}
          style={st.smallBtn}>+</button>

        <Sep/>
        <RowLabel>↕</RowLabel>
        <select value={editor.getAttributes('textStyle').lineHeight || ''}
          onChange={e => editor.chain().focus().setLineHeight(e.target.value).run()}
          style={{ ...st.sel, width:'58px' }}>
          <option value="">Auto</option>
          {LINE_HEIGHTS.map(l => <option key={l.v} value={l.v}>{l.l}</option>)}
        </select>

        <Sep/>

        {/* Undo / Redo */}
        <Btn title="Annulla (Ctrl+Z)" disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}>↩</Btn>
        <Btn title="Ripeti (Ctrl+Y)" disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}>↪</Btn>
        <Btn title="Rimuovi tutta la formattazione"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
          <ClearIcon/>
        </Btn>
      </div>

      {/* ══════════ RIGA 2: Formattazione testo ══════════ */}
      <div style={st.row}>
        <RowLabel>Format</RowLabel>
        <Btn title="Grassetto (Ctrl+B)" active={editor.isActive('bold')}
          onClick={handleBoldClick}><strong style={{fontSize:'14px'}}>B</strong></Btn>
        <Btn title="Corsivo (Ctrl+I)" active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}><em style={{fontStyle:'italic',fontSize:'14px'}}>I</em></Btn>
        <Btn title="Sottolineato (Ctrl+U)" active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}><span style={{textDecoration:'underline',fontSize:'14px'}}>U</span></Btn>
        <Btn title="Barrato" active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}><span style={{textDecoration:'line-through',fontSize:'13px'}}>S</span></Btn>
        <Btn title="Codice inline" active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}>
          <span style={{fontFamily:'monospace',fontSize:'12px',letterSpacing:'-1px'}}>&lt;/&gt;</span></Btn>
        <Btn title="Apice" active={editor.isActive('superscript')}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}>
          <span style={{fontSize:'11px'}}>X<sup style={{fontSize:'8px'}}>2</sup></span></Btn>
        <Btn title="Pedice" active={editor.isActive('subscript')}
          onClick={() => editor.chain().focus().toggleSubscript().run()}>
          <span style={{fontSize:'11px'}}>X<sub style={{fontSize:'8px'}}>2</sub></span></Btn>

        <Sep/>
        <RowLabel>Align</RowLabel>
        <Btn title="Allinea sinistra" active={editor.isActive({textAlign:'left'})}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeftIcon/></Btn>
        <Btn title="Centra" active={editor.isActive({textAlign:'center'})}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenterIcon/></Btn>
        <Btn title="Allinea destra" active={editor.isActive({textAlign:'right'})}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRightIcon/></Btn>
        <Btn title="Giustifica" active={editor.isActive({textAlign:'justify'})}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}><AlignJustifyIcon/></Btn>

        <Sep/>
        <RowLabel>Colore</RowLabel>
        <ColorPicker label="A" title="Colore testo" editor={editor} />
        <ColorPicker label="■" title="Sfondo / evidenziazione" editor={editor} isHighlight={true} />
        <Btn title="Rimuovi colori" onClick={() => editor.chain().focus().unsetColor().unsetHighlight().run()}>
          <span style={{fontSize:'10px',color:'#DC2626'}}>✕col</span>
        </Btn>
      </div>

      {/* ══════════ RIGA 3: Liste + Media + Extra ══════════ */}
      <div style={st.row}>
        <RowLabel>Liste</RowLabel>
        <Btn title="Elenco puntato" active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}><BulletListIcon/></Btn>
        <Btn title="Elenco numerato" active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}><OrderedListIcon/></Btn>
        <Btn title="Lista checkbox" active={editor.isActive('taskList')}
          onClick={() => editor.chain().focus().toggleTaskList().run()}>☑</Btn>
        <Btn title="Rientro +" onClick={() => editor.chain().focus().sinkListItem('listItem').run()}><IndentIcon/></Btn>
        <Btn title="Rientro -" onClick={() => editor.chain().focus().liftListItem('listItem').run()}><OutdentIcon/></Btn>

        <Sep/>
        <RowLabel>Blocchi</RowLabel>
        <Btn title="Citazione" active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}><QuoteIcon/></Btn>
        <Btn title="Linea orizzontale" onClick={() => editor.chain().focus().setHorizontalRule().run()}><HrIcon/></Btn>
        <Btn title="Link" active={editor.isActive('link')} onClick={addLink}><LinkIcon/></Btn>

        {/* Immagine */}
        <Btn title="Inserisci immagine" disabled={uploadingImg} onClick={e => { e.stopPropagation(); fileRef.current?.click() }}>
          <ImgIcon uploading={uploadingImg}/>
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
              <p style={st.pickerTitle}>{tableHover.r>0 ? `Tabella ${tableHover.r}×${tableHover.c}` : 'Seleziona righe × colonne'}</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(8,22px)', gap:'2px', marginBottom:'8px' }}>
                {Array.from({length:48}).map((_,i) => {
                  const r=Math.floor(i/8)+1, c=(i%8)+1
                  const sel = r<=tableHover.r && c<=tableHover.c
                  return <div key={i} onMouseEnter={() => setTableHover({r,c})}
                    onClick={() => { editor.chain().focus().insertTable({rows:r,cols:c,withHeaderRow:true}).run(); setShowTablePicker(false) }}
                    style={{ width:'20px', height:'20px', border:`1.5px solid ${sel?'#003DA5':'#D1D5DB'}`,
                      backgroundColor:sel?'#EEF3FF':'#FFF', borderRadius:'2px', cursor:'pointer', transition:'all .1s' }}/>
                })}
              </div>
              {editor.isActive('table') && (
                <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', borderTop:'1px solid #E5E7EB', paddingTop:'8px' }}>
                  {[['+ Col',()=>editor.chain().focus().addColumnAfter().run()],
                    ['+ Riga',()=>editor.chain().focus().addRowAfter().run()],
                    ['− Col',()=>editor.chain().focus().deleteColumn().run()],
                    ['− Riga',()=>editor.chain().focus().deleteRow().run()],
                    ['✕ Tabella',()=>editor.chain().focus().deleteTable().run()],
                  ].map(([l,fn])=>
                    <button key={l} onClick={()=>{fn();setShowTablePicker(false)}} style={st.tblBtn}>{l}</button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Blocchi speciali */}
        <div style={{ position:'relative' }} onClick={e => e.stopPropagation()}>
          <Btn title="Blocchi speciali & animazioni" active={showSpecial}
            onClick={() => { setShowSpecial(!showSpecial); setShowTablePicker(false); setShowVarPicker(false) }}>
            ✨
          </Btn>
          {showSpecial && (
            <div style={{ ...st.picker, width:'220px' }}>
              <p style={st.pickerTitle}>Blocchi & animazioni</p>
              {SPECIAL_BLOCKS.map(b =>
                <button key={b.label} onClick={() => { editor.chain().focus().insertContent(b.html).run(); setShowSpecial(false) }}
                  style={st.specialBtn}
                  onMouseEnter={e => e.currentTarget.style.background='#F3F4F6'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  {b.label}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Variabili */}
        {variables.length > 0 && (
          <div style={{ position:'relative' }} onClick={e => e.stopPropagation()}>
            <button type="button"
              onClick={() => { setShowVarPicker(!showVarPicker); setShowTablePicker(false); setShowSpecial(false) }}
              style={{ height:'30px', padding:'0 10px', border:'1px solid #C7D9F8', background: showVarPicker ? '#EEF3FF' : '#F8FAFF',
                borderRadius:'5px', cursor:'pointer', fontSize:'12px', fontWeight:'700', color:'#003DA5',
                fontFamily:"'Inter',sans-serif", display:'flex', alignItems:'center', gap:'4px', flexShrink:0 }}>
              {'{ }'} Variabili
            </button>
            {showVarPicker && (
              <div style={{ ...st.picker, width:'230px', right:0, left:'auto' }}>
                <p style={st.pickerTitle}>Inserisci al cursore</p>
                <button onClick={insertQr}
                  style={{ ...st.specialBtn, background:'#F0FDF4', color:'#166534', fontWeight:'700', borderRadius:'6px', marginBottom:'6px' }}
                  onMouseEnter={e => e.currentTarget.style.background='#DCFCE7'}
                  onMouseLeave={e => e.currentTarget.style.background='#F0FDF4'}>
                  📱 QR Code iscritto
                </button>
                <div style={{ height:'1px', background:'#E5E7EB', margin:'4px 0 8px' }}/>
                {variables.map(v =>
                  <button key={v} onClick={() => insertVariable(v)}
                    style={{ ...st.specialBtn, fontFamily:'monospace', fontWeight:'600', color:'#003DA5' }}
                    onMouseEnter={e => e.currentTarget.style.background='#EEF3FF'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    {v}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Contatore caratteri */}
        <span style={{ marginLeft:'auto', fontSize:'11px', color:'#D1D5DB', flexShrink:0 }}>{charCount} car.</span>
      </div>

      {/* ── Toolbar immagine ── */}
      {selectedImg && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', padding:'6px 10px', background:'#FFF7ED', borderBottom:'1px solid #FED7AA', alignItems:'center' }}>
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
          <span style={{ fontSize:'11px', color:'#6B7280' }}>Dimensione:</span>
          {[['small','Piccola'],['medium','Media'],['large','Piena']].map(([sz,label]) =>
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
        .ProseMirror ul[data-type="taskList"] { padding-left:0; }
        .ProseMirror ul[data-type="taskList"] li { display:flex; gap:8px; align-items:flex-start; list-style:none; }
        .ProseMirror ul[data-type="taskList"] li > label { display:flex; align-items:center; }
        .ProseMirror ul[data-type="taskList"] li > label input { width:16px; height:16px; cursor:pointer; accent-color:#003DA5; }
        .ProseMirror ul[data-type="taskList"] li > div { flex:1; }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}

/* ─── SVG Icons ─────────────────────────────────────────────── */
const AlignLeftIcon    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
const AlignCenterIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
const AlignRightIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
const AlignJustifyIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
const BulletListIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
const OrderedListIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="8" fontSize="6" fill="currentColor" stroke="none" fontWeight="bold">1.</text><text x="2" y="14" fontSize="6" fill="currentColor" stroke="none" fontWeight="bold">2.</text><text x="2" y="20" fontSize="6" fill="currentColor" stroke="none" fontWeight="bold">3.</text></svg>
const IndentIcon       = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/><polyline points="3 9 7 12 3 15"/></svg>
const OutdentIcon      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/><polyline points="7 9 3 12 7 15"/></svg>
const QuoteIcon        = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
const HrIcon           = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="2" y1="12" x2="22" y2="12"/></svg>
const LinkIcon         = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
const ImgIcon          = ({uploading}) => uploading
  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:'spin .8s linear infinite'}}><circle cx="12" cy="12" r="9"/></svg>
  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
const TableIcon        = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
const ClearIcon        = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3h11l-4 9"/><path d="M3 21l18-18"/><line x1="6" y1="15" x2="6" y2="21"/><line x1="9" y1="21" x2="3" y2="21"/></svg>

const st = {
  wrap:       { border:'1px solid #D1D5DB', borderRadius:'10px', overflow:'visible', background:'#FFF', fontFamily:"'Inter',sans-serif", position:'relative', zIndex:1 },
  row:        { display:'flex', flexWrap:'wrap', gap:'2px', padding:'5px 8px', borderBottom:'1px solid #E5E7EB', background:'#FAFAFA', alignItems:'center', overflow:'visible', position:'relative' },
  sel:        { height:'30px', padding:'0 6px', border:'1px solid #E5E7EB', borderRadius:'5px', fontSize:'12px', fontFamily:"'Inter',sans-serif", background:'#FFF', cursor:'pointer', color:'#374151' },
  smallBtn:   { width:'24px', height:'30px', border:'1px solid #E5E7EB', borderRadius:'5px', background:'#FFF', cursor:'pointer', fontSize:'16px', fontWeight:'700', fontFamily:"'Inter',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#374151' },
  picker:     { position:'absolute', top:'34px', left:0, background:'#FFF', border:'1px solid #E5E7EB', borderRadius:'10px', padding:'12px', zIndex:400, boxShadow:'0 8px 32px rgba(0,0,0,.12)', minWidth:'180px' },
  pickerTitle:{ fontSize:'11px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.05em', margin:'0 0 8px' },
  tblBtn:     { fontSize:'11px', padding:'3px 7px', border:'1px solid #E5E7EB', borderRadius:'4px', cursor:'pointer', background:'#FFF', fontFamily:"'Inter',sans-serif", fontWeight:'600' },
  specialBtn: { display:'block', width:'100%', textAlign:'left', padding:'6px 8px', border:'none', borderRadius:'5px', cursor:'pointer', fontSize:'12px', fontFamily:"'Inter',sans-serif", background:'transparent', color:'#374151', marginBottom:'1px' },
}
