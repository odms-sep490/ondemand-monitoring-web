import { describe, expect, it } from 'vitest'
import { staffMediaSources } from './staffMediaSources'
import { operatorMediaApi, type LocalMedia } from '../api/operatorMediaApi'
const item = {
  localMediaId: 'capture',
  missionId: 'm',
  mediaType: 'IMAGE',
  thumbnailUrl: 'thumb',
  previewUrl: 'preview',
} as LocalMedia

describe('staff viewing source policy', () => {
  it('uses local files before remote copies for Bộ điều khiển bay media', () => {
    expect(staffMediaSources(item).images).toEqual([
      operatorMediaApi.previewUrl('capture'),
      'thumb',
      'preview',
    ])
  })
  it('never invents a local URL for manual uploads or unavailable files', () => {
    for (const extra of [
      { uploadChannel: 'STAFF_FILE' as const },
      { localAvailable: false },
    ]) {
      const result = staffMediaSources({ ...item, ...extra })
      expect(result.images).toEqual(['thumb', 'preview'])
      expect(result.localPreview).toBeUndefined()
    }
  })
  it('uses local video, a local poster and only a remote preview as fallback', () => {
    const result = staffMediaSources({ ...item, mediaType: 'VIDEO' })
    expect(result.videos).toEqual([
      operatorMediaApi.previewUrl('capture'),
      'preview',
    ])
    expect(result.poster).toBe(operatorMediaApi.thumbnailUrl('capture'))
    expect(result.fallbackPoster).toBe('thumb')
  })
  it('uses refreshed remote copies for both card and enlarged view', () => {
    const result = staffMediaSources(
      { ...item, uploadChannel: 'STAFF_FILE' },
      'new-preview',
      'new-thumb',
    )
    expect(result.images).toEqual(['new-thumb', 'new-preview'])
    expect(result.viewImages).toEqual(['new-preview', 'new-thumb'])
    expect(result.videos).toEqual(['new-preview'])
  })
})
