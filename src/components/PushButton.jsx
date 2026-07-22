import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'

const PUSH_URL = 'https://hnkhckcclgabunkqfmrz.supabase.co/functions/v1/web-push'
// Chiave pubblica VAPID — generata con web-push generate-vapid-keys
// Usa una stringa placeholder finché non configuri le VAPID keys nei secrets Supabase
const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjZJVcO5c'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export default function PushButton({ eventId = null, tipo = 'calendario', label, labelOff, variant = 'full' }) {
  const [state, setState] = useState('idle') // idle | subscribed | loading | unsupported
  const [error, setError] = useState(null)

  useEffect(() => {
    checkState()
    // Registra SW se non già registrato
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  async function checkState() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported'); return
    }
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    setState(sub ? 'subscribed' : 'idle')
  }

  async function toggle() {
    if (state === 'loading') return
    setState('loading')
    setError(null)
    try {
      if (state === 'subscribed') {
        // Unsubscribe
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await fetch(PUSH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'unsubscribe', subscription: sub.toJSON() })
          })
          await sub.unsubscribe()
        }
        setState('idle')
      } else {
        // Subscribe
        const perm = await Notification.requestPermission()
        if (perm !== 'granted') { setState('idle'); setError('Permesso negato'); return }
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_KEY)
        })
        await fetch(PUSH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'subscribe',
            subscription: sub.toJSON(),
            event_id: eventId,
            tipo
          })
        })
        setState('subscribed')
      }
    } catch (e) {
      console.error(e)
      setState('idle')
      setError('Errore — riprova')
    }
  }

  if (state === 'unsupported') return null

  const isOn = state === 'subscribed'
  const isLoading = state === 'loading'

  if (variant === 'icon') {
    return (
      <button onClick={toggle} disabled={isLoading} title={isOn ? 'Disattiva notifiche' : 'Attiva notifiche'}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '38px', height: '38px', borderRadius: '8px', border: '1px solid',
          borderColor: isOn ? '#E11D48' : '#E5E7EB',
          backgroundColor: isOn ? '#EFF6FF' : '#ffffff',
          cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}>
        {isLoading
          ? <Loader2 size={16} style={{ color: '#9CA3AF', animation: 'spin 1s linear infinite' }} />
          : isOn
            ? <Bell size={16} style={{ color: '#E11D48' }} />
            : <BellOff size={16} style={{ color: '#9CA3AF' }} />
        }
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </button>
    )
  }

  return (
    <div>
      <button onClick={toggle} disabled={isLoading}
        style={{ display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 18px', borderRadius: '8px', border: '1px solid',
          borderColor: isOn ? '#E11D48' : '#E5E7EB',
          backgroundColor: isOn ? '#EFF6FF' : '#ffffff',
          color: isOn ? '#E11D48' : '#374151',
          fontSize: '14px', fontWeight: '600', cursor: 'pointer',
          fontFamily: "'Outfit',sans-serif", transition: 'all 0.15s',
          opacity: isLoading ? 0.7 : 1 }}>
        {isLoading
          ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          : isOn ? <Bell size={16} /> : <BellOff size={16} />
        }
        {isLoading ? 'Un momento…' : isOn ? (labelOff || 'Notifiche attive') : (label || 'Ricevi notifiche')}
      </button>
      {error && <p style={{ fontSize: '12px', color: '#DC2626', margin: '6px 0 0' }}>{error}</p>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
