import { expect, it } from 'vitest'
import { evidenceQueueFeedback } from './evidenceQueueFeedback'

it('explains the capture-age rejection in both languages without assuming a fixed duration', () => {
  expect(evidenceQueueFeedback('MEDIA_CAPTURE_TOO_OLD', 'vi')).toContain(
    'Thời điểm chụp/quay đã vượt giới hạn',
  )
  expect(evidenceQueueFeedback('MEDIA_CAPTURE_TOO_OLD', 'en')).toContain(
    'planned mission duration',
  )
  expect(evidenceQueueFeedback('MEDIA_CAPTURE_TOO_OLD', 'vi')).not.toContain(
    '60',
  )
})
it('keeps known failures distinct and never exposes raw diagnostics', () => {
  expect(evidenceQueueFeedback('LOCAL_MEDIA_UNAVAILABLE', 'vi')).toContain(
    'Không tìm thấy tệp gốc',
  )
  expect(evidenceQueueFeedback('MANUAL_UPLOAD_REQUIRED', 'en')).toContain(
    'manually',
  )
  expect(evidenceQueueFeedback('MEDIA_UPLOAD_NOT_ALLOWED', 'en')).toContain(
    'not currently allowed',
  )
  expect(evidenceQueueFeedback('PRIVATE_SERVER_DETAIL', 'vi')).not.toContain(
    'PRIVATE_SERVER_DETAIL',
  )
})
