import { memo } from 'react'
import { useRenderDiagnostics } from '../useRenderDiagnostics'
import { useI18n } from '../../../../../shared/i18n'
import { inFlightControlMessages } from './InFlightControl.messages'

export const MissionProgress = memo(function MissionProgress({
  progress,
}: {
  progress: number
}) {
  useRenderDiagnostics('MissionProgress')
  const { t } = useI18n(inFlightControlMessages)
  return (
    <>
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 900,
              color: '#64748b',
              letterSpacing: '.18em',
              textTransform: 'uppercase',
            }}
          >
            {t.missionProgress}
          </span>
          <span
            style={{
              fontSize: 12,
              fontFamily: 'var(--font-data)',
              color: '#4ade80',
              fontWeight: 800,
            }}
          >
            {progress.toFixed(1)}%
          </span>
        </div>
        <div
          style={{
            height: 5,
            borderRadius: 999,
            background: 'rgba(30,41,59,.92)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              borderRadius: 999,
              background: 'linear-gradient(90deg,#16a34a,#22c55e)',
            }}
          />
        </div>
      </div>
    </>
  )
})
