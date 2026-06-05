import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  CalendarDays,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  Circle,
} from 'lucide-react'

const STATUS_LABELS = {
  bozza: 'Bozza',
  pubblicato: 'Pubblicato',
  chiuso: 'Chiuso',
  archiviato: 'Archiviato',
}

const STATUS_COLORS = {
  bozza: { bg: '#F3F4F6', text: '#6B7280' },
  pubblicato: { bg: '#DCFCE7', text: '#16A34A' },
  chiuso: { bg: '#FEF3C7', text: '#D97706' },
  archiviato: { bg: '#F3F4F6', text: '#9CA3AF' },
}

function StatCard({ icon: Icon, label, value, sub, color = '#003DA5' }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, backgroundColor: color + '14', color }}>
        <Icon size={22} />
      </div>
      <div>
        <p style={styles.statLabel}>{label}</p>
        <p style={styles.statValue}>{value}</p>
        {sub && <p style={styles.statSub}>{sub}</p>}
      </div>
    </div>
  )
}

function StatusBadge({ stato }) {
  const c = STATUS_COLORS[stato] || STATUS_COLORS.bozza
  return (
    <span style={{ ...styles.badge, backgroundColor: c.bg, color: c.text }}>
      {STATUS_LABELS[stato] || stato}
    </span>
  )
}

export default function DashboardPage() {
  const [events, setEvents] = useState([])
  const [stats, setStats] = useState({ totale: 0, pubblicati: 0, iscritti: 0, presenti: 0 })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Fetch events
      const { data: eventsData, error: eventsErr } = await supabase
        .from('events')
        .select('id, titolo, slug, stato, data_inizio, data_fine, luogo, capienza_max, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

      if (eventsErr) throw eventsErr

      // Fetch registration counts per event
      const { data: regData } = await supabase
        .from('registrations')
        .select('event_id, stato, presente')

      // Merge counts into events
      const enriched = (eventsData || []).map(ev => {
        const regs = (regData || []).filter(r => r.event_id === ev.id)
        return {
          ...ev,
          iscritti: regs.length,
          presenti: regs.filter(r => r.presente).length,
        }
      })

      setEvents(enriched)

      const allRegs = regData || []
      setStats({
        totale: eventsData?.length || 0,
        pubblicati: eventsData?.filter(e => e.stato === 'pubblicato').length || 0,
        iscritti: allRegs.length,
        presenti: allRegs.filter(r => r.presente).length,
      })
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  function formatDate(ts) {
    if (!ts) return '—'
    return new Date(ts).toLocaleDateString('it-IT', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Dashboard</h1>
          <p style={styles.pageSubtitle}>
            {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/eventi/nuovo')}
          style={styles.primaryBtn}
        >
          <Plus size={18} />
          Nuovo evento
        </button>
      </div>

      {/* Stats grid */}
      <div style={styles.statsGrid}>
        <StatCard icon={CalendarDays} label="Tot. eventi" value={stats.totale} color="#003DA5" />
        <StatCard icon={CheckCircle2} label="Pubblicati" value={stats.pubblicati} color="#16A34A" />
        <StatCard icon={Users} label="Tot. iscritti" value={stats.iscritti} color="#003DA5" />
        <StatCard icon={TrendingUp} label="Tot. presenti" value={stats.presenti} color="#16A34A" />
      </div>

      {/* Events table */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Ultimi eventi</h2>
          <button
            onClick={() => navigate('/admin/eventi')}
            style={styles.ghostBtn}
          >
            Vedi tutti <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div style={styles.loadingState}>
            <Clock size={24} style={{ color: '#9CA3AF', marginBottom: '8px' }} />
            <p style={styles.loadingText}>Caricamento…</p>
          </div>
        ) : events.length === 0 ? (
          <div style={styles.emptyState}>
            <CalendarDays size={40} style={{ color: '#D1D5DB', marginBottom: '12px' }} />
            <p style={styles.emptyTitle}>Nessun evento ancora</p>
            <p style={styles.emptySubtitle}>Crea il tuo primo evento per iniziare</p>
            <button
              onClick={() => navigate('/admin/eventi/nuovo')}
              style={{ ...styles.primaryBtn, marginTop: '16px' }}
            >
              <Plus size={16} /> Crea evento
            </button>
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['Evento', 'Data', 'Luogo', 'Stato', 'Iscritti', 'Presenti', ''].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map(ev => (
                  <tr
                    key={ev.id}
                    style={styles.tr}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={styles.td}>
                      <p style={styles.eventTitle}>{ev.titolo}</p>
                      <p style={styles.eventSlug}>/{ev.slug}</p>
                    </td>
                    <td style={styles.td}>
                      <p style={styles.cellText}>{formatDate(ev.data_inizio)}</p>
                    </td>
                    <td style={styles.td}>
                      <p style={{ ...styles.cellText, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.luogo || '—'}
                      </p>
                    </td>
                    <td style={styles.td}>
                      <StatusBadge stato={ev.stato} />
                    </td>
                    <td style={styles.td}>
                      <p style={styles.cellText}>
                        {ev.iscritti}
                        {ev.capienza_max ? <span style={styles.capTxt}>/{ev.capienza_max}</span> : null}
                      </p>
                    </td>
                    <td style={styles.td}>
                      <p style={styles.cellText}>{ev.presenti}</p>
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => navigate(`/admin/eventi/${ev.id}`)}
                        style={styles.rowBtn}
                      >
                        Gestisci
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: {
    maxWidth: '1100px',
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  pageTitle: {
    fontSize: '32px',
    fontWeight: '900',
    color: '#0A0A0A',
    letterSpacing: '-0.03em',
    margin: 0,
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#6B7280',
    margin: '4px 0 0',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#003DA5',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer',
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '6px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    border: '1px solid #E5E7EB',
  },
  statIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#6B7280',
    margin: '0 0 2px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '900',
    color: '#0A0A0A',
    letterSpacing: '-0.03em',
    margin: 0,
  },
  statSub: {
    fontSize: '12px',
    color: '#6B7280',
    margin: '2px 0 0',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: '6px',
    border: '1px solid #E5E7EB',
    overflow: 'hidden',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid #E5E7EB',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0A0A0A',
    letterSpacing: '-0.02em',
    margin: 0,
  },
  ghostBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: "'Inter', sans-serif",
    color: '#003DA5',
    fontWeight: '600',
    padding: '4px 0',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    padding: '10px 24px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    borderBottom: '1px solid #E5E7EB',
    whiteSpace: 'nowrap',
    backgroundColor: '#FAFAFA',
  },
  tr: {
    transition: 'background-color 0.1s',
    cursor: 'default',
  },
  td: {
    padding: '14px 24px',
    borderBottom: '1px solid #F3F4F6',
    verticalAlign: 'middle',
  },
  eventTitle: {
    fontWeight: '600',
    color: '#0A0A0A',
    margin: '0 0 2px',
    letterSpacing: '-0.01em',
  },
  eventSlug: {
    fontSize: '12px',
    color: '#9CA3AF',
    margin: 0,
    fontFamily: 'monospace',
  },
  cellText: {
    color: '#374151',
    margin: 0,
    fontSize: '14px',
  },
  capTxt: {
    color: '#9CA3AF',
    fontSize: '12px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.01em',
  },
  rowBtn: {
    background: 'none',
    border: '1px solid #003DA5',
    color: '#003DA5',
    borderRadius: '4px',
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: '600',
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  loadingState: {
    padding: '48px',
    textAlign: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: '14px',
    margin: 0,
  },
  emptyState: {
    padding: '64px 32px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0A0A0A',
    margin: '0 0 6px',
    letterSpacing: '-0.02em',
  },
  emptySubtitle: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0,
  },
}
