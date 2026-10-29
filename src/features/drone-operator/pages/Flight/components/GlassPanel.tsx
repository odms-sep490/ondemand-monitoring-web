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
        background: 'color-mix(in srgb, var(--fc-bg) 66%, transparent)',
        border: '1px solid color-mix(in srgb, var(--fc-tx2) 20%, transparent)',
        boxShadow: '0 16px 40px color-mix(in srgb, black 24%, transparent)',
        borderRadius: 12,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
