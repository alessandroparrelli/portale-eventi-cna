import { useEffect, useRef, useState } from 'react'
import { MapPin, Search, Loader2, X } from 'lucide-react'

/* ─── Formatta risultato Nominatim in indirizzo completo ────────── */
function formatAddress(r) {
  const a = r.address || {}

  // Nome del luogo (palazzo, edificio, POI)
  const nome_luogo = a.amenity || a.building || a.tourism || a.leisure ||
                     a.office || a.shop || a.historic || ''

  // Via — preferisce road, poi altre tipologie stradali
  const via = a.road || a.pedestrian || a.path || a.footway ||
              a.cycleway || a.street || ''

  // Numero civico — Nominatim lo mette in house_number separato
  const civico = a.house_number || ''

  const cap    = a.postcode || ''
  const comune = a.city || a.town || a.village || a.hamlet ||
                 a.municipality || a.suburb || ''
  const provincia = a.county || a.state_district || a.state || ''
  const sigla  = PROVINCE_SIGLA[provincia] || siglaFromDisplay(r.display_name) || ''

  // Costruisce la stringa strutturata
  const parti = []

  // Prima parte: nome luogo + via + civico
  if (nome_luogo && via) {
    parti.push(`${nome_luogo}, ${via}${civico ? ', ' + civico : ''}`)
  } else if (via) {
    parti.push(civico ? `${via}, ${civico}` : via)
  } else if (nome_luogo) {
    parti.push(nome_luogo)
  }

  if (cap)    parti.push(cap)
  if (comune) parti.push(sigla ? `${comune} (${sigla})` : comune)

  return {
    indirizzo: parti.join(', '),
    nome_luogo, via, civico, cap, comune, provincia, sigla,
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
    display: r.display_name,
  }
}

// Estrae sigla provincia dal display_name di Nominatim (es. "..., Roma RM, ...")
function siglaFromDisplay(display) {
  const match = display.match(/\b([A-Z]{2})\b/)
  if (match) return match[1]
  return ''
}

/* ─── COMPONENTE ─────────────────────────────────────────────────── */
export default function AddressSearch({ value, onChange }) {
  const [query,    setQuery]    = useState(value || '')
  const [results,  setResults]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [open,     setOpen]     = useState(false)
  const [selected, setSelected] = useState(!!value)
  const timerRef = useRef(null)
  const wrapRef  = useRef(null)

  // Sincronizza se il valore esterno cambia (es. caricamento asincrono evento)
  useEffect(() => {
    if (value && value !== query) {
      setQuery(value)
      setSelected(true)
    }
  }, [value])

  // Chiudi dropdown cliccando fuori
  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleInput(val) {
    setQuery(val)
    setSelected(false)
    clearTimeout(timerRef.current)

    if (val.length < 3) { setResults([]); setOpen(false); return }

    timerRef.current = setTimeout(() => search(val), 500)
  }

  async function search(q) {
    setLoading(true)
    try {
      const url = `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=8` +
        `&countrycodes=it&accept-language=it&namedetails=1`

      const res = await fetch(url, {
        headers: { 'Accept-Language': 'it', 'User-Agent': 'portale-cna-roma/1.0' }
      })
      const data = await res.json()
      setResults(data)
      setOpen(data.length > 0)
    } catch {
      setResults([])
    }
    setLoading(false)
  }

  function selectResult(r) {
    const fmt = formatAddress(r)
    setQuery(fmt.indirizzo)
    setSelected(true)
    setOpen(false)
    setResults([])
    onChange(fmt.indirizzo, fmt)
  }

  function clear() {
    setQuery('')
    setSelected(false)
    setResults([])
    onChange('', null)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* Input con icone */}
      <div style={{
        display: 'flex', alignItems: 'center',
        border: `1.5px solid ${open ? '#E11D48' : selected ? '#16A34A' : '#D1D5DB'}`,
        borderRadius: '8px', background: '#fff',
        overflow: 'hidden', transition: 'border-color .15s',
      }}>
        <div style={{ padding: '0 10px', color: selected ? '#16A34A' : '#9CA3AF', flexShrink: 0 }}>
          {loading
            ? <Loader2 size={16} style={{ animation: 'spin-addr .8s linear infinite' }} />
            : <MapPin size={16} />}
        </div>

        <input
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Cerca indirizzo, via, piazza…"
          style={{
            flex: 1, padding: '10px 0', border: 'none', outline: 'none',
            fontSize: '14px', fontFamily: "'Outfit',sans-serif",
            background: 'transparent',
          }}
        />

        {query && (
          <button onClick={clear} style={{ padding: '0 10px', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', flexShrink: 0 }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown risultati */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 999,
          maxHeight: '280px', overflowY: 'auto',
        }}>
          {results.map((r, i) => {
            const fmt = formatAddress(r)
            return (
              <button
                key={i}
                onMouseDown={() => selectResult(r)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'flex-start',
                  gap: '10px', padding: '10px 14px', background: 'none',
                  border: 'none', borderBottom: i < results.length - 1 ? '1px solid #F3F4F6' : 'none',
                  cursor: 'pointer', textAlign: 'left', fontFamily: "'Outfit',sans-serif",
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <MapPin size={14} style={{ color: '#E11D48', marginTop: '2px', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#0A0A0A', margin: '0 0 2px' }}>
                    {fmt.indirizzo || r.display_name.split(',')[0]}
                  </p>
                  <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0, lineHeight: '1.4',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.display_name.split(',').slice(0, 5).join(', ')}
                  </p>
                </div>
              </button>
            )
          })}
          <div style={{ padding: '6px 14px', borderTop: '1px solid #F3F4F6' }}>
            <p style={{ fontSize: '10px', color: '#D1D5DB', margin: 0 }}>
              © OpenStreetMap contributors
            </p>
          </div>
        </div>
      )}

      {/* Indirizzo selezionato — dettaglio strutturato */}
      {selected && query && (
        <div style={{
          marginTop: '6px', padding: '8px 12px',
          background: '#F0FDF4', border: '1px solid #86EFAC',
          borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <MapPin size={13} style={{ color: '#16A34A', flexShrink: 0 }} />
          <p style={{ fontSize: '12px', color: '#166534', margin: 0, fontWeight: '500' }}>
            {query}
          </p>
        </div>
      )}

      <style>{`@keyframes spin-addr { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}

/* ─── Mappa province italiane ──────────────────────────────────── */
const PROVINCE_SIGLA = {
  'Città Metropolitana di Roma Capitale': 'RM', 'Roma': 'RM',
  'Città Metropolitana di Milano': 'MI', 'Milano': 'MI',
  'Città Metropolitana di Napoli': 'NA', 'Napoli': 'NA',
  'Città Metropolitana di Torino': 'TO', 'Torino': 'TO',
  'Città Metropolitana di Palermo': 'PA', 'Palermo': 'PA',
  'Città Metropolitana di Genova': 'GE', 'Genova': 'GE',
  'Città Metropolitana di Bologna': 'BO', 'Bologna': 'BO',
  'Città Metropolitana di Firenze': 'FI', 'Firenze': 'FI',
  'Città Metropolitana di Bari': 'BA', 'Bari': 'BA',
  'Città Metropolitana di Catania': 'CT', 'Catania': 'CT',
  'Città Metropolitana di Venezia': 'VE', 'Venezia': 'VE',
  'Provincia di Bergamo': 'BG', 'Bergamo': 'BG',
  'Provincia di Brescia': 'BS', 'Brescia': 'BS',
  'Provincia di Verona': 'VR', 'Verona': 'VR',
  'Provincia di Vicenza': 'VI', 'Vicenza': 'VI',
  'Provincia di Padova': 'PD', 'Padova': 'PD',
  'Provincia di Udine': 'UD', 'Udine': 'UD',
  'Provincia di Trieste': 'TS', 'Trieste': 'TS',
  'Provincia di Trento': 'TN', 'Trento': 'TN',
  'Provincia di Bolzano': 'BZ', 'Bolzano': 'BZ',
  'Provincia di Perugia': 'PG', 'Perugia': 'PG',
  'Provincia di Ancona': 'AN', 'Ancona': 'AN',
  'Provincia di Pescara': 'PE', 'Pescara': 'PE',
  'Provincia di Foggia': 'FG', 'Foggia': 'FG',
  'Provincia di Taranto': 'TA', 'Taranto': 'TA',
  'Provincia di Lecce': 'LE', 'Lecce': 'LE',
  'Provincia di Reggio Calabria': 'RC', 'Reggio Calabria': 'RC',
  'Provincia di Messina': 'ME', 'Messina': 'ME',
  'Provincia di Siracusa': 'SR', 'Siracusa': 'SR',
  'Provincia di Sassari': 'SS', 'Sassari': 'SS',
  'Provincia di Cagliari': 'CA', 'Cagliari': 'CA',
}
