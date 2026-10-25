import type {
  MissionPlanResponse,
  PersistedPostDeviceCheckResponse,
  PreflightCheckItem,
} from '../../types/missions'
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
  if (!plan) {
    return <div className="odm-or-empty">Chưa có kế hoạch bay.</div>
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
      <MetricTile label="Thuật toán" value={plan.planningAlgorithm} />
      <MetricTile
        label="Quãng đường"
        value={formatNumber(plan.plannedDistanceM, ' m')}
      />
      <MetricTile
        label="Thời lượng"
        value={formatDuration(plan.plannedDurationSec)}
      />
      <MetricTile
        label="Năng lượng"
        value={formatNumber(plan.estimatedEnergyMah, ' mAh')}
      />
      <MetricTile
        label="Pin trước bay"
        value={formatNumber(
          plan.availableBatteryPercentAtPlanning ??
            batteryFromPrecheck(precheckItems),
          '%',
        )}
      />
      <MetricTile
        label="Pin dùng dự kiến"
        value={formatNumber(estimatedUsedPercent, '%')}
      />
      <MetricTile
        label="Pin còn lại"
        value={formatNumber(remainingBattery, '%')}
      />
      <MetricTile
        label="Độ cao tối đa"
        value={formatNumber(plan.maxPlannedAltitudeM, ' m')}
      />
      <MetricTile label="Waypoint" value={plan.waypoints?.length ?? 0} />
    </div>
  )
}
