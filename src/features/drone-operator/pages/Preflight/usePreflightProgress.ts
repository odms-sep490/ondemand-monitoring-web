import { useMemo } from 'react'
import { mapRuntimeToItems, isMissionInFlight } from './preflightHelpers'
import type {
  RuntimePreflightStatus,
  PersistedPreflightStatus,
} from './preflightTypes'
import type { PreflightItemDef } from './components/PreflightItem'

export function usePreflightProgress({
  runtimeStatus,
  ALL_ITEMS,
  persistedPreflightStatus,
  checkId,
  triggering,
  missionStatus,
}: {
  runtimeStatus: RuntimePreflightStatus | null
  ALL_ITEMS: PreflightItemDef[]
  persistedPreflightStatus: PersistedPreflightStatus | null
  checkId: string | null
  triggering: boolean
  missionStatus: string | null | undefined
}) {
  const itemStates = useMemo(
    () => mapRuntimeToItems(runtimeStatus?.checks ?? []),
    [runtimeStatus],
  )
  const nOk = ALL_ITEMS.filter(
    (item) => itemStates[item.key]?.result === 'ok',
  ).length
  const nTotal = ALL_ITEMS.length
  const failedItems = ALL_ITEMS.filter(
    (item) => itemStates[item.key]?.result === 'fail',
  )
  const runtimeItemsReady = nOk === nTotal && failedItems.length === 0
  // Older persisted runs may still report failure from checks removed from the
  // active preflight list. The visible active items remain the source of truth.
  const hasActivePreflightFailure =
    failedItems.length > 0 ||
    ((runtimeStatus?.status === 'FAILED' ||
      persistedPreflightStatus === 'FAILED') &&
      !runtimeItemsReady)
  const isReady =
    runtimeItemsReady &&
    (persistedPreflightStatus === 'PASSED' ||
      (persistedPreflightStatus === 'FAILED' && !hasActivePreflightFailure))
  const progress = runtimeStatus?.progress ?? 0
  // Local runtime snapshots can be stale, but an active persisted checklist is
  // the manual inspection the operator must finish before starting another one.
  const hasTriggered =
    checkId !== null ||
    triggering ||
    runtimeStatus?.checkId === 'triggering' ||
    persistedPreflightStatus === 'CHECKING'
  const canContinueToHandover = isReady
  const isAlreadyInFlight = isMissionInFlight(missionStatus)
  const isFailed = hasActivePreflightFailure
  return {
    itemStates,
    nOk,
    nTotal,
    failedItems,
    runtimeItemsReady,
    progress,
    hasTriggered,
    canContinueToHandover,
    isAlreadyInFlight,
    isFailed,
  }
}
