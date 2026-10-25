import type { CSSProperties } from 'react'

export const buttonStyle = (tone?: 'danger' | 'amber'): CSSProperties => ({
  width: 46,
  height: 36,
  borderRadius: 8,
  border:
    tone === 'danger'
      ? '1px solid rgba(248,113,113,.72)'
      : '1px solid rgba(148,163,184,.18)',
  background:
    tone === 'danger'
      ? 'rgba(127,29,29,.78)'
      : tone === 'amber'
        ? 'rgba(180,83,9,.76)'
        : 'rgba(15,23,42,.78)',
  color: tone === 'danger' ? '#fecaca' : '#e5edf8',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 1,
  fontSize: 8,
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)',
})

export const toolbarGroupStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  padding: 3,
  borderRadius: 10,
  background: 'rgba(15, 23, 42, .42)',
  border: '1px solid rgba(148,163,184,.12)',
}
