import { memo, Fragment } from 'react'
import type { ControlStatus } from '../inFlightTypes'
import { useRenderDiagnostics } from '../useRenderDiagnostics'
import { useI18n } from '../../../../../shared/i18n'
import { inFlightControlMessages } from './InFlightControl.messages'
import { getLidarFresh, getLidarMetric } from '../lidarHelpers'
import { GlassPanel } from './GlassPanel'
import { Icon } from './Icon'

export const LidarDetailPanel = memo(function LidarDetailPanel({
  status,
}: {
  status: ControlStatus | null
}) {
  useRenderDiagnostics('LidarDetailPanel')
  const { t } = useI18n(inFlightControlMessages)
  const lidar = status?.lidar
  const fresh = getLidarFresh(lidar)
  const rows = [
    [
      t.lidarDetail.rows.status,
      fresh
        ? (lidar?.status ?? t.lidarDetail.statusClear)
        : t.lidarDetail.statusWaiting,
    ],
    [
      t.lidarDetail.rows.action,
      lidar?.status === 'OBSTACLE'
        ? t.lidarDetail.actionAvoid
        : t.lidarDetail.actionContinue,
    ],
    [t.lidarDetail.rows.front, getLidarMetric(lidar?.frontM)],
    [t.lidarDetail.rows.frontLeft, getLidarMetric(lidar?.frontLeftM)],
    [t.lidarDetail.rows.frontRight, getLidarMetric(lidar?.frontRightM)],
    [t.lidarDetail.rows.left, getLidarMetric(lidar?.leftM)],
    [t.lidarDetail.rows.right, getLidarMetric(lidar?.rightM)],
    [t.lidarDetail.rows.back, getLidarMetric(lidar?.backM)],
    [t.lidarDetail.rows.nearest, getLidarMetric(lidar?.nearestM)],
    [
      t.lidarDetail.rows.direction,
      lidar?.nearestDirection ?? lidar?.direction ?? '--',
    ],
    [t.lidarDetail.rows.range, getLidarMetric(lidar?.rangeMaxM)],
    [
      t.lidarDetail.rows.scanAge,
      lidar?.scanAgeS != null ? `${lidar.scanAgeS.toFixed(1)}s` : '--',
    ],
  ]

  return (
    <GlassPanel
      style={{
        width: '100%',
        padding: 12,
        border: fresh
          ? '1px solid rgba(34,211,238,.28)'
          : '1px solid rgba(251,191,36,.35)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            color: fresh ? '#67e8f9' : '#fbbf24',
            fontSize: 12,
            fontWeight: 950,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
          }}
        >
          <Icon name="radar" size={14} />
          {t.lidarDetail.title}
        </span>
        <strong style={{ color: fresh ? '#bbf7d0' : '#fde68a', fontSize: 10 }}>
          {lidar?.enabled ? t.lidarDetail.on : t.lidarDetail.off}
        </strong>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 7 }}>
        {rows.map(([label, value]) => (
          <Fragment key={label}>
            <span style={{ color: '#94a3b8', fontSize: 11 }}>{label}</span>
            <strong
              style={{
                color: '#e5edf8',
                fontSize: 11,
                fontFamily: 'var(--font-data)',
                textAlign: 'right',
              }}
            >
              {value}
            </strong>
          </Fragment>
        ))}
      </div>
    </GlassPanel>
  )
})
