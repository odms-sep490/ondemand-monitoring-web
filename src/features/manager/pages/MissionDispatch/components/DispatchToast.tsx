export function DispatchToast({ toast }: { toast: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: 'var(--green-solid, #22c55e)',
        color: '#fff',
        borderRadius: 8,
        padding: '12px 20px',
        maxWidth: 420,
        boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
        fontSize: 14,
        fontWeight: 500,
        lineHeight: 1.5,
      }}
    >
      {toast}
    </div>
  )
}
