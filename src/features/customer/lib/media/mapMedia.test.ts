import { describe, expect, it } from 'vitest'

import {
  filterMedia,
  formatBytes,
  groupByMission,
  mediaKind,
  shortId,
  siblings,
  sortNewestFirst,
  toMediaItem,
} from './mapMedia'

const dto = (over = {}) => ({
  mediaId: 'm1',
  missionId: 'ms1',
  deviceId: 'dev',
  mediaType: 'IMAGE',
  fileName: 'a.jpg',
  contentType: 'image/jpeg',
  fileSize: 2_500_000,
  capturedAt: '2026-09-14T13:30:00+07:00',
  availableAt: '2026-09-14T13:40:00+07:00',
  downloadUrl: 'https://x/a.jpg',
  ...over,
})

describe('media mapping', () => {
  it('maps the BE dto and infers the kind from mediaType, then MIME', () => {
    expect(toMediaItem(dto())).toMatchObject({
      id: 'm1',
      kind: 'image',
      url: null,
      canDownloadOriginal: false,
      fileSize: 2_500_000,
    })
    expect(mediaKind('VIDEO', undefined)).toBe('video')
    expect(mediaKind('STREAMING', 'video/mp4')).toBe('video')
    expect(mediaKind(undefined, 'application/pdf')).toBe('other')
  })

  it('falls back to the id when the file name is blank and keeps missing fields null', () => {
    const item = toMediaItem({ mediaId: 'm9', missionId: 'ms', fileName: ' ' })
    expect(item).toMatchObject({
      fileName: 'm9',
      fileSize: null,
      url: null,
      capturedAt: null,
    })
  })

  it('sorts newest first, filters and groups by mission', () => {
    const a = toMediaItem(
      dto({ mediaId: 'a', capturedAt: '2026-09-14T10:00:00Z' }),
    )
    const b = toMediaItem(
      dto({
        mediaId: 'b',
        capturedAt: '2026-09-14T12:00:00Z',
        mediaType: 'VIDEO',
        fileName: 'clip.mp4',
      }),
    )
    const c = toMediaItem(
      dto({
        mediaId: 'c',
        missionId: 'ms2',
        capturedAt: '2026-09-14T11:00:00Z',
      }),
    )
    expect(sortNewestFirst([a, b, c]).map((i) => i.id)).toEqual(['b', 'c', 'a'])
    expect(
      filterMedia([a, b, c], { missionId: 'ms1', kind: 'all', query: '' }).map(
        (i) => i.id,
      ),
    ).toEqual(['a', 'b'])
    expect(
      filterMedia([a, b, c], { missionId: null, kind: 'video', query: '' }).map(
        (i) => i.id,
      ),
    ).toEqual(['b'])
    expect(
      filterMedia([a, b, c], {
        missionId: null,
        kind: 'all',
        query: 'CLIP',
      }).map((i) => i.id),
    ).toEqual(['b'])
    expect(groupByMission([a, b, c], { ms1: 'MSN-1' })).toEqual([
      { missionId: 'ms1', label: 'MSN-1', count: 2 },
      { missionId: 'ms2', label: 'ms2', count: 1 },
    ])
    expect(siblings([a, b, c], a)).toEqual({ prev: b, next: null })
    expect(siblings([a, b, c], b)).toEqual({ prev: null, next: a })
  })

  it('formats sizes and shortens uuids', () => {
    expect(formatBytes(null)).toBeNull()
    expect(formatBytes(900)).toBe('900 B')
    expect(formatBytes(48_000)).toBe('48 KB')
    expect(formatBytes(8_800_000)).toBe('8.8 MB')
    expect(shortId('123e4567-e89b-12d3-a456-426614174000')).toBe('123E4567')
    expect(shortId('msn-1')).toBe('msn-1')
  })
})
