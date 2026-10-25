import { useEffect, useState, type RefObject } from 'react'

export function useViewportActivity(ref: RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(
    typeof IntersectionObserver === 'undefined',
  )
  const [visible, setVisible] = useState(
    () => document.visibilityState === 'visible',
  )

  useEffect(() => {
    const target = ref.current
    if (!target || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [ref])

  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  return inView && visible
}
