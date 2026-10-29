import type { CSSProperties } from 'react'

export const buttonStyle = (tone?: 'danger' | 'amber'): CSSProperties => ({
  width: 46,
  height: 36,
  borderRadius: 8,
  border:
    tone === 'danger'
      ? '1px solid color-mix(in srgb, var(--fc-red) 72%, transparent)'
      : '1px solid color-mix(in srgb, var(--fc-tx2) 18%, transparent)',
  background:
    tone === 'danger'
      ? 'color-mix(in srgb, color-mix(in srgb, var(--fc-red) 24%, var(--fc-panel)) 78%, transparent)'
      : tone === 'amber'
        ? 'color-mix(in srgb, var(--fc-amber) 76%, transparent)'
        : 'color-mix(in srgb, var(--fc-panel) 78%, transparent)',
  color: tone === 'danger' ? 'var(--fc-tx)' : 'var(--fc-tx)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 1,
  fontSize: 8,
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: 'inset 0 1px 0 color-mix(in srgb, black 6%, transparent)',
})

export const toolbarGroupStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  padding: 3,
  borderRadius: 10,
  background: 'color-mix(in srgb, var(--fc-panel) 42%, transparent)',
  border: '1px solid color-mix(in srgb, var(--fc-tx2) 12%, transparent)',
}
