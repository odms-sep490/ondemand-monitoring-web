import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { setLanguage } from '../../../shared/i18n'
import { CorrectionEvidenceGallery } from './CorrectionEvidenceGallery'
import type { MissionChecklistEvidence } from '../types/checklistExecution'
vi.mock('../components/InspectorEvidencePreview', () => ({
  InspectorEvidencePreview: ({ link }: { link: MissionChecklistEvidence }) => (
    <div role="dialog">{link.fileName}</div>
  ),
}))
const photo = {
  evidenceId: 'e1',
  mediaId: 'm1',
  mediaType: 'IMAGE',
  fileName: 'roof.jpg',
  thumbnailUrl: '/thumb.jpg',
  previewUrl: '/preview.jpg',
  mediaStatus: 'AVAILABLE',
} as MissionChecklistEvidence
const clip = {
  ...photo,
  evidenceId: 'e2',
  mediaId: 'm2',
  mediaType: 'VIDEO',
  fileName: 'roof.mp4',
  thumbnailUrl: '/poster.jpg',
  previewUrl: '/clip.mp4',
} as MissionChecklistEvidence
const props = {
  missionId: 'mission',
  executionId: 'execution',
  links: [photo, clip],
  selected: [],
  disabled: false,
}
afterEach(() => setLanguage('vi'))
it('shows thumbnails and video posters without loading video; previews without selecting', () => {
  const change = vi.fn()
  render(<CorrectionEvidenceGallery {...props} onChange={change} />)
  expect(
    screen
      .getByRole('button', { name: 'Xem bằng chứng roof.jpg' })
      .querySelector('img'),
  ).toHaveAttribute('src', '/thumb.jpg')
  expect(
    screen
      .getByRole('button', { name: 'Xem bằng chứng roof.mp4' })
      .querySelector('img'),
  ).toHaveAttribute('src', '/poster.jpg')
  expect(document.querySelector('video')).toBeNull()
  fireEvent.click(
    screen.getByRole('button', { name: 'Xem bằng chứng roof.mp4' }),
  )
  expect(screen.getByRole('dialog')).toHaveTextContent('roof.mp4')
  expect(change).not.toHaveBeenCalled()
  fireEvent.click(
    screen.getByRole('checkbox', { name: 'Chọn tệp liên quan roof.jpg' }),
  )
  expect(change).toHaveBeenCalledWith(['m1'])
})
it('removes a selected media id and prevents edits when disabled', () => {
  const change = vi.fn()
  const { rerender } = render(
    <CorrectionEvidenceGallery
      {...props}
      selected={['m1', 'm2']}
      onChange={change}
    />,
  )
  fireEvent.click(
    screen.getByRole('checkbox', { name: 'Chọn tệp liên quan roof.jpg' }),
  )
  expect(change).toHaveBeenCalledWith(['m2'])
  rerender(<CorrectionEvidenceGallery {...props} disabled onChange={change} />)
  expect(
    screen.getByRole('checkbox', { name: 'Chọn tệp liên quan roof.jpg' }),
  ).toBeDisabled()
})
it('falls back from a failed thumbnail to preview, then a placeholder', () => {
  render(
    <CorrectionEvidenceGallery {...props} links={[photo]} onChange={vi.fn()} />,
  )
  const button = screen.getByRole('button', { name: 'Xem bằng chứng roof.jpg' })
  fireEvent.error(button.querySelector('img')!)
  expect(button.querySelector('img')).toHaveAttribute('src', '/preview.jpg')
  fireEvent.error(button.querySelector('img')!)
  expect(button).toHaveTextContent('Chưa có ảnh thu nhỏ')
})
it('renders the related-media controls in English', () => {
  setLanguage('en')
  render(<CorrectionEvidenceGallery {...props} onChange={vi.fn()} />)
  expect(
    screen.getByText('Related images/videos (optional)'),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'View evidence roof.jpg' }),
  ).toBeInTheDocument()
})
it('renders a friendly label instead of an opaque UUID filename while preserving full accessible labels', () => {
  const uuidPhoto = {
    ...photo,
    fileName: '7601f9d9-47d2-4a8e-9b1c-1234567890ab',
  } as MissionChecklistEvidence
  render(
    <CorrectionEvidenceGallery
      {...props}
      links={[uuidPhoto]}
      onChange={vi.fn()}
    />,
  )
  expect(screen.getByText('Ảnh #1')).toBeInTheDocument()
  expect(
    screen.queryByText('7601f9d9-47d2-4a8e-9b1c-1234567890ab'),
  ).toBeNull()
  expect(
    screen.getByRole('checkbox', {
      name: 'Chọn tệp liên quan 7601f9d9-47d2-4a8e-9b1c-1234567890ab',
    }),
  ).toBeInTheDocument()
})
