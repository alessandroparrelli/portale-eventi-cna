import { useEffect, useState } from 'react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { supabase } from '../../lib/supabase'
import { usePushNotifications } from '../../hooks/usePushNotifications'
import { Bell, BellOff, TrendingUp, Users, Mail, Award, Calendar, BarChart2 } from 'lucide-react'

const BLU = '#E11D48'
const PUSH_URL = 'https://hnkhckcclgabunkqfmrz.supabase.co/functions/v1/web-push'

function StatCard({ icon: Icon, label, value, sub, color = BLU }) {
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px 24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 4px', fontWeight: '500' }}>{label}</p>
        <p style={{ fontSize: '28px', fontWeight: '900', color: '#0A0A0A', letterSpacing: '-0.03em', margin: '0 0 2px', lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>{sub}</p>}
      </div>
    </div>
  )
}

function BarRow({ label, value, max, color = BLU }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#0A0A0A' }}>{value}</span>
      </div>
      <div style={{ height: '6px', backgroundColor: '#F3F4F6', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

export default function AnaliticsPage() {
  usePageTitle('Analytics')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pushModal, setPushModal] = useState(false)
  const [pushForm, setPushForm] = useState({ title: 'CNA Roma', body: '', url: '/calendario' })
  const [sending, setSending] = useState(false)
  const [pushSent, setPushSent] = useState(null)
  const { supported: pushSupported, subscribed, loading: pushLoading, subscribe, unsubscribe } = usePushNotifications()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const now = new Date().toISOString()

    const [
      { count: totEventi },
      { count: totIscritti },
      { count: totPresenti },
      { count: totCertificati },
      { data: eventiTop },
      { data: iscrizioniMese },
      { count: pushSubs },
    ] = await Promise.all([
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('stato', 'confermato'),
      supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('presente', true),
      supabase.from('certificati').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('id, titolo, capienza_max').eq('stato', 'pubblicato').order('data_inizio', { ascending: false }).limit(8),
      supabase.from('registrations').select('created_at').eq('stato', 'confermato').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('push_subscriptions').select('*', { count: 'exact', head: true }),
    ])

    // Iscritti per evento
    let eventiConIscritti = []
    if (eventiTop?.length) {
      const ids = eventiTop.map(e => e.id)
      const { data: regCounts } = await supabase.from('registrations').select('event_id').in('event_id', ids).eq('stato', 'confermato')
      const countMap = {}
      ;(regCounts || []).forEach(r => { countMap[r.event_id] = (countMap[r.event_id] || 0) + 1 })
      eventiConIscritti = (eventiTop || []).map(e => ({ ...e, iscritti: countMap[e.id] || 0 }))
        .sort((a, b) => b.iscritti - a.iscritti)
    }

    // Iscrizioni per giorno (ultimi 14gg)
    const giorni = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const key = d.toISOString().slice(0, 10)
      giorni.push({ key, label: d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }), count: 0 })
    }
    ;(iscrizioniMese || []).forEach(r => {
      const key = r.created_at.slice(0, 10)
      const g = giorni.find(g => g.key === key)
      if (g) g.count++
    })

    const presenzaRate = totIscritti > 0 ? Math.round(((totPresenti || 0) / totIscritti) * 100) : 0

    setData({
      totEventi: totEventi || 0,
      totIscritti: totIscritti || 0,
      totPresenti: totPresenti || 0,
      totCertificati: totCertificati || 0,
      presenzaRate,
      eventiTop: eventiConIscritti,
      giorni,
      pushSubs: pushSubs || 0,
    })
    setLoading(false)
  }

  async function sendPush() {
    setSending(true)
    const res = await fetch(PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'broadcast', ...pushForm })
    })
    const result = await res.json()
    setPushSent(result)
    setSending(false)
  }

  if (loading) return <div style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>Caricamento analytics…</div>

  const maxIscritti = Math.max(...(data.eventiTop.map(e => e.iscritti)), 1)
  const maxGiorni = Math.max(...data.giorni.map(g => g.count), 1)

  return (
    <div style={{ width: '100%', maxWidth: '960px', fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0A0A0A', letterSpacing: '-0.03em', margin: 0 }}>Analytics</h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0' }}>Panoramica attività portale</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Push toggle */}
          {pushSupported && (
            <button onClick={subscribed ? unsubscribe : subscribe} disabled={pushLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
                border: '1px solid', borderColor: subscribed ? '#DC2626' : BLU,
                borderRadius: '7px', backgroundColor: '#fff',
                color: subscribed ? '#DC2626' : BLU,
                fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif", opacity: pushLoading ? 0.6 : 1 }}>
              {subscribed ? <BellOff size={15} /> : <Bell size={15} />}
              {subscribed ? 'Disattiva notifiche' : 'Attiva notifiche'}
            </button>
          )}
          <button onClick={() => setPushModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
              border: 'none', borderRadius: '7px', backgroundColor: BLU, color: '#fff',
              fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
            <Bell size={15} /> Invia notifica push
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatCard icon={Calendar}   label="Tot. eventi"     value={data.totEventi}     color={BLU} />
        <StatCard icon={Users}      label="Iscritti totali" value={data.totIscritti}    color='#059669' />
        <StatCard icon={TrendingUp} label="Presenti"        value={data.totPresenti}    sub={`${data.presenzaRate}% tasso presenza`} color='#7C3AED' />
        <StatCard icon={Award}      label="Certificati"     value={data.totCertificati} color='#F59E0B' />
        <StatCard icon={Bell}       label="Push iscritti"   value={data.pushSubs}       sub="abbonati notifiche" color='#0891B2' />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Iscrizioni ultimi 14gg */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0A0A0A', letterSpacing: '-0.02em', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={16} style={{ color: BLU }} /> Iscrizioni ultimi 14 giorni
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px' }}>
            {data.giorni.map(g => (
              <div key={g.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div title={`${g.count} iscrizioni`}
                  style={{ width: '100%', backgroundColor: g.count > 0 ? BLU : '#F3F4F6',
                    height: `${Math.max((g.count / maxGiorni) * 80, g.count > 0 ? 8 : 2)}px`,
                    borderRadius: '3px 3px 0 0', transition: 'height 0.4s ease', cursor: g.count > 0 ? 'default' : 'default' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ fontSize: '10px', color: '#9CA3AF' }}>{data.giorni[0]?.label}</span>
            <span style={{ fontSize: '10px', color: '#9CA3AF' }}>{data.giorni[13]?.label}</span>
          </div>
        </div>

        {/* Top eventi per iscrizioni */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0A0A0A', letterSpacing: '-0.02em', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} style={{ color: '#059669' }} /> Top eventi per iscrizioni
          </h3>
          {data.eventiTop.length === 0
            ? <p style={{ fontSize: '14px', color: '#9CA3AF' }}>Nessun evento pubblicato</p>
            : data.eventiTop.slice(0, 6).map(e => (
                <BarRow key={e.id} label={e.titolo} value={e.iscritti} max={maxIscritti} color={BLU} />
              ))
          }
        </div>
      </div>

      {/* Push notification modal */}
      {pushModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '32px', width: '100%', maxWidth: '480px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)', fontFamily: "'Outfit',sans-serif" }}>
            <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0A0A0A', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              Invia notifica push
            </h3>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 24px' }}>
              Inviata a {data.pushSubs} abbonati
            </p>
            {pushSent ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                <p style={{ fontSize: '16px', fontWeight: '700', color: '#059669' }}>
                  Inviata a {pushSent.sent} dispositivi
                </p>
                {pushSent.failed > 0 && <p style={{ fontSize: '13px', color: '#9CA3AF' }}>{pushSent.failed} non raggiunti</p>}
                <button onClick={() => { setPushModal(false); setPushSent(null) }}
                  style={{ marginTop: '16px', padding: '10px 24px', backgroundColor: BLU, color: '#fff',
                    border: 'none', borderRadius: '7px', fontSize: '14px', fontWeight: '700',
                    cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                  Chiudi
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>Titolo</label>
                  <input value={pushForm.title} onChange={e => setPushForm(f => ({ ...f, title: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '6px',
                      fontSize: '14px', fontFamily: "'Outfit',sans-serif", outline: 'none', boxSizing: 'border-box' }}/>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>Messaggio</label>
                  <textarea value={pushForm.body} onChange={e => setPushForm(f => ({ ...f, body: e.target.value }))}
                    rows={3} placeholder="Es. Nuovo evento disponibile: iscriviti ora!"
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '6px',
                      fontSize: '14px', fontFamily: "'Outfit',sans-serif", outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}/>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '6px' }}>URL destinazione</label>
                  <input value={pushForm.url} onChange={e => setPushForm(f => ({ ...f, url: e.target.value }))}
                    placeholder="/calendario"
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '6px',
                      fontSize: '14px', fontFamily: "'Outfit',sans-serif", outline: 'none', boxSizing: 'border-box' }}/>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px' }}>
                  <button onClick={() => setPushModal(false)}
                    style={{ padding: '10px 18px', border: '1px solid #E5E7EB', borderRadius: '7px',
                      backgroundColor: '#fff', color: '#374151', fontSize: '13px', fontWeight: '600',
                      cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                    Annulla
                  </button>
                  <button onClick={sendPush} disabled={sending || !pushForm.body}
                    style={{ padding: '10px 20px', border: 'none', borderRadius: '7px',
                      backgroundColor: BLU, color: '#fff', fontSize: '13px', fontWeight: '700',
                      cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
                      opacity: sending || !pushForm.body ? 0.6 : 1 }}>
                    {sending ? 'Invio…' : `Invia a ${data.pushSubs} abbonati`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
