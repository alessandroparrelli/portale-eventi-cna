import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const STATO_COLORS = {
  bozza:      { bg:'#F3F4F6', color:'#374151', label:'Bozza' },
  pubblicata: { bg:'#D1FAE5', color:'#065F46', label:'Pubblicata' },
  archiviata: { bg:'#F3F4F6', color:'#9CA3AF', label:'Archiviata' },
}

export default function LandingPageListPage() {
  const navigate = useNavigate()
  const [pages, setPages] = useState([])
  const [counts, setCounts] = useState({})   // { [lp_id]: number }
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: lps }, { data: cts }] = await Promise.all([
      supabase.from('landing_pages')
        .select('id, titolo, slug, stato, created_at, updated_at')
        .order('created_at', { ascending: false }),
      supabase.from('lp_contacts')
        .select('landing_page_id')
    ])
    setPages(lps || [])
    // Conta contatti per LP
    const map = {}
    for (const c of (cts || [])) {
      map[c.landing_page_id] = (map[c.landing_page_id] || 0) + 1
    }
    setCounts(map)
    setLoading(false)
  }

  async function crea() {
    const titolo = `Nuova Landing Page ${new Date().toLocaleDateString('it-IT')}`
    const slug = 'lp-' + Date.now()
    const { data, error } = await supabase
      .from('landing_pages').insert({ titolo, slug }).select('id').single()
    if (!error && data) navigate(`/admin/landing/${data.id}/editor`)
  }

  async function elimina(id) {
    if (!window.confirm('Eliminare questa landing page e tutti i contatti raccolti?')) return
    await supabase.from('landing_pages').delete().eq('id', id)
    load()
  }

  const filtered = pages.filter(p =>
    p.titolo.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding:'24px', maxWidth:'1100px', fontFamily:'Inter,sans-serif' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'800', color:'#0A0A0A', margin:0, letterSpacing:'-0.03em' }}>Landing Page</h1>
          <p style={{ fontSize:'13px', color:'#6B7280', margin:'4px 0 0' }}>Pagine di marketing per raccogliere contatti</p>
        </div>
        <button onClick={crea} style={{
          background:'#003DA5', color:'#fff', border:'none', borderRadius:'8px',
          padding:'10px 20px', fontFamily:'Inter,sans-serif', fontSize:'13px',
          fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px'
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Nuova Landing Page
        </button>
      </div>

      {/* KPI rapidi */}
      {!loading && pages.length > 0 && (
        <div style={{ display:'flex', gap:'12px', marginBottom:'20px', flexWrap:'wrap' }}>
          {[
            { label:'Totale', val: pages.length, color:'#6B7280' },
            { label:'Pubblicate', val: pages.filter(p=>p.stato==='pubblicata').length, color:'#059669' },
            { label:'Bozze', val: pages.filter(p=>p.stato==='bozza').length, color:'#F59E0B' },
            { label:'Contatti totali', val: Object.values(counts).reduce((a,b)=>a+b,0), color:'#003DA5' },
          ].map(k => (
            <div key={k.label} style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'10px', padding:'12px 20px', display:'flex', flexDirection:'column', gap:'2px' }}>
              <span style={{ fontSize:'22px', fontWeight:'800', color:k.color, letterSpacing:'-.03em' }}>{k.val}</span>
              <span style={{ fontSize:'11px', color:'#9CA3AF', fontWeight:'600', textTransform:'uppercase', letterSpacing:'.04em' }}>{k.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Ricerca */}
      <div style={{ marginBottom:'16px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cerca per titolo o slug..."
          style={{ width:'100%', boxSizing:'border-box', padding:'10px 14px', border:'1px solid #E5E7EB', borderRadius:'8px', fontSize:'14px', fontFamily:'Inter,sans-serif', outline:'none' }}
        />
      </div>

      {/* Tabella */}
      {loading ? (
        <p style={{ color:'#9CA3AF', fontSize:'14px' }}>Caricamento...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'#9CA3AF' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom:'12px', opacity:.4 }}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          <p style={{ margin:0, fontSize:'14px' }}>Nessuna landing page</p>
          <p style={{ margin:'4px 0 0', fontSize:'13px' }}>Crea la prima pagina per iniziare</p>
        </div>
      ) : (
        <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E5E7EB', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#F9FAFB', borderBottom:'1px solid #E5E7EB' }}>
                <th style={thSt}>Titolo</th>
                <th style={thSt}>Slug</th>
                <th style={thSt}>Stato</th>
                <th style={{ ...thSt, textAlign:'center' }}>Contatti</th>
                <th style={thSt}>Creata il</th>
                <th style={{ ...thSt, width:'160px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const sc = STATO_COLORS[p.stato] || STATO_COLORS.bozza
                const nContatti = counts[p.id] || 0
                return (
                  <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                    <td style={tdSt}>
                      <span style={{ fontWeight:'600', color:'#0A0A0A', fontSize:'14px' }}>{p.titolo}</span>
                    </td>
                    <td style={tdSt}>
                      <span style={{ fontSize:'12px', color:'#6B7280', fontFamily:'monospace' }}>/lp/{p.slug}</span>
                    </td>
                    <td style={tdSt}>
                      <span style={{ background:sc.bg, color:sc.color, borderRadius:'4px', padding:'3px 8px', fontSize:'12px', fontWeight:'600' }}>
                        {sc.label}
                      </span>
                    </td>
                    <td style={{ ...tdSt, textAlign:'center' }}>
                      <span style={{
                        fontWeight:'700', fontSize:'14px',
                        color: nContatti > 0 ? '#003DA5' : '#9CA3AF'
                      }}>
                        {nContatti > 0 ? nContatti : '—'}
                      </span>
                    </td>
                    <td style={{ ...tdSt, color:'#9CA3AF', fontSize:'13px' }}>
                      {new Date(p.created_at).toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric' })}
                    </td>
                    <td style={{ ...tdSt, textAlign:'right' }}>
                      <div style={{ display:'flex', gap:'5px', justifyContent:'flex-end' }}>
                        {/* Preview */}
                        <a href={`/lp/${p.slug}`} target="_blank" rel="noreferrer"
                          title="Anteprima pubblica"
                          style={{ ...btnSmBase('#F3F4F6','#374151'), textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', padding:'6px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </a>
                        {/* Contatti */}
                        <button onClick={() => navigate(`/admin/landing/${p.id}/contatti`)} title="Contatti">
                          <div style={btnSmBase('#EFF6FF','#003DA5')}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                          </div>
                        </button>
                        {/* Modifica */}
                        <button onClick={() => navigate(`/admin/landing/${p.id}/editor`)} title="Modifica">
                          <div style={btnSmBase('#EFF6FF','#003DA5')}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </div>
                        </button>
                        {/* Elimina */}
                        <button onClick={() => elimina(p.id)} title="Elimina">
                          <div style={btnSmBase('#FEF2F2','#DC2626')}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          </div>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const thSt = { padding:'10px 16px', textAlign:'left', fontSize:'11px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.05em' }
const tdSt = { padding:'13px 16px', verticalAlign:'middle' }
const btnSmBase = (bg, color) => ({
  background: bg, color, borderRadius:'6px', padding:'6px', border:'none', cursor:'pointer',
  display:'flex', alignItems:'center', justifyContent:'center'
})
