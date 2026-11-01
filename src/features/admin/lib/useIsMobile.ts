import { useEffect, useState } from 'react'

const QUERY = '(max-width: 767px)'

function matches(): boolean {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function'
    ? window.matchMedia(QUERY).matches
    : false
}

/** True below 768px, where the admin menu switches from Sider to Drawer. */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(matches)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(QUERY)
    const onChange = () => setMobile(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return mobile
}
