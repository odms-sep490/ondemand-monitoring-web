import type { ReactNode } from 'react'

export function AvailabilityBanner({
  tone,
  children,
}: {
  tone: 'green' | 'red' | 'yellow'
  children: ReactNode
}) {
  return (
    <div
      role={tone === 'red' ? 'alert' : 'status'}
      style={{
        padding: '10px 14px',
        borderRadius: 8,
        background: `var(--${tone}-bg)`,
        color: `var(--${tone}-fg)`,
        border: `1px solid var(--${tone}-dot)`,
        fontSize: 13,
      }}
    >
      {children}
    </div>
  )
}
