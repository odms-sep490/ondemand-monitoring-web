import { useLayoutEffect, useRef, useState } from 'react'

export type PickerPlacement = { up: boolean; end: boolean }

/**
 * Keeps an absolutely positioned picker panel anchored to its trigger but
 * inside the viewport: flips above the trigger when there is no room below
 * (and more room above), and right-aligns when it would overflow to the right.
 */
export function usePickerPlacement() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [placement, setPlacement] = useState<PickerPlacement>({
    up: false,
    end: false,
  })

  useLayoutEffect(() => {
    const panel = ref.current
    const anchor = panel?.parentElement
    if (!panel || !anchor) return
    function measure() {
      if (!panel || !anchor) return
      const box = panel.getBoundingClientRect()
      const host = anchor.getBoundingClientRect()
      const height = box.height
      const spaceBelow = window.innerHeight - host.bottom - 8
      const spaceAbove = host.top - 8
      const up = height > spaceBelow && spaceAbove > spaceBelow
      const end = host.left + box.width > window.innerWidth - 8
      setPlacement((prev) =>
        prev.up === up && prev.end === end ? prev : { up, end },
      )
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const className = `${placement.up ? ' is-up' : ''}${placement.end ? ' is-end' : ''}`
  return { ref, className }
}
