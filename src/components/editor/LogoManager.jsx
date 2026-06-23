import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Upload, Check, X, Loader2, ImageOff, Trash2, CheckSquare, Square } from 'lucide-react'

const GITHUB_OWNER  = 'alessandroparrelli'
const GITHUB_REPO   = 'fileappoggio'
const GITHUB_FOLDER = 'loghi'
const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${GITHUB_FOLDER}/`

const LOGO_DEFAULT = {
  name: 'CNA Roma (default)',
  url:  'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png',
  isDefault: true,
}

export default function LogoManager({ value, onChange }) {
  const [loghi,        setLoghi]        = useState([LOGO_DEFAULT])
  const [loading,      setLoading]      = useState(true)
  const [uploading,    setUploading]    = useState(false)
  const [uploadErr,    setUploadErr]    = useState('')
  const [uploadOk,     setUploadOk]     = useState('')
  const [deleteMode,   setDeleteMode]   = useState(false)
  const [selezionati,  setSelezionati]  = useState(new Set())
  const [deleting,     setDeleting]     = useState(false)
  const [deleteErr,    setDeleteErr]    = useState('')
  const fileRef = useRef()

  useEffect(() => { fetchLoghi() }, [])

  async function fetchLoghi() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const jwt = session?.access_token
      if (!jwt) throw new Error('Non autenticato')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-list-loghi`,
        { headers: { 'Authorization': `Bearer ${jwt}` } }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!data.ok || !data.files) throw new Error(data.error || 'Errore lista')

      const ts = Date.now()
      const imgs = data.files.map(f => ({
        name:      f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        url:       f.url + `?v=${ts}`,
        sha:       f.sha,
        path:      f.path,
        filename:  f.name,
        isDefault: false,
      }))
      setLoghi([LOGO_DEFAULT, ...imgs])
    } catch (e) {
      console.error('fetchLoghi:', e)
      setLoghi([LOGO_DEFAULT])
    }
    setLoading(false)
  }

  /* ── Upload ── */
  async function handleUpload(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) { setUploadErr('Solo immagini (PNG, JPG, SVG, WebP)'); return }
    if (file.size > 2 * 1024 * 1024)    { setUploadErr('File troppo grande (max 2MB)'); return }

    setUploading(true); setUploadErr(''); setUploadOk('')
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader()
        r.onload = () => res(r.result.split(',')[1])
        r.onerror = rej
        r.readAsDataURL(file)
      })
      const { data: { session } } = await supabase.auth.getSession()
      const jwt = session?.access_token
      if (!jwt) throw new Error('Non autenticato')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-upload-logo`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, base64 }),
        }
      )
      const result = await res.json()
      if (!res.ok || result.error) throw new Error(result.error || 'Errore upload')
      setUploadOk(`Logo caricato: ${result.filename}`)
      // Attende che GitHub indicizzi il file prima di ricaricare la lista
      await new Promise(r => setTimeout(r, 1500))
      await fetchLoghi()
      onChange(result.url)
    } catch (e) {
      setUploadErr(e.message || 'Errore durante il caricamento')
    }
    setUploading(false)
  }

  /* ── Toggle selezione ── */
  function toggleSel(path) {
    setSelezionati(prev => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }

  function selTutti() {
    const eliminabili = loghi.filter(l => !l.isDefault).map(l => l.path)
    setSelezionati(new Set(eliminabili))
  }

  function deselTutti() { setSelezionati(new Set()) }

  /* ── Elimina selezionati ── */
  async function eliminaSelezionati() {
    if (selezionati.size === 0) return
    if (!confirm(`Eliminare ${selezionati.size} logo${selezionati.size > 1 ? 'i' : ''}? L'operazione è irreversibile.`)) return

    setDeleting(true); setDeleteErr('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const jwt = session?.access_token
      if (!jwt) throw new Error('Non autenticato')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-delete-logo`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ paths: Array.from(selezionati) }),
        }
      )
      const result = await res.json()
      if (!res.ok || result.error) throw new Error(result.error || 'Errore eliminazione')

      // Se il logo eliminato era quello selezionato, ripristina default
      const pathEliminate = Array.from(selezionati)
      const logoEliminato = loghi.find(l => pathEliminate.includes(l.path) && sameUrl(l.url, value))
      if (logoEliminato) onChange(null)

      setSelezionati(new Set())
      setDeleteMode(false)
      await new Promise(r => setTimeout(r, 1500))
      await fetchLoghi()
    } catch (e) {
      setDeleteErr(e.message || 'Errore durante l\'eliminazione')
    }
    setDeleting(false)
  }

  const selected      = value || LOGO_DEFAULT.url
  // Confronto URL: ignora il cache-buster ?v=...
  function sameUrl(a, b) {
    return (a || '').split('?')[0] === (b || '').split('?')[0]
  }
  const eliminabili   = loghi.filter(l => !l.isDefault)
  const tuttiSelezionati = eliminabili.length > 0 && eliminabili.every(l => selezionati.has(l.path))

  return (
    <div>
      {/* Logo attuale */}
      <div style={{ display:'flex', alignItems:'center', gap:'16px', padding:'12px 14px', background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'10px', marginBottom:'16px' }}>
        <div style={{ width:'120px', height:'52px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', borderRadius:'6px', border:'1px solid #E5E7EB', padding:'6px' }}>
          <img src={selected} alt="Logo selezionato" style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain' }} onError={e => { e.target.style.display='none' }} />
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:'12px', fontWeight:'700', color:'#6B7280', margin:'0 0 2px', textTransform:'uppercase', letterSpacing:'.05em' }}>Logo selezionato</p>
          <p style={{ fontSize:'13px', color:'#0A0A0A', margin:0, wordBreak:'break-all' }}>
            {selected === LOGO_DEFAULT.url ? 'CNA Roma (default)' : selected.split('/').pop()}
          </p>
          {value && value !== LOGO_DEFAULT.url && (
            <button onClick={() => onChange(null)} style={{ marginTop:'4px', fontSize:'11px', color:'#DC2626', background:'none', border:'none', cursor:'pointer', padding:0, fontWeight:'600' }}>
              × Ripristina default
            </button>
          )}
        </div>
      </div>

      {/* Intestazione galleria */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
        <p style={{ fontSize:'12px', fontWeight:'700', color:'#374151', margin:0, textTransform:'uppercase', letterSpacing:'.05em' }}>
          Scegli un logo
        </p>
        <div style={{ display:'flex', gap:'6px' }}>
          {deleteMode ? (
            <>
              {/* Seleziona/deseleziona tutti */}
              <button
                onClick={tuttiSelezionati ? deselTutti : selTutti}
                style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:'700', color:'#374151', background:'#F3F4F6', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'5px 10px', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}
              >
                {tuttiSelezionati ? <CheckSquare size={13}/> : <Square size={13}/>}
                {tuttiSelezionati ? 'Deseleziona tutti' : 'Seleziona tutti'}
              </button>
              {/* Elimina selezionati */}
              <button
                onClick={eliminaSelezionati}
                disabled={selezionati.size === 0 || deleting}
                style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:'700', color:'#fff', background: selezionati.size === 0 ? '#D1D5DB' : '#DC2626', border:'none', borderRadius:'6px', padding:'5px 10px', cursor: selezionati.size === 0 ? 'not-allowed' : 'pointer', fontFamily:"'Inter',sans-serif" }}
              >
                {deleting ? <Loader2 size={12} style={{ animation:'spin .7s linear infinite' }}/> : <Trash2 size={12}/>}
                {deleting ? 'Eliminazione…' : `Elimina${selezionati.size > 0 ? ` (${selezionati.size})` : ''}`}
              </button>
              {/* Annulla */}
              <button
                onClick={() => { setDeleteMode(false); setSelezionati(new Set()); setDeleteErr('') }}
                style={{ fontSize:'11px', fontWeight:'700', color:'#6B7280', background:'#fff', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'5px 10px', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}
              >
                Annulla
              </button>
            </>
          ) : (
            eliminabili.length > 0 && (
              <button
                onClick={() => setDeleteMode(true)}
                style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:'700', color:'#DC2626', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'6px', padding:'5px 10px', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}
              >
                <Trash2 size={12}/> Gestisci
              </button>
            )
          )}
        </div>
      </div>

      {deleteErr && (
        <p style={{ fontSize:'12px', color:'#DC2626', marginBottom:'8px', display:'flex', alignItems:'center', gap:'5px' }}>
          <X size={13}/> {deleteErr}
        </p>
      )}

      {/* Galleria */}
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'16px 0', color:'#9CA3AF', fontSize:'13px' }}>
          <Loader2 size={16} style={{ animation:'spin .8s linear infinite' }}/> Caricamento loghi…
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:'8px', marginBottom:'16px' }}>
          {loghi.map(logo => {
            const isSelected  = sameUrl(selected, logo.url)
            const isChecked   = selezionati.has(logo.path)
            const showCheck   = deleteMode && !logo.isDefault

            return (
              <button
                key={logo.url}
                onClick={() => {
                  if (deleteMode && !logo.isDefault) { toggleSel(logo.path); return }
                  if (!deleteMode) onChange(logo.isDefault ? null : logo.url)
                }}
                title={logo.name}
                style={{
                  position: 'relative',
                  border: `2px solid ${deleteMode && isChecked ? '#DC2626' : isSelected && !deleteMode ? '#003DA5' : '#E5E7EB'}`,
                  borderRadius: '10px',
                  background: deleteMode && isChecked ? '#FEF2F2' : '#fff',
                  padding: '10px 8px',
                  cursor: logo.isDefault && deleteMode ? 'default' : 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                  transition: 'border-color .15s, box-shadow .15s, background .15s',
                  boxShadow: isSelected && !deleteMode ? '0 0 0 3px rgba(0,61,165,.15)' : 'none',
                  opacity: logo.isDefault && deleteMode ? 0.5 : 1,
                }}
              >
                {/* Badge selezione (delete mode) */}
                {showCheck && (
                  <div style={{
                    position:'absolute', top:'4px', left:'4px',
                    width:'18px', height:'18px', borderRadius:'4px',
                    background: isChecked ? '#DC2626' : '#fff',
                    border: `2px solid ${isChecked ? '#DC2626' : '#D1D5DB'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    {isChecked && <Check size={11} color="#fff" strokeWidth={3}/>}
                  </div>
                )}

                {/* Badge selezionato come logo evento (non in delete mode) */}
                {isSelected && !deleteMode && (
                  <div style={{ position:'absolute', top:'4px', right:'4px', width:'18px', height:'18px', borderRadius:'50%', background:'#003DA5', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Check size={11} color="#fff" strokeWidth={3}/>
                  </div>
                )}

                <div style={{ width:'100%', height:'44px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <img
                    src={logo.url} alt={logo.name}
                    style={{ maxWidth:'100%', maxHeight:'44px', objectFit:'contain' }}
                    onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}
                  />
                  <div style={{ display:'none', alignItems:'center', justifyContent:'center', color:'#D1D5DB' }}>
                    <ImageOff size={20}/>
                  </div>
                </div>

                <span style={{
                  fontSize:'10px', color: isChecked ? '#DC2626' : isSelected && !deleteMode ? '#003DA5' : '#6B7280',
                  fontWeight: isChecked || (isSelected && !deleteMode) ? '700' : '500',
                  textAlign:'center', lineHeight:'1.3',
                  overflow:'hidden', textOverflow:'ellipsis',
                  display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', width:'100%',
                }}>
                  {logo.name}
                  {logo.isDefault && <span style={{ display:'block', color:'#9CA3AF', fontSize:'9px' }}>default</span>}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Upload */}
      <div style={{ border:'1px dashed #D1D5DB', borderRadius:'10px', padding:'14px 16px', background:'#FAFAFA' }}>
        <p style={{ fontSize:'12px', fontWeight:'700', color:'#374151', margin:'0 0 8px', textTransform:'uppercase', letterSpacing:'.05em' }}>Carica nuovo logo</p>
        <p style={{ fontSize:'12px', color:'#9CA3AF', margin:'0 0 10px' }}>PNG, JPG, SVG o WebP · max 2MB</p>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style={{ display:'none' }} onChange={e => handleUpload(e.target.files[0])}/>
        <button
          onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{ display:'flex', alignItems:'center', gap:'8px', background: uploading ? '#E5E7EB' : '#003DA5', color:'#fff', border:'none', borderRadius:'8px', padding:'9px 16px', fontSize:'13px', fontWeight:'700', fontFamily:"'Inter',sans-serif", cursor: uploading ? 'not-allowed' : 'pointer' }}
        >
          {uploading ? <><Loader2 size={15} style={{ animation:'spin .8s linear infinite' }}/> Caricamento…</> : <><Upload size={15}/> Scegli file</>}
        </button>
        {uploadErr && <p style={{ fontSize:'12px', color:'#DC2626', margin:'8px 0 0', display:'flex', alignItems:'center', gap:'5px' }}><X size={13}/> {uploadErr}</p>}
        {uploadOk  && <p style={{ fontSize:'12px', color:'#16A34A', margin:'8px 0 0', display:'flex', alignItems:'center', gap:'5px' }}><Check size={13}/> {uploadOk}</p>}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
