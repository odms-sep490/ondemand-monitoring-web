import { livePageMessages } from '../LivePage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { LiveTelemetry } from '../../../types/missions'

export function LiveActions({ telemetry }: { telemetry: LiveTelemetry }) {
  const { t } = useI18n(livePageMessages)
  return (
    <div style={{ padding: '0 16px 16px' }}>
      <div
        style={{
          border: '1px solid var(--bd)',
          borderRadius: 8,
          overflow: 'hidden',
          background: 'var(--sf)',
        }}
      >
        <div
          style={{
            padding: '10px 14px',
            borderBottom: '1px solid var(--bd)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {t.livestream.title}
          {telemetry.livestream?.isLive && (
            <span
              style={{
                background: 'var(--red-solid)',
                color: 'var(--red-on)',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 4,
                letterSpacing: '0.05em',
              }}
            >
              LIVE
            </span>
          )}
        </div>
        {telemetry.livestream?.isLive ? (
          <div style={{ position: 'relative' }}>
            {/* PROPOSED: video element placeholder — no real WebRTC [evd/00-PLAN.md §8] */}
            <video
              style={{
                width: '100%',
                aspectRatio: '16/9',
                background: '#000',
                display: 'block',
              }}
              poster=""
              aria-label={t.livestream.videoPlaceholder}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,.6)',
                fontSize: 13,
                background: 'rgba(0,0,0,.5)',
              }}
            >
              {t.livestream.noConnection}
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: 'var(--tx3)',
              fontSize: 13,
            }}
          >
            {t.livestream.noSession}
          </div>
        )}
      </div>
    </div>
  )
}
