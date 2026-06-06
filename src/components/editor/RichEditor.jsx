import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
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

// ── Globale CSS ricco iniettato sia nell'editor sia nella landing ──
export const RICH_CSS = `
  .rich-content { font-family:'Inter',sans-serif; font-size:16px; line-height:1.75; color:#374151; }
  .rich-content p  { margin:0 0 14px; }
  .rich-content h1 { font-size:2.2em; font-weight:900; color:#0A0A0A; letter-spacing:-0.04em; margin:24px 0 12px; line-height:1.1; }
  .rich-content h2 { font-size:1.7em; font-weight:800; color:#0A0A0A; letter-spacing:-0.03em; margin:20px 0 10px; line-height:1.15; }
  .rich-content h3 { font-size:1.35em; font-weight:700; color:#0A0A0A; letter-spacing:-0.02em; margin:16px 0 8px; }
  .rich-content h4 { font-size:1.1em; font-weight:700; color:#374151; margin:14px 0 6px; }
  .rich-content strong, .rich-content b { font-weight:800; color:#0A0A0A; }
  .rich-content em, .rich-content i { font-style:italic; }
  .rich-content u  { text-decoration:underline; text-underline-offset:3px; }
  .rich-content s  { text-decoration:line-through; }
  .rich-content ul { padding-left:26px; margin:10px 0; list-style-type:disc; }
  .rich-content ol { padding-left:26px; margin:10px 0; list-style-type:decimal; }
  .rich-content li { margin:5px 0; line-height:1.6; }
  .rich-content blockquote {
    border-left:4px solid #003DA5; padding:12px 20px;
    margin:16px 0; background:#EEF3FF; border-radius:0 8px 8px 0;
    color:#1d4ed8; font-style:italic; font-size:1.05em;
  }
  .rich-content code {
    background:#F3F4F6; padding:2px 7px; border-radius:4px;
    font-family:'Courier New',monospace; font-size:.88em; color:#DC2626;
  }
  .rich-content pre {
    background:#1F2937; color:#F9FAFB; padding:16px 20px;
    border-radius:8px; overflow-x:auto; margin:16px 0;
    font-family:'Courier New',monospace; font-size:.9em; line-height:1.6;
  }
  .rich-content pre code { background:none; color:inherit; padding:0; }
  .rich-content hr { border:none; border-top:2px solid #E5E7EB; margin:24px 0; }
  .rich-content img { max-width:100%; border-radius:8px; margin:12px 0; display:block; box-shadow:0 2px 12px rgba(0,0,0,.1); }
  .rich-content a { color:#003DA5; text-decoration:underline; text-underline-offset:2px; font-weight:500; }
  .rich-content a:hover { color:#1d4ed8; }
  .rich-content table { border-collapse:collapse; width:100%; margin:16px 0; border-radius:8px; overflow:hidden; }
  .rich-content th { background:#003DA5; color:#FFF; border:1px solid #1d4ed8; padding:10px 16px; font-weight:700; font-size:14px; text-align:left; }
  .rich-content td { border:1px solid #E5E7EB; padding:10px 16px; font-size:14px; }
  .rich-content tr:nth-child(even) td { background:#F9FAFB; }
  /* Box speciali */
  .rich-content .callout-info    { background:#EFF6FF; border:1px solid #93C5FD; border-radius:8px; padding:14px 18px; margin:16px 0; }
  .rich-content .callout-warning { background:#FFFBEB; border:1px solid #FCD34D; border-radius:8px; padding:14px 18px; margin:16px 0; }
  .rich-content .callout-success { background:#F0FDF4; border:1px solid #86EFAC; border-radius:8px; padding:14px 18px; margin:16px 0; }
  .rich-content .callout-error   { background:#FEF2F2; border:1px solid #FECACA; border-radius:8px; padding:14px 18px; margin:16px 0; }
  /* Animazioni */
  .rich-content .animate-fade    { animation: richFadeIn .6s ease both; }
  .rich-content .animate-slide   { animation: richSlideUp .5s ease both; }
  .rich-content .animate-pulse   { animation: richPulse 2s ease-in-out infinite; }
  @keyframes richFadeIn  { from { opacity:0; } to { opacity:1; } }
  @keyframes richSlideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes richPulse   { 0%,100% { opacity:1; } 50% { opacity:.6; } }
  /* Highlight */
  .rich-content mark { border-radius:3px; padding:1px 3px; }
`

// ── Pulsante toolbar ────────────────────────────────────────
function Btn({ children, title, active, onClick, disabled }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: '34px',
        height: '34px',
        padding: '0 8px',
        border: 'none',
        background: active ? '#EEF3FF' : 'transparent',
        color: active ? '#003DA5' : disabled ? '#D1D5DB' : '#374151',
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        fontWeight: active ? '700' : '500',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        fontFamily: "'Inter',sans-serif",
        transition: 'background .1s',
        flexShrink: 0,
      }}
      onMouseEnter={e => !disabled && !active && (e.currentTarget.style.background = '#F3F4F6')}
      onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent')}
    >{children}</button>
  )
}

function Sep() {
  return <div style={{ width:'1px', background:'#E5E7EB', margin:'4px 3px', flexShrink:0, alignSelf:'stretch' }}/>
}

function ToolLabel({ children }) {
  return <span style={{ fontSize:'11px', fontWeight:'600', color:'#9CA3AF', padding:'0 4px', letterSpacing:'.04em', alignSelf:'center', flexShrink:0 }}>{children}</span>
}

// Font e colori
const FONTS = [
  { label:'Inter',      value:'Inter, sans-serif' },
  { label:'Georgia',    value:'Georgia, serif' },
  { label:'Arial',      value:'Arial, sans-serif' },
  { label:'Courier',    value:'"Courier New", monospace' },
  { label:'Trebuchet',  value:'"Trebuchet MS", sans-serif' },
  { label:'Times',      value:'"Times New Roman", serif' },
]

const COLORS = [
  '#003DA5','#1d4ed8','#16A34A','#DC2626','#D97706','#7C3AED',
  '#EC4899','#0891B2','#0A0A0A','#374151','#6B7280','#9CA3AF',
  '#FFFFFF','#FEF3C7','#F0FDF4','#EFF6FF',
]

export default function RichEditor({ value, onChange, placeholder = 'Scrivi qui…', minHeight = '300px' }) {
  const [uploadingImg, setUploadingImg] = useState(false)
  const [showTablePicker, setShowTablePicker] = useState(false)
  const [tableHover, setTableHover] = useState({ r:0, c:0 })
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showBgPicker, setShowBgPicker] = useState(false)
  const [showSpecial, setShowSpecial] = useState(false)
  const fileRef = useRef()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels:[1,2,3,4] }, codeBlock: { HTMLAttributes: { class:'rich-code-block' } } }),
      Underline,
      TextStyle,
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
        style: `min-height:${minHeight}; padding:20px 24px; outline:none;`,
      }
    }
  })

  useEffect(() => {
    if (editor && value !== undefined && editor.getHTML() !== value) {
      editor.commands.setContent(value || '', false)
    }
  }, [value])

  if (!editor) return null

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
    const url  = prompt('URL del link:', prev)
    if (url === null) return
    if (url === '') { editor.chain().focus().unsetLink().run(); return }
    editor.chain().focus().setLink({ href: url }).run()
  }

  // Inserisce HTML raw (per box speciali e animazioni)
  function insertSpecial(html) {
    editor.chain().focus().insertContent(html).run()
    setShowSpecial(false)
  }

  const SPECIAL_BLOCKS = [
    {
      label:'📘 Box Info',
      html:'<div class="callout-info"><p><strong>ℹ️ Info:</strong> Inserisci il testo informativo qui.</p></div>',
    },
    {
      label:'⚠️ Box Avviso',
      html:'<div class="callout-warning"><p><strong>⚠️ Attenzione:</strong> Inserisci l\'avviso qui.</p></div>',
    },
    {
      label:'✅ Box Successo',
      html:'<div class="callout-success"><p><strong>✅ Nota:</strong> Inserisci il contenuto qui.</p></div>',
    },
    {
      label:'❌ Box Errore',
      html:'<div class="callout-error"><p><strong>❌ Importante:</strong> Inserisci il contenuto qui.</p></div>',
    },
    {
      label:'✨ Fade In',
      html:'<p class="animate-fade">Testo con animazione fade-in.</p>',
    },
    {
      label:'⬆️ Slide Up',
      html:'<p class="animate-slide">Testo con animazione slide-up.</p>',
    },
    {
      label:'💓 Pulsante',
      html:'<p class="animate-pulse"><strong>Testo pulsante.</strong></p>',
    },
  ]

  return (
    <div style={st.wrap} onClick={() => { setShowTablePicker(false); setShowColorPicker(false); setShowBgPicker(false); setShowSpecial(false) }}>
      
      {/* ── RIGA 1: Struttura + Grassetto/Corsivo + Allineamenti ── */}
      <div style={st.row}>
        {/* Stile paragrafo */}
        <select
          value={
            editor.isActive('heading',{level:1}) ? 'h1' :
            editor.isActive('heading',{level:2}) ? 'h2' :
            editor.isActive('heading',{level:3}) ? 'h3' :
            editor.isActive('heading',{level:4}) ? 'h4' : 'p'
          }
          onChange={e => {
            const v=e.target.value
            if(v==='p') editor.chain().focus().setParagraph().run()
            else editor.chain().focus().setHeading({ level: parseInt(v[1]) }).run()
          }}
          style={st.sel}
        >
          <option value="p">Paragrafo</option>
          <option value="h1">Titolo 1</option>
          <option value="h2">Titolo 2</option>
          <option value="h3">Titolo 3</option>
          <option value="h4">Titolo 4</option>
        </select>

        {/* Font family */}
        <select
          onChange={e => editor.chain().focus().setFontFamily(e.target.value).run()}
          style={{ ...st.sel, minWidth:'100px' }}
          defaultValue="Inter, sans-serif"
        >
          {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        <Sep/>

        {/* Grassetto */}
        <Btn title="Grassetto (Ctrl+B)" active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>B</strong>
        </Btn>
        {/* Corsivo */}
        <Btn title="Corsivo (Ctrl+I)" active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em style={{fontStyle:'italic'}}>I</em>
        </Btn>
        {/* Sottolineato */}
        <Btn title="Sottolineato (Ctrl+U)" active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <span style={{textDecoration:'underline'}}>U</span>
        </Btn>
        {/* Barrato */}
        <Btn title="Barrato" active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}>
          <span style={{textDecoration:'line-through'}}>S</span>
        </Btn>
        {/* Codice inline */}
        <Btn title="Codice inline" active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}>
          {'</>'}
        </Btn>

        <Sep/>

        {/* Allineamenti */}
        <Btn title="Allinea a sinistra" active={editor.isActive({textAlign:'left'})}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeftIcon/>
        </Btn>
        <Btn title="Centra" active={editor.isActive({textAlign:'center'})}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenterIcon/>
        </Btn>
        <Btn title="Allinea a destra" active={editor.isActive({textAlign:'right'})}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRightIcon/>
        </Btn>
        <Btn title="Giustifica" active={editor.isActive({textAlign:'justify'})}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
          <AlignJustifyIcon/>
        </Btn>

        <Sep/>

        {/* Undo/Redo */}
        <Btn title="Annulla (Ctrl+Z)" disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}>↩</Btn>
        <Btn title="Ripeti (Ctrl+Y)" disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}>↪</Btn>

        <Btn title="Rimuovi formattazione"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
          <RemoveFormatIcon/>
        </Btn>
      </div>

      {/* ── RIGA 2: Liste + Citazione + Media + Tabella + Speciali ── */}
      <div style={st.row}>
        {/* Liste */}
        <Btn title="Elenco puntato" active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <BulletListIcon/>
        </Btn>
        <Btn title="Elenco numerato" active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <OrderedListIcon/>
        </Btn>
        {/* Rientro */}
        <Btn title="Aumenta rientro"
          onClick={() => editor.chain().focus().sinkListItem('listItem').run()}>
          <IndentIcon/>
        </Btn>
        <Btn title="Riduci rientro"
          onClick={() => editor.chain().focus().liftListItem('listItem').run()}>
          <OutdentIcon/>
        </Btn>

        <Sep/>

        {/* Citazione */}
        <Btn title="Citazione / Blockquote" active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <QuoteIcon/>
        </Btn>
        {/* Blocco codice */}
        <Btn title="Blocco codice" active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          {'{ }'}
        </Btn>
        {/* Linea orizzontale */}
        <Btn title="Linea orizzontale"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <HrIcon/>
        </Btn>

        <Sep/>

        {/* Link */}
        <Btn title="Inserisci/modifica link" active={editor.isActive('link')}
          onClick={addLink}>
          <LinkIcon/>
        </Btn>

        {/* Immagine upload */}
        <Btn title="Inserisci immagine" disabled={uploadingImg}
          onClick={e => { e.stopPropagation(); fileRef.current?.click() }}>
          <ImageIcon upload={uploadingImg}/>
        </Btn>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
          onChange={e => handleImageUpload(e.target.files[0])}/>

        <Sep/>

        {/* Tabella picker */}
        <div style={{ position:'relative' }} onClick={e=>e.stopPropagation()}>
          <Btn title="Inserisci tabella" active={showTablePicker}
            onClick={() => setShowTablePicker(!showTablePicker)}>
            <TableIcon/>
          </Btn>
          {showTablePicker && (
            <div style={st.picker}>
              <p style={st.pickerTitle}>
                {tableHover.r>0 ? `Tabella ${tableHover.r}×${tableHover.c}` : 'Seleziona dimensioni'}
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(8,22px)', gap:'2px', marginBottom:'8px' }}>
                {Array.from({length:40}).map((_,i) => {
                  const r=Math.floor(i/8)+1, c=(i%8)+1
                  const sel = r<=tableHover.r && c<=tableHover.c
                  return (
                    <div key={i}
                      onMouseEnter={() => setTableHover({r,c})}
                      onClick={() => { editor.chain().focus().insertTable({rows:r,cols:c,withHeaderRow:true}).run(); setShowTablePicker(false) }}
                      style={{ width:'20px',height:'20px',border:`1px solid ${sel?'#003DA5':'#D1D5DB'}`,
                        backgroundColor:sel?'#EEF3FF':'#FFF', borderRadius:'3px', cursor:'pointer' }}/>
                  )
                })}
              </div>
              {editor.isActive('table') && (
                <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                  {[
                    ['+ Col →', ()=>editor.chain().focus().addColumnAfter().run()],
                    ['+ Riga ↓', ()=>editor.chain().focus().addRowAfter().run()],
                    ['- Col',   ()=>editor.chain().focus().deleteColumn().run()],
                    ['- Riga',  ()=>editor.chain().focus().deleteRow().run()],
                    ['✕ Tab',   ()=>editor.chain().focus().deleteTable().run()],
                  ].map(([label,fn])=>(
                    <button key={label} onClick={()=>{fn();setShowTablePicker(false)}}
                      style={st.tblBtn}>{label}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <Sep/>

        {/* Box speciali + animazioni */}
        <div style={{ position:'relative' }} onClick={e=>e.stopPropagation()}>
          <Btn title="Inserisci blocco speciale o animazione" active={showSpecial}
            onClick={() => setShowSpecial(!showSpecial)}>
            ✨
          </Btn>
          {showSpecial && (
            <div style={{ ...st.picker, width:'220px' }}>
              <p style={st.pickerTitle}>Blocchi speciali & animazioni</p>
              {SPECIAL_BLOCKS.map(b=>(
                <button key={b.label} onClick={() => insertSpecial(b.html)}
                  style={st.specialBtn}>
                  {b.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGA 3: Colori ── */}
      <div style={{ ...st.row, paddingTop:'6px', paddingBottom:'6px', borderBottom:'1px solid #E5E7EB', gap:'6px' }}>
        <ToolLabel>Colore:</ToolLabel>
        {COLORS.map(col=>(
          <button key={col} type="button"
            onClick={e=>{e.stopPropagation();editor.chain().focus().setColor(col).run()}}
            style={{
              width:'22px',height:'22px',borderRadius:'50%',backgroundColor:col,
              border:`2px solid ${editor.isActive('textStyle',{color:col})?'#003DA5':'rgba(0,0,0,.12)'}`,
              cursor:'pointer',flexShrink:0,transition:'transform .1s',
            }}
            onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.25)')}
            onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}
            title={col}/>
        ))}
        <Sep/>
        <ToolLabel>Sfondo:</ToolLabel>
        {COLORS.map(col=>(
          <button key={`h${col}`} type="button"
            onClick={e=>{e.stopPropagation();editor.chain().focus().setHighlight({color:col}).run()}}
            style={{
              width:'22px',height:'22px',borderRadius:'4px',backgroundColor:col,
              border:'1px solid rgba(0,0,0,.12)',cursor:'pointer',flexShrink:0,transition:'transform .1s',
            }}
            onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.25)')}
            onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}
            title={`Sfondo ${col}`}/>
        ))}
        <Sep/>
        <Btn title="Rimuovi colore" onClick={e=>{e.stopPropagation();editor.chain().focus().unsetColor().unsetHighlight().run()}}>
          ✕
        </Btn>
      </div>

      {/* ── AREA EDITOR ── */}
      <EditorContent editor={editor}/>

      {/* CSS globali che valgono anche nella landing */}
      <style>{`
        ${RICH_CSS}
        /* Editor-only extras */
        .ProseMirror { outline:none; }
        .ProseMirror p.is-editor-empty:first-child::before {
          content:attr(data-placeholder); float:left; color:#9CA3AF;
          pointer-events:none; height:0;
        }
        .ProseMirror .selectedCell:after {
          background:rgba(0,61,165,.08); content:""; position:absolute;
          inset:0; pointer-events:none; z-index:2;
        }
        .ProseMirror .column-resize-handle {
          background:#003DA5; bottom:-2px; position:absolute; right:-2px;
          pointer-events:none; top:0; width:4px;
        }
        .ProseMirror table { position:relative; }
      `}</style>
    </div>
  )
}

// ── SVG Icons inline ───────────────────────────────────────
const AlignLeftIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
const AlignCenterIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
const AlignRightIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
const AlignJustifyIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
const BulletListIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
const OrderedListIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="8" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">1.</text><text x="2" y="14" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">2.</text><text x="2" y="20" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">3.</text></svg>
const IndentIcon       = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/><polyline points="3 9 7 12 3 15"/></svg>
const OutdentIcon      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/><polyline points="7 9 3 12 7 15"/></svg>
const QuoteIcon        = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
const HrIcon           = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/></svg>
const LinkIcon         = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
const ImageIcon        = ({upload}) => upload
  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:'spin .8s linear infinite'}}><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/><path d="M9 12l2 2 4-4"/></svg>
  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
const TableIcon        = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
const RemoveFormatIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3h11l-4 9"/><path d="M3 21l18-18"/><line x1="6" y1="15" x2="6" y2="21"/><line x1="9" y1="21" x2="3" y2="21"/></svg>

const st = {
  wrap:        { border:'1px solid #D1D5DB', borderRadius:'10px', overflow:'hidden', backgroundColor:'#FFFFFF', fontFamily:"'Inter',sans-serif" },
  row:         { display:'flex', flexWrap:'wrap', gap:'2px', padding:'8px 10px', borderBottom:'1px solid #E5E7EB', backgroundColor:'#FAFAFA', alignItems:'center' },
  sel:         { height:'34px', padding:'0 8px', border:'1px solid #E5E7EB', borderRadius:'6px', fontSize:'13px', fontFamily:"'Inter',sans-serif", backgroundColor:'#FFFFFF', cursor:'pointer' },
  picker:      { position:'absolute', top:'40px', left:0, backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'10px', padding:'12px', zIndex:200, boxShadow:'0 8px 32px rgba(0,0,0,.12)', minWidth:'180px' },
  pickerTitle: { fontSize:'11px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'.05em', margin:'0 0 8px' },
  tblBtn:      { fontSize:'11px', padding:'4px 8px', border:'1px solid #E5E7EB', borderRadius:'4px', cursor:'pointer', backgroundColor:'#FFF', fontFamily:"'Inter',sans-serif", fontWeight:'600' },
  specialBtn:  { display:'block', width:'100%', textAlign:'left', padding:'7px 10px', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'13px', fontFamily:"'Inter',sans-serif", backgroundColor:'transparent', color:'#374151', marginBottom:'2px' },
}

// @keyframes spin for image upload icon
const spinStyle = document.createElement('style')
spinStyle.textContent = '@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }'
if (typeof document !== 'undefined' && !document.head.querySelector('[data-rich-spin]')) {
  spinStyle.setAttribute('data-rich-spin','')
  document.head?.appendChild(spinStyle)
}
