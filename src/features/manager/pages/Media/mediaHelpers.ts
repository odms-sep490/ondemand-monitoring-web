import { mediaPageMessages } from './MediaPage.messages'

// ── helpers ────────────────────────────────────────────────────────────────

export function formatAge(
  iso: string,
  t: (typeof mediaPageMessages)['vi']['age'],
): string {
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return t.minsAgo(mins)
  const hours = Math.floor(ms / 3600000)
  if (hours < 24) return t.hoursAgo(hours)
  return t.daysAgo(Math.floor(ms / 86400000))
}

export function formatVnDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export const OVERLAY_STYLE: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(6,9,14,.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50,
}

export const DLG_STYLE: React.CSSProperties = {
  background: 'var(--sf)',
  border: '1px solid var(--bd)',
  borderRadius: 12,
  boxShadow: '0 24px 64px rgba(0,0,0,.35)',
  overflow: 'hidden',
}

export const DLG_HEAD_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  padding: '16px 18px 10px',
}

export const DLG_BODY_STYLE: React.CSSProperties = {
  padding: '4px 18px 16px',
}

export const DLG_FOOT_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  padding: '12px 18px',
  borderTop: '1px solid var(--bd)',
  background: 'var(--sf2)',
}
