import { useMemo } from 'react'
import { preflightGroups } from './components/PreflightItem'
import { RUNTIME_KEY_MAP } from './preflightConstants'
import {
  preflightStateStorageKey,
} from './preflightStorage'
import { preflightPageMessages } from './PreflightPage.messages'
import { useI18n } from '../../../../shared/i18n'

export function usePreflightGroups({
  missionId,
  deviceId,
  deviceAssignmentId,
}: {
  missionId: string
  deviceId: string
  deviceAssignmentId?: string | null
}) {
  const { lang } = useI18n(preflightPageMessages)
  const PREFLIGHT_GROUPS = useMemo(() => preflightGroups(lang), [lang])
  const RUNTIME_GROUPS = useMemo(
    () =>
      PREFLIGHT_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          Object.values(RUNTIME_KEY_MAP).includes(item.key),
        ),
      })).filter((group) => group.items.length > 0),
    [PREFLIGHT_GROUPS],
  )
  const ALL_ITEMS = useMemo(
    () => RUNTIME_GROUPS.flatMap((group) => group.items),
    [RUNTIME_GROUPS],
  )
  const storageKey = useMemo(
    () => preflightStateStorageKey(missionId, deviceId, deviceAssignmentId),
    [deviceAssignmentId, deviceId, missionId],
  )
  return { RUNTIME_GROUPS, ALL_ITEMS, storageKey }
}
