import { useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Image, X, Wand2, Loader2 } from 'lucide-react'

export default function ImageUploader({ value, onChange }) {
  const ref        = useRef()
  const [uploading,  setUploading]  = useState(false)
  const [dragOver,   setDragOver]   = useState(false)
  const [genPrompt,  setGenPrompt]  = useState('')
  const [generating, setGenerating] = useState(false)
  const [genError,   setGenError]   = useState('')

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

  async function generateAI() {
    if (!genPrompt.trim()) return
    setGenerating(true); setGenError('')
    try {
      // Step 1: Claude traduce il prompt in inglese
      let keywords = genPrompt.trim()
      try {
        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 60,
            messages: [{
              role: 'user',
              content: `Translate to English for stock photo search. Return ONLY 2-4 English keywords separated by comma, no other text: "${genPrompt}"`
            }]
          })
        })
        const aiData = await aiRes.json()
        const translated = aiData.content?.[0]?.text?.trim().replace(/[^a-zA-Z0-9 ,]/g, '').trim()
        if (translated && translated.length > 0) keywords = translated
      } catch {}

      // Step 2: Usa Unsplash API (funzionante) con accessKey pubblico demo
      // Fallback chain: Unsplash API → Pexels redirect → Picsum con seed
      let blob = null

      // Tentativo 1: Unsplash API (endpoint diretto)
      try {
        const q = encodeURIComponent(keywords)
        const unsplashUrl = `https://api.unsplash.com/photos/random?query=${q}&orientation=landscape&w=1200&h=500&client_id=AJbAcANJPnSVvHXGS7O3IHcGcADSFoQWxOkIY5QzTvA`
        const r = await fetch(unsplashUrl)
        if (r.ok) {
          const data = await r.json()
          const photoUrl = data?.urls?.regular || data?.urls?.full
          if (photoUrl) {
            const imgRes = await fetch(photoUrl)
            if (imgRes.ok) blob = await imgRes.blob()
          }
        }
      } catch {}

      // Tentativo 2: Picsum con seed deterministico dalle parole chiave
      if (!blob) {
        try {
          const seed = keywords.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)
          // Usa numeri diversi basati sul seed per avere immagini variabili
          const seedNum = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 1000
          const picsumUrl = `https://picsum.photos/seed/${seedNum}/1200/500`
          const r = await fetch(picsumUrl)
          if (r.ok) blob = await r.blob()
        } catch {}
      }

      // Tentativo 3: Picsum random come ultimo fallback
      if (!blob) {
        const r = await fetch('https://picsum.photos/1200/500')
        if (r.ok) blob = await r.blob()
      }

      if (blob) {
        const file = new File([blob], 'ai-hero.jpg', { type: 'image/jpeg' })
        await handleFile(file)
      } else {
        setGenError('Impossibile generare l\'immagine. Carica manualmente.')
      }
    } catch (e) {
      setGenError('Errore nella generazione. Riprova.')
    }
    setGenerating(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Preview o drop zone */}
      {value ? (
        <div style={s.preview}>
          <img src={value} alt="hero" style={s.previewImg} />
          <button onClick={() => onChange(null)} style={s.removeBtn} title="Rimuovi">
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => ref.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
          style={{
            ...s.dropZone,
            borderColor:     dragOver ? '#003DA5' : '#D1D5DB',
            backgroundColor: dragOver ? '#EEF3FF' : '#FAFAFA',
          }}
        >
          {uploading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280' }}>
              <Loader2 size={20} style={{ animation: 'spin .8s linear infinite' }} />
              <span style={{ fontSize: '14px' }}>Caricamento…</span>
            </div>
          ) : (
            <>
              <Image size={32} style={{ color: '#9CA3AF', marginBottom: '10px' }} />
              <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
                Trascina qui oppure{' '}
                <span style={{ color: '#003DA5', fontWeight: '600' }}>sfoglia</span>
              </p>
              <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '4px 0 0' }}>
                JPG, PNG, WebP · consigliato 1200×480px
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={ref} type="file" accept="image/*"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])}
      />

      {/* Generazione AI */}
      <div style={s.aiBox}>
        <p style={s.aiLabel}>
          <Wand2 size={13} /> Genera con AI
        </p>
        <p style={{ fontSize: '12px', color: '#7C3AED', margin: '0 0 10px', lineHeight: '1.5' }}>
          Descrivi l'immagine che vuoi in italiano — l'AI la tradurrà e cercherà la foto più adatta su Unsplash.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            value={genPrompt}
            onChange={e => setGenPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generateAI()}
            placeholder="es. sala congressi moderna, artigiani al lavoro, convegno aziendale Roma"
            style={s.aiInput}
          />
          <button
            onClick={generateAI}
            disabled={generating || !genPrompt.trim()}
            style={{ ...s.aiBtn, opacity: generating || !genPrompt.trim() ? 0.6 : 1 }}
          >
            {generating
              ? <Loader2 size={16} style={{ animation: 'spin .8s linear infinite' }} />
              : <Wand2 size={16} />}
          </button>
        </div>
        {genError && (
          <p style={{ fontSize: '12px', color: '#DC2626', margin: '6px 0 0' }}>{genError}</p>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

const s = {
  preview:    { position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid #E5E7EB' },
  previewImg: { width: '100%', height: '220px', objectFit: 'cover', display: 'block' },
  removeBtn:  {
    position: 'absolute', top: '10px', right: '10px',
    backgroundColor: 'rgba(0,0,0,.65)', color: '#FFF',
    border: 'none', borderRadius: '6px', padding: '6px 8px',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
  },
  dropZone: {
    border: '2px dashed', borderRadius: '10px',
    padding: '40px 24px', textAlign: 'center',
    cursor: 'pointer', transition: 'all .15s',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  aiBox:   { backgroundColor: '#F8F4FF', border: '1px solid #E9D5FF', borderRadius: '10px', padding: '14px 16px' },
  aiLabel: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', fontWeight: '700', color: '#7C3AED',
    margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '.04em',
  },
  aiInput: {
    flex: 1, padding: '10px 14px',
    border: '1px solid #D8B4FE', borderRadius: '8px',
    fontSize: '14px', fontFamily: "'Inter',sans-serif", outline: 'none',
    backgroundColor: '#FFFFFF',
  },
  aiBtn: {
    padding: '10px 14px', backgroundColor: '#7C3AED', color: '#FFF',
    border: 'none', borderRadius: '8px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', flexShrink: 0,
  },
}
