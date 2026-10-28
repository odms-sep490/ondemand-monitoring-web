import type {
  MissionMediaReader,
  UploadedMissionMedia,
  UploadedMissionMediaPage,
} from '../../media/types/missionMedia'
import { getLanguage } from '../../../shared/i18n'
import { managerLibMessages } from '../lib/lib.messages'
import type { MediaResponse } from '../types/missions'
import { missionsApi } from './missionsApi'

const PAGE_SIZE = 12

function toUploaded(item: MediaResponse): UploadedMissionMedia {
  const isVideo =
    item.contentType?.startsWith('video/') ||
    item.type?.toUpperCase() === 'VIDEO'
  const extension = item.contentType?.split('/')[1] ?? (isVideo ? 'mp4' : 'jpg')
  const deviceId = item.deviceId ?? item.droneId
  return {
    mediaId: item.id,
    missionId: item.missionId,
    deviceId: deviceId ?? '—',
    mediaType: isVideo ? 'VIDEO' : 'IMAGE',
    status: item.status,
    fileName: `${isVideo ? 'video' : 'image'}-${item.id.slice(0, 8)}.${extension}`,
    contentType: item.contentType,
    fileSize: item.fileSize,
    capturedAt: item.capturedAt ?? null,
    availableAt: null,
    downloadUrl: item.url,
    sourceType: item.sourceType ?? null,
    sourceReferenceId: item.sourceReferenceId ?? null,
    sourceCapturedAt: item.sourceCapturedAt ?? null,
    captureLatitude: item.captureLatitude ?? null,
    captureLongitude: item.captureLongitude ?? null,
    sourceDistanceMeters: item.sourceDistanceMeters ?? null,
  }
}

/**
 * Staff-side reader for the shared mission media gallery. Uses the manager
 * `GET /api/missions/{id}/media` endpoint and paginates on the client.
 */
export const staffMissionMediaReader: MissionMediaReader = {
  async list(missionId, page, signal): Promise<UploadedMissionMediaPage> {
    const result = await missionsApi.getMissionResult(missionId, signal)
    let media = result?.missionId === missionId ? (result.mediaFiles ?? []) : []
    if (media.length === 0) {
      media = await missionsApi.getMissionMedia(missionId, signal)
    }
    const all = (media ?? [])
      .filter((item) => item.missionId === missionId)
      .map(toUploaded)
    const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE))
    const safePage = Math.min(Math.max(0, page), totalPages - 1)
    return {
      items: all.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
      page: safePage,
      totalItems: all.length,
      totalPages,
      first: safePage === 0,
      last: safePage >= totalPages - 1,
    }
  },
  async get(missionId, mediaId, signal) {
    const result = await missionsApi.getMissionResult(missionId, signal)
    let all = result?.missionId === missionId ? (result.mediaFiles ?? []) : []
    if (all.length === 0) {
      all = await missionsApi.getMissionMedia(missionId, signal)
    }
    const found = all.find(
      (item) => item.id === mediaId && item.missionId === missionId,
    )
    if (!found) throw new Error(managerLibMessages[getLanguage()].api.mediaNotFound)
    return toUploaded(found)
  },
}
