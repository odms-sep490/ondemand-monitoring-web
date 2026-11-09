import type {
  MissionPlanResponse,
  PersistedPostDeviceCheckResponse,
  PreflightCheckItem,
} from '../../types/missions'
import { useI18n } from '../../../../shared/i18n'
import { detailPanelsMessages } from './detailPanels.messages'
import { MetricTile } from './MetricTile'
import {
  formatNumber,
  formatDuration,
  batteryFromPrecheck,
} from './missionDetailHelpers'

export function PlanDetail({
  plan,
  postcheck,
  precheckItems,
}: {
  plan: MissionPlanResponse | null
  postcheck?: PersistedPostDeviceCheckResponse | null
  precheckItems?: PreflightCheckItem[] | null
}) {
  const { t } = useI18n(detailPanelsMessages)
  if (!plan) {
    return <div className="odm-or-empty">{t.noPlan}</div>
  }
  const estimatedUsedPercent =
    plan.estimatedBatteryUsedPercent ??
    (plan.estimatedEnergyMah != null && plan.batteryCapacityMah
      ? (plan.estimatedEnergyMah / plan.batteryCapacityMah) * 100
      : null)
  const remainingBattery =
    plan.estimatedRemainingBatteryPercent ??
    postcheck?.landingBatteryPercent ??
    null
  return (
    <div className="odm-or-detail-grid">
      <MetricTile label={t.algorithm} value={plan.planningAlgorithm} />
      <MetricTile
        label={t.distance}
        value={formatNumber(plan.plannedDistanceM, ' m')}
      />
      <MetricTile
        label={t.duration}
        value={formatDuration(plan.plannedDurationSec)}
      />
      <MetricTile
        label={t.energy}
        value={formatNumber(plan.estimatedEnergyMah, ' mAh')}
      />
      <MetricTile
        label={t.batteryBefore}
        value={formatNumber(
          plan.availableBatteryPercentAtPlanning ??
            batteryFromPrecheck(precheckItems),
          '%',
        )}
      />
      <MetricTile
        label={t.batteryUsed}
        value={formatNumber(estimatedUsedPercent, '%')}
      />
      <MetricTile
        label={t.batteryRemaining}
        value={formatNumber(remainingBattery, '%')}
      />
      <MetricTile
        label={t.maxAltitude}
        value={formatNumber(plan.maxPlannedAltitudeM, ' m')}
      />
      <MetricTile label="Waypoint" value={plan.waypoints?.length ?? 0} />
    </div>
  )
}
