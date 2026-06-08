import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(identifier, password)
    if (error) {
      setError('Credenziali non valide. Riprova.')
    } else {
      navigate('/admin')
    }
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <img
            src="https://raw.githubusercontent.com/alessandroparrelli/fileappoggio/main/NUOVO-LOGO-CNA-ROMA-SOLO-ROMA.png"
            alt="CNA Roma"
            style={styles.logo}
          />
        </div>

        <div style={styles.divider} />

        <h1 style={styles.title}>Accesso Admin</h1>
        <p style={styles.subtitle}>Portale Gestione Eventi</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email o username</label>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="email@cnaroma.it oppure username"
              required
              autoComplete="username"
              style={styles.input}
              onFocus={e => e.target.style.borderColor = '#003DA5'}
              onBlur={e => e.target.style.borderColor = '#D1D5DB'}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrap}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ ...styles.input, paddingRight: '44px' }}
                onFocus={e => e.target.style.borderColor = '#003DA5'}
                onBlur={e => e.target.style.borderColor = '#D1D5DB'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={styles.errorBox}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <span style={styles.loadingDots}>Accesso in corso…</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Accedi</span>
              </>
            )}
          </button>
        </form>
      </div>

      <p style={styles.footer}>
        © {new Date().getFullYear()} CNA Roma — Area Riservata
      </p>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F4F5F7',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 24px rgba(0,61,165,0.08)',
  },
  logoWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  logo: {
    height: '56px',
    objectFit: 'contain',
  },
  divider: {
    height: '1px',
    backgroundColor: '#E5E7EB',
    marginBottom: '28px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '900',
    color: '#0A0A0A',
    letterSpacing: '-0.03em',
    margin: '0 0 4px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6B7280',
    margin: '0 0 32px',
    textAlign: 'center',
    fontWeight: '500',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#0A0A0A',
    letterSpacing: '-0.01em',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #D1D5DB',
    borderRadius: '4px',
    fontSize: '15px',
    fontFamily: "'Inter', sans-serif",
    color: '#0A0A0A',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  },
  passwordWrap: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#6B7280',
    display: 'flex',
    alignItems: 'center',
    padding: '0',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '4px',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#DC2626',
    fontWeight: '500',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#003DA5',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: '700',
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer',
    letterSpacing: '-0.01em',
    transition: 'background-color 0.15s',
    marginTop: '4px',
  },
  loadingDots: {
    fontSize: '15px',
  },
  footer: {
    marginTop: '24px',
    fontSize: '12px',
    color: '#9CA3AF',
    textAlign: 'center',
  },
}
