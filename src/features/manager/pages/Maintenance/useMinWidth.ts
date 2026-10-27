import { useEffect, useState } from 'react'

/** True while the viewport is at least `px` wide (false when matchMedia is unavailable). */
export function useMinWidth(px: number): boolean {
  const query = `(min-width: ${px}px)`
  const read = () =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false
  const [matches, setMatches] = useState(read)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}
