// Spunta obbligatoria di accettazione privacy, usata in tutti i form di iscrizione pubblici
export const PRIVACY_URL = 'https://www.cnaroma.it/informativa-newsletter'

export default function PrivacyConsenso({ checked, onChange, error, color = '#005AC9', id }) {
  return (
    <div style={{ marginTop: 14 }}>
      <label htmlFor={id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
        <input id={id} type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} required
          style={{ width: 18, height: 18, marginTop: 1, flexShrink: 0, accentColor: color, cursor: 'pointer' }} />
        <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
          <span style={{ fontWeight: 700, color: '#111827' }}>Accettazione privacy <span style={{ color: '#DC2626' }}>*</span></span>
          <span style={{ display: 'block', marginTop: 4, fontSize: 13.5, color: '#4B5563' }}>
            Esprimo il consenso al trattamento dei dati personali sulla base di questa informativa. I dati trasmessi saranno trattati in ottemperanza alla <b>normativa sulla privacy</b> ai sensi del nuovo GDPR del 27 aprile 2016.
          </span>
          <span style={{ display: 'block', marginTop: 6, fontSize: 13, color: '#6B7280' }}>
            L'informativa sulla privacy &egrave; consultabile nella sezione{' '}
            <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              style={{ color, fontWeight: 700, textDecoration: 'underline' }}>Privacy Policy</a>.
          </span>
        </span>
      </label>
      {error && <p style={{ fontSize: 12.5, color: '#DC2626', fontWeight: 600, margin: '6px 0 0 28px' }}>{error}</p>}
    </div>
  )
}
