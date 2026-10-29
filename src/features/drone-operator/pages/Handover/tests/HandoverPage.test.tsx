import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { missionApi } from '../../../../mission/api/missionApi'
import { useActiveMission } from '../../../api/useActiveMission'
import { flightControlApi } from '../../../api/flightControlApi'
import { HandoverPage } from '../HandoverPage'

vi.mock('../../../api/useActiveMission')

describe('HandoverScreen', () => {
  beforeEach(() => {
    act(() => setLanguage('vi'))
    vi.mocked(useActiveMission).mockReturnValue({
      data: undefined,
      missionId: '',
      loading: false,
      error: null,
      allMissions: [],
      postflightMissions: [],
      selectMission: vi.fn(),
    } as unknown as ReturnType<typeof useActiveMission>)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    window.location.hash = ''
  })

  it('renders vietnamese chrome text', () => {
    render(<HandoverPage />)
    expect(screen.getByText('Bàn giao quyền điều khiển')).toBeTruthy()
    expect(
      screen.getByText('Xác nhận bàn giao sau kiểm tra trước chuyến bay'),
    ).toBeTruthy()
  })

  it('renders english chrome text when language is switched', () => {
    render(<HandoverPage />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Control handover')).toBeTruthy()
    expect(
      screen.getByText('Post-preflight handover confirmation'),
    ).toBeTruthy()
  })

  it('sends a multi-role staff member straight to flight after handover', async () => {
    window.location.hash = '#portal/staff/handover/mission-1'
    vi.mocked(useActiveMission).mockReturnValue({
      data: {
        id: 'mission-1',
        missionId: 'mission-1',
        missionCode: 'MS-1',
        status: 'READY_TO_FLY',
        deviceId: 'drone-1',
        droneCode: 'DRN-1',
      },
      missionId: 'mission-1',
      loading: false,
      error: null,
      allMissions: [],
      postflightMissions: [],
      selectMission: vi.fn(),
    } as unknown as ReturnType<typeof useActiveMission>)
    vi.spyOn(flightControlApi, 'bindSession').mockResolvedValue({ ok: true, missionId: 'mission-1', deviceId: 'drone-1' })
    vi.spyOn(missionApi, 'handoverMyMission').mockResolvedValue({} as never)
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      canRespond: true,
      canControlFlight: true,
      canOperatePayload: true,
      canInspectDevice: true,
      canMaintainDevice: true,
      canUploadMedia: true,
      canCompleteMission: true,
      canSubmitMissionResult: true,
      canExecuteMonitoringChecklist: true,
    })

    render(<HandoverPage missionId="mission-1" />)

    for (const checkbox of screen.getAllByRole('checkbox')) {
      fireEvent.click(checkbox)
    }
    fireEvent.click(screen.getByRole('button', { name: /Tôi xác nhận/ }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Xác nhận bàn giao' }),
    )

    await waitFor(() =>
      expect(window.location.hash).toBe('#portal/staff/flight/mission-1'),
    )
    expect(missionApi.handoverMyMission).toHaveBeenCalledWith('mission-1')
  })

  it('returns an operator-only staff member to the mission list after handover', async () => {
    window.location.hash = '#portal/staff/handover/mission-1'
    vi.mocked(useActiveMission).mockReturnValue({
      data: {
        id: 'mission-1',
        missionId: 'mission-1',
        missionCode: 'MS-1',
        status: 'READY_TO_FLY',
        deviceId: 'drone-1',
        droneCode: 'DRN-1',
      },
      missionId: 'mission-1',
      loading: false,
      error: null,
      allMissions: [],
      postflightMissions: [],
      selectMission: vi.fn(),
    } as unknown as ReturnType<typeof useActiveMission>)
    vi.spyOn(flightControlApi, 'bindSession').mockResolvedValue({ ok: true, missionId: 'mission-1', deviceId: 'drone-1' })
    vi.spyOn(missionApi, 'handoverMyMission').mockResolvedValue({} as never)
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      canRespond: true,
      canControlFlight: false,
      canOperatePayload: true,
      canInspectDevice: false,
      canMaintainDevice: false,
      canUploadMedia: false,
    })

    render(<HandoverPage missionId="mission-1" />)

    for (const checkbox of screen.getAllByRole('checkbox')) {
      fireEvent.click(checkbox)
    }
    fireEvent.click(screen.getByRole('button', { name: /Tôi xác nhận/ }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Xác nhận bàn giao' }),
    )

    await waitFor(() =>
      expect(window.location.hash).toBe('#portal/staff/missions'),
    )
  })
})
