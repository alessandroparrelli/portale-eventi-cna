import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Upload, Check, X, Loader2, ImageOff } from 'lucide-react'

const GITHUB_OWNER = 'alessandroparrelli'
const GITHUB_REPO  = 'fileappoggio'
const GITHUB_FOLDER = 'loghi'
const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${GITHUB_FOLDER}/`

// Logo default sempre presente
const LOGO_DEFAULT = {
  name: 'CNA Roma (default)',
  url:  'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png',
  isDefault: true,
}

export default function LogoManager({ value, onChange }) {
  const [loghi,       setLoghi]       = useState([LOGO_DEFAULT])
  const [loading,     setLoading]     = useState(true)
  const [uploading,   setUploading]   = useState(false)
  const [uploadErr,   setUploadErr]   = useState('')
  const [uploadOk,    setUploadOk]    = useState('')
  const fileRef = useRef()

  // Carica lista loghi dalla cartella loghi/ del repo
  useEffect(() => {
    fetchLoghi()
  }, [])

  async function fetchLoghi() {
    setLoading(true)
    try {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FOLDER}`,
        { headers: { 'Accept': 'application/vnd.github.v3+json' } }
      )
      if (!res.ok) throw new Error()
      const files = await res.json()
      const imgs = files
        .filter(f => /\.(png|jpg|jpeg|svg|webp)$/i.test(f.name))
        .map(f => ({
          name: f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
          url:  f.download_url,
          sha:  f.sha,
          path: f.path,
          isDefault: false,
        }))
      setLoghi([LOGO_DEFAULT, ...imgs])
    } catch {
      // Se fallisce la GitHub API (rate limit), mostra solo il default
      setLoghi([LOGO_DEFAULT])
    }
    setLoading(false)
  }

  async function handleUpload(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadErr('Solo immagini (PNG, JPG, SVG, WebP)')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadErr('File troppo grande (max 2MB)')
      return
    }

    setUploading(true)
    setUploadErr('')
    setUploadOk('')

    try {
      // Converti file in base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Recupera il JWT dell'utente autenticato
      const { data: { session } } = await supabase.auth.getSession()
      const jwt = session?.access_token
      if (!jwt) throw new Error('Non autenticato')

      // Chiama la Edge Function proxy (il token GitHub è lato server)
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-upload-logo`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filename: file.name, base64 }),
        }
      )

      const result = await res.json()
      if (!res.ok || result.error) throw new Error(result.error || 'Errore upload')

      setUploadOk(`Logo caricato: ${result.filename}`)
      await fetchLoghi()
      onChange(result.url)

    } catch (e) {
      setUploadErr(e.message || 'Errore durante il caricamento')
    }
    setUploading(false)
  }

  const selected = value || LOGO_DEFAULT.url

  return (
    <div>
      {/* Logo attualmente selezionato */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '12px 14px', background: '#F9FAFB',
        border: '1px solid #E5E7EB', borderRadius: '10px', marginBottom: '16px',
      }}>
        <div style={{
          width: '120px', height: '52px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#fff', borderRadius: '6px', border: '1px solid #E5E7EB',
          padding: '6px',
        }}>
          <img
            src={selected}
            alt="Logo selezionato"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            onError={e => { e.target.style.display = 'none' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Logo selezionato</p>
          <p style={{ fontSize: '13px', color: '#0A0A0A', margin: 0, wordBreak: 'break-all' }}>
            {selected === LOGO_DEFAULT.url ? 'CNA Roma (default)' : selected.split('/').pop()}
          </p>
          {value && value !== LOGO_DEFAULT.url && (
            <button
              onClick={() => onChange(null)}
              style={{ marginTop: '4px', fontSize: '11px', color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '600' }}
            >
              × Ripristina default
            </button>
          )}
        </div>
      </div>

      {/* Galleria loghi */}
      <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
        Scegli un logo
      </p>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 0', color: '#9CA3AF', fontSize: '13px' }}>
          <Loader2 size={16} style={{ animation: 'spin .8s linear infinite' }} /> Caricamento loghi…
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '8px', marginBottom: '16px',
        }}>
          {loghi.map(logo => {
            const isSelected = selected === logo.url
            return (
              <button
                key={logo.url}
                onClick={() => onChange(logo.isDefault ? null : logo.url)}
                title={logo.name}
                style={{
                  position: 'relative',
                  border: `2px solid ${isSelected ? '#003DA5' : '#E5E7EB'}`,
                  borderRadius: '10px', background: '#fff',
                  padding: '10px 8px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: '6px',
                  transition: 'border-color .15s, box-shadow .15s',
                  boxShadow: isSelected ? '0 0 0 3px rgba(0,61,165,.15)' : 'none',
                }}
              >
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: '4px', right: '4px',
                    width: '18px', height: '18px', borderRadius: '50%',
                    background: '#003DA5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={11} color="#fff" strokeWidth={3} />
                  </div>
                )}
                <div style={{ width: '100%', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={logo.url}
                    alt={logo.name}
                    style={{ maxWidth: '100%', maxHeight: '44px', objectFit: 'contain' }}
                    onError={e => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                  <div style={{ display: 'none', alignItems: 'center', justifyContent: 'center', color: '#D1D5DB' }}>
                    <ImageOff size={20} />
                  </div>
                </div>
                <span style={{
                  fontSize: '10px', color: isSelected ? '#003DA5' : '#6B7280',
                  fontWeight: isSelected ? '700' : '500',
                  textAlign: 'center', lineHeight: '1.3',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  width: '100%',
                }}>
                  {logo.name}
                  {logo.isDefault && <span style={{ display: 'block', color: '#9CA3AF', fontSize: '9px' }}>default</span>}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Upload nuovo logo */}
      <div style={{
        border: '1px dashed #D1D5DB', borderRadius: '10px',
        padding: '14px 16px', background: '#FAFAFA',
      }}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
          Carica nuovo logo
        </p>
        <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '0 0 10px' }}>
          PNG, JPG, SVG o WebP · max 2MB · viene salvato nel repository e disponibile per tutti gli eventi futuri.
        </p>

        <input
          ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp"
          style={{ display: 'none' }}
          onChange={e => handleUpload(e.target.files[0])}
        />

        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: uploading ? '#E5E7EB' : '#003DA5',
            color: '#fff', border: 'none', borderRadius: '8px',
            padding: '9px 16px', fontSize: '13px', fontWeight: '700',
            fontFamily: "'Inter',sans-serif", cursor: uploading ? 'not-allowed' : 'pointer',
          }}
        >
          {uploading
            ? <><Loader2 size={15} style={{ animation: 'spin .8s linear infinite' }} /> Caricamento…</>
            : <><Upload size={15} /> Scegli file</>}
        </button>

        {uploadErr && (
          <p style={{ fontSize: '12px', color: '#DC2626', margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <X size={13} /> {uploadErr}
          </p>
        )}
        {uploadOk && (
          <p style={{ fontSize: '12px', color: '#16A34A', margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Check size={13} /> {uploadOk}
          </p>
        )}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
