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

// ── Icone toolbar ────────────────────────────────────────────
const Ic = ({ children, title, active, onClick, disabled }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    disabled={disabled}
    style={{
      padding:'4px 7px', border:'none', background: active ? '#EEF3FF' : 'transparent',
      color: active ? '#003DA5' : disabled ? '#D1D5DB' : '#374151',
      borderRadius:'4px', cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize:'13px', display:'flex', alignItems:'center', justifyContent:'center',
      minWidth:'28px', height:'28px', fontFamily:"'Inter',sans-serif",
    }}
  >{children}</button>
)
const Sep = () => <div style={{ width:'1px', backgroundColor:'#E5E7EB', margin:'0 2px', alignSelf:'stretch' }}/>

// ── Font e colori disponibili ────────────────────────────────
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
  '#0A0A0A','#374151','#6B7280','#9CA3AF','#FFFFFF','#F4F5F7',
]
const SIZES = ['12','14','16','18','20','24','28','32','36','48']

export default function RichEditor({ value, onChange, placeholder = 'Scrivi qui…', minHeight = '300px' }) {
  const [uploadingImg, setUploadingImg] = useState(false)
  const [showTablePicker, setShowTablePicker] = useState(false)
  const [tableHover, setTableHover] = useState({ r:0, c:0 })
  const fileRef = useRef()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels:[1,2,3,4] } }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      TextAlign.configure({ types:['heading','paragraph'] }),
      Highlight.configure({ multicolor: true }),
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
        style: `min-height:${minHeight}; padding:16px; outline:none; font-family:Inter,sans-serif; font-size:15px; line-height:1.7; color:#0A0A0A;`,
      }
    }
  })

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== undefined && editor.getHTML() !== value) {
      editor.commands.setContent(value || '', false)
    }
  }, [value])

  if (!editor) return null

  // ── Upload immagine ──────────────────────────────────────
  async function handleImageUpload(file) {
    if (!file) return
    setUploadingImg(true)
    try {
      const ext  = file.name.split('.').pop()
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
    const url = prompt('Inserisci URL:')
    if (url) editor.chain().focus().setLink({ href:url }).run()
  }

  // ── Barra strumenti ──────────────────────────────────────
  return (
    <div style={s.wrap}>
      {/* TOOLBAR */}
      <div style={s.toolbar}>

        {/* Paragrafo / Heading */}
        <select
          value={
            editor.isActive('heading',{level:1}) ? 'h1' :
            editor.isActive('heading',{level:2}) ? 'h2' :
            editor.isActive('heading',{level:3}) ? 'h3' :
            editor.isActive('heading',{level:4}) ? 'h4' : 'p'
          }
          onChange={e => {
            const v = e.target.value
            if (v==='p') editor.chain().focus().setParagraph().run()
            else editor.chain().focus().setHeading({ level: parseInt(v[1]) }).run()
          }}
          style={s.select}
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
          style={s.select}
          defaultValue="Inter, sans-serif"
        >
          {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        <Sep/>

        {/* Grassetto, Corsivo, Sottolineato, Barrato */}
        <Ic title="Grassetto" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <b>B</b>
        </Ic>
        <Ic title="Corsivo" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <i>I</i>
        </Ic>
        <Ic title="Sottolineato" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <u>U</u>
        </Ic>
        <Ic title="Barrato" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <s>S</s>
        </Ic>

        <Sep/>

        {/* Allineamenti */}
        <Ic title="Allinea sinistra" active={editor.isActive({textAlign:'left'})} onClick={() => editor.chain().focus().setTextAlign('left').run()}>≡</Ic>
        <Ic title="Centra" active={editor.isActive({textAlign:'center'})} onClick={() => editor.chain().focus().setTextAlign('center').run()}>≡</Ic>
        <Ic title="Allinea destra" active={editor.isActive({textAlign:'right'})} onClick={() => editor.chain().focus().setTextAlign('right').run()}>≡</Ic>
        <Ic title="Giustifica" active={editor.isActive({textAlign:'justify'})} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>≡</Ic>

        <Sep/>

        {/* Liste */}
        <Ic title="Elenco puntato" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>•≡</Ic>
        <Ic title="Elenco numerato" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1≡</Ic>
        <Ic title="Citazione" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>"</Ic>
        <Ic title="Codice" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>{`<>`}</Ic>

        <Sep/>

        {/* Rientro */}
        <Ic title="Aumenta rientro" onClick={() => editor.chain().focus().sinkListItem('listItem').run()}>→</Ic>
        <Ic title="Riduci rientro" onClick={() => editor.chain().focus().liftListItem('listItem').run()}>←</Ic>

        <Sep/>

        {/* Link */}
        <Ic title="Inserisci link" active={editor.isActive('link')} onClick={addLink}>🔗</Ic>

        {/* Immagine upload */}
        <Ic title="Inserisci immagine" onClick={() => fileRef.current?.click()} disabled={uploadingImg}>
          {uploadingImg ? '⏳' : '🖼'}
        </Ic>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
          onChange={e => handleImageUpload(e.target.files[0])}/>

        {/* Tabella */}
        <div style={{ position:'relative' }}>
          <Ic title="Inserisci tabella" active={showTablePicker}
            onClick={() => setShowTablePicker(!showTablePicker)}>⊞</Ic>
          {showTablePicker && (
            <div style={s.tablePicker}>
              <p style={{ fontSize:'11px', color:'#6B7280', margin:'0 0 6px', fontWeight:'600' }}>
                {tableHover.r > 0 ? `${tableHover.r} × ${tableHover.c}` : 'Seleziona dimensioni'}
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(8,20px)', gap:'2px' }}>
                {Array.from({length:40}).map((_,i) => {
                  const r = Math.floor(i/8)+1, c = (i%8)+1
                  return (
                    <div key={i}
                      onMouseEnter={() => setTableHover({r,c})}
                      onClick={() => {
                        editor.chain().focus().insertTable({ rows:r, cols:c, withHeaderRow:true }).run()
                        setShowTablePicker(false)
                      }}
                      style={{
                        width:'18px', height:'18px', border:'1px solid',
                        borderColor: r<=tableHover.r && c<=tableHover.c ? '#003DA5' : '#E5E7EB',
                        backgroundColor: r<=tableHover.r && c<=tableHover.c ? '#EEF3FF' : '#FFFFFF',
                        borderRadius:'2px', cursor:'pointer',
                      }}/>
                  )
                })}
              </div>
              <div style={{ display:'flex', gap:'4px', marginTop:'6px' }}>
                <button onClick={() => { editor.chain().focus().addColumnAfter().run(); setShowTablePicker(false) }}
                  style={s.tblBtn}>+Col</button>
                <button onClick={() => { editor.chain().focus().addRowAfter().run(); setShowTablePicker(false) }}
                  style={s.tblBtn}>+Riga</button>
                <button onClick={() => { editor.chain().focus().deleteTable().run(); setShowTablePicker(false) }}
                  style={{ ...s.tblBtn, color:'#DC2626', borderColor:'#FECACA' }}>✕ Tab</button>
              </div>
            </div>
          )}
        </div>

        <Sep/>

        {/* Linea orizzontale */}
        <Ic title="Linea orizzontale" onClick={() => editor.chain().focus().setHorizontalRule().run()}>─</Ic>
        {/* Rimuovi formattazione */}
        <Ic title="Rimuovi formattazione" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>✕</Ic>

        <Sep/>

        {/* Undo/Redo */}
        <Ic title="Annulla" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>↩</Ic>
        <Ic title="Ripeti" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>↪</Ic>
      </div>

      {/* SECONDA RIGA: Colori */}
      <div style={s.toolbar2}>
        <span style={{ fontSize:'11px', color:'#6B7280', fontWeight:'600', alignSelf:'center' }}>Colore testo:</span>
        {COLORS.map(col => (
          <button key={col} type="button"
            onClick={() => editor.chain().focus().setColor(col).run()}
            style={{
              width:'20px', height:'20px', borderRadius:'50%', backgroundColor:col,
              border: editor.isActive('textStyle',{color:col}) ? '2px solid #003DA5' : '1px solid #D1D5DB',
              cursor:'pointer', flexShrink:0,
            }}
            title={col}/>
        ))}
        <Sep/>
        <span style={{ fontSize:'11px', color:'#6B7280', fontWeight:'600', alignSelf:'center' }}>Sfondo:</span>
        {COLORS.map(col => (
          <button key={`h-${col}`} type="button"
            onClick={() => editor.chain().focus().setHighlight({ color:col }).run()}
            style={{
              width:'20px', height:'20px', borderRadius:'4px', backgroundColor:col,
              border:'1px solid #D1D5DB', cursor:'pointer', flexShrink:0,
            }}
            title={`Sfondo ${col}`}/>
        ))}
      </div>

      {/* EDITOR AREA */}
      <div style={s.editorArea} onClick={() => setShowTablePicker(false)}>
        <EditorContent editor={editor}/>
      </div>

      <style>{`
        .ProseMirror p { margin:0 0 8px; }
        .ProseMirror h1 { font-size:2em; font-weight:900; margin:16px 0 8px; }
        .ProseMirror h2 { font-size:1.5em; font-weight:800; margin:14px 0 6px; }
        .ProseMirror h3 { font-size:1.25em; font-weight:700; margin:12px 0 5px; }
        .ProseMirror h4 { font-size:1.1em; font-weight:700; margin:10px 0 4px; }
        .ProseMirror ul { padding-left:24px; margin:8px 0; }
        .ProseMirror ol { padding-left:24px; margin:8px 0; }
        .ProseMirror li { margin:3px 0; }
        .ProseMirror blockquote { border-left:4px solid #003DA5; padding:8px 16px; margin:12px 0; color:#6B7280; background:#F4F5F7; border-radius:0 6px 6px 0; }
        .ProseMirror code { background:#F3F4F6; padding:2px 6px; border-radius:3px; font-family:monospace; font-size:.9em; }
        .ProseMirror hr { border:none; border-top:2px solid #E5E7EB; margin:16px 0; }
        .ProseMirror img { max-width:100%; border-radius:6px; margin:8px 0; }
        .ProseMirror table { border-collapse:collapse; width:100%; margin:12px 0; }
        .ProseMirror th { background:#EEF3FF; border:1px solid #D1D5DB; padding:8px 12px; font-weight:700; font-size:13px; }
        .ProseMirror td { border:1px solid #D1D5DB; padding:8px 12px; font-size:14px; }
        .ProseMirror a { color:#003DA5; text-decoration:underline; }
        .ProseMirror p.is-editor-empty:first-child::before { content:attr(data-placeholder); float:left; color:#9CA3AF; pointer-events:none; height:0; }
        .ProseMirror:focus { outline:none; }
        .ProseMirror .selectedCell:after { background:rgba(0,61,165,.08); content:""; left:0; right:0; top:0; bottom:0; pointer-events:none; position:absolute; z-index:2; }
        .ProseMirror .column-resize-handle { background-color:#003DA5; bottom:-2px; position:absolute; right:-2px; pointer-events:none; top:0; width:4px; }
      `}</style>
    </div>
  )
}

const s = {
  wrap:       { border:'1px solid #D1D5DB', borderRadius:'8px', overflow:'hidden', backgroundColor:'#FFFFFF' },
  toolbar:    { display:'flex', flexWrap:'wrap', gap:'2px', padding:'8px 10px', borderBottom:'1px solid #E5E7EB', backgroundColor:'#FAFAFA', alignItems:'center' },
  toolbar2:   { display:'flex', flexWrap:'wrap', gap:'4px', padding:'6px 10px', borderBottom:'1px solid #E5E7EB', backgroundColor:'#FAFAFA', alignItems:'center' },
  select:     { padding:'3px 6px', border:'1px solid #E5E7EB', borderRadius:'4px', fontSize:'12px', fontFamily:"'Inter',sans-serif", backgroundColor:'#FFFFFF', cursor:'pointer', height:'28px' },
  editorArea: { backgroundColor:'#FFFFFF', minHeight:'200px', cursor:'text' },
  tablePicker:{ position:'absolute', top:'32px', left:0, backgroundColor:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:'8px', padding:'10px', zIndex:100, boxShadow:'0 8px 24px rgba(0,0,0,.12)' },
  tblBtn:     { fontSize:'11px', padding:'3px 8px', border:'1px solid #E5E7EB', borderRadius:'4px', cursor:'pointer', backgroundColor:'#FFFFFF', fontFamily:"'Inter',sans-serif" },
  bubbleMenu: { display:'flex', gap:'4px', backgroundColor:'#0A0A0A', borderRadius:'6px', padding:'4px 6px' },
  bubbleBtn:  { background:'none', border:'none', color:'#FFFFFF', fontSize:'12px', cursor:'pointer', padding:'2px 8px', fontFamily:"'Inter',sans-serif' " },
}
