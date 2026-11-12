import { operatorHref } from '../../../routes'
import { useI18n } from '../../../../../shared/i18n'
import { flightPageMessages } from '../FlightPage.messages'

export function FlightEmptyState({
  tone = 'info',
  title,
  message,
  primaryLabel,
  primaryHref = operatorHref({ screen: 'missions' }),
}: {
  tone?: 'info' | 'error' | 'loading'
  title: string
  message: string
  primaryLabel?: string
  primaryHref?: string
}) {
  const accent =
    tone === 'error'
      ? 'var(--ui-danger)'
      : tone === 'loading'
        ? 'var(--ui-primary)'
        : 'var(--ui-success)'
  const { t } = useI18n(flightPageMessages)
  const resolvedPrimaryLabel = primaryLabel ?? t.backToMissions

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'var(--mgr-bg)',
      }}
    >
      <section
        style={{
          width: 'min(100%, 560px)',
          background: 'var(--mgr-card)',
          border: '1px solid var(--mgr-border)',
          borderRadius: 'var(--mgr-radius)',
          boxShadow: 'var(--mgr-shadow)',
          padding: '34px 36px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 68,
            height: 68,
            margin: '0 auto 18px',
            borderRadius: 20,
            display: 'grid',
            placeItems: 'center',
            color: accent,
            background: `color-mix(in srgb, ${accent} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${accent} 25%, transparent)`,
            fontSize: 32,
            fontWeight: 900,
          }}
          aria-hidden="true"
        >
          {tone === 'loading' ? '…' : tone === 'error' ? '!' : '◎'}
        </div>
        <h1
          style={{ margin: 0, fontSize: 28, lineHeight: 1.1, color: 'var(--mgr-text)' }}
        >
          {title}
        </h1>
        <p
          style={{
            margin: '12px auto 0',
            maxWidth: 430,
            color: 'var(--mgr-muted)',
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>
        <div
          style={{
            marginTop: 24,
            display: 'flex',
            justifyContent: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <a
            href={primaryHref}
            style={{
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 18px',
              borderRadius: 10,
              background: 'var(--ui-primary)',
              color: 'var(--ui-on-primary)',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 12px 28px rgba(31,111,235,.24)',
            }}
          >
            {resolvedPrimaryLabel}
          </a>
          <a
            href={operatorHref({ screen: 'preflight' })}
            style={{
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 18px',
              borderRadius: 10,
              background: 'var(--mgr-card)',
              color: 'var(--mgr-text)',
              border: '1px solid var(--mgr-border)',
              fontWeight: 800,
              textDecoration: 'none',
            }}
          >
            {t.throughPreflight}
          </a>
        </div>
      </section>
    </main>
  )
}
