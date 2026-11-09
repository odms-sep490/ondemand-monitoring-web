import { useEffect, useState } from 'react'

const isDark = () => document.documentElement.dataset.theme === 'dark'

/** Follows `<html data-theme>`, which both the manager and operator shells toggle. */
export function useDocumentDark(): boolean {
  const [dark, setDark] = useState(isDark)
  useEffect(() => {
    const observer = new MutationObserver(() => setDark(isDark()))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  }, [])
  return dark
}
