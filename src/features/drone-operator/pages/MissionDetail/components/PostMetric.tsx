export function PostMetric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '9px 11px',
        borderRadius: 7,
        border: '1px solid var(--bd)',
        background: 'var(--sf2)',
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 13, color: 'var(--tx3)', marginBottom: 3 }}>
        {label}
      </div>
      <div
        style={{
          fontWeight: 700,
          fontSize: 15,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </div>
    </div>
  )
}
