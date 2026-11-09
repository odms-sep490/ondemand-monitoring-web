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
  return useApiQuery<PostflightReviewData>(async (signal) => {
    const [mission, preflight, weather, postflight, media] = await Promise.allSettled([
      missionApi.getMissionById(missionId, signal),
      fetchCurrentPersistedPreflight(missionId, signal),
      fetchLatestWeatherCheck(missionId, signal),
      fetchLatestPostflightCheck(missionId, signal),
      missionApi.getMissionMedia(missionId, signal),
    ])
    if (signal.aborted) {
      throw new DOMException('Postflight review request was cancelled', 'AbortError')
    }

    return {
      mission: mission.status === 'fulfilled'
        ? mission.value as unknown as BackendMission
        : null,
      preflight: preflight.status === 'fulfilled' ? preflight.value : null,
      weather: weather.status === 'fulfilled' ? weather.value : null,
      postflight: postflight.status === 'fulfilled' ? postflight.value : null,
      media: media.status === 'fulfilled' ? media.value : [],
      loadErrors: {
        ...(mission.status === 'rejected' ? { mission: mission.reason } : {}),
        ...(preflight.status === 'rejected' ? { preflight: preflight.reason } : {}),
        ...(weather.status === 'rejected' ? { weather: weather.reason } : {}),
        ...(postflight.status === 'rejected' ? { postflight: postflight.reason } : {}),
        ...(media.status === 'rejected' ? { media: media.reason } : {}),
      },
    }
  }, [missionId])
}
