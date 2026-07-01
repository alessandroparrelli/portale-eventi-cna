import { useEffect } from 'react'

/**
 * Aggiorna dinamicamente i meta tag Open Graph (og:title, og:description, og:image)
 * per la preview di WhatsApp, Telegram, Facebook ecc.
 */
export function useOGMeta({ title, description, image }) {
  useEffect(() => {
    function setMeta(property, content) {
      if (!content) return
      let el = document.querySelector(`meta[property="${property}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('property', property)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }
    function setNameMeta(name, content) {
      if (!content) return
      let el = document.querySelector(`meta[name="${name}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('name', name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    const suffix = '— CNA Roma'
    const fullTitle = title ? `${title} ${suffix}` : 'CNA Roma'

    if (title) document.title = fullTitle
    setMeta('og:title', fullTitle)
    setMeta('og:description', description || 'Evento organizzato da CNA Roma')
    if (image) setMeta('og:image', image)
    setMeta('og:type', 'website')
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle)
    if (description) setMeta('twitter:description', description)
    if (image) setMeta('twitter:image', image)
    setNameMeta('description', description || 'Evento organizzato da CNA Roma')

    return () => {
      document.title = 'CNA Roma'
      setMeta('og:title', 'Eventi CNA')
      setMeta('og:description', 'Portale gestione eventi CNA Roma')
      setMeta('og:image', '/icon-512.png')
    }
  }, [title, description, image])
}
