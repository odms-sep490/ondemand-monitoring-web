import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { PostflightPage } from '../PostflightPage'
import { missionApi } from '../../../../mission/api/missionApi'
import { setLanguage } from '../../../../../shared/i18n'
const fixtures = vi.hoisted(() => ({
  check: { completedAt: '2026-11-15T00:00:00Z', overallOk: true } as { completedAt: string; overallOk: boolean } | null,
  checksFail: false,
  pendingDevice: null as string | null,
  mission: { id: 'm', missionCode: 'MS-1', status: 'IN_PROGRESS', deviceId: 'd', deviceAssignments: [{ deviceId: 'd', deviceCode: 'DRN-1' }] },
}))
vi.mock('../../../api/useActiveMission', () => ({ useActiveMission: () => ({ data: fixtures.mission, missionId: 'm', loading: false, error: null, reload: vi.fn(), selectMission: vi.fn() }) }))
vi.mock('../../../../mission/api/missionApi', () => ({ missionApi: { getPermissions: vi.fn() } }))
vi.mock('../../MissionDetail/checkData', () => ({ fetchLatestPostflightCheck: async (_id: string, _signal: AbortSignal | undefined, deviceId?: string) => { if (deviceId === fixtures.pendingDevice) return null; if (fixtures.checksFail) throw new Error('Offline'); return fixtures.check } }))
vi.mock('../usePostflightAssessment', () => ({ usePostflightAssessment: () => ({ handleSetResult: vi.fn(), handlePassAll: vi.fn(), handleComplete: vi.fn(), handleCreateTicket: vi.fn() }) }))
vi.mock('../components/PostflightCompletedView', () => ({ PostflightCompletedView: () => <div>Inspection workspace reached</div> }))
beforeEach(() => { vi.resetAllMocks(); setLanguage('vi'); window.location.hash = ''; fixtures.checksFail = false; fixtures.pendingDevice = null; fixtures.mission.deviceAssignments = [{ deviceId: 'd', deviceCode: 'DRN-1' }]; fixtures.check = { completedAt: '2026-11-15T00:00:00Z', overallOk: true } })
const inspector = { canAccessMissionInspection: true, canAssessMonitoringChecklist: false, canCompleteMission: true } as Awaited<ReturnType<typeof missionApi.getPermissions>>
it('opens the assigned Inspector workspace before the dossier is submitted', async () => {
  vi.mocked(missionApi.getPermissions).mockResolvedValue(inspector)
  render(<PostflightPage missionId="m" inspectionOnly />)
  expect(await screen.findByText('Inspection workspace reached')).toBeInTheDocument()
  expect(screen.queryByText('Chỉ nghiệm thu viên được truy cập')).toBeNull()
})
it('keeps the Inspector workspace open while waiting for the crew handoff after postflight completion', async () => {
  vi.mocked(missionApi.getPermissions).mockResolvedValue({ ...inspector, canCompleteMission: false })
  render(<PostflightPage missionId="m" inspectionOnly />)
  expect(await screen.findByText('Inspection workspace reached')).toBeInTheDocument()
})
it('returns the reporting crew to Mission details without the retired dossier UI', async () => {
  vi.mocked(missionApi.getPermissions).mockResolvedValue({ ...inspector, canAccessMissionInspection: false, canCompleteMission: false, canAttachChecklistEvidence: true })
  render(<PostflightPage missionId="m" inspectionOnly />)
  expect(await screen.findByRole('link', { name: 'Thông tin nhiệm vụ' })).toHaveAttribute('href', expect.stringContaining('m'))
  expect(screen.queryByText('Inspection workspace reached')).toBeNull()
})
it('does not treat a permissions request failure as a missing Inspector assignment', async () => {
  vi.mocked(missionApi.getPermissions).mockRejectedValue(new Error('Offline'))
  render(<PostflightPage missionId="m" inspectionOnly />)
  expect(await screen.findByText('Chưa tải được quyền truy cập')).toBeInTheDocument()
  expect(screen.queryByText('Chỉ nghiệm thu viên được truy cập')).toBeNull()
  vi.mocked(missionApi.getPermissions).mockResolvedValue(inspector)
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
  await waitFor(() => expect(screen.getByText('Inspection workspace reached')).toBeInTheDocument())
})
it('denies unassigned Staff even if an old action flag is present', async () => {
  vi.mocked(missionApi.getPermissions).mockResolvedValue({ ...inspector, canAccessMissionInspection: false })
  render(<PostflightPage missionId="m" inspectionOnly />)
  expect(await screen.findByText('Chỉ nghiệm thu viên được truy cập')).toBeInTheDocument()
  expect(screen.queryByText('Inspection workspace reached')).toBeNull()
})

it('keeps the inspection route out of the physical equipment check form', async () => {
  fixtures.check = null
  vi.mocked(missionApi.getPermissions).mockResolvedValue(inspector)
  render(<PostflightPage missionId="m" inspectionOnly />)
  expect(await screen.findByText('Chưa hoàn tất kiểm tra sau bay')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Mở kiểm tra sau bay' })).toHaveAttribute('href', '#portal/staff/postflight/m')
  expect(screen.queryByLabelText(/Pin/)).toBeNull()
})


it('does not infer fleet completion from the legacy primary device when assignments are missing', async () => {
  fixtures.mission.deviceAssignments = []
  render(<PostflightPage missionId="m" inspectionOnly />)
  expect(await screen.findByText('Chưa có thông tin thiết bị của nhiệm vụ')).toBeInTheDocument()
  expect(screen.queryByText('Inspection workspace reached')).toBeNull()
  expect(screen.queryByRole('progressbar')).toBeNull()
  expect(screen.queryByText(/Chọn thiết bị còn lại/)).toBeNull()
})

it('recovers the fleet list when the user reloads missing data', async () => {
  fixtures.mission.deviceAssignments = []
  vi.mocked(missionApi.getPermissions).mockResolvedValue(inspector)
  render(<PostflightPage missionId="m" inspectionOnly />)
  await screen.findByText('Chưa có thông tin thiết bị của nhiệm vụ')
  fixtures.mission.deviceAssignments = [{ deviceId: 'd', deviceCode: 'DRN-1' }]
  fireEvent.click(screen.getByRole('button', { name: 'Tải lại dữ liệu' }))
  expect(await screen.findByText('Inspection workspace reached')).toBeInTheDocument()
})

it('does not treat a failed fleet check request as an unfinished device', async () => {
  fixtures.checksFail = true
  vi.mocked(missionApi.getPermissions).mockResolvedValue(inspector)
  render(<PostflightPage missionId="m" inspectionOnly />)
  expect(await screen.findByRole('button', { name: 'Tải lại dữ liệu' })).toBeInTheDocument()
  expect(screen.queryByText('Inspection workspace reached')).toBeNull()
  fixtures.checksFail = false
  fireEvent.click(screen.getByRole('button', { name: 'Tải lại dữ liệu' }))
  expect(await screen.findByText('Inspection workspace reached')).toBeInTheDocument()
})


it('keeps inspection blocked until both assigned drones finish postflight', async () => {
  fixtures.mission.deviceAssignments = [{ deviceId: 'd', deviceCode: 'DRN-1' }, { deviceId: 'support', deviceCode: 'DRN-2' }]
  fixtures.pendingDevice = 'support'
  vi.mocked(missionApi.getPermissions).mockResolvedValue(inspector)
  render(<PostflightPage missionId="m" inspectionOnly />)
  expect(await screen.findByText('Chưa hoàn tất kiểm tra sau bay')).toBeInTheDocument()
  expect(screen.queryByText('Inspection workspace reached')).toBeNull()
})

it('opens inspection after checks for the entire released fleet have completed', async () => {
  fixtures.mission.deviceAssignments = [{ deviceId: 'd', deviceCode: 'DRN-1' }, { deviceId: 'support', deviceCode: 'DRN-2' }]
  vi.mocked(missionApi.getPermissions).mockResolvedValue(inspector)
  render(<PostflightPage missionId="m" inspectionOnly />)
  expect(await screen.findByText('Inspection workspace reached')).toBeInTheDocument()
})


it('moves straight from completed postflight to the assigned Inspector route', async () => {
  vi.mocked(missionApi.getPermissions).mockResolvedValue(inspector)
  render(<PostflightPage missionId="m" />)
  await waitFor(() => expect(window.location.hash).toBe('#portal/staff/inspection/m'))
  expect(screen.queryByText('Inspection workspace reached')).toBeNull()
})

it('routes a separate reporting Pilot back to Mission details without a dossier step', async () => {
  vi.mocked(missionApi.getPermissions).mockResolvedValue({ ...inspector, canAccessMissionInspection: false, canCompleteMission: false, canAttachChecklistEvidence: true })
  render(<PostflightPage missionId="m" />)
  await waitFor(() => expect(window.location.hash).toBe('#portal/staff/missions/m'))
  expect(screen.queryByText('Inspection workspace reached')).toBeNull()
})

it('does not navigate while fleet checks are missing or failed to load', async () => {
  fixtures.checksFail = true
  vi.mocked(missionApi.getPermissions).mockResolvedValue(inspector)
  render(<PostflightPage missionId="m" />)
  await screen.findByRole('button', { name: 'Tải lại dữ liệu' })
  expect(window.location.hash).toBe('')
})


it('waits for the last drone before navigating away from physical postflight', async () => {
  fixtures.mission.deviceAssignments = [{ deviceId: 'd', deviceCode: 'DRN-1' }, { deviceId: 'support', deviceCode: 'DRN-2' }]
  fixtures.pendingDevice = 'support'
  vi.mocked(missionApi.getPermissions).mockResolvedValue(inspector)
  render(<PostflightPage missionId="m" />)
  expect(await screen.findByRole('button', { name: /DRN-2/ })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
  expect(window.location.hash).toBe('')
})
