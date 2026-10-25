export function DroneChip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        height: 32,
        padding: '0 12px',
        borderRadius: 16,
        background: 'var(--sf3)',
        fontWeight: 700,
        fontSize: 13,
        flex: 'none',
      }}
    >
      {label}
    </span>
  )
}
