import { describe, expect, it } from 'vitest'
import { withStaffLocalPreviews } from './staffEvidencePresentation'
import type { EvidenceCandidate } from '../../mission/types/checklistExecution'
import type { LocalMedia } from '../api/operatorMediaApi'

const candidate = {
  mediaId: 'asset', fileName: 'drone.mp4', mediaType: 'VIDEO',
  status: 'VALIDATING', attachable: false, eligibleForFinalApproval: false,
  previewUrl: 'https://media.test/preview', thumbnailUrl: 'https://media.test/poster',
} as EvidenceCandidate
const local = {
  missionId: 'mission', backendMediaId: 'asset', mediaType: 'VIDEO',
  localAvailable: true, uploadChannel: 'FLIGHT_CONTROLLER',
  localPreviewUrl: 'http://localhost:8090/api/media/local/video/preview',
  localThumbnailUrl: 'http://localhost:8090/api/media/local/video/thumbnail',
} as LocalMedia

describe('Staff local media presentation', () => {
  it('adds local sources while retaining exact backend identity, status and eligibility', () => {
    const [result] = withStaffLocalPreviews([candidate], [local], 'mission')
    expect(result).toEqual({ ...candidate, localPreviewUrl: local.localPreviewUrl, localThumbnailUrl: local.localThumbnailUrl })
    expect(candidate).not.toHaveProperty('localPreviewUrl')
    expect(result.attachable).toBe(false)
    expect(result.previewUrl).toBe(candidate.previewUrl)
  })
  it.each([
    { missionId: 'sibling' }, { backendMediaId: 'different-asset' },
    { mediaType: 'IMAGE' }, { localAvailable: false },
    { uploadChannel: 'STAFF_FILE' }, { localPreviewUrl: null },
  ])('does not override remote/manual/unavailable sources: %j', (override) => {
    expect(withStaffLocalPreviews([candidate], [{ ...local, ...override } as LocalMedia], 'mission')[0]).toBe(candidate)
  })
})
