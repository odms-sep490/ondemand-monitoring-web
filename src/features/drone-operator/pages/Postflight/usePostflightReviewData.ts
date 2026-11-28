import { useRef } from 'react'
import { useMissionWorkspaceUpdates } from '../../../mission/realtime/useMissionWorkspaceUpdates'
import type { WorkspaceComponent } from '../../../mission/realtime/missionWorkspaceUpdates'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { missionApi } from '../../../mission/api/missionApi'
import type { MissionResultMedia } from '../../../mission/types/mission'
import type { BackendMission } from '../../api/liveMission'
import { fetchCurrentPersistedPreflight } from '../Preflight/preflightApi'
import type { PersistedPreflightCheck } from '../Preflight/preflightTypes'
import {
  fetchLatestPostflightCheck,
  fetchLatestWeatherCheck,
} from '../MissionDetail/checkData'
import type {
  PostflightCheckStatus,
  WeatherPreflightStatus,
} from '../MissionDetail/types'

export type PostflightReviewData = {
  mission: BackendMission | null
  preflight: PersistedPreflightCheck | null
  weather: WeatherPreflightStatus | null
  postflight: PostflightCheckStatus | null
  media: MissionResultMedia[]
  loadErrors: {
    mission?: unknown
    preflight?: unknown
    weather?: unknown
    postflight?: unknown
    media?: unknown
  }
}

export function usePostflightReviewData(missionId: string) {
  const cached = useRef<
    { missionId: string; data: PostflightReviewData } | undefined
  >(undefined)
  const dirty = useRef(new Set<WorkspaceComponent>())
  const query = useApiQuery<PostflightReviewData>(
    async (signal) => {
      const previous =
        cached.current?.missionId === missionId
          ? cached.current.data
          : undefined
      const all =
        !previous ||
        dirty.current.size === 0 ||
        Object.keys(previous.loadErrors).length > 0
      const checksChanged =
        all || dirty.current.has('permissions') || dirty.current.has('result')
      const mediaChanged = all || dirty.current.has('media')
      const [mission, preflight, weather, postflight, media] =
        await Promise.allSettled([
          checksChanged
            ? missionApi.getMissionById(missionId, signal)
            : previous!.mission,
          checksChanged
            ? fetchCurrentPersistedPreflight(missionId, signal)
            : previous!.preflight,
          checksChanged
            ? fetchLatestWeatherCheck(missionId, signal)
            : previous!.weather,
          checksChanged
            ? fetchLatestPostflightCheck(missionId, signal)
            : previous!.postflight,
          mediaChanged
            ? missionApi.getMissionMedia(missionId, signal)
            : previous!.media,
        ])
      if (signal.aborted) {
        throw new DOMException(
          'Postflight review request was cancelled',
          'AbortError',
        )
      }

      const data: PostflightReviewData = {
        mission:
          mission.status === 'fulfilled'
            ? (mission.value as unknown as BackendMission)
            : null,
        preflight: preflight.status === 'fulfilled' ? preflight.value : null,
        weather: weather.status === 'fulfilled' ? weather.value : null,
        postflight: postflight.status === 'fulfilled' ? postflight.value : null,
        media: media.status === 'fulfilled' ? media.value : [],
        loadErrors: {
          ...(mission.status === 'rejected' ? { mission: mission.reason } : {}),
          ...(preflight.status === 'rejected'
            ? { preflight: preflight.reason }
            : {}),
          ...(weather.status === 'rejected' ? { weather: weather.reason } : {}),
          ...(postflight.status === 'rejected'
            ? { postflight: postflight.reason }
            : {}),
          ...(media.status === 'rejected' ? { media: media.reason } : {}),
        },
      }
      cached.current = { missionId, data }
      dirty.current.clear()
      return data
    },
    [missionId],
  )
  useMissionWorkspaceUpdates(
    missionId,
    ['result', 'permissions', 'media'],
    (changed) => {
      changed.forEach((part) => dirty.current.add(part))
      query.reload()
    },
  )
  return query
}
