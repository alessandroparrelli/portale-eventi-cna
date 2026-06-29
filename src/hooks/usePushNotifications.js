import { useState, useEffect } from 'react'

const PUSH_URL = 'https://hnkhckcclgabunkqfmrz.supabase.co/functions/v1/web-push'

export function usePushNotifications() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window)
    checkSubscription()
  }, [])

  async function checkSubscription() {
    if (!('serviceWorker' in navigator)) return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    setSubscribed(!!sub)
  }

  async function subscribe() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
      })
      await fetch(PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'subscribe', subscription: sub.toJSON() })
      })
      setSubscribed(true)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function unsubscribe() {
    setLoading(true)
    try {
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
      setSubscribed(false)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  return { supported, subscribed, loading, subscribe, unsubscribe }
}
