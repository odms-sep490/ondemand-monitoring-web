import type { ReactNode } from 'react'

export function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div
      className="mds-info-row"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(104px, auto) minmax(0, 1fr)',
        alignItems: 'start',
        gap: 10,
        padding: '6px 0',
        fontSize: 13.5,
        borderTop: '1px solid var(--bd)',
      }}
    >
      <span
        style={{
          color: 'var(--tx2)',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          lineHeight: 1.4,
        }}
      >
        <span className="mds-info-icon" aria-hidden="true">
          {icon}
        </span>
        {label}
      </span>
      <span
        style={{
          fontWeight: 600,
          textAlign: 'right',
          color: 'var(--tx)',
          minWidth: 0,
          overflowWrap: 'anywhere',
          lineHeight: 1.4,
        }}
      >
        {value}
      </span>
    </div>
  )
}
