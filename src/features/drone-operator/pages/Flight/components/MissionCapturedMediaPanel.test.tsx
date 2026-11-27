import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MissionCapturedMediaPanel, notifyFlightLocalMediaChanged } from './MissionCapturedMediaPanel'
import {
  operatorMediaApi,
  type LocalMedia,
} from '../../../../media/api/operatorMediaApi'
import type { Mission } from '../../../types/omss'
import { authSession } from '../../../../auth/api/authSession'
const updates = vi.hoisted(() => new Map<string, () => void>())
const session = vi.hoisted(() => ({ userId: 'u1' }))
vi.mock('../../../../auth/hooks/useAuthSession', () => ({
  useAuthSession: () => ({ user: { id: session.userId }, sessionKey: session.userId }),
}))
vi.mock('../../../../mission/realtime/useMissionWorkspaceUpdates', () => ({
  useMissionWorkspaceUpdates: (id: string, components: readonly string[], callback: () => void) => {
    updates.set(`${id}:${components.join(',')}`, callback)
  },
}))
vi.mock('../../../../mission/realtime/missionWorkspaceUpdates', () => ({
  // An unchanged backend version produces no callback. Local refresh must
  // still work for files that have not been registered with the backend.
  notifyMissionWorkspaceChanged: vi.fn(),
}))
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
beforeEach(() => { vi.clearAllMocks(); updates.clear(); session.userId = 'u1' })
describe('Cockpit shared Mission library', () => {
  it('refreshes local captures despite an unchanged backend version and scopes the event by Mission', async () => {
    vi.mocked(operatorMediaApi.reviewItems).mockResolvedValueOnce([])
    render(<MissionCapturedMediaPanel mission={mission} />)
    await waitFor(() => expect(operatorMediaApi.reviewItems).toHaveBeenCalledOnce())
    vi.mocked(operatorMediaApi.reviewItems).mockResolvedValue([{
      ...media('exact-uuid', 'before-s3.jpg'), uploadChannel: 'FLIGHT_CONTROLLER',
      localAvailable: true, localPreviewUrl: 'http://controller/local/photo',
    }])
    act(() => notifyFlightLocalMediaChanged('another-mission'))
    act(() => notifyFlightLocalMediaChanged('exact-uuid', { ...authSession.capture(), generation: -1 }))
    expect(operatorMediaApi.reviewItems).toHaveBeenCalledOnce()
    act(() => notifyFlightLocalMediaChanged('exact-uuid'))
    expect(await screen.findByText('before-s3.jpg')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('src', 'http://controller/local/photo')
  })
  it('refreshes media in place on a scoped update without a polling timer', async () => {
    vi.mocked(operatorMediaApi.reviewItems).mockResolvedValue([media('exact-uuid', 'kept.jpg')])
    const interval = vi.spyOn(window, 'setInterval')
    try {
      render(<MissionCapturedMediaPanel mission={mission} />)
      await screen.findByText('kept.jpg')
      const image = screen.getByRole('img')
      let resolveRefresh!: (items: LocalMedia[]) => void
      vi.mocked(operatorMediaApi.reviewItems).mockImplementationOnce(() => new Promise(resolve => { resolveRefresh = resolve }))
      act(() => updates.get('exact-uuid:media')!())
      expect(screen.getByText('kept.jpg')).toBeInTheDocument()
      expect(screen.getByRole('img')).toBe(image)
      await act(async () => resolveRefresh([media('exact-uuid', 'kept.jpg'), media('exact-uuid', 'new.jpg')]))
      expect(await screen.findByText('new.jpg')).toBeInTheDocument()
      expect(screen.getAllByRole('img')).toContain(image)
      expect(interval.mock.calls.some(([, delay]) => delay === 5000)).toBe(false)
    } finally { interval.mockRestore() }
  })

  it('keeps existing media on a failed background refresh', async () => {
    vi.mocked(operatorMediaApi.reviewItems).mockResolvedValue([media('exact-uuid', 'kept.jpg')])
    render(<MissionCapturedMediaPanel mission={mission} />)
    await screen.findByText('kept.jpg')
    const image = screen.getByRole('img')
    vi.mocked(operatorMediaApi.reviewItems).mockRejectedValueOnce(new Error('offline'))
    await act(async () => updates.get('exact-uuid:media')!())
    expect(screen.getByRole('img')).toBe(image)
    expect(screen.getByText('kept.jpg')).toBeInTheDocument()
  })
  it('clears retained media when the account changes on the same Mission', async () => {
    vi.mocked(operatorMediaApi.reviewItems).mockResolvedValueOnce([media('exact-uuid', 'old-account.jpg')])
    const { rerender } = render(<MissionCapturedMediaPanel mission={mission} />)
    await screen.findByText('old-account.jpg')
    let resolveNew!: (items: LocalMedia[]) => void
    vi.mocked(operatorMediaApi.reviewItems).mockImplementationOnce(() => new Promise(resolve => { resolveNew = resolve }))
    session.userId = 'u2'
    rerender(<MissionCapturedMediaPanel mission={mission} />)
    expect(screen.queryByText('old-account.jpg')).not.toBeInTheDocument()
    await act(async () => resolveNew([media('exact-uuid', 'new-account.jpg')]))
    expect(await screen.findByText('new-account.jpg')).toBeInTheDocument()
  })
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
