import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const CNA_LOGO = 'https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png'

// Icone SVG inline colorate
function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#003DA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  )
}
function IconLock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#003DA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}
function IconEye({ off }) {
  return off ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  )
}
function IconArrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  )
}
function IconSpinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" style={{animation:'spin .8s linear infinite', transformOrigin:'12px 12px'}}/>
    </svg>
  )
}

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword]     = useState('')
  const [showPwd, setShowPwd]       = useState(false)
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const { signIn }                  = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: authError } = await signIn(identifier, password)
    if (authError) {
      setError(authError.message || 'Credenziali non valide. Riprova.')
      setLoading(false)
    }
    // Se ok, signIn naviga — loading rimane true mentre si carica /admin
  }

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Logo */}
        <div style={s.logoWrap}>
          <img src={CNA_LOGO} alt="CNA Roma" style={s.logo} />
        </div>

        <div style={s.divider} />

        {/* Titolo */}
        <h1 style={s.title}>EVENTI</h1>
        <p style={s.subtitle}>Portale di gestione eventi</p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={s.form}>

          {/* Username / email */}
          <div style={s.field}>
            <label style={s.label}>Email o username</label>
            <div style={s.inputWrap}>
              <span style={s.inputIcon}><IconUser /></span>
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="username oppure email@cnaroma.it"
                required
                autoComplete="username"
                style={s.input}
                onFocus={e => e.target.style.borderColor = '#003DA5'}
                onBlur={e => e.target.style.borderColor = '#D1D5DB'}
              />
            </div>
          </div>

          {/* Password */}
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <div style={s.inputWrap}>
              <span style={s.inputIcon}><IconLock /></span>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{ ...s.input, paddingRight: '44px' }}
                onFocus={e => e.target.style.borderColor = '#003DA5'}
                onBlur={e => e.target.style.borderColor = '#D1D5DB'}
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} style={s.eyeBtn}>
                <IconEye off={showPwd} />
              </button>
            </div>
          </div>

          {error && <div style={s.errorBox}>{error}</div>}

          <button type="submit" disabled={loading} style={{ ...s.submitBtn, opacity: loading ? 0.75 : 1 }}>
            {loading ? <><IconSpinner /><span>Accesso in corso…</span></> : <><IconArrow /><span>Accedi</span></>}
          </button>

        </form>
      </div>

      <p style={s.footer}>© {new Date().getFullYear()} CNA Roma — Area Riservata</p>

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F4F5F7',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '24px',
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '48px 40px',
    width: '100%', maxWidth: '420px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 8px 32px rgba(0,61,165,0.10)',
  },
  logoWrap: { display: 'flex', justifyContent: 'center', marginBottom: '24px' },
  logo: { height: '52px', objectFit: 'contain' },
  divider: { height: '1px', backgroundColor: '#E5E7EB', marginBottom: '28px' },
  title: {
    fontSize: '28px',
    fontWeight: '900',
    color: '#0A0A0A',
    letterSpacing: '-0.04em',
    margin: '0 0 6px',
    textAlign: 'center',
    fontFamily: "'Inter', sans-serif",
  },
  subtitle: {
    fontSize: '14px',
    fontWeight: '400',
    fontStyle: 'italic',
    color: '#6B7280',
    margin: '0 0 32px',
    textAlign: 'center',
    fontFamily: "'Inter', sans-serif",
  },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151', letterSpacing: '-0.01em' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: {
    position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
    display: 'flex', alignItems: 'center', pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '10px 14px 10px 40px',
    border: '1.5px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '16px',
    fontFamily: "'Inter', sans-serif",
    color: '#0A0A0A',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
    backgroundColor: '#FAFAFA',
  },
  eyeBtn: {
    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#9CA3AF', display: 'flex', alignItems: 'center', padding: 0,
  },
  errorBox: {
    backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
    borderRadius: '6px', padding: '10px 14px',
    fontSize: '13px', color: '#DC2626', fontWeight: '500',
  },
  submitBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    background: 'linear-gradient(135deg, #003DA5, #1a56db)',
    color: '#FFFFFF', border: 'none', borderRadius: '8px',
    padding: '13px 24px', fontSize: '15px', fontWeight: '700',
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer', letterSpacing: '-0.01em',
    boxShadow: '0 4px 14px rgba(0,61,165,.30)',
    transition: 'opacity .15s',
    marginTop: '4px',
  },
  footer: { marginTop: '24px', fontSize: '12px', color: '#9CA3AF', textAlign: 'center' },
}
