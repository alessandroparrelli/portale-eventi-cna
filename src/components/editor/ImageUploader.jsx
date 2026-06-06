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
      // Step 1: Claude traduce il prompt in inglese per la ricerca
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
              content: `Translate to English for stock photo search. Return ONLY 2-4 English keywords separated by space, no punctuation, no other text: "${genPrompt}"`
            }]
          })
        })
        const aiData = await aiRes.json()
        const translated = aiData.content?.[0]?.text?.trim().replace(/[^a-zA-Z0-9 ]/g, '').trim()
        if (translated && translated.length > 2) keywords = translated
      } catch {}

      let blob = null

      // Tentativo 1: Google Imagen via Gemini API (se chiave configurata)
      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (geminiKey) {
        try {
          const imagenRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                instances: [{ prompt: `Professional event photography: ${keywords}, high quality, realistic, 16:9 ratio` }],
                parameters: { sampleCount: 1, aspectRatio: '16:9', safetyFilterLevel: 'block_few' }
              })
            }
          )
          if (imagenRes.ok) {
            const imagenData = await imagenRes.json()
            const b64 = imagenData?.predictions?.[0]?.bytesBase64Encoded
            if (b64) {
              const byteChars = atob(b64)
              const byteArr = new Uint8Array(byteChars.length)
              for (let i=0; i<byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i)
              blob = new Blob([byteArr], { type: 'image/png' })
            }
          }
        } catch {}
      }

      // Tentativo 2: Pexels API — foto stock pertinenti e gratuite
      const pexelsKey = import.meta.env.VITE_PEXELS_API_KEY || 'BrUJuAX6T1z1vI2AYI9GMGFdlCnIHFKFIMKZO5i0KGFF3z0UgFXPnFp2'
      if (!blob) {
        try {
          const q = encodeURIComponent(keywords)
          const pexRes = await fetch(
            `https://api.pexels.com/v1/search?query=${q}&per_page=1&orientation=landscape`,
            { headers: { Authorization: pexelsKey } }
          )
          if (pexRes.ok) {
            const pexData = await pexRes.json()
            const photoUrl = pexData?.photos?.[0]?.src?.large2x || pexData?.photos?.[0]?.src?.large
            if (photoUrl) {
              const imgRes = await fetch(photoUrl)
              if (imgRes.ok) blob = await imgRes.blob()
            }
          }
        } catch {}
      }

      // Tentativo 3: Pixabay — altra fonte stock pertinente
      if (!blob) {
        try {
          const q = encodeURIComponent(keywords)
          const pixRes = await fetch(
            `https://pixabay.com/api/?key=49103248-bd6a7d2a8b3e4e1b7f8c3b2a4&q=${q}&image_type=photo&orientation=horizontal&per_page=3&safesearch=true`
          )
          if (pixRes.ok) {
            const pixData = await pixRes.json()
            const photoUrl = pixData?.hits?.[0]?.largeImageURL || pixData?.hits?.[0]?.webformatURL
            if (photoUrl) {
              const imgRes = await fetch(photoUrl)
              if (imgRes.ok) blob = await imgRes.blob()
            }
          }
        } catch {}
      }

      if (blob) {
        const ext = blob.type === 'image/png' ? 'png' : 'jpg'
        const file = new File([blob], `ai-hero.${ext}`, { type: blob.type })
        await handleFile(file)
      } else {
        setGenError('Nessuna immagine trovata. Prova parole chiave diverse o carica manualmente.')
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
          Descrivi in italiano — usa <strong>Google Imagen</strong> (se configurato) oppure cerca su Pexels/Pixabay.
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
