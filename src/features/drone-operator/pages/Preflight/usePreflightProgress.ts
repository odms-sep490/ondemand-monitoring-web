import { useMemo } from 'react'
import { mapRuntimeToItems, isMissionInFlight } from './preflightHelpers'
import type {
  RuntimePreflightStatus,
  WeatherPreflightStatus,
  PersistedPreflightStatus,
} from './preflightTypes'
import type { PreflightItemDef } from './components/PreflightItem'

export function usePreflightProgress({
  runtimeStatus,
  ALL_ITEMS,
  weatherStatus,
  persistedWeatherPassed,
  persistedPreflightStatus,
  checkId,
  triggering,
  missionStatus,
}: {
  runtimeStatus: RuntimePreflightStatus | null
  ALL_ITEMS: PreflightItemDef[]
  weatherStatus: WeatherPreflightStatus | null
  persistedWeatherPassed: boolean
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
  const weatherReady =
    weatherStatus?.safeToFly === true || persistedWeatherPassed
  const isReady =
    runtimeItemsReady && weatherReady && persistedPreflightStatus === 'PASSED'
  const progress = runtimeStatus?.progress ?? 0
  // A persisted run is loaded into runtimeStatus when the page opens. It is
  // only a snapshot, not an actively running controller check. Treating every
  // loaded snapshot as "triggered" leaves the trigger button disabled forever
  // when an earlier run was interrupted in CHECKING state.
  const hasTriggered =
    checkId !== null || triggering || runtimeStatus?.checkId === 'triggering'
  const canContinueToHandover = isReady
  const isAlreadyInFlight = isMissionInFlight(missionStatus)
  const isFailed =
    runtimeStatus?.status === 'FAILED' ||
    persistedPreflightStatus === 'FAILED' ||
    weatherStatus?.safeToFly === false
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
