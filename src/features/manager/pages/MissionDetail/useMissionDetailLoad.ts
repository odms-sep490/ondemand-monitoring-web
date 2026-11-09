import { useEffect, useRef } from 'react'
import { managerHref } from '../../routes'
import { missionsApi } from '../../api/missionsApi'
import { unwrapSettled } from '../../components/common/missionDetailHelpers'
import { ordersApi } from '../../api/ordersApi'
import { dronesApi } from '../../api/dronesApi'
import { missionDetailPageMessages } from './MissionDetailPage.messages'
import { useI18n } from '../../../../shared/i18n'
import type { Dispatch, SetStateAction } from 'react'
import type { DetailData } from '../../components/common/missionDetailTypes'

export function useMissionDetailLoad({
  setLoading,
  setError,
  missionId,
  setDetail,
  revision,
  detail,
  setDroneLookup,
}: {
  setLoading: Dispatch<SetStateAction<boolean>>
  setError: Dispatch<SetStateAction<string | null>>
  missionId: string
  setDetail: Dispatch<SetStateAction<DetailData | null>>
  revision: number
  detail: DetailData | null
  setDroneLookup: Dispatch<SetStateAction<string | null>>
}) {
  const { t } = useI18n(missionDetailPageMessages)
  const loadedMissionRef = useRef<string | null>(null)
  useEffect(() => {
    const abort = new AbortController()
    if (loadedMissionRef.current !== missionId) setLoading(true)
    setError(null)
    let openingPlanning = false
    missionsApi
      .getMissionResponse(missionId, abort.signal)
      .then(async (fullMission) => {
        if (abort.signal.aborted) return
        if (!fullMission || fullMission.id !== missionId) {
          setError(t.loadError)
          return
        }
        // Executions and results do not exist until planning is confirmed.
        if (fullMission.status === 'PLANNING') {
          if (
            fullMission.purpose === 'REWORK' &&
            !fullMission.resultRevisionCaseId
          ) {
            setError(t.loadError)
            return
          }
          openingPlanning = true
          window.location.replace(
            managerHref(
              fullMission.purpose === 'REWORK'
                ? {
                    screen: 'missionCreate',
                    orderId: fullMission.orderId,
                    reworkCaseId: fullMission.resultRevisionCaseId!,
                  }
                : { screen: 'orderReview', orderId: fullMission.orderId },
            ),
          )
          return
        }
        const [preflight, postcheck, result, weather] =
          await Promise.allSettled([
            missionsApi.getCurrentPreflight(missionId, abort.signal),
            missionsApi.getCurrentPostDeviceCheck(missionId, abort.signal),
            missionsApi.getMissionResult(missionId, abort.signal),
            missionsApi.getLatestWeatherCheck(missionId, abort.signal),
          ])
        if (abort.signal.aborted) return
        setDetail({
          mission: fullMission,
          order: null,
          preflight: unwrapSettled(preflight),
          postcheck: unwrapSettled(postcheck),
          result:
            unwrapSettled(result)?.missionId === missionId
              ? unwrapSettled(result)
              : null,
          // Media is loaded by the gallery only after its tab is first opened.
          media: [],
          weather: unwrapSettled(weather),
        })
        loadedMissionRef.current = missionId
        ordersApi
          .getOrder(fullMission.orderId, abort.signal)
          .then((order) => {
            if (abort.signal.aborted) return
            setDetail((current) =>
              current?.mission?.id === fullMission.id
                ? { ...current, order }
                : current,
            )
          })
          .catch(() => undefined)
      })
      .catch(() => {
        if (!abort.signal.aborted) setError(t.loadError)
      })
      .finally(() => {
        if (!abort.signal.aborted && !openingPlanning) setLoading(false)
      })
    return () => abort.abort()
  }, [missionId, revision, t.loadError])

  // Completed missions may no longer carry `droneCode`; resolve the device
  // from the mission assignment or its post-flight check without loading media.
  const droneIdForLookup =
    detail &&
    !detail.mission?.droneCode &&
    !detail.mission?.deviceCode &&
    !detail.postcheck?.deviceCode
      ? (detail.mission?.deviceId ?? detail.mission?.droneId ?? null)
      : null
  useEffect(() => {
    if (!droneIdForLookup) {
      setDroneLookup(null)
      return
    }
    const abort = new AbortController()
    dronesApi
      .getDrone(droneIdForLookup, abort.signal)
      .then((drone) => {
        if (!abort.signal.aborted) setDroneLookup(drone.serialNumber)
      })
      .catch(() => {
        if (!abort.signal.aborted) setDroneLookup(null)
      })
    return () => abort.abort()
  }, [droneIdForLookup])
}
