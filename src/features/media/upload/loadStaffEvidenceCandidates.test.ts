import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../shared/api/httpClient'
import { checklistEvidenceApi } from '../../mission/api/checklistEvidenceApi'
import type { EvidenceCandidate } from '../../mission/types/checklistExecution'
import { operatorMediaApi, type LocalMedia } from '../api/operatorMediaApi'
import { loadStaffEvidenceCandidates } from './loadStaffEvidenceCandidates'

const image = (overrides: Partial<LocalMedia> = {}): LocalMedia => ({
  missionId: 'mission',
  deviceId: 'device',
  localMediaId: 'capture',
  mediaType: 'IMAGE',
  fileName: 'local.jpg',
  contentType: 'image/jpeg',
  fileSize: 100,
  checksumSha256: 'a'.repeat(64),
  sourceType: 'DRONE_CAMERA',
  capturedAt: '2026-11-12T00:00:00Z',
  status: 'REVIEW_PENDING',
  localPreviewUrl: 'http://localhost:8090/local/capture',
  ...overrides,
})
const remote = (
  overrides: Partial<EvidenceCandidate> = {},
): EvidenceCandidate => ({
  mediaId: 'asset',
  fileName: 'manual.jpg',
  mediaType: 'IMAGE',
  contentType: 'image/jpeg',
  status: 'AVAILABLE',
  sourceType: 'DRONE_CAMERA',
  capturedAt: '',
  validatedAt: '',
  attachable: true,
  eligibleForOperationalReadiness: true,
  eligibleForFinalApproval: true,
  ineligibilityReason: null,
  previewUrl: 'https://media.test/preview',
  thumbnailUrl: 'https://media.test/thumbnail',
  urlExpiresAt: null,
  alreadyAttachedExecutionIds: [],
  ...overrides,
})
const options = {
  missionId: 'mission',
  page: 0,
  canUploadMedia: true,
  executions: [],
}
beforeEach(() => {
  vi.spyOn(checklistEvidenceApi, 'candidates').mockResolvedValue([])
  vi.spyOn(operatorMediaApi, 'list').mockResolvedValue([image()])
  vi.spyOn(operatorMediaApi, 'reviewItems')
  vi.spyOn(operatorMediaApi, 'upload')
  vi.spyOn(operatorMediaApi, 'uploadStaffFile')
})
afterEach(() => vi.restoreAllMocks())

describe('independent Staff evidence media sources', () => {
  it('reads unuploaded FC images directly and performs no upload when opening the picker', async () => {
    const result = await loadStaffEvidenceCandidates(options)
    expect(result.items).toMatchObject([
      { mediaId: 'local:capture', status: 'UPLOAD_PENDING', attachable: true },
    ])
    expect(result.unavailableSources).toEqual([])
    expect(result.hasMore).toBe(false)
    expect(checklistEvidenceApi.candidates).toHaveBeenCalledWith(
      'mission',
      0,
      expect.any(AbortSignal),
    )
    expect(operatorMediaApi.list).toHaveBeenCalledWith('mission', [])
    expect(operatorMediaApi.reviewItems).not.toHaveBeenCalled()
    expect(operatorMediaApi.upload).not.toHaveBeenCalled()
    expect(operatorMediaApi.uploadStaffFile).not.toHaveBeenCalled()
  })

  it('keeps local photos visible if BE returns an error', async () => {
    vi.mocked(checklistEvidenceApi.candidates).mockRejectedValue(
      new ApiError('Server unavailable', {
        status: 500,
        method: 'GET',
        path: '/candidates',
      }),
    )
    const result = await loadStaffEvidenceCandidates(options)
    expect(result.items[0].mediaId).toBe('local:capture')
    expect(result.unavailableSources).toEqual(['uploaded'])
    expect(result.hasMore).toBe(false)
  })

  it('keeps uploaded manual media visible if FC is offline, without converting it to local media', async () => {
    const manual = remote()
    vi.mocked(checklistEvidenceApi.candidates).mockResolvedValue([manual])
    vi.mocked(operatorMediaApi.list).mockRejectedValue(
      new TypeError('Controller offline'),
    )
    const result = await loadStaffEvidenceCandidates(options)
    expect(result.items).toEqual([manual])
    expect(result.items[0]).toBe(manual)
    expect(result.unavailableSources).toEqual(['local'])
    expect(operatorMediaApi.upload).not.toHaveBeenCalled()
  })

  it.each([401, 403])(
    'does not hide authorization failure %s behind local files',
    async (status) => {
      const denied = new ApiError('Denied', {
        status,
        method: 'GET',
        path: '/candidates',
      })
      vi.mocked(checklistEvidenceApi.candidates).mockRejectedValue(denied)
      await expect(loadStaffEvidenceCandidates(options)).rejects.toBe(denied)
    },
  )

  it('reports full failure if neither source is available', async () => {
    vi.mocked(checklistEvidenceApi.candidates).mockRejectedValue(
      new Error('BE down'),
    )
    vi.mocked(operatorMediaApi.list).mockRejectedValue(new Error('FC down'))
    await expect(loadStaffEvidenceCandidates(options)).rejects.toBeInstanceOf(
      AggregateError,
    )
  })

  it('reports a malformed BE payload as a partial failure, not an empty success', async () => {
    vi.mocked(checklistEvidenceApi.candidates).mockResolvedValue({
      items: [],
    } as never)
    const result = await loadStaffEvidenceCandidates(options)
    expect(result.items).toHaveLength(1)
    expect(result.unavailableSources).toEqual(['uploaded'])
  })

  it('never shows a sibling Mission capture even with the same Mission code', async () => {
    vi.mocked(operatorMediaApi.list).mockResolvedValue([
      image({ missionId: 'sibling', missionCode: 'MS-1' }),
    ])
    expect(
      (
        await loadStaffEvidenceCandidates({
          ...options,
          missionAliases: ['MS-1'],
        })
      ).items,
    ).toEqual([])
  })

  it('retains backend eligibility and identity for a registered capture', async () => {
    const candidate = remote({
      attachable: false,
      eligibleForFinalApproval: false,
      status: 'VALIDATING',
    })
    vi.mocked(checklistEvidenceApi.candidates).mockResolvedValue([candidate])
    vi.mocked(operatorMediaApi.list).mockResolvedValue([
      image({ backendMediaId: 'asset' }),
    ])
    const result = await loadStaffEvidenceCandidates(options)
    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({
      mediaId: 'asset',
      status: 'VALIDATING',
      attachable: false,
      eligibleForFinalApproval: false,
    })
    expect(result.items[0].localPreviewUrl).toBe(image().localPreviewUrl)
  })

  it('does not turn a known backend asset into a new upload when BE state cannot be checked', async () => {
    vi.mocked(checklistEvidenceApi.candidates).mockRejectedValue(
      new Error('BE unavailable'),
    )
    vi.mocked(operatorMediaApi.list).mockResolvedValue([
      image({ backendMediaId: 'asset' }),
    ])
    expect((await loadStaffEvidenceCandidates(options)).items).toMatchObject([
      {
        mediaId: 'asset',
        attachable: false,
        ineligibilityReason: 'MEDIA_NOT_VALIDATED',
      },
    ])
  })

  it('does not resurrect a registered asset that BE omits', async () => {
    vi.mocked(operatorMediaApi.list).mockResolvedValue([
      image({ backendMediaId: 'removed-or-on-another-page' }),
    ])
    expect((await loadStaffEvidenceCandidates(options)).items).toEqual([])
  })

  it('excludes removed captures and Staff-file entries from the FC source', async () => {
    vi.mocked(operatorMediaApi.list).mockResolvedValue([
      image({ status: 'REMOVED' }),
      image({ uploadChannel: 'STAFF_FILE' }),
    ])
    expect((await loadStaffEvidenceCandidates(options)).items).toEqual([])
  })

  it('displays local files read-only when upload permission is unavailable', async () => {
    expect(
      (await loadStaffEvidenceCandidates({ ...options, canUploadMedia: false }))
        .items[0].attachable,
    ).toBe(false)
  })

  it('does not manufacture a next page from many local captures', async () => {
    vi.mocked(operatorMediaApi.list).mockResolvedValue(
      Array.from({ length: 60 }, (_, i) =>
        image({ localMediaId: `capture-${i}` }),
      ),
    )
    const result = await loadStaffEvidenceCandidates(options)
    expect(result.items).toHaveLength(60)
    expect(result.hasMore).toBe(false)
  })

  it('uses backend pagination independently and never repeats local captures on page two', async () => {
    vi.mocked(checklistEvidenceApi.candidates).mockResolvedValue(
      Array.from({ length: 50 }, (_, i) => remote({ mediaId: `asset-${i}` })),
    )
    const result = await loadStaffEvidenceCandidates({ ...options, page: 1 })
    expect(result.items).toHaveLength(50)
    expect(result.hasMore).toBe(true)
    expect(result.items.some((item) => item.mediaId.startsWith('local:'))).toBe(
      false,
    )
  })

  it('aborts before making source requests for an obsolete picker', async () => {
    const abort = new AbortController()
    abort.abort()
    await expect(
      loadStaffEvidenceCandidates({ ...options, signal: abort.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' })
    expect(checklistEvidenceApi.candidates).not.toHaveBeenCalled()
    expect(operatorMediaApi.list).not.toHaveBeenCalled()
  })
})
