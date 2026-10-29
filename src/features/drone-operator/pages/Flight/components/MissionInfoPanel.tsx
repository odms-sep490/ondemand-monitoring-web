import { memo } from 'react'
import type { ControlStatus } from '../inFlightTypes'
import type { Mission } from '../../../types/omss'
import { useRenderDiagnostics } from '../useRenderDiagnostics'
import { useI18n } from '../../../../../shared/i18n'
import { inFlightControlMessages } from './InFlightControl.messages'
import { GlassPanel } from './GlassPanel'
import { FlightPlanGuide } from './FlightPlanGuide'

export const MissionInfoPanel = memo(function MissionInfoPanel({
  status,
  progress,
  mission,
}: {
  status: ControlStatus | null
  progress: number
  mission: Mission
}) {
  useRenderDiagnostics('MissionInfo')
  const { t } = useI18n(inFlightControlMessages)
  const yaw =
    typeof status?.yawDeg === 'number' && Number.isFinite(status.yawDeg)
      ? `${Math.round(status.yawDeg)}°`
      : '--'
  const distance =
    typeof mission.distanceKm === 'number' &&
    Number.isFinite(mission.distanceKm)
      ? `${mission.distanceKm.toFixed(1)} km`
      : '--'
  const routePointCount = mission.routePoints?.length ?? 0
  const routePoints = (mission.routePoints ?? [])
    .slice()
    .sort((a, b) => a.sequence - b.sequence)

  return (
    <GlassPanel
      style={{
        width: '100%',
        height: 'auto',
        minHeight: 'fit-content',
        flexShrink: 0,
        overflow: 'hidden',
        padding: 10,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 950,
          color: 'var(--fc-tx)',
          marginBottom: 8,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
        }}
      >
        {t.missionInfo.title}
      </div>
      {(
        [
          {
            id: 'mission',
            label: t.missionInfo.mission,
            value: mission.id,
            mono: false,
          },
          {
            id: 'order',
            label: t.missionInfo.order,
            value: mission.orderRef,
            mono: false,
          },
          {
            id: 'progress',
            label: t.missionInfo.progress,
            value: `${progress.toFixed(1)}%`,
            mono: true,
          },
          {
            id: 'distance',
            label: t.missionInfo.distance,
            value: distance,
            mono: true,
          },
          {
            id: 'points',
            label: t.missionInfo.points,
            value: routePointCount > 0 ? `${routePointCount}` : '--',
            mono: false,
          },
          {
            id: 'maxAlt',
            label: t.missionInfo.maxAlt,
            value: `${mission.maxAltitudeM.toFixed(0)} m`,
            mono: false,
          },
          {
            id: 'heading',
            label: t.missionInfo.heading,
            value: yaw,
            mono: true,
          },
          {
            id: 'auto',
            label: t.missionInfo.auto,
            value: status?.autoPlan?.active
              ? t.missionInfo.waypointCount(
                  status.autoPlan.currentIndex ?? 0,
                  status.autoPlan.total ?? routePointCount,
                )
              : (status?.autoPlan?.status ?? t.missionInfo.manual),
            mono: false,
          },
        ] as const
      ).map(({ id, label, value, mono }) => (
        <div
          key={id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 4,
          }}
        >
          <span style={{ color: 'var(--fc-tx2)', fontSize: 11 }}>{label}</span>
          <strong
            style={{
              minWidth: 0,
              color: 'var(--fc-tx)',
              fontSize: 12,
              fontFamily: mono ? 'var(--font-data)' : 'var(--font-ui)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'right',
            }}
          >
            {value}
          </strong>
        </div>
      ))}
      <FlightPlanGuide routePoints={routePoints} />
    </GlassPanel>
  )
})
