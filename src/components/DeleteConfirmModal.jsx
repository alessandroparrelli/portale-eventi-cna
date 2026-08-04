import { useState, useEffect } from 'react'

/**
 * DeleteConfirmModal — alert di sicurezza per eliminazioni irreversibili.
 *
 * Props:
 *  - isOpen      : bool
 *  - onClose     : () => void
 *  - onConfirm   : () => void
 *  - title       : string  — es. "Elimina landing page"
 *  - description : string  — es. "Stai per eliminare..."
 *  - confirmWord : string? — se fornito, l'utente deve digitarlo per confermare
 *  - loading     : bool?
 */
export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, title, description, confirmWord, loading }) {
  const [typed, setTyped] = useState('')

  useEffect(() => {
    if (!isOpen) setTyped('')
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const needsTyping = !!confirmWord
  const canConfirm = !needsTyping || typed.trim() === confirmWord.trim()

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(17,24,39,0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn .18s ease',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0,0,0,.18)',
        animation: 'slideUp .2s cubic-bezier(.34,1.1,.64,1)',
        overflow: 'hidden',
      }}>

        {/* Header rosso */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid #FEE2E2',
          display: 'flex', alignItems: 'flex-start', gap: '14px',
          background: '#FFF5F5',
        }}>
          {/* Icona cestino */}
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: '#FEE2E2', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: '0 0 4px', letterSpacing: '-0.02em', fontFamily: "'Inter',sans-serif" }}>
              {title}
            </h2>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: 1.5, fontFamily: "'Inter',sans-serif" }}>
              {description}
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>

          {/* Warning box */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            background: '#FFF7ED', border: '1px solid #FED7AA',
            borderRadius: '12px', padding: '12px 14px', marginBottom: needsTyping ? '16px' : '0',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p style={{ fontSize: '13px', color: '#92400E', margin: 0, lineHeight: 1.5, fontFamily: "'Inter',sans-serif" }}>
              Questa azione è <strong>irreversibile</strong>. I dati eliminati non potranno essere recuperati.
            </p>
          </div>

          {/* Campo di conferma digitando */}
          {needsTyping && (
            <div style={{ marginTop: '0' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#374151', fontWeight: '500', marginBottom: '6px', fontFamily: "'Inter',sans-serif" }}>
                Digita <strong style={{ color: '#EF4444' }}>{confirmWord}</strong> per confermare:
              </label>
              <input
                type="text"
                value={typed}
                onChange={e => setTyped(e.target.value)}
                placeholder={confirmWord}
                autoFocus
                style={{
                  width: '100%', padding: '10px 14px',
                  border: `1.5px solid ${typed && !canConfirm ? '#FECACA' : typed && canConfirm ? '#86EFAC' : '#E8ECF4'}`,
                  borderRadius: '12px', fontSize: '14px',
                  fontFamily: "'Inter',sans-serif", color: '#111827',
                  outline: 'none', transition: 'border-color .15s',
                  background: '#FAFAFA', boxSizing: 'border-box',
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: '10px', justifyContent: 'flex-end',
          padding: '0 24px 20px',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px', borderRadius: '20px',
              background: '#F3F4F6', border: 'none',
              fontSize: '14px', fontWeight: '600', color: '#374151',
              cursor: 'pointer', fontFamily: "'Inter',sans-serif",
              transition: 'background .12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#E5E7EB'}
            onMouseLeave={e => e.currentTarget.style.background = '#F3F4F6'}
          >
            Annulla
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm || loading}
            style={{
              padding: '10px 20px', borderRadius: '20px',
              background: canConfirm && !loading ? '#EF4444' : '#FCA5A5',
              border: 'none', fontSize: '14px', fontWeight: '600', color: '#fff',
              cursor: canConfirm && !loading ? 'pointer' : 'not-allowed',
              fontFamily: "'Inter',sans-serif",
              transition: 'all .12s',
              boxShadow: canConfirm && !loading ? '0 4px 12px rgba(239,68,68,.35)' : 'none',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {loading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation:'spin .8s linear infinite', transformOrigin:'12px 12px' }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                Eliminando…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                </svg>
                Elimina definitivamente
              </>
            )}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(12px) scale(.97)} to{opacity:1;transform:none} }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}
