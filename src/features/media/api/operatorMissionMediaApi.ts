import { missionApi } from '../../mission/api/missionApi'
import type { MissionResultMedia } from '../../mission/types/mission'
import type {
  UploadedMissionMedia,
  UploadedMissionMediaPage,
} from '../types/missionMedia'
import { apiRequest } from '../../../shared/api/httpClient'
export type {
  UploadedMissionMedia,
  UploadedMissionMediaPage,
} from '../types/missionMedia'

const PAGE_SIZE = 12

function toUploaded(item: MissionResultMedia): UploadedMissionMedia {
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
    status: item.status ?? undefined,
    fileName: `${isVideo ? 'video' : 'image'}-${item.id.slice(0, 8)}.${extension}`,
    contentType: item.contentType ?? (isVideo ? 'video/mp4' : 'image/jpeg'),
    fileSize: item.fileSize ?? 0,
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

async function listResultMedia(missionId: string, signal?: AbortSignal) {
  const result = await missionApi.getMissionResult(missionId, signal)
  const fromResult = result?.mediaFiles ?? []
  if (fromResult.length > 0) return fromResult
  return missionApi.getMissionMedia(missionId, signal).catch(() => [])
}

export const operatorMissionMediaApi = {
  approve(missionId: string, mediaId: string): Promise<unknown> {
    return apiRequest(
      `/api/manager/missions/${encodeURIComponent(missionId)}/media-approvals/${encodeURIComponent(mediaId)}/approve`,
      { method: 'POST' },
    )
  },
  async list(
    missionId: string,
    page: number,
    signal?: AbortSignal,
  ): Promise<UploadedMissionMediaPage> {
    const all = (await listResultMedia(missionId, signal)).map(toUploaded)
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
  async get(
    missionId: string,
    mediaId: string,
    signal?: AbortSignal,
  ): Promise<UploadedMissionMedia> {
    const found = (await listResultMedia(missionId, signal)).find(
      (item) => item.id === mediaId,
    )
    if (!found) throw new Error('Không tìm thấy media trong kết quả mission.')
    return toUploaded(found)
  },
}
