import { CalendarDays, ChevronDown } from 'lucide-react'

/**
 * Card selettore evento con stile "luminous" — usato in Checkin, Iscritti, Statistiche
 * Props: eventi, value, onChange, label?, placeholder?
 */
export default function EventSelector({ eventi = [], value, onChange, label = 'Evento', placeholder = '— Seleziona un evento —' }) {
  const selected = eventi.find(e => e.id === value)

  return (
    <div className="evt-selector-card" style={{ flexWrap: 'wrap', gap: '12px' }}>
      {/* Icona */}
      <div className="icon-badge-blue" style={{ width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <CalendarDays size={20} />
      </div>

      {/* Label + select */}
      <div style={{ flex: 1, minWidth: '220px' }}>
        <p style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 5px' }}>
          {label}
        </p>
        <div style={{ position: 'relative' }}>
          <select
            value={value}
            onChange={onChange}
            style={{
              width: '100%',
              appearance: 'none',
              border: '1.5px solid #D1D5DB',
              borderRadius: '8px',
              padding: '9px 36px 9px 12px',
              fontSize: '14px',
              fontWeight: '600',
              fontFamily: "'Inter', sans-serif",
              color: value ? '#0A0A0A' : '#9CA3AF',
              backgroundColor: '#fff',
              cursor: 'pointer',
              outline: 'none',
              transition: 'border-color .15s',
            }}
            onFocus={e => (e.target.style.borderColor = '#003DA5')}
            onBlur={e => (e.target.style.borderColor = '#D1D5DB')}
          >
            <option value="">{placeholder}</option>
            {eventi.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.titolo}</option>
            ))}
          </select>
          <ChevronDown size={16} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* Info evento selezionato */}
      {selected && (
        <div style={{ display: 'flex', gap: '16px', flexShrink: 0, flexWrap: 'wrap' }}>
          {selected.data_inizio && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '0 0 2px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Data</p>
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#0A0A0A', margin: 0 }}>
                {new Date(selected.data_inizio).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          )}
          {selected.stato && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '0 0 2px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Stato</p>
              <span style={{
                display: 'inline-block',
                padding: '2px 10px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '700',
                backgroundColor: selected.stato === 'pubblicato' ? '#DCFCE7' : '#F3F4F6',
                color: selected.stato === 'pubblicato' ? '#16A34A' : '#6B7280',
              }}>
                {selected.stato}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
