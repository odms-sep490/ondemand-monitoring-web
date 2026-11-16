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
        {
          key: 'battery_ok',
          ...t.power.items.battery_ok,
          backendKeys: ['e1', 'e4'],
        },
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

type RunItem = {
  checkType?: string | null
  checkName?: string | null
  description?: string | null
  category?: string | null
}

/**
 * Builds categories from the backend run's items (admin-configured criteria),
 * in the order returned. Built-in codes reuse the localized labels; others use
 * the backend name/description. Falls back to the hardcoded list when empty.
 */
export function postflightCategoriesFromRun(
  lang: Language,
  runItems: RunItem[] | null | undefined,
): PostflightCategoryDef[] {
  const items = (runItems ?? []).filter((item) => item.checkType)
  const fallback = postflightCategories(lang)
  if (items.length === 0) return fallback

  const builtIn = new Map<string, PostflightCategoryDef['items'][number]>()
  for (const cat of fallback) {
    for (const item of cat.items) {
      for (const code of item.backendKeys) builtIn.set(code.toLowerCase(), item)
    }
  }
  const usedBuiltIn = new Set<string>()
  const otherTitle = postflightPageMessages[lang].otherCategory
  const groups = new Map<string, PostflightCategoryDef>()
  for (const run of items) {
    const code = String(run.checkType)
    const local = builtIn.get(code.toLowerCase())
    const useLocal = local && !usedBuiltIn.has(local.key)
    if (local) usedBuiltIn.add(local.key)
    const title = run.category?.trim() || otherTitle
    let group = groups.get(title)
    if (!group) {
      group = { title, icon: '📋', items: [] }
      groups.set(title, group)
    }
    group.items.push({
      key: code,
      label: useLocal ? local.label : (run.checkName?.trim() || code),
      detail: useLocal ? local.detail : (run.description?.trim() ?? ''),
      backendKeys: [code],
    })
  }
  return [...groups.values()]
}

export function categoryKeys(categories: PostflightCategoryDef[]) {
  return categories.flatMap((cat) => cat.items.map((item) => item.key))
}

/** Maps per-item results onto the backend codes the postflight API expects. */
export function buildInspectionResults(
  categories: PostflightCategoryDef[],
  results: Partial<Record<string, 'ok' | 'fail'>>,
): Record<string, 'PASS' | 'FAIL'> {
  const out: Record<string, 'PASS' | 'FAIL'> = {}
  for (const item of categories.flatMap((cat) => cat.items)) {
    for (const code of item.backendKeys) {
      out[code] = results[item.key] === 'ok' ? 'PASS' : 'FAIL'
    }
  }
  return out
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
