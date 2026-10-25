import type { ReactNode, CSSProperties } from 'react'

export function GlassPanel({
  children,
  style,
}: {
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        background: 'rgba(8, 13, 24, .66)',
        border: '1px solid rgba(148, 163, 184, .2)',
        boxShadow: '0 16px 40px rgba(0,0,0,.24)',
        borderRadius: 12,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
