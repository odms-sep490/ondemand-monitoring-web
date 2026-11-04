// Mock handlers in the BE DTO shape for the customer's media. Verified
// against /v3/api-docs (Customer Media):
//   GET /api/customer/available-media                    -> ApiResponse<CustomerMediaResponse[]>
//   GET /api/customer/missions/{id}/media ?page&size     -> ApiResponse<PageResponse<CustomerMediaResponse>>
//   GET /api/customer/missions/{id}/media/{mediaId}      -> ApiResponse<CustomerMediaResponse>
//   GET /api/customer/missions/{id}/media-status         -> ApiResponse<CustomerMissionMediaStatusResponse>
//   GET /api/media/{mediaId}/download                    -> ApiResponse<CustomerMediaResponse>
// Only assets that are AVAILABLE are ever returned, like the BE.
import type { CustomerMediaResponse } from '../../features/customer/lib/media/types'
import seed from '../data/customer-orders.json'
import { fail, ok, registerMockRoutes } from '../mockServer'

type SeedMedia = (typeof seed.media)['msn-006-1'][number]

const seedMedia = Object.values(seed.media).flat() as SeedMedia[]

/** Offline-safe placeholder: an inline SVG so the gallery renders without a network. */
function placeholder(label: string) {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">' +
    '<rect width="640" height="420" fill="#dbe7fb"/>' +
    `<text x="320" y="220" font-family="sans-serif" font-size="28" text-anchor="middle" fill="#3b5b8f">${label}</text>` +
    '</svg>'
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function toDto(m: SeedMedia, index: number): CustomerMediaResponse {
  const video = m.mediaType === 'VIDEO'
  const captured = new Date(m.capturedAt)
  return {
    mediaId: m.id,
    missionId: m.missionId,
    deviceId: 'dev-mock-01',
    mediaType: video ? 'VIDEO' : 'IMAGE',
    fileName: `${m.missionCode}-${String(index + 1).padStart(3, '0')}.${video ? 'mp4' : 'jpg'}`,
    contentType: video ? 'video/mp4' : 'image/jpeg',
    fileSize: m.fileSizeBytes,
    capturedAt: m.capturedAt,
    availableAt: new Date(captured.getTime() + 5 * 60_000).toISOString(),
    downloadUrl: video
      ? `https://mock-storage.example/media/${m.id}.mp4?token=mock`
      : placeholder(m.id),
  }
}

const available = seedMedia.map(toDto)

/** Mission-history mission that has files still being validated (mock only). */
const PROCESSING: Record<
  string,
  { processingCount: number; rejectedCount: number }
> = {
  'msn-004-1': { processingCount: 1, rejectedCount: 1 },
}

const forMission = (missionId: string) =>
  available.filter((m) => m.missionId === missionId)

registerMockRoutes([
  {
    method: 'GET',
    path: '/api/customer/available-media',
    handler: () => ok(available),
  },
  {
    method: 'GET',
    path: '/api/customer/missions/:missionId/media',
    handler: ({ params, query }) => {
      const page = Math.max(0, Number(query.get('page') ?? 0) || 0)
      const size = Math.min(
        100,
        Math.max(1, Number(query.get('size') ?? 12) || 12),
      )
      const all = forMission(params.missionId)
      const totalPages = Math.ceil(all.length / size)
      return ok({
        items: all.slice(page * size, page * size + size),
        page,
        size,
        totalItems: all.length,
        totalPages,
        first: page === 0,
        last: page >= totalPages - 1,
      })
    },
  },
  {
    method: 'GET',
    path: '/api/customer/missions/:missionId/media/:mediaId',
    handler: ({ params }) => {
      const found = forMission(params.missionId).find(
        (m) => m.mediaId === params.mediaId,
      )
      return found ? ok(found) : fail(404, 'NOT_FOUND', 'Media not found')
    },
  },
  {
    method: 'GET',
    path: '/api/customer/missions/:missionId/media-status',
    handler: ({ params }) =>
      ok({
        availableCount: forMission(params.missionId).length,
        processingCount: PROCESSING[params.missionId]?.processingCount ?? 0,
        rejectedCount: PROCESSING[params.missionId]?.rejectedCount ?? 0,
      }),
  },
  {
    method: 'GET',
    path: '/api/media/:mediaId/download',
    handler: ({ params }) => {
      const found = available.find((m) => m.mediaId === params.mediaId)
      return found ? ok(found) : fail(404, 'NOT_FOUND', 'Media not found')
    },
  },
])
