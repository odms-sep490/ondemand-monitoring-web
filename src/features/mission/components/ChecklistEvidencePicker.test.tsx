import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { EvidenceCandidate } from '../types/checklistExecution'
import { ChecklistEvidencePicker } from './ChecklistEvidencePicker'

const candidate = (id: string): EvidenceCandidate => ({
  mediaId: id,
  fileName: `${id}.jpg`,
  mediaType: 'IMAGE',
  contentType: 'image/jpeg',
  status: 'PENDING_MANAGER_APPROVAL',
  sourceType: 'DRONE_CAMERA',
  capturedAt: '',
  validatedAt: null,
  attachable: true,
  eligibleForOperationalReadiness: false,
  eligibleForFinalApproval: false,
  ineligibilityReason: null,
  previewUrl: null,
  urlExpiresAt: null,
  alreadyAttachedExecutionIds: [],
})
describe('multi-select evidence picker', () => {
  it('retains selections across pages and adds all files with one confirmation', async () => {
    const first = Array.from({ length: 50 }, (_, index) =>
      candidate(`first-${index}`),
    )
    const next = candidate('second')
    const onSelect = vi.fn().mockResolvedValue(undefined)
    render(
      <ChecklistEvidencePicker
        missionId="m"
        open
        onClose={vi.fn()}
        onSelect={onSelect}
        loadCandidates={async (page) => (page ? [next] : first)}
      />,
    )
    fireEvent.click(
      await screen.findByRole('checkbox', { name: 'first-0.jpg' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }))
    fireEvent.click(await screen.findByRole('checkbox', { name: 'second.jpg' }))
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Gắn 2 tệp' }))
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith([first[0], next]))
  }, 15000)
  it('prevents wrong media type and keeps selection after an attach failure', async () => {
    const image = candidate('image')
    const video = {
      ...candidate('video'),
      fileName: 'video.mp4',
      mediaType: 'VIDEO',
    }
    render(
      <ChecklistEvidencePicker
        missionId="m"
        open
        requiredType="IMAGE"
        onClose={vi.fn()}
        onSelect={vi.fn().mockRejectedValue(new Error('conflict'))}
        loadCandidates={async () => [image, video]}
      />,
    )
    expect(
      await screen.findByRole('checkbox', { name: 'video.mp4' }),
    ).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox', { name: 'image.jpg' }))
    fireEvent.click(screen.getByRole('button', { name: 'Gắn 1 tệp' }))
    await screen.findByRole('alert')
    expect(screen.getByRole('checkbox', { name: 'image.jpg' })).toBeChecked()
  })
})


it('prefers a Staff local image and falls back to the backend thumbnail', async () => {
  const image = { ...candidate('local-image'), localPreviewUrl: 'http://localhost:8090/local.jpg',
    thumbnailUrl: 'https://media.test/thumb.jpg', previewUrl: 'https://media.test/image.jpg' }
  render(<ChecklistEvidencePicker missionId="mission" open onClose={vi.fn()} onSelect={vi.fn()} loadCandidates={async () => [image]} />)
  const preview = await screen.findByRole('img', { name: image.fileName })
  expect(preview).toHaveAttribute('src', image.localPreviewUrl)
  fireEvent.error(preview)
  expect(preview).toHaveAttribute('src', image.thumbnailUrl)
  fireEvent.error(preview)
  expect(preview).toHaveAttribute('src', image.previewUrl)
})

it('uses the local video JPEG poster without mounting a video decoder in the picker', async () => {
  const video = { ...candidate('video-local'), mediaType: 'VIDEO', fileName: 'clip.mp4',
    localThumbnailUrl: 'http://localhost:8090/video/thumbnail', thumbnailUrl: 'https://media.test/video.jpg' }
  const { container } = render(<ChecklistEvidencePicker missionId="mission" open onClose={vi.fn()} onSelect={vi.fn()} loadCandidates={async () => [video]} />)
  const preview = await screen.findByRole('img', { name: video.fileName })
  expect(preview).toHaveAttribute('src', video.localThumbnailUrl)
  fireEvent.error(preview)
  expect(preview).toHaveAttribute('src', video.thumbnailUrl)
  expect(container.querySelector('video')).toBeNull()
})


it('shows local files and a retryable source warning when uploaded media is unavailable', async () => {
  const local = { ...candidate('local:capture'), fileName: 'captured.jpg', status: 'UPLOAD_PENDING' as const }
  const load = vi.fn().mockResolvedValueOnce({ items: [local], unavailableSources: ['uploaded'], hasMore: false })
    .mockResolvedValueOnce({ items: [local, candidate('uploaded-manual')], unavailableSources: [], hasMore: false })
  const select = vi.fn().mockResolvedValue(undefined)
  render(<ChecklistEvidencePicker missionId="mission" open onClose={vi.fn()} onSelect={select} loadCandidates={load} />)
  const checkbox = await screen.findByRole('checkbox', { name: 'captured.jpg' })
  expect(screen.getByText(/Chưa tải được ảnh\/video từ hệ thống/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Trang sau' })).toBeDisabled()
  expect(select).not.toHaveBeenCalled()
  fireEvent.click(checkbox)
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
  await screen.findByRole('checkbox', { name: 'uploaded-manual.jpg' })
  expect(screen.queryByText(/Chưa tải được ảnh\/video từ hệ thống/)).toBeNull()
  expect(screen.getByRole('checkbox', { name: 'captured.jpg' })).toBeChecked()
  fireEvent.click(screen.getByRole('button', { name: 'Gắn 1 tệp' }))
  await waitFor(() => expect(select).toHaveBeenCalledWith([local]))
})

it('keeps uploaded files selectable when only the FC library is unavailable', async () => {
  const uploaded = candidate('manual')
  render(<ChecklistEvidencePicker missionId="mission" open onClose={vi.fn()} onSelect={vi.fn()}
    loadCandidates={async () => ({ items: [uploaded], unavailableSources: ['local'], hasMore: false })} />)
  expect(await screen.findByRole('checkbox', { name: 'manual.jpg' })).toBeEnabled()
  expect(screen.getByText(/Chưa kết nối được thư viện Bộ điều khiển bay/)).toBeInTheDocument()
})

it('clears stale candidates and selection when a retry is denied', async () => {
  const load = vi.fn().mockResolvedValueOnce({ items: [candidate('local:a')], unavailableSources: ['uploaded'], hasMore: false })
    .mockRejectedValueOnce(new Error('Denied'))
  render(<ChecklistEvidencePicker missionId="mission" open onClose={vi.fn()} onSelect={vi.fn()} loadCandidates={load} />)
  fireEvent.click(await screen.findByRole('checkbox', { name: 'local:a.jpg' }))
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
  await screen.findByRole('alert')
  expect(screen.queryByRole('checkbox')).toBeNull()
  expect(screen.getByRole('button', { name: 'Gắn 0 tệp' })).toBeDisabled()
  expect(screen.queryByText('Không có ảnh/video phù hợp.')).toBeNull()
})

it('does not expose selection from the previous Mission while the next one loads', async () => {
  const load = vi.fn().mockResolvedValue([candidate('old')])
  const { rerender } = render(<ChecklistEvidencePicker missionId="old" open onClose={vi.fn()} onSelect={vi.fn()} loadCandidates={load} />)
  fireEvent.click(await screen.findByRole('checkbox', { name: 'old.jpg' }))
  const next = vi.fn().mockResolvedValue([candidate('new')])
  rerender(<ChecklistEvidencePicker missionId="new" open onClose={vi.fn()} onSelect={vi.fn()} loadCandidates={next} />)
  await screen.findByRole('checkbox', { name: 'new.jpg' })
  expect(screen.queryByRole('checkbox', { name: 'old.jpg' })).toBeNull()
  expect(screen.getByRole('button', { name: 'Gắn 0 tệp' })).toBeDisabled()
})

it('shows capture-age rejection while keeping the selected file available for review', async () => {
  const onClose = vi.fn()
  render(<ChecklistEvidencePicker missionId="m" open onClose={onClose}
    loadCandidates={async () => [candidate('expired')]}
    onSelect={vi.fn().mockRejectedValue(Object.assign(new Error('internal detail'), { code: 'MEDIA_CAPTURE_TOO_OLD' }))} />)
  fireEvent.click(await screen.findByRole('checkbox', { name: 'expired.jpg' }))
  fireEvent.click(screen.getByRole('button', { name: 'Gắn 1 tệp' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Thời điểm chụp/quay đã vượt giới hạn')
  expect(screen.getByRole('checkbox', { name: 'expired.jpg' })).toBeChecked()
  expect(screen.queryByText('internal detail')).toBeNull()
  expect(onClose).not.toHaveBeenCalled()
})
