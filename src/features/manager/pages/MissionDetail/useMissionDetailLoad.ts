import { useEffect, useRef } from 'react'
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
    Promise.allSettled([
      missionsApi.getMissionResponse(missionId, abort.signal),
      missionsApi.getCurrentPreflight(missionId, abort.signal),
      missionsApi.getCurrentPostDeviceCheck(missionId, abort.signal),
      missionsApi.getMissionResult(missionId, abort.signal),
      missionsApi.getMissionMedia(missionId, abort.signal),
      missionsApi.getLatestWeatherCheck(missionId, abort.signal),
    ])
      .then(([mission, preflight, postcheck, result, media, weather]) => {
        if (abort.signal.aborted) return
        const fullMission = unwrapSettled(mission)
        if (!fullMission || fullMission.id !== missionId) {
          setError(t.loadError)
          return
        }
        setDetail({
          mission: fullMission,
          order: null,
          preflight: unwrapSettled(preflight),
          postcheck: unwrapSettled(postcheck),
          result:
            unwrapSettled(result)?.missionId === missionId
              ? unwrapSettled(result)
              : null,
          media: (unwrapSettled(media) ?? []).filter(
            (item) => item.missionId === missionId,
          ),
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
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false)
      })
    return () => abort.abort()
  }, [missionId, revision, t.loadError])

  // Completed missions may no longer carry `droneCode`; resolve the device
  // from the post-check, then from the drone that captured the media.
  const droneIdForLookup =
    detail &&
    !detail.mission?.droneCode &&
    !detail.mission?.deviceCode &&
    !detail.postcheck?.deviceCode
      ? (detail.mission?.deviceId ??
        detail.mission?.droneId ??
        detail.media[0]?.droneId ??
        null)
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
