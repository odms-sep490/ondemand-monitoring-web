// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  operatorMissionMediaApi,
  type UploadedMissionMedia,
} from '../api/operatorMissionMediaApi'
import { MissionUploadedMedia } from './MissionUploadedMedia'

vi.mock('../api/operatorMissionMediaApi', () => ({
  operatorMissionMediaApi: { list: vi.fn(), get: vi.fn() },
}))

const image: UploadedMissionMedia = {
  mediaId: 'image',
  missionId: 'mission',
  deviceId: 'device-0050',
  mediaType: 'IMAGE',
  fileName: 'capture.jpg',
  contentType: 'image/jpeg',
  fileSize: 1024,
  capturedAt: '2026-09-27T00:00:00Z',
  availableAt: null,
  downloadUrl: 'https://example.test/image',
  urlExpiresAt: '2026-09-27T01:00:00Z',
}
const video = {
  ...image,
  mediaId: 'video',
  mediaType: 'VIDEO',
  fileName: 'clip.mp4',
  contentType: 'video/mp4',
}
const page = (items: UploadedMissionMedia[]) => ({
  items,
  page: 0,
  totalItems: items.length,
  totalPages: 1,
  first: true,
  last: true,
})

describe('uploaded mission media gallery', () => {
  it('keeps AVAILABLE metadata visible without exposing an unreleased original', async () => {
    vi.mocked(operatorMissionMediaApi.list).mockResolvedValue(
      page([{ ...image, status: 'AVAILABLE', downloadUrl: null }]),
    )
    render(<MissionUploadedMedia missionId="mission" />)
    await screen.findByText('capture.jpg')
    expect(screen.getByText('Bản gốc chưa được bàn giao')).toBeInTheDocument()
    const preview = screen.getByRole('button', { name: 'Xem capture.jpg' })
    expect(preview).toBeDisabled()
    fireEvent.click(preview)
    expect(operatorMissionMediaApi.get).not.toHaveBeenCalled()
    expect(document.querySelector('img')).toBeNull()
  })
  it('refreshes media from a workspace revision without losing Mission identity', async () => {
    vi.mocked(operatorMissionMediaApi.list).mockResolvedValue(page([image]))
    const view = render(
      <MissionUploadedMedia missionId="mission" refreshKey={0} />,
    )
    await screen.findByText('capture.jpg')
    vi.mocked(operatorMissionMediaApi.list).mockResolvedValue(
      page([image, video]),
    )
    view.rerender(<MissionUploadedMedia missionId="mission" refreshKey={1} />)
    await screen.findByText('clip.mp4')
    expect(operatorMissionMediaApi.list).toHaveBeenLastCalledWith(
      'mission',
      0,
      expect.any(AbortSignal),
    )
  })
  it('notifies its Mission workspace after explicit media refresh', async () => {
    vi.mocked(operatorMissionMediaApi.list).mockResolvedValue(page([image]))
    const onChanged = vi.fn()
    render(<MissionUploadedMedia missionId="mission" onChanged={onChanged} />)
    await screen.findByText('capture.jpg')
    fireEvent.click(screen.getByRole('button', { name: 'Làm mới' }))
    expect(onChanged).toHaveBeenCalledOnce()
    await waitFor(() =>
      expect(operatorMissionMediaApi.list).toHaveBeenCalledTimes(2),
    )
  })
  it('approves media only through its explicit separate action', async () => {
    vi.mocked(operatorMissionMediaApi.list).mockResolvedValue(page([image]))
    const approveMedia = vi.fn().mockResolvedValue({})
    render(
      <MissionUploadedMedia missionId="mission" approveMedia={approveMedia} />,
    )
    fireEvent.click(await screen.findByText('Duyệt media cho khách hàng'))
    await waitFor(() =>
      expect(approveMedia).toHaveBeenCalledWith(image.mediaId),
    )
    expect(
      await screen.findByText('Đã duyệt media trong phiên này'),
    ).toBeDisabled()
  })
  it('distinguishes satellite media and draft result without claiming camera capture or manager submission', async () => {
    vi.mocked(operatorMissionMediaApi.list).mockResolvedValue(
      page([{ ...image, sourceType: 'SATELLITE_SNAPSHOT' }]),
    )
    render(<MissionUploadedMedia missionId="mission" reviewStatus="DRAFT" />)
    expect(
      await screen.findByText('Ảnh vệ tinh · Browser snapshot'),
    ).toBeTruthy()
    expect(
      screen.getAllByText('Kết quả nháp — chưa gửi manager').length,
    ).toBeGreaterThan(0)
    expect(screen.queryByText('Camera drone')).toBeNull()
  })
  beforeEach(() => {
    vi.clearAllMocks()
    HTMLDialogElement.prototype.showModal = vi.fn()
    HTMLDialogElement.prototype.close = vi.fn()
  })
  afterEach(cleanup)

  it('loads the selected mission and requests a fresh scoped video URL before playback', async () => {
    vi.mocked(operatorMissionMediaApi.list).mockResolvedValue(
      page([image, video]),
    )
    vi.mocked(operatorMissionMediaApi.get).mockResolvedValue({
      ...video,
      downloadUrl: 'https://example.test/fresh',
    })
    const { container } = render(<MissionUploadedMedia missionId="mission" />)
    await screen.findByText('capture.jpg')
    expect(operatorMissionMediaApi.list).toHaveBeenCalledWith(
      'mission',
      0,
      expect.any(AbortSignal),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Xem clip.mp4' }))
    await waitFor(() =>
      expect(container.querySelector('video')?.getAttribute('src')).toBe(
        'https://example.test/fresh',
      ),
    )
    expect(operatorMissionMediaApi.get).toHaveBeenCalledWith(
      'mission',
      'video',
      expect.any(AbortSignal),
    )
  })

  it('shows an empty state rather than local files', async () => {
    vi.mocked(operatorMissionMediaApi.list).mockResolvedValue(page([]))
    render(<MissionUploadedMedia missionId="mission" />)
    await screen.findByText('Chưa có ảnh/video được tải lên cho Mission này.')
  })

  it('shows errors and supports retry', async () => {
    vi.mocked(operatorMissionMediaApi.list)
      .mockRejectedValueOnce(new Error('Access denied'))
      .mockResolvedValue(page([]))
    render(<MissionUploadedMedia missionId="mission" />)
    await screen.findByText('Không thể tải ảnh/video của Mission này.')
    expect(screen.queryByText('Access denied')).toBeNull()
    fireEvent.click(screen.getByText('Thử lại'))
    await screen.findByText('Chưa có ảnh/video được tải lên cho Mission này.')
  })

  it('resets gallery when switching missions', async () => {
    vi.mocked(operatorMissionMediaApi.list)
      .mockResolvedValueOnce(page([image]))
      .mockResolvedValue(page([]))
    const view = render(<MissionUploadedMedia missionId="mission" />)
    await screen.findByText('capture.jpg')
    view.rerender(<MissionUploadedMedia missionId="other" />)
    await screen.findByText('Chưa có ảnh/video được tải lên cho Mission này.')
    expect(screen.queryByText('capture.jpg')).toBeNull()
  })
})
