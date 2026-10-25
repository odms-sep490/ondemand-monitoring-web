export function PostflightErrorBanner({ error }: { error: string }) {
  return (
    <div
      role="alert"
      style={{
        padding: '12px 16px',
        borderRadius: 10,
        background: 'var(--red-bg, #fef2f2)',
        border: '1.5px solid var(--red-dot, #ef4444)',
        color: 'var(--red-fg, #b91c1c)',
        fontSize: 13.5,
        fontWeight: 600,
      }}
    >
      ⚠️ {error}
    </div>
  )
}
