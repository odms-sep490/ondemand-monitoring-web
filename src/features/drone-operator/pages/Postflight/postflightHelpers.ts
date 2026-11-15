import type { Language } from '../../../../shared/i18n/languageStore'
import type { PostflightCategoryDef } from './postflightTypes'
import { postflightPageMessages } from './PostflightPage.messages'
import type { PostflightItemKey } from '../../types/mission'

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

export function clearCompletedMissionState(
  missionId: string,
  missionLabel: string,
  deviceId: string,
) {
  window.sessionStorage.removeItem(
    `fieldwise.operator.handoverAcknowledged.${missionId}`,
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
