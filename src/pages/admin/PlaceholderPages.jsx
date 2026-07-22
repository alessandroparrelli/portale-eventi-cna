import { CalendarDays, Users, Mail, QrCode, BarChart2 } from 'lucide-react'

function Placeholder({ icon: Icon, title, description }) {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.iconWrap}>
          <Icon size={32} style={{ color: '#E11D48' }} />
        </div>
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.desc}>{description}</p>
        <span style={styles.badge}>In sviluppo</span>
      </div>
    </div>
  )
}

export function EventiPage() {
  return <Placeholder icon={CalendarDays} title="Gestione Eventi" description="Crea, modifica e gestisci tutti gli eventi. Disponibile nella prossima fase." />
}

export function IscrittiPage() {
  return <Placeholder icon={Users} title="Gestione Iscritti" description="Visualizza, filtra ed esporta gli iscritti agli eventi." />
}

export function EmailPage() {
  return <Placeholder icon={Mail} title="Gestione Email" description="Configura template email, reminder e notifiche automatiche." />
}

export function CheckinPage() {
  return <Placeholder icon={QrCode} title="App Check-in" description="Scansiona QR Code e gestisci i presenti il giorno dell'evento." />
}

export function StatistichePage() {
  return <Placeholder icon={BarChart2} title="Statistiche" description="Visualizza statistiche aggregate, questionari e risposte." />
}

const styles = {
  page: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 64px)',
    fontFamily: "'Outfit', sans-serif",
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    padding: '48px',
    textAlign: 'center',
    maxWidth: '440px',
  },
  iconWrap: {
    width: '64px',
    height: '64px',
    backgroundColor: '#FEE4E6',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '900',
    color: '#0A0A0A',
    letterSpacing: '-0.03em',
    margin: '0 0 8px',
  },
  desc: {
    fontSize: '14px',
    color: '#6B7280',
    margin: '0 0 20px',
    lineHeight: '1.6',
  },
  badge: {
    display: 'inline-flex',
    backgroundColor: '#FEE4E6',
    color: '#E11D48',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
}
