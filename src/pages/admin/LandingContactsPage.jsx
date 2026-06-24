import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'

export default function LandingContactsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [page, setPage] = useState(null)
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    const [{ data: lp }, { data: ct }] = await Promise.all([
      supabase.from('landing_pages').select('id,titolo,slug').eq('id', id).single(),
      supabase.from('lp_contacts').select('*').eq('landing_page_id', id).order('created_at', { ascending: false })
    ])
    setPage(lp)
    setContacts(ct || [])
    setLoading(false)
  }

  function exportXlsx() {
    const rows = contacts.map(c => ({
      'Nome': c.nome || '',
      'Cognome': c.cognome || '',
      'Email': c.email || '',
      'Telefono': c.telefono || '',
      'Privacy': c.consenso_privacy ? 'Sì' : 'No',
      'Newsletter': c.consenso_newsletter ? 'Sì' : 'No',
      'Data': new Date(c.created_at).toLocaleString('it-IT'),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Contatti')
    XLSX.writeFile(wb, `contatti-${page?.slug || id}.xlsx`)
  }

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase()
    return (c.nome || '').toLowerCase().includes(q) ||
           (c.cognome || '').toLowerCase().includes(q) ||
           (c.email || '').toLowerCase().includes(q)
  })

  return (
    <div style={{ padding:'24px', maxWidth:'1000px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'6px' }}>
        <button onClick={() => navigate('/admin/landing')} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px', color:'#6B7280' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div>
          <h1 style={{ fontSize:'20px', fontWeight:'800', color:'#0A0A0A', margin:0, letterSpacing:'-0.03em' }}>
            Contatti — {page?.titolo || '...'}
          </h1>
          <p style={{ fontSize:'13px', color:'#6B7280', margin:'2px 0 0' }}>{contacts.length} contatto{contacts.length !== 1 ? 'i' : ''} raccolto{contacts.length !== 1 ? 'i' : ''}</p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:'10px', marginBottom:'20px', marginTop:'16px', flexWrap:'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cerca per nome, cognome, email..."
          style={{ flex:1, minWidth:'200px', padding:'10px 14px', border:'1px solid #E5E7EB', borderRadius:'8px', fontSize:'14px', fontFamily:'Inter,sans-serif', outline:'none' }}
        />
        <button onClick={exportXlsx} disabled={contacts.length === 0} style={{
          background:'#059669', color:'#fff', border:'none', borderRadius:'8px',
          padding:'10px 18px', fontFamily:'Inter,sans-serif', fontSize:'13px',
          fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px',
          opacity: contacts.length === 0 ? .5 : 1
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Esporta Excel
        </button>
      </div>

      {loading ? (
        <p style={{ color:'#9CA3AF', fontSize:'14px' }}>Caricamento...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'#9CA3AF' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom:'12px', opacity:.4 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <p style={{ margin:0, fontSize:'14px' }}>Nessun contatto ancora</p>
          <p style={{ margin:'4px 0 0', fontSize:'13px' }}>I contatti appariranno qui quando qualcuno compila il form</p>
        </div>
      ) : (
        <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #E5E7EB', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#F9FAFB', borderBottom:'1px solid #E5E7EB' }}>
                <th style={thSt}>Nome</th>
                <th style={thSt}>Email</th>
                <th style={thSt}>Telefono</th>
                <th style={thSt}>Privacy</th>
                <th style={thSt}>Newsletter</th>
                <th style={thSt}>Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < filtered.length-1 ? '1px solid #F3F4F6' : 'none' }}>
                  <td style={tdSt}>
                    <span style={{ fontWeight:'600', color:'#0A0A0A', fontSize:'14px' }}>
                      {[c.nome, c.cognome].filter(Boolean).join(' ') || '—'}
                    </span>
                  </td>
                  <td style={{ ...tdSt, color:'#374151', fontSize:'13px' }}>{c.email || '—'}</td>
                  <td style={{ ...tdSt, color:'#374151', fontSize:'13px' }}>{c.telefono || '—'}</td>
                  <td style={tdSt}>
                    <span style={{ fontSize:'12px', color: c.consenso_privacy ? '#059669' : '#9CA3AF' }}>
                      {c.consenso_privacy ? '✓' : '—'}
                    </span>
                  </td>
                  <td style={tdSt}>
                    <span style={{ fontSize:'12px', color: c.consenso_newsletter ? '#059669' : '#9CA3AF' }}>
                      {c.consenso_newsletter ? '✓' : '—'}
                    </span>
                  </td>
                  <td style={{ ...tdSt, color:'#9CA3AF', fontSize:'12px' }}>
                    {new Date(c.created_at).toLocaleDateString('it-IT')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const thSt = { padding:'10px 16px', textAlign:'left', fontSize:'11px', fontWeight:'700', color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.05em' }
const tdSt = { padding:'12px 16px', verticalAlign:'middle' }
