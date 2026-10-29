import { memo } from 'react'
import { useRenderDiagnostics } from '../useRenderDiagnostics'
import { useI18n } from '../../../../../shared/i18n'
import { inFlightControlMessages } from './InFlightControl.messages'
import { GlassPanel } from './GlassPanel'

export const CameraFeed = memo(function CameraFeed({
  streamUrl,
  preflightReady,
  isOnline,
  onOnline,
  onOffline,
}: {
  streamUrl: string
  preflightReady: boolean
  isOnline: boolean
  onOnline: () => void
  onOffline: () => void
}) {
  useRenderDiagnostics('CameraFeed')
  const { t } = useI18n(inFlightControlMessages)
  return (
    <>
      <img
        src={streamUrl}
        alt={t.cameraFeed.alt}
        onLoad={onOnline}
        onError={onOffline}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          display: 'block',
          background: 'var(--fc-bg)',
        }}
      />
      {!isOnline && preflightReady && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            background: 'color-mix(in srgb, var(--fc-bg) 72%, transparent)',
          }}
        >
          <GlassPanel style={{ padding: '18px 22px', textAlign: 'center' }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                color: 'var(--fc-tx)',
                marginBottom: 7,
              }}
            >
              {t.cameraFeed.offlineTitle}
            </div>
            <div style={{ fontSize: 12, color: 'var(--fc-tx2)' }}>
              {t.cameraFeed.offlineBody}
            </div>
          </GlassPanel>
        </div>
      )}
    </>
  )
})
