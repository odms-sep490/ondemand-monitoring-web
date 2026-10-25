import type { Language } from '../../../../shared/i18n/languageStore'
import type { PostflightCategoryDef } from './postflightTypes'
import { postflightPageMessages } from './PostflightPage.messages'
import type { PostflightItemKey } from '../../types/mission'
import type { FlightControlStatus } from '../../api/flightControlApi'

/** Bilingual postflight categories. `key`/`backendKeys`/`icon` stay stable across languages. */
export function postflightCategories(lang: Language): PostflightCategoryDef[] {
  const t = postflightPageMessages[lang].categories
  return [
    {
      title: t.structure.title,
      icon: '🛡️',
      items: [
        {
          key: 'physical_condition_ok',
          ...t.structure.items.physical_condition_ok,
          backendKeys: ['a1', 'a2'],
        },
      ],
    },
    {
      title: t.power.title,
      icon: '⚡',
      items: [
        {
          key: 'motor_ok',
          ...t.power.items.motor_ok,
          backendKeys: ['p1', 'p2'],
        },
        { key: 'battery_ok', ...t.power.items.battery_ok, backendKeys: ['e1'] },
      ],
    },
    {
      title: t.sensors.title,
      icon: '📷',
      items: [
        { key: 'camera_ok', ...t.sensors.items.camera_ok, backendKeys: ['e2'] },
      ],
    },
    {
      title: t.gcs.title,
      icon: '📡',
      items: [
        { key: 'gps_ok', ...t.gcs.items.gps_ok, backendKeys: ['e3'] },
        {
          key: 'communication_ok',
          ...t.gcs.items.communication_ok,
          backendKeys: ['d1'],
        },
      ],
    },
  ]
}

export const ALL_KEYS: PostflightItemKey[] = [
  'physical_condition_ok',
  'motor_ok',
  'battery_ok',
  'camera_ok',
  'gps_ok',
  'communication_ok',
]

export const postflightTelemetryKey = (missionId: string) =>
  `fieldwise.operator.postflightTelemetry.${missionId}`

export function readPostflightTelemetry(
  missionId: string,
): FlightControlStatus | null {
  if (!missionId) return null
  try {
    const raw = window.sessionStorage.getItem(postflightTelemetryKey(missionId))
    if (!raw) return null
    return JSON.parse(raw) as FlightControlStatus
  } catch {
    return null
  }
}

export function isUsablePostflightTelemetry(
  status: FlightControlStatus,
  missionId: string,
) {
  const matchesMission = !status.missionId || status.missionId === missionId
  return (
    matchesMission &&
    typeof status.batteryPercent === 'number' &&
    Number.isFinite(status.batteryPercent)
  )
}

export function removeStorageByPrefix(storage: Storage, prefix: string) {
  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index)
    if (key?.startsWith(prefix)) storage.removeItem(key)
  }
}

export function clearCompletedMissionState(
  missionId: string,
  missionLabel: string,
  deviceId: string,
) {
  window.sessionStorage.removeItem(postflightTelemetryKey(missionId))
  window.sessionStorage.removeItem(
    `fieldwise.operator.handoverAcknowledged.${missionId}`,
  )
  window.sessionStorage.removeItem('odm.operator.autoStartSimulation')
  removeStorageByPrefix(
    window.sessionStorage,
    `omss.droneOperator.backendPreflightToken.${missionId}.`,
  )
  window.localStorage.removeItem(
    `omss.droneOperator.preflightReady.${missionLabel}.${deviceId}`,
  )
  window.localStorage.removeItem(
    `omss.droneOperator.preflightReady.${missionId}.${deviceId}`,
  )
}

/** Rounds raw telemetry (e.g. 0.0016679763793945312) to a readable value. */
export function formatMetric(
  value: number | null | undefined,
  unit: string,
  digits: number,
): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return `--${unit}`
  return `${value.toFixed(digits)}${unit}`
}
