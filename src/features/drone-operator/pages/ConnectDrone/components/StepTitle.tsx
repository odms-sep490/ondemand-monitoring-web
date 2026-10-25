export function StepTitle({ n, text }: { n: number; text: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'var(--ink)',
          color: 'var(--inkfg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 12.5,
          flex: 'none',
        }}
      >
        {n}
      </span>
      <span style={{ fontWeight: 700, fontSize: 15.5 }}>{text}</span>
    </div>
  )
}
