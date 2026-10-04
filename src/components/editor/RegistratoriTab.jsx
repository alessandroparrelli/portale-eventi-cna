import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, ToggleLeft, ToggleRight, Check, Search, RefreshCw } from 'lucide-react'

export default function RegistratoriTab({ event, onUpdate }) {
  const [registratori, setRegistratori] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [search, setSearch] = useState('')
  const [tuttiAbilitati, setTuttiAbilitati] = useState(event.tutti_registratori ?? true)

  const load = useCallback(async () => {
    if (!event.id) return
    setLoading(true)
    const { data } = await supabase.rpc('get_registratori_evento', { p_event_id: event.id })
    setRegistratori(data || [])
    setLoading(false)
  }, [event.id])

  useEffect(() => { load() }, [load])
  useEffect(() => { setTuttiAbilitati(event.tutti_registratori ?? true) }, [event.tutti_registratori])

  async function toggleTutti(val) {
    setSaving('tutti')
    setTuttiAbilitati(val)
    const { error } = await supabase.from('events').update({ tutti_registratori: val }).eq('id', event.id)
    if (error) setTuttiAbilitati(!val)
    else onUpdate?.({ tutti_registratori: val })
    setSaving(null)
  }

  async function toggleUtente(reg) {
    setSaving(reg.user_id)
    const was = reg.is_assegnato
    setRegistratori(prev => prev.map(r => r.user_id === reg.user_id ? { ...r, is_assegnato: !was } : r))
    if (!was) await supabase.from('event_registratori').insert({ event_id: event.id, user_id: reg.user_id })
    else await supabase.from('event_registratori').delete().eq('event_id', event.id).eq('user_id', reg.user_id)
    setSaving(null)
  }

  const filtrati = registratori.filter(r => {
    const q = search.toLowerCase()
    return r.username?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q)
  })
  const assegnati = registratori.filter(r => r.is_assegnato).length

  return (
    <div style={{ padding: '24px', maxWidth: '720px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="#003DA5" /> Registratori abilitati
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
            Controlla chi puo accedere al check-in per questo evento
          </p>
        </div>
        <button onClick={load} disabled={loading}
          style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <RefreshCw size={13} /> Aggiorna
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px',
          background: tuttiAbilitati ? '#EFF6FF' : '#F9FAFB',
          border: `1px solid ${tuttiAbilitati ? '#BFDBFE' : '#E5E7EB'}`,
          borderRadius: '12px', marginBottom: '20px', cursor: 'pointer', transition: 'all .2s' }}
        onClick={() => saving !== 'tutti' && toggleTutti(!tuttiAbilitati)}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>Tutti i registratori</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
            {tuttiAbilitati
              ? 'Qualsiasi registratore puo fare check-in su questo evento'
              : 'Solo i registratori selezionati qui sotto possono accedere'}
          </div>
        </div>
        {tuttiAbilitati ? <ToggleRight size={32} color="#003DA5" /> : <ToggleLeft size={32} color="#9CA3AF" />}
      </div>

      <div style={{ opacity: tuttiAbilitati ? 0.45 : 1, pointerEvents: tuttiAbilitati ? 'none' : 'auto', transition: 'opacity .2s' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', color: '#6B7280' }}>
            {!tuttiAbilitati && <><b style={{ color: '#111827' }}>{assegnati}</b> di {registratori.length} abilitati</>}
          </span>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca..."
              style={{ paddingLeft: '30px', height: '32px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', outline: 'none', width: '200px' }} />
          </div>
        </div>

        {loading ? <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>Caricamento...</div>
        : filtrati.length === 0 ? <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>Nessun risultato</div>
        : (
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
            {filtrati.map((reg, i) => {
              const label = reg.username || reg.email
              return (
                <div key={reg.user_id} onClick={() => toggleUtente(reg)}
                  style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px',
                    borderBottom: i < filtrati.length - 1 ? '1px solid #F3F4F6' : 'none',
                    background: reg.is_assegnato ? '#F0F9FF' : '#fff', cursor: 'pointer', transition: 'background .15s' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                      border: reg.is_assegnato ? 'none' : '2px solid #D1D5DB',
                      background: reg.is_assegnato ? '#003DA5' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {reg.is_assegnato && <Check size={12} color="#fff" strokeWidth={3} />}
                  </div>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                      background: reg.is_assegnato ? '#003DA5' : '#E5E7EB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: '700', color: reg.is_assegnato ? '#fff' : '#6B7280' }}>
                    {(label[0] || '?').toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{reg.email}</div>
                  </div>
                  {reg.is_assegnato && (
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#003DA5', background: '#EFF6FF', padding: '3px 8px', borderRadius: '20px' }}>Abilitato</div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {!tuttiAbilitati && assegnati === 0 && !loading && (
          <div style={{ marginTop: '12px', padding: '10px 14px', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', fontSize: '12px', color: '#92400E' }}>
            Nessun registratore abilitato - nessuno potra fare check-in.
          </div>
        )}
      </div>
    </div>
  )
}
