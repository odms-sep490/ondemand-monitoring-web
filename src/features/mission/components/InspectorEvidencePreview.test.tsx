import { afterEach, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ApiError } from '../../../shared/api/httpClient'
import { setLanguage } from '../../../shared/i18n'
import { checklistExecutionApi } from '../api/checklistExecutionApi'
import { InspectorEvidencePreview } from './InspectorEvidencePreview'
import type {
  MissionChecklistEvidence,
  MissionChecklistResponse,
} from '../types/checklistExecution'
const link = {
  evidenceId: 'evidence',
  mediaId: 'media',
  mediaType: 'IMAGE',
  fileName: 'drone.jpg',
  previewUrl: '/expired.jpg',
  thumbnailUrl: '/thumbnail.jpg',
} as MissionChecklistEvidence
const response = (previewUrl: string | null): MissionChecklistResponse =>
  ({
    missionId: 'mission',
    executions: [{ id: 'execution', evidence: [{ ...link, previewUrl }] }],
  }) as MissionChecklistResponse
function renderPreview() {
  return render(
    <InspectorEvidencePreview
      missionId="mission"
      executionId="execution"
      link={link}
      onClose={vi.fn()}
    />,
  )
}
function failImage() {
  fireEvent.error(document.querySelector('.ant-image-preview-img')!)
}
afterEach(() => {
  vi.restoreAllMocks()
  setLanguage('vi')
})
it('renews an expired preview through the exact Staff checklist scope without opening an old modal', async () => {
  const read = vi
    .spyOn(checklistExecutionApi, 'getMissionChecklistExecutions')
    .mockResolvedValue(response('/fresh.jpg'))
  renderPreview()
  failImage()
  await waitFor(() =>
    expect(document.querySelector('.ant-image-preview-img')).toHaveAttribute(
      'src',
      '/fresh.jpg',
    ),
  )
  expect(read).toHaveBeenCalledExactlyOnceWith(
    'mission',
    expect.any(AbortSignal),
  )
  expect(document.querySelector('.ant-modal')).toBeNull()
})
it('clearly labels a thumbnail fallback instead of presenting it as a quality preview', async () => {
  vi.spyOn(
    checklistExecutionApi,
    'getMissionChecklistExecutions',
  ).mockResolvedValue(response('/fresh.jpg'))
  renderPreview()
  failImage()
  await waitFor(() =>
    expect(document.querySelector('.ant-image-preview-img')).toHaveAttribute(
      'src',
      '/fresh.jpg',
    ),
  )
  failImage()
  expect(document.querySelector('.ant-image-preview-img')).toHaveAttribute(
    'src',
    '/thumbnail.jpg',
  )
  expect(screen.getByRole('status')).toHaveTextContent('Đang xem ảnh thu nhỏ')
  expect(
    screen.getByRole('button', { name: 'Thử lại bản xem trước' }),
  ).toBeEnabled()
  failImage()
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Không thể mở bản xem trước',
  )
})
it('shows a localized error and hides media after a denied Staff refresh', async () => {
  setLanguage('en')
  vi.spyOn(
    checklistExecutionApi,
    'getMissionChecklistExecutions',
  ).mockRejectedValue(
    new ApiError('PRIVATE_DETAIL', {
      status: 403,
      method: 'GET',
      path: '/private',
    }),
  )
  renderPreview()
  failImage()
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to open the preview',
  )
  expect(document.querySelector('.ant-image-preview-img')).toBeNull()
  expect(screen.queryByText('PRIVATE_DETAIL')).toBeNull()
})
it('never renders another Mission or sibling evidence URL', async () => {
  vi.spyOn(
    checklistExecutionApi,
    'getMissionChecklistExecutions',
  ).mockResolvedValue({ ...response('/sibling.jpg'), missionId: 'sibling' })
  renderPreview()
  failImage()
  await screen.findByText(/Đang xem ảnh thu nhỏ/)
  expect(document.querySelector('.ant-image-preview-img')).toHaveAttribute(
    'src',
    '/thumbnail.jpg',
  )
})
it('ignores a late recovery response after the viewer closes', async () => {
  let finish!: (data: MissionChecklistResponse) => void
  vi.spyOn(
    checklistExecutionApi,
    'getMissionChecklistExecutions',
  ).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const view = renderPreview()
  failImage()
  view.unmount()
  await act(async () => finish(response('/late.jpg')))
  expect(document.querySelector('.ant-image-preview-img')).toBeNull()
})
it('can open a thumbnail-only attachment with an explicit limitation notice', () => {
  const read = vi.spyOn(checklistExecutionApi, 'getMissionChecklistExecutions')
  render(
    <InspectorEvidencePreview
      missionId="mission"
      executionId="execution"
      link={{ ...link, previewUrl: null }}
      onClose={vi.fn()}
    />,
  )
  expect(document.querySelector('.ant-image-preview-img')).toHaveAttribute(
    'src',
    '/thumbnail.jpg',
  )
  expect(screen.getByRole('status')).toHaveTextContent('Đang xem ảnh thu nhỏ')
  expect(read).not.toHaveBeenCalled()
})

it('keeps zoom, rotation, reset and close usable without fetching another file', async () => {
  const read = vi.spyOn(checklistExecutionApi, 'getMissionChecklistExecutions')
  const close = vi.fn()
  render(<InspectorEvidencePreview missionId="mission" executionId="execution" link={link} onClose={close} />)
  expect(screen.getByText('drone.jpg')).toHaveAttribute('title', 'drone.jpg')
  fireEvent.click(screen.getByRole('button', { name: 'Phóng to' }))
  await waitFor(() => expect(screen.queryByText('100%')).toBeNull())
  fireEvent.click(screen.getByRole('button', { name: 'Xoay phải' }))
  await waitFor(() => expect(document.querySelector('.ant-image-preview-img')?.getAttribute('style')).toContain('rotate(90deg)'))
  fireEvent.click(screen.getByRole('button', { name: 'Vừa khung' }))
  await screen.findByText('100%')
  fireEvent.click(screen.getByRole('button', { name: 'Đóng' }))
  expect(close).toHaveBeenCalledTimes(1)
  expect(read).not.toHaveBeenCalled()
})
