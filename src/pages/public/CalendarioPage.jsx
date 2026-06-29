import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const LOGO = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'

function formatData(ts, opts = {}) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric', ...opts })
}
function formatOra(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

const MESI = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']

export default function CalendarioPage() {
  const [eventi, setEventi] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [meseFilter, setMeseFilter] = useState('tutti')
  const [view, setView] = useState('grid') // 'grid' | 'list'

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('events')
        .select('id,titolo,sottotitolo,slug,data_inizio,data_fine,luogo,immagine_hero,capienza_max,stato,tema,colore_primario')
        .eq('stato', 'pubblicato')
        .gte('data_inizio', new Date().toISOString())
        .order('data_inizio', { ascending: true })
      setEventi(data || [])
      setLoading(false)
    })()
  }, [])

  const mesiDisponibili = [...new Set(eventi.map(e => {
    const d = new Date(e.data_inizio)
    return `${d.getFullYear()}-${d.getMonth()}`
  }))]

  const filtered = eventi.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = !q || e.titolo?.toLowerCase().includes(q) || e.luogo?.toLowerCase().includes(q)
    if (!matchSearch) return false
    if (meseFilter === 'tutti') return true
    const d = new Date(e.data_inizio)
    return `${d.getFullYear()}-${d.getMonth()}` === meseFilter
    return true
  })

  // Raggruppa per mese
  const gruppi = {}
  filtered.forEach(e => {
    const d = new Date(e.data_inizio)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const label = `${MESI[d.getMonth()]} ${d.getFullYear()}`
    if (!gruppi[key]) gruppi[key] = { label, eventi: [] }
    gruppi[key].eventi.push(e)
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', fontFamily: "'Inter',sans-serif" }}>
      {/* Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '2px solid #003DA5', padding: '0 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>
          <img src={LOGO} alt="CNA Roma" style={{ height: '40px', objectFit: 'contain' }} />
          <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>Calendario eventi</span>
        </div>
      </header>

      {/* Hero */}
      <div style={{ backgroundColor: '#003DA5', color: '#ffffff', padding: '56px 24px 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '-0.04em', margin: '0 0 12px' }}>
            I prossimi eventi
          </h1>
          <p style={{ fontSize: '17px', opacity: 0.85, margin: '0 0 32px', maxWidth: '560px', lineHeight: '1.6' }}>
            Formazione, networking e opportunità per le imprese associate CNA Roma.
          </p>

          {/* Search */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cerca evento o luogo…"
                style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.12)',
                  color: '#ffffff', fontSize: '14px', fontFamily: "'Inter',sans-serif",
                  outline: 'none', boxSizing: 'border-box' }}/>
            </div>

            <select value={meseFilter} onChange={e => setMeseFilter(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.25)',
                backgroundColor: 'rgba(255,255,255,0.12)', color: '#ffffff', fontSize: '14px',
                fontFamily: "'Inter',sans-serif", outline: 'none', cursor: 'pointer' }}>
              <option value="tutti" style={{ color: '#0A0A0A' }}>Tutti i mesi</option>
              {mesiDisponibili.map(k => {
                const [y, m] = k.split('-')
                return <option key={k} value={k} style={{ color: '#0A0A0A' }}>{MESI[parseInt(m)]} {y}</option>
              })}
            </select>

            {/* Toggle vista */}
            <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '8px', overflow: 'hidden' }}>
              {['grid','list'].map(v => (
                <button key={v} onClick={() => setView(v)}
                  style={{ padding: '10px 16px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                    backgroundColor: view === v ? 'rgba(255,255,255,0.25)' : 'transparent',
                    color: '#ffffff', fontFamily: "'Inter',sans-serif", transition: 'background 0.15s' }}>
                  {v === 'grid' ? '⊞ Griglia' : '☰ Lista'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contenuto */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px 80px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#9CA3AF' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #E5E7EB', borderTopColor: '#003DA5',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}/>
            <p>Caricamento eventi…</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px' }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px' }}>📅</p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: '#0A0A0A', margin: '0 0 8px' }}>
              Nessun evento in programma
            </p>
            <p style={{ fontSize: '14px', color: '#6B7280' }}>
              {search ? 'Nessun risultato per la ricerca.' : 'Al momento non ci sono eventi pubblicati.'}
            </p>
          </div>
        ) : Object.entries(gruppi).map(([key, { label, eventi: evList }]) => (
          <section key={key} style={{ marginBottom: '56px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.03em', color: '#0A0A0A', margin: 0 }}>
                {label}
              </h2>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}/>
              <span style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: '500' }}>
                {evList.length} {evList.length === 1 ? 'evento' : 'eventi'}
              </span>
            </div>

            {view === 'grid' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '20px' }}>
                {evList.map(e => <CardGrid key={e.id} evento={e} />)}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {evList.map(e => <CardList key={e.id} evento={e} />)}
              </div>
            )}
          </section>
        ))}
      </main>

      <footer style={{ borderTop: '1px solid #E5E7EB', padding: '32px 24px', textAlign: 'center' }}>
        <img src={LOGO} alt="CNA Roma" style={{ height: '32px', opacity: 0.7, marginBottom: '12px' }}/>
        <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
          © {new Date().getFullYear()} CNA Roma · Tutti i diritti riservati
        </p>
      </footer>
    </div>
  )
}

function CardGrid({ evento }) {
  const color = evento.colore_primario || '#003DA5'
  const d = new Date(evento.data_inizio)
  return (
    <a href={`/eventi/${evento.slug}`}
      style={{ textDecoration: 'none', display: 'block', backgroundColor: '#ffffff',
        border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden',
        transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}>

      {/* Immagine o placeholder */}
      <div style={{ height: '160px', backgroundColor: color + '18', position: 'relative', overflow: 'hidden' }}>
        {evento.immagine_hero ? (
          <img src={evento.immagine_hero} alt={evento.titolo}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
        )}
        {/* Badge data */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: '#ffffff',
          borderRadius: '8px', padding: '6px 10px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          <div style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '-0.03em', color: '#0A0A0A', lineHeight: 1 }}>
            {String(d.getDate()).padStart(2,'0')}
          </div>
          <div style={{ fontSize: '10px', fontWeight: '700', color: color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {MESI[d.getMonth()].slice(0,3)}
          </div>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '-0.02em', color: '#0A0A0A',
          margin: '0 0 6px', lineHeight: '1.3' }}>
          {evento.titolo}
        </h3>
        {evento.sottotitolo && (
          <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 12px', lineHeight: '1.5',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {evento.sottotitolo}
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <MetaRow icon="clock" text={`${formatOra(evento.data_inizio)}${evento.data_fine ? ' — ' + formatOra(evento.data_fine) : ''}`} color={color}/>
          {evento.luogo && <MetaRow icon="pin" text={evento.luogo} color={color}/>}
        </div>
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ backgroundColor: color, color: '#ffffff', padding: '8px 16px', borderRadius: '6px',
            fontSize: '13px', fontWeight: '700', letterSpacing: '-0.01em' }}>
            Scopri →
          </span>
        </div>
      </div>
    </a>
  )
}

function CardList({ evento }) {
  const color = evento.colore_primario || '#003DA5'
  const d = new Date(evento.data_inizio)
  return (
    <a href={`/eventi/${evento.slug}`}
      style={{ textDecoration: 'none', display: 'flex', gap: '20px', alignItems: 'center',
        backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '20px',
        transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

      {/* Badge data */}
      <div style={{ minWidth: '56px', textAlign: 'center', padding: '10px 8px', backgroundColor: color + '12',
        borderRadius: '8px', borderLeft: `3px solid ${color}` }}>
        <div style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.03em', color: '#0A0A0A', lineHeight: 1 }}>
          {String(d.getDate()).padStart(2,'0')}
        </div>
        <div style={{ fontSize: '10px', fontWeight: '700', color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {MESI[d.getMonth()].slice(0,3)}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '-0.02em', color: '#0A0A0A', margin: '0 0 4px' }}>
          {evento.titolo}
        </h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <MetaRow icon="clock" text={`${formatOra(evento.data_inizio)}${evento.data_fine ? ' — ' + formatOra(evento.data_fine) : ''}`} color={color}/>
          {evento.luogo && <MetaRow icon="pin" text={evento.luogo} color={color}/>}
        </div>
      </div>

      <span style={{ color, fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap', flexShrink: 0 }}>
        Iscriviti →
      </span>
    </a>
  )
}

function MetaRow({ icon, text, color }) {
  const d = icon === 'clock'
    ? 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5v5l3 3'
    : 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d={d}/>
      </svg>
      <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>{text}</span>
    </div>
  )
}
