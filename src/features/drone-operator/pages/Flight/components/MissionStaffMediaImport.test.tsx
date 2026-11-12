import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MissionStaffMediaImport } from './MissionStaffMediaImport'
import { missionApi } from '../../../../mission/api/missionApi'
import { uploadStaffMediaBatch } from '../../../../media/upload/uploadStaffMediaBatch'

vi.mock('../../../../mission/api/missionApi', () => ({
  missionApi: { getPermissions: vi.fn(), getMissionById: vi.fn() },
}))
vi.mock('../../../../media/upload/uploadStaffMediaBatch', () => ({
  uploadStaffMediaBatch: vi.fn(),
}))
vi.mock('../../UploadMedia/components/StaffMediaImportPanel', () => ({
  StaffMediaImportPanel: ({
    disabled,
    onUpload,
  }: {
    disabled: boolean
    onUpload: (files: unknown[]) => void
  }) => (
    <button
      disabled={disabled}
      onClick={() =>
        onUpload([
          {
            file: new File(['photo'], 'drone.jpg'),
            capturedAt: '2026-11-10T01:00:00Z',
          },
        ])
      }
    >
      Chọn file drone
    </button>
  ),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(missionApi.getPermissions).mockResolvedValue({
    canUploadMedia: true,
  } as never)
  vi.mocked(missionApi.getMissionById).mockResolvedValue({
    id: 'mission-1',
    deviceId: 'device-1',
  } as never)
  vi.mocked(uploadStaffMediaBatch).mockResolvedValue({
    submitted: 1,
    failures: [],
  })
})
describe('Cockpit manual upload', () => {
  it('uploads to the exact Mission/device and refreshes the library', async () => {
    const reload = vi.fn()
    render(
      <MissionStaffMediaImport
        missionId="mission-1"
        missionStatus="IN_FLIGHT"
        onUploaded={reload}
      />,
    )
    fireEvent.click(await screen.findByText('Tải ảnh/video từ drone'))
    fireEvent.click(screen.getByRole('button', { name: 'Chọn file drone' }))
    await waitFor(() =>
      expect(uploadStaffMediaBatch).toHaveBeenCalledWith(
        expect.objectContaining({
          missionId: 'mission-1',
          deviceId: 'device-1',
        }),
      ),
    )
    expect(
      await screen.findByText('1 tệp đã được gửi để xác thực.'),
    ).toBeInTheDocument()
    expect(reload).toHaveBeenCalledOnce()
  })
  it('hides the picker when backend permissions deny upload', async () => {
    vi.mocked(missionApi.getPermissions).mockResolvedValue({
      canUploadMedia: false,
    } as never)
    const { container } = render(
      <MissionStaffMediaImport
        missionId="mission-1"
        missionStatus="COMPLETED"
        onUploaded={vi.fn()}
      />,
    )
    await waitFor(() => expect(container).toBeEmptyDOMElement())
    expect(uploadStaffMediaBatch).not.toHaveBeenCalled()
  })
  it('fails closed if the returned Mission does not match', async () => {
    vi.mocked(missionApi.getMissionById).mockResolvedValue({
      id: 'sibling',
      deviceId: 'device-2',
    } as never)
    const { container } = render(
      <MissionStaffMediaImport
        missionId="mission-1"
        missionStatus="IN_FLIGHT"
        onUploaded={vi.fn()}
      />,
    )
    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })
  it('shows transfer failures without automatic resubmission', async () => {
    vi.mocked(uploadStaffMediaBatch).mockResolvedValue({
      submitted: 0,
      failures: ['drone.jpg: Mất kết nối'],
    })
    render(
      <MissionStaffMediaImport
        missionId="mission-1"
        missionStatus="IN_FLIGHT"
        onUploaded={vi.fn()}
      />,
    )
    fireEvent.click(await screen.findByText('Tải ảnh/video từ drone'))
    fireEvent.click(screen.getByRole('button', { name: 'Chọn file drone' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'drone.jpg: Mất kết nối',
    )
    expect(uploadStaffMediaBatch).toHaveBeenCalledOnce()
  })
})
