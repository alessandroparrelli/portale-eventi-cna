import { useEffect, useRef, useState } from 'react'
import { supabase, getFreshJwt } from '../../lib/supabase'
import { Upload, Check, X, Loader2, ImageOff, Trash2, CheckSquare, Square } from 'lucide-react'

const LOGO_DEFAULT = {
  name: 'CNA Roma (default)',
  url:  'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png',
  isDefault: true,
}

/**
 * LogoManager – galleria + upload per una singola cartella GitHub.
 * Props:
 *   value      – URL attualmente selezionato
 *   onChange   – (url | null) => void
 *   folder     – 'loghi' (default) | 'certificati-immagini'
 *   showDefault – mostra il logo CNA default (true per loghi, false per immagini libere)
 *   heading    – intestazione sezione galleria
 *   uploadHeading – intestazione sezione upload
 *   compact    – se true mostra solo la galleria senza il box "logo corrente"
 */
export default function LogoManager({
  value, onChange,
  folder = 'loghi',
  showDefault = true,
  heading = 'Scegli un logo',
  uploadHeading = 'Carica nuovo logo',
  compact = false,
}) {
  const initialList = folder === 'loghi' && showDefault ? [LOGO_DEFAULT] : []
  const [loghi,       setLoghi]       = useState(initialList)
  const [loading,     setLoading]     = useState(true)
  const [uploading,   setUploading]   = useState(false)
  const [uploadErr,   setUploadErr]   = useState('')
  const [uploadOk,    setUploadOk]    = useState('')
  const [deleteMode,  setDeleteMode]  = useState(false)
  const [selezionati, setSelezionati] = useState(new Set())
  const [deleting,    setDeleting]    = useState(false)
  const [deleteErr,   setDeleteErr]   = useState('')
  const fileRef = useRef()

  useEffect(() => { fetchLoghi() }, [folder])

  async function fetchLoghi() {
    setLoading(true)
    try {
      const jwt = await getFreshJwt()
      if (!jwt) throw new Error('Non autenticato')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-list-loghi?folder=${folder}`,
        { headers: { 'Authorization': `Bearer ${jwt}` } }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!data.ok || !Array.isArray(data.files)) throw new Error(data.error || 'Errore lista')

      const ts = Date.now()
      const imgs = data.files.map(f => ({
        name:      f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        url:       f.url + `?v=${ts}`,
        sha:       f.sha,
        path:      f.path,
        filename:  f.name,
        isDefault: false,
      }))
      const base = folder === 'loghi' && showDefault ? [LOGO_DEFAULT] : []
      setLoghi([...base, ...imgs])
    } catch (e) {
      console.error('fetchLoghi:', e)
      const base = folder === 'loghi' && showDefault ? [LOGO_DEFAULT] : []
      setLoghi(base)
    }
    setLoading(false)
  }

  async function handleUpload(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) { setUploadErr('Solo immagini (PNG, JPG, SVG, WebP)'); return }
    if (file.size > 2 * 1024 * 1024) { setUploadErr('File troppo grande (max 2MB)'); return }

    setUploading(true); setUploadErr(''); setUploadOk('')
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-upload-logo`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, base64, folder }),
        }
      )
      const result = await res.json()
      if (!res.ok || result.error) throw new Error(result.error || 'Errore upload')
      setUploadOk(`Caricato: ${result.filename}`)
      await new Promise(r => setTimeout(r, 1000))
      await fetchLoghi()
      onChange(result.url)
    } catch (e) {
      setUploadErr(e.message || 'Errore durante il caricamento')
    }
    setUploading(false)
  }

  function toggleSel(path) {
    setSelezionati(prev => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }
  function selTutti() { setSelezionati(new Set(loghi.filter(l => !l.isDefault).map(l => l.path))) }
  function deselTutti() { setSelezionati(new Set()) }

  async function eliminaSelezionati() {
    if (selezionati.size === 0) return
    if (!confirm(`Eliminare ${selezionati.size} immagine${selezionati.size > 1 ? 'i' : ''}? Irreversibile.`)) return
    setDeleting(true); setDeleteErr('')
    try {
      const jwt = await getFreshJwt()
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
      const pathEliminate = Array.from(selezionati)
      const logoEliminato = loghi.find(l => pathEliminate.includes(l.path) && sameUrl(l.url, value))
      if (logoEliminato) onChange(null)
      setSelezionati(new Set()); setDeleteMode(false)
      await new Promise(r => setTimeout(r, 1000))
      await fetchLoghi()
    } catch (e) {
      setDeleteErr(e.message || 'Errore eliminazione')
    }
    setDeleting(false)
  }

  const selected = value || (folder === 'loghi' && showDefault ? LOGO_DEFAULT.url : '')
  function sameUrl(a, b) { return (a || '').split('?')[0] === (b || '').split('?')[0] }
  const eliminabili = loghi.filter(l => !l.isDefault)
  const tuttiSelezionati = eliminabili.length > 0 && eliminabili.every(l => selezionati.has(l.path))

  return (
    <div>
      {/* Logo/immagine corrente (solo in modalità logo, non compact) */}
      {!compact && folder === 'loghi' && (
        <div style={{ display:'flex', alignItems:'center', gap:'16px', padding:'12px 14px', background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'10px', marginBottom:'16px' }}>
          <div style={{ width:'120px', height:'52px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', borderRadius:'6px', border:'1px solid #E5E7EB', padding:'6px' }}>
            <img src={selected} alt="Logo selezionato" style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain' }} onError={e => { e.target.style.display='none' }} />
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:'12px', fontWeight:'700', color:'#6B7280', margin:'0 0 2px', textTransform:'uppercase', letterSpacing:'.05em' }}>Logo selezionato</p>
            <p style={{ fontSize:'13px', color:'#0A0A0A', margin:0, wordBreak:'break-all' }}>
              {sameUrl(selected, LOGO_DEFAULT.url) ? 'CNA Roma (default)' : selected.split('/').pop()?.split('?')[0] || '—'}
            </p>
            {value && !sameUrl(value, LOGO_DEFAULT.url) && (
              <button onClick={() => onChange(null)} style={{ marginTop:'4px', fontSize:'11px', color:'#DC2626', background:'none', border:'none', cursor:'pointer', padding:0, fontWeight:'600' }}>
                × Ripristina default
              </button>
            )}
          </div>
        </div>
      )}

      {/* Intestazione galleria + azioni gestione */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
        <p style={{ fontSize:'12px', fontWeight:'700', color:'#374151', margin:0, textTransform:'uppercase', letterSpacing:'.05em' }}>
          {heading}
        </p>
        <div style={{ display:'flex', gap:'6px' }}>
          {deleteMode ? (
            <>
              <button onClick={tuttiSelezionati ? deselTutti : selTutti}
                style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:'700', color:'#374151', background:'#F3F4F6', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'5px 10px', cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                {tuttiSelezionati ? <CheckSquare size={13}/> : <Square size={13}/>}
                {tuttiSelezionati ? 'Deseleziona tutti' : 'Seleziona tutti'}
              </button>
              <button onClick={eliminaSelezionati} disabled={selezionati.size === 0 || deleting}
                style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:'700', color:'#fff', background: selezionati.size === 0 ? '#D1D5DB' : '#DC2626', border:'none', borderRadius:'6px', padding:'5px 10px', cursor: selezionati.size === 0 ? 'not-allowed' : 'pointer', fontFamily:"'Outfit',sans-serif" }}>
                {deleting ? <Loader2 size={12} style={{ animation:'spin .7s linear infinite' }}/> : <Trash2 size={12}/>}
                {deleting ? 'Eliminazione…' : `Elimina${selezionati.size > 0 ? ` (${selezionati.size})` : ''}`}
              </button>
              <button onClick={() => { setDeleteMode(false); setSelezionati(new Set()); setDeleteErr('') }}
                style={{ fontSize:'11px', fontWeight:'700', color:'#6B7280', background:'#fff', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'5px 10px', cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                Annulla
              </button>
            </>
          ) : (
            eliminabili.length > 0 && (
              <button onClick={() => setDeleteMode(true)}
                style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:'700', color:'#DC2626', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'6px', padding:'5px 10px', cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                <Trash2 size={12}/> Gestisci
              </button>
            )
          )}
        </div>
      </div>

      {deleteErr && <p style={{ fontSize:'12px', color:'#DC2626', marginBottom:'8px' }}>{deleteErr}</p>}

      {/* Galleria */}
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'16px 0', color:'#9CA3AF', fontSize:'13px' }}>
          <Loader2 size={16} style={{ animation:'spin .8s linear infinite' }}/> Caricamento…
        </div>
      ) : loghi.length === 0 ? (
        <div style={{ padding:'20px', textAlign:'center', color:'#9CA3AF', fontSize:'12px', border:'1px dashed #E5E7EB', borderRadius:'8px', marginBottom:'12px' }}>
          Nessuna immagine ancora caricata in questa galleria
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(110px, 1fr))', gap:'8px', marginBottom:'14px' }}>
          {loghi.map(logo => {
            const isSelected = sameUrl(selected, logo.url)
            const isChecked  = selezionati.has(logo.path)
            const showCheck  = deleteMode && !logo.isDefault
            return (
              <button key={logo.url} onClick={() => {
                  if (deleteMode && !logo.isDefault) { toggleSel(logo.path); return }
                  if (!deleteMode) onChange(logo.isDefault ? null : logo.url)
                }} title={logo.name}
                style={{ position:'relative', border:`2px solid ${deleteMode && isChecked ? '#DC2626' : isSelected && !deleteMode ? '#E11D48' : '#E5E7EB'}`,
                  borderRadius:'10px', background: deleteMode && isChecked ? '#FEF2F2' : '#fff', padding:'10px 8px', cursor: logo.isDefault && deleteMode ? 'default' : 'pointer',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:'6px',
                  boxShadow: isSelected && !deleteMode ? '0 0 0 3px rgba(0,61,165,.15)' : 'none', opacity: logo.isDefault && deleteMode ? 0.5 : 1 }}>
                {showCheck && (
                  <div style={{ position:'absolute', top:'4px', left:'4px', width:'18px', height:'18px', borderRadius:'4px',
                    background: isChecked ? '#DC2626' : '#fff', border:`2px solid ${isChecked ? '#DC2626' : '#D1D5DB'}`,
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {isChecked && <Check size={11} color="#fff" strokeWidth={3}/>}
                  </div>
                )}
                {isSelected && !deleteMode && (
                  <div style={{ position:'absolute', top:'4px', right:'4px', width:'18px', height:'18px', borderRadius:'50%', background:'#E11D48', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Check size={11} color="#fff" strokeWidth={3}/>
                  </div>
                )}
                <div style={{ width:'100%', height:'44px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <img src={logo.url} alt={logo.name} style={{ maxWidth:'100%', maxHeight:'44px', objectFit:'contain' }}
                    onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}/>
                  <div style={{ display:'none', alignItems:'center', justifyContent:'center', color:'#D1D5DB' }}>
                    <ImageOff size={20}/>
                  </div>
                </div>
                <span style={{ fontSize:'10px', color: isChecked ? '#DC2626' : isSelected && !deleteMode ? '#E11D48' : '#6B7280',
                  fontWeight: isChecked || (isSelected && !deleteMode) ? '700' : '500', textAlign:'center', lineHeight:'1.3',
                  overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', width:'100%' }}>
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
        <p style={{ fontSize:'12px', fontWeight:'700', color:'#374151', margin:'0 0 6px', textTransform:'uppercase', letterSpacing:'.05em' }}>{uploadHeading}</p>
        <p style={{ fontSize:'12px', color:'#9CA3AF', margin:'0 0 10px' }}>PNG, JPG, SVG o WebP · max 2MB</p>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style={{ display:'none' }}
          onChange={e => { handleUpload(e.target.files[0]); e.target.value = '' }}/>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{ display:'flex', alignItems:'center', gap:'8px', background: uploading ? '#E5E7EB' : '#E11D48', color:'#fff', border:'none', borderRadius:'8px', padding:'9px 16px', fontSize:'13px', fontWeight:'700', fontFamily:"'Outfit',sans-serif", cursor: uploading ? 'not-allowed' : 'pointer' }}>
          {uploading ? <><Loader2 size={15} style={{ animation:'spin .8s linear infinite' }}/> Caricamento…</> : <><Upload size={15}/> Scegli file</>}
        </button>
        {uploadErr && <p style={{ fontSize:'12px', color:'#DC2626', margin:'8px 0 0' }}>{uploadErr}</p>}
        {uploadOk  && <p style={{ fontSize:'12px', color:'#16A34A', margin:'8px 0 0' }}>{uploadOk}</p>}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
