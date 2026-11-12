import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MissionCapturedMediaPanel } from './MissionCapturedMediaPanel'
import {
  operatorMediaApi,
  type LocalMedia,
} from '../../../../media/api/operatorMediaApi'
import type { Mission } from '../../../types/omss'
vi.mock('../../../../media/api/operatorMediaApi', () => ({
  operatorMediaApi: { reviewItems: vi.fn(), previewUrl: vi.fn(), thumbnailUrl: vi.fn() },
}))
vi.mock('../../../../mission/api/missionApi', () => ({ missionApi: { getPermissions: vi.fn().mockResolvedValue({ canUploadMedia: true }) } }))
vi.mock('./MissionStaffMediaImport', () => ({
  MissionStaffMediaImport: ({ onUploaded }: { onUploaded: () => void }) => (
    <button onClick={onUploaded}>Upload complete</button>
  ),
}))
const mission = {
  id: 'MS-1',
  backendId: 'exact-uuid',
  state: 'IN_FLIGHT',
} as Mission
const media = (missionId: string, fileName: string): LocalMedia => ({
  missionId,
  fileName,
  localMediaId: fileName,
  deviceId: 'device',
  mediaType: 'IMAGE',
  fileSize: 500,
  contentType: 'image/jpeg',
  checksumSha256: '',
  capturedAt: '2026-11-10T01:00:00Z',
  uploadChannel: 'STAFF_FILE',
  localAvailable: false,
  thumbnailUrl: 'https://media.test/thumbnail',
  status: 'VALIDATING',
})
beforeEach(() => vi.clearAllMocks())
describe('Cockpit shared Mission library', () => {
  it('shows manually uploaded media with backend preview and refreshes after upload', async () => {
    vi.mocked(operatorMediaApi.reviewItems).mockResolvedValue([
      media('exact-uuid', 'manual-drone.jpg'),
    ])
    render(<MissionCapturedMediaPanel mission={mission} />)
    expect(await screen.findByText('manual-drone.jpg')).toBeInTheDocument()
    expect(operatorMediaApi.reviewItems).toHaveBeenCalledWith('exact-uuid', [
      'MS-1',
    ])
    expect(screen.getByText('Thủ công')).toBeInTheDocument()
    expect(screen.getByText('Đang xác thực')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://media.test/thumbnail',
    )
    expect(operatorMediaApi.previewUrl).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Upload complete' }))
    await waitFor(() =>
      expect(operatorMediaApi.reviewItems).toHaveBeenCalledTimes(2),
    )
  })
  it('ignores an old Mission response after switching to another Mission', async () => {
    let resolveFirst!: (items: LocalMedia[]) => void
    vi.mocked(operatorMediaApi.reviewItems).mockImplementation((id) =>
      id === 'exact-uuid'
        ? new Promise((resolve) => {
            resolveFirst = resolve
          })
        : Promise.resolve([media('second-uuid', 'second.jpg')]),
    )
    const { rerender } = render(<MissionCapturedMediaPanel mission={mission} />)
    rerender(
      <MissionCapturedMediaPanel
        mission={{ ...mission, id: 'MS-2', backendId: 'second-uuid' }}
      />,
    )
    expect(await screen.findByText('second.jpg')).toBeInTheDocument()
    await act(async () => resolveFirst([media('exact-uuid', 'first.jpg')]))
    expect(screen.queryByText('first.jpg')).not.toBeInTheDocument()
    expect(screen.getByText('second.jpg')).toBeInTheDocument()
  })
})


it('prefers local FC images and falls back to the remote thumbnail if local is unavailable', async () => {
  vi.mocked(operatorMediaApi.reviewItems).mockResolvedValue([{ ...media('exact-uuid', 'local-drone.jpg'),
    uploadChannel: 'FLIGHT_CONTROLLER', localAvailable: true,
    localPreviewUrl: 'http://localhost:8090/local-drone/preview',
    previewUrl: 'https://media.test/original-preview',
  }])
  render(<MissionCapturedMediaPanel mission={mission} />)
  await screen.findByText('local-drone.jpg')
  const image = screen.getByRole('img')
  expect(image).toHaveAttribute('src', 'http://localhost:8090/local-drone/preview')
  fireEvent.error(image)
  expect(image).toHaveAttribute('src', 'https://media.test/thumbnail')
})

it('renders a local video poster without loading a decoder in the Mission gallery', async () => {
  vi.mocked(operatorMediaApi.reviewItems).mockResolvedValue([{ ...media('exact-uuid', 'local-drone.mp4'),
    mediaType: 'VIDEO', uploadChannel: 'FLIGHT_CONTROLLER', localAvailable: true,
    localPreviewUrl: 'http://localhost:8090/local-drone/preview',
    localThumbnailUrl: 'http://localhost:8090/local-drone/thumbnail',
  }])
  render(<MissionCapturedMediaPanel mission={mission} />)
  await screen.findByText('local-drone.mp4')
  expect(screen.getByRole('img', { name: 'Video: local-drone.mp4' })).toHaveAttribute('src', 'http://localhost:8090/local-drone/thumbnail')
  expect(document.querySelector('video')).toBeNull()
})
