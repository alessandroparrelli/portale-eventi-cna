import { useEffect } from 'react'

const SUFFIX = '— CNA di Roma'

/**
 * Imposta il titolo della scheda del browser.
 * Formato: "<titolo> — CNA di Roma"
 * Se titolo è vuoto/null usa solo "CNA di Roma"
 */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} ${SUFFIX}` : `CNA di Roma`
    return () => { document.title = 'CNA di Roma' }
  }, [title])
}
