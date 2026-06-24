import { useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

const EDGE_URL = 'https://hnkhckcclgabunkqfmrz.supabase.co/functions/v1/image-search'

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation: 'spin .7s linear infinite' }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  )
}

export default function ImageUploader({ value, onChange }) {
  const ref = useRef()

  // Upload
  const [uploading,  setUploading]  = useState(false)
  const [dragOver,   setDragOver]   = useState(false)

  // AI Search
  const [prompt,     setPrompt]     = useState('')
  const [searching,  setSearching]  = useState(false)
  const [images,     setImages]     = useState([])  // [{url, thumb, source, author}]
  const [hasMore,    setHasMore]    = useState(false)
  const [page,       setPage]       = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error,      setError]      = useState('')
  const [applying,   setApplying]   = useState(null) // url che sta caricando

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    setUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `hero/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('eventi-immagini').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('eventi-immagini').getPublicUrl(path)
      onChange(data.publicUrl)
    }
    setUploading(false)
  }

  async function translatePrompt(text) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 60,
          messages: [{ role: 'user', content: `Translate to English for stock photo search. Return ONLY 3-5 English keywords separated by space, no punctuation, no extra text: "${text}"` }]
        })
      })
      const d = await res.json()
      const t = d.content?.[0]?.text?.trim().replace(/[^a-zA-Z0-9 ]/g, '').trim()
      return (t && t.length > 2) ? t : text
    } catch { return text }
  }

  async function search(resetPage = true) {
    if (!prompt.trim()) return
    if (resetPage) {
      setSearching(true)
      setImages([])
      setPage(1)
    } else {
      setLoadingMore(true)
    }
    setError('')

    const currentPage = resetPage ? 1 : page + 1

    try {
      const keywords = await translatePrompt(prompt)
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: keywords, page: currentPage })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.error === 'no_results'
          ? `Nessuna foto trovata per "${prompt}". Prova parole chiave diverse.`
          : 'Errore nel servizio. Riprova.')
        return
      }

      const data = await res.json()
      if (resetPage) {
        setImages(data.images || [])
      } else {
        setImages(prev => [...prev, ...(data.images || [])])
      }
      setHasMore(data.hasMore || false)
      setPage(currentPage)
    } catch {
      setError('Errore di connessione. Riprova.')
    } finally {
      setSearching(false)
      setLoadingMore(false)
    }
  }

  async function applyImage(imgUrl) {
    setApplying(imgUrl)
    try {
      const res = await fetch(imgUrl)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const ext = blob.type.includes('png') ? 'png' : 'jpg'
      const file = new File([blob], `ai-hero.${ext}`, { type: blob.type })
      await handleFile(file)
    } catch {
      // Se il download fallisce (es. redirect Unsplash), usa direttamente l'URL
      onChange(imgUrl)
    }
    setApplying(null)
    setImages([]) // chiude la gallery dopo la selezione
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

      {/* Preview o dropzone */}
      {value ? (
        <div style={{ position:'relative', borderRadius:'10px', overflow:'hidden', border:'1px solid #E5E7EB' }}>
          <img src={value} alt="hero" style={{ width:'100%', height:'220px', objectFit:'cover', display:'block' }} />
          <button onClick={() => onChange(null)} style={{
            position:'absolute', top:'10px', right:'10px',
            background:'rgba(0,0,0,.65)', color:'#fff', border:'none',
            borderRadius:'6px', padding:'6px 8px', cursor:'pointer',
            display:'flex', alignItems:'center', gap:'4px', fontSize:'12px'
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            Rimuovi
          </button>
          <button onClick={() => { setImages([]); setPrompt('') }} style={{
            position:'absolute', top:'10px', left:'10px',
            background:'rgba(0,0,0,.65)', color:'#fff', border:'none',
            borderRadius:'6px', padding:'6px 8px', cursor:'pointer',
            display:'flex', alignItems:'center', gap:'4px', fontSize:'12px'
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Cambia
          </button>
        </div>
      ) : (
        <div
          onClick={() => ref.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
          style={{
            border: `2px dashed ${dragOver ? '#003DA5' : '#D1D5DB'}`,
            background: dragOver ? '#EEF3FF' : '#FAFAFA',
            borderRadius:'10px', padding:'32px 24px', textAlign:'center',
            cursor:'pointer', transition:'all .15s',
            display:'flex', flexDirection:'column', alignItems:'center',
          }}
        >
          {uploading ? (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', color:'#6B7280' }}>
              <Spinner />
              <span style={{ fontSize:'14px' }}>Caricamento…</span>
            </div>
          ) : (
            <>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" style={{ marginBottom:'10px' }}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <p style={{ fontSize:'14px', color:'#6B7280', margin:0 }}>
                Trascina qui oppure <span style={{ color:'#003DA5', fontWeight:'600' }}>sfoglia</span>
              </p>
              <p style={{ fontSize:'12px', color:'#9CA3AF', margin:'4px 0 0' }}>JPG, PNG, WebP · consigliato 1600×900px</p>
            </>
          )}
        </div>
      )}

      <input ref={ref} type="file" accept="image/*" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />

      {/* Ricerca AI */}
      <div style={{ background:'#F8F4FF', border:'1px solid #E9D5FF', borderRadius:'10px', padding:'14px 16px' }}>
        <p style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', fontWeight:'700', color:'#7C3AED', margin:'0 0 6px', textTransform:'uppercase', letterSpacing:'.04em' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          Cerca con AI
        </p>
        <p style={{ fontSize:'12px', color:'#7C3AED', margin:'0 0 10px', lineHeight:'1.5' }}>
          Descrivi la foto in italiano — l'AI cerca tra migliaia di immagini professionali.
        </p>
        <div style={{ display:'flex', gap:'8px' }}>
          <input
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="es. artigiani al lavoro, convegno Roma, sala conferenze moderna"
            style={{
              flex:1, padding:'10px 14px', border:'1px solid #D8B4FE',
              borderRadius:'8px', fontSize:'14px', fontFamily:'Inter,sans-serif',
              outline:'none', background:'#fff'
            }}
          />
          <button
            onClick={() => search()}
            disabled={searching || !prompt.trim()}
            style={{
              padding:'10px 16px', background:'#7C3AED', color:'#fff',
              border:'none', borderRadius:'8px', cursor:'pointer',
              display:'flex', alignItems:'center', gap:'6px',
              fontSize:'13px', fontWeight:'700', fontFamily:'Inter,sans-serif',
              opacity: searching || !prompt.trim() ? .6 : 1,
              whiteSpace:'nowrap'
            }}
          >
            {searching ? <><Spinner /> Ricerca...</> : <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Cerca
            </>}
          </button>
        </div>
        {error && <p style={{ fontSize:'12px', color:'#DC2626', margin:'8px 0 0' }}>{error}</p>}
      </div>

      {/* Gallery risultati */}
      {images.length > 0 && (
        <div style={{ border:'1px solid #E5E7EB', borderRadius:'10px', overflow:'hidden' }}>
          {/* Header gallery */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'#F9FAFB', borderBottom:'1px solid #E5E7EB' }}>
            <span style={{ fontSize:'12px', fontWeight:'700', color:'#374151' }}>
              {images.length} foto trovate — clicca per selezionare
            </span>
            <button onClick={() => setImages([])} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', fontSize:'12px', display:'flex', alignItems:'center', gap:'4px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              Chiudi
            </button>
          </div>

          {/* Grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'2px', background:'#E5E7EB', maxHeight:'480px', overflowY:'auto' }}>
            {images.map((img, i) => (
              <div key={i} onClick={() => applyImage(img.url)} style={{ position:'relative', aspectRatio:'16/9', cursor:'pointer', overflow:'hidden', background:'#F3F4F6' }}>
                <img
                  src={img.thumb}
                  alt=""
                  loading="lazy"
                  style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform .2s' }}
                  onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                />
                {/* Overlay al hover */}
                <div style={{
                  position:'absolute', inset:0, background:'rgba(0,0,0,0)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'background .15s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.35)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
                >
                  {applying === img.url ? (
                    <div style={{ color:'#fff' }}><Spinner /></div>
                  ) : null}
                </div>
                {/* Badge source */}
                <span style={{
                  position:'absolute', bottom:'4px', right:'4px',
                  background:'rgba(0,0,0,.6)', color:'#fff',
                  fontSize:'9px', padding:'2px 5px', borderRadius:'3px', fontWeight:'600'
                }}>{img.source}</span>
              </div>
            ))}
          </div>

          {/* Carica altro */}
          {hasMore && (
            <div style={{ padding:'12px', textAlign:'center', borderTop:'1px solid #E5E7EB' }}>
              <button onClick={() => search(false)} disabled={loadingMore} style={{
                background:'none', border:'1px solid #D8B4FE', borderRadius:'8px',
                padding:'8px 20px', cursor:'pointer', fontSize:'13px', fontWeight:'600',
                color:'#7C3AED', fontFamily:'Inter,sans-serif',
                display:'inline-flex', alignItems:'center', gap:'6px',
                opacity: loadingMore ? .6 : 1
              }}>
                {loadingMore ? <><Spinner /> Caricamento...</> : 'Carica altre foto'}
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </div>
  )
}
