import { apiRequest } from '../../../shared/api/httpClient'
import type { CustomerMediaResponse, PageResponse } from '../lib/media/types'

const enc = encodeURIComponent
const missionPath = (missionId: string) =>
  `/api/customer/missions/${enc(missionId)}`

/** Customer media endpoints, verified against `/v3/api-docs` (Customer Media). */
export const customerMediaApi = {
  /** `GET /api/customer/available-media`: every ready asset of the customer's orders. */
  listAvailable: (signal?: AbortSignal) =>
    apiRequest<CustomerMediaResponse[]>('/api/customer/available-media', {
      signal,
    }),

  /** `GET /api/customer/missions/{missionId}/media?page&size` (size 1-100). */
  listMissionMedia: (
    missionId: string,
    page: number,
    size = 12,
    signal?: AbortSignal,
  ) =>
    apiRequest<PageResponse<CustomerMediaResponse>>(
      `${missionPath(missionId)}/media`,
      {
        query: { page, size },
        signal,
      },
    ),

  /** `GET /api/customer/missions/{missionId}/media/{mediaId}`: fresh viewing URL. */
  getMissionMedia: (missionId: string, mediaId: string, signal?: AbortSignal) =>
    apiRequest<CustomerMediaResponse>(
      `${missionPath(missionId)}/media/${enc(mediaId)}`,
      {
        signal,
      },
    ),

  /** `GET /api/media/{mediaId}/download`: presigned URL when only the media id is known. */
  getDownload: (mediaId: string, signal?: AbortSignal) =>
    apiRequest<CustomerMediaResponse>(`/api/media/${enc(mediaId)}/download`, {
      signal,
    }),
}
