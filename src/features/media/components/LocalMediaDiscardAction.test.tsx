import { afterEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { setLanguage } from '../../../shared/i18n'
import { operatorMediaApi, type LocalMedia } from '../api/operatorMediaApi'
import { LocalMediaDiscardAction } from './LocalMediaDiscardAction'

const item = {
  missionId: 'mission',
  localMediaId: 'local-photo',
  fileName: 'drone.jpg',
  mediaType: 'IMAGE',
  status: 'REVIEW_PENDING',
  localAvailable: true,
  uploadChannel: 'FLIGHT_CONTROLLER',
} as LocalMedia

afterEach(() => {
  vi.restoreAllMocks()
  setLanguage('vi')
})
function open() {
  fireEvent.click(
    screen.getByRole('button', { name: 'Xóa tệp trên thiết bị: drone.jpg' }),
  )
}

it('discards the exact local file only after confirmation and refreshes on success', async () => {
  const api = vi
    .spyOn(operatorMediaApi, 'discard')
    .mockResolvedValue({ ok: true })
  const refresh = vi.fn()
  render(
    <LocalMediaDiscardAction item={item} canDiscard onDiscarded={refresh} />,
  )
  open()
  expect(api).not.toHaveBeenCalled()
  expect(
    await screen.findByText(/Media đã upload và liên kết bằng chứng/),
  ).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Xóa tệp' }))
  await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
  expect(api).toHaveBeenCalledExactlyOnceWith('local-photo')
})
it('cancelling leaves the local file untouched', async () => {
  const api = vi.spyOn(operatorMediaApi, 'discard')
  render(
    <LocalMediaDiscardAction item={item} canDiscard onDiscarded={vi.fn()} />,
  )
  open()
  fireEvent.click(await screen.findByRole('button', { name: 'Hủy' }))
  expect(api).not.toHaveBeenCalled()
})
it('preserves the card and shows a localized error on failure', async () => {
  const api = vi
    .spyOn(operatorMediaApi, 'discard')
    .mockRejectedValue(new Error('INTERNAL_ERROR'))
  const refresh = vi.fn()
  render(
    <LocalMediaDiscardAction item={item} canDiscard onDiscarded={refresh} />,
  )
  open()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Xóa tệp' }),
  )
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Không thể xóa tệp',
  )
  expect(screen.queryByText('INTERNAL_ERROR')).toBeNull()
  expect(api).toHaveBeenCalledTimes(1)
  expect(refresh).not.toHaveBeenCalled()
})
it.each([
  { ...item, uploadChannel: 'STAFF_FILE' as const },
  { ...item, localAvailable: false },
  { ...item, status: 'UPLOADING' as const },
  { ...item, status: 'AVAILABLE' as const },
])(
  'hides discard for unsupported source/availability/status: $uploadChannel $status $localAvailable',
  (row) => {
    const { container } = render(
      <LocalMediaDiscardAction item={row} canDiscard onDiscarded={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  },
)
it('requires Mission media permission', () => {
  const { container } = render(
    <LocalMediaDiscardAction
      item={item}
      canDiscard={false}
      onDiscarded={vi.fn()}
    />,
  )
  expect(container).toBeEmptyDOMElement()
})
it('supports local video and English confirmation', async () => {
  setLanguage('en')
  render(
    <LocalMediaDiscardAction
      item={{
        ...item,
        mediaType: 'VIDEO',
        fileName: 'drone.mp4',
        status: 'UPLOAD_FAILED',
      }}
      canDiscard
      onDiscarded={vi.fn()}
    />,
  )
  fireEvent.click(
    screen.getByRole('button', { name: 'Delete local copy: drone.mp4' }),
  )
  expect(
    await screen.findByRole('button', { name: 'Delete file' }),
  ).toBeInTheDocument()
})
