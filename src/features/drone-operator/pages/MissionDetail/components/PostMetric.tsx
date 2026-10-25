export function PostMetric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '7px 9px',
        borderRadius: 7,
        border: '1px solid var(--bd)',
        background: 'var(--sf2)',
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 2 }}>
        {label}
      </div>
      <div
        style={{
          fontWeight: 700,
          fontSize: 12.5,
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
