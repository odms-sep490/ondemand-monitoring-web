type BatteryTelemetry = {
  batteryPercent?: number | null
  rawPx4BatteryPercent?: number | null
}

function finitePercent(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.max(0, Math.min(100, value))
}

/**
 * Gazebo publishes the aircraft battery through PX4 telemetry. The flight
 * controller also exposes an internal simulated battery model, which may
 * still be at 100% when a cockpit is first opened. Prefer the aircraft value
 * so preflight and cockpit always show the same source of truth.
 */
export function resolveCockpitBatteryPercent(status: BatteryTelemetry | null) {
  const px4Battery = finitePercent(status?.rawPx4BatteryPercent)
  if (px4Battery !== null) return px4Battery
  return finitePercent(status?.batteryPercent)
}
