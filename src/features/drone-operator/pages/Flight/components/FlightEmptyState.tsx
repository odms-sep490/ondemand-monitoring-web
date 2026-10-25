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
    tone === 'error' ? '#dc2626' : tone === 'loading' ? '#2563eb' : '#16a34a'
  const { t } = useI18n(flightPageMessages)
  const resolvedPrimaryLabel = primaryLabel ?? t.backToMissions

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background:
          'radial-gradient(circle at 18% 12%, rgba(37,99,235,.13), transparent 32%), radial-gradient(circle at 82% 20%, rgba(22,163,74,.12), transparent 30%), #f3f6fb',
      }}
    >
      <section
        style={{
          width: 'min(100%, 560px)',
          background: '#fff',
          border: '1px solid #d9e2ef',
          borderRadius: 18,
          boxShadow: '0 24px 70px rgba(15,23,42,.12)',
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
            background: `${accent}18`,
            border: `1px solid ${accent}35`,
            fontSize: 32,
            fontWeight: 900,
          }}
          aria-hidden="true"
        >
          {tone === 'loading' ? '…' : tone === 'error' ? '!' : '◎'}
        </div>
        <h1
          style={{ margin: 0, fontSize: 28, lineHeight: 1.1, color: '#07142b' }}
        >
          {title}
        </h1>
        <p
          style={{
            margin: '12px auto 0',
            maxWidth: 430,
            color: '#53627a',
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
              background: '#1f6feb',
              color: '#fff',
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
              background: '#fff',
              color: '#1f3151',
              border: '1px solid #c8d4e6',
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
