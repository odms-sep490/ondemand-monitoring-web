import { describe, expect, it } from 'vitest'

import { env } from '../../config/env'
import { mockFetch } from '../mockServer'
import '../index'

async function call(path: string) {
  const response = await mockFetch(`${env.apiBaseUrl}${path}`, {
    method: 'GET',
  })
  return { status: response.status, payload: await response.json() }
}

describe('customer media (BE shape)', () => {
  it('lists the available media as CustomerMediaResponse[]', async () => {
    const { status, payload } = await call('/api/customer/available-media')
    expect(status).toBe(200)
    expect(payload.data).toHaveLength(18)
    expect(payload.data[0]).toEqual(
      expect.objectContaining({
        mediaId: expect.any(String),
        missionId: 'msn-006-1',
        mediaType: expect.stringMatching(/^(IMAGE|VIDEO)$/),
        fileName: expect.any(String),
        contentType: expect.any(String),
        fileSize: expect.any(Number),
        downloadUrl: expect.any(String),
      }),
    )
  })

  it('pages the media of a mission', async () => {
    const first = await call(
      '/api/customer/missions/msn-006-1/media?page=0&size=12',
    )
    expect(first.payload.data).toMatchObject({
      page: 0,
      size: 12,
      totalItems: 15,
      totalPages: 2,
      first: true,
      last: false,
    })
    expect(first.payload.data.items).toHaveLength(12)
    const second = await call(
      '/api/customer/missions/msn-006-1/media?page=1&size=12',
    )
    expect(second.payload.data.items).toHaveLength(3)
    expect(second.payload.data.last).toBe(true)
  })

  it('returns one mission media item and 404 for a foreign one', async () => {
    const list = await call('/api/customer/available-media')
    const item = list.payload.data[0]
    const found = await call(
      `/api/customer/missions/${item.missionId}/media/${item.mediaId}`,
    )
    expect(found.payload.data.mediaId).toBe(item.mediaId)
    expect(
      (await call(`/api/customer/missions/msn-004-1/media/${item.mediaId}`))
        .status,
    ).toBe(404)
  })

  it('reports the media status counts', async () => {
    expect(
      (await call('/api/customer/missions/msn-006-1/media-status')).payload
        .data,
    ).toEqual({
      availableCount: 15,
      processingCount: 0,
      rejectedCount: 0,
    })
    expect(
      (await call('/api/customer/missions/msn-004-1/media-status')).payload
        .data,
    ).toEqual({
      availableCount: 3,
      processingCount: 1,
      rejectedCount: 1,
    })
  })

  it('serves a fresh URL from /api/media/{id}/download', async () => {
    const list = await call('/api/customer/available-media')
    const { payload } = await call(
      `/api/media/${list.payload.data[1].mediaId}/download`,
    )
    expect(payload.data.downloadUrl).toBeTruthy()
    expect((await call('/api/media/nope/download')).status).toBe(404)
  })
})
