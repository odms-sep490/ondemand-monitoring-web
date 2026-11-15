import { getUploadMediaTypeLabel, getUploadMediaSourceLabel, getUploadMediaStatusLabel } from '../../drone-operator/pages/UploadMedia/uploadMediaHelpers'
import { expect, it } from 'vitest'
import { mediaFeedback } from './mediaFeedback'
import { uploadMediaPageMessages as messages } from '../../drone-operator/pages/UploadMedia/UploadMediaPage.messages'
it('translates stored system feedback in either direction without changing filenames', () => {
  expect(mediaFeedback(messages.vi.evidenceApproved, 'en')).toBe(
    messages.en.evidenceApproved,
  )
  expect(mediaFeedback(messages.en.evidenceApproved, 'vi')).toBe(
    messages.vi.evidenceApproved,
  )
  expect(mediaFeedback('Ảnh của khách.png: Failed to fetch', 'en')).toBe(
    'Ảnh của khách.png: Could not connect. Check the network and try again.',
  )
  expect(mediaFeedback('Ảnh của khách.png: Failed to fetch', 'vi')).toBe(
    'Ảnh của khách.png: Không thể kết nối. Kiểm tra mạng rồi thử lại.',
  )
})
it('retains counts when switching a successful upload notification', () => {
  expect(mediaFeedback('3 tệp đã được gửi để xác thực.', 'en', 'info')).toBe(
    '3 files sent for validation.',
  )
  expect(mediaFeedback('3 files submitted for validation.', 'vi', 'info')).toBe(
    '3 tệp đã được gửi để xác thực.',
  )
})
it('does not leak unknown backend error text or codes into either language', () => {
  for (const language of ['vi', 'en'] as const) {
    const translated = mediaFeedback(
      'INTERNAL_DIAGNOSTIC: server detail',
      language,
    )
    expect(translated).not.toContain('INTERNAL_DIAGNOSTIC')
    expect(translated).not.toContain('server detail')
  }
})

it('localizes upload type/source labels and hides unknown backend enums', () => {
  expect(getUploadMediaTypeLabel('IMAGE', 'en')).toBe('Image')
  expect(getUploadMediaSourceLabel('DRONE_CAMERA', 'en')).toBe('Drone camera')
  expect(getUploadMediaSourceLabel('DRONE_CAMERA', 'vi')).toBe('Máy ảnh trên drone')
  expect(getUploadMediaStatusLabel('FUTURE_STATUS', 'en')).toBe('Unknown status')
  expect(getUploadMediaSourceLabel('FUTURE_SOURCE', 'vi')).toBe('Nguồn chưa xác định')
})
