import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { missionApi } from '../../../../mission/api/missionApi'
import type { MissionPermissions } from '../../../../mission/types/permissions'
import { MissionActionGuard } from '../MissionActionGuard'

const permissions: MissionPermissions = {
  canRespond: false,
  canControlFlight: false,
  canOperatePayload: false,
  canInspectDevice: false,
  canMaintainDevice: true,
  canUploadMedia: false,
}
afterEach(() => vi.restoreAllMocks())

describe('mission action guard', () => {
  it('allows stop-only cockpit without allowing connect or preflight', async () => {
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...permissions,
      canTerminateFlight: true,
    })
    render(
      <MissionActionGuard missionId="m1" action="flight">
        <div>Stop-only cockpit</div>
      </MissionActionGuard>,
    )
    expect(await screen.findByText('Stop-only cockpit')).toBeInTheDocument()
  })
  it('allows a monitoring actor into the shared media/checklist workspace without granting upload', async () => {
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...permissions,
      canMaintainDevice: false,
      canExecuteMonitoringChecklist: true,
    })
    render(
      <MissionActionGuard missionId="m1" action="upload">
        <div>Monitoring workspace</div>
      </MissionActionGuard>,
    )
    expect(await screen.findByText('Monitoring workspace')).toBeInTheDocument()
  })
  it('lets the assigned inspector view Pilot uploads without upload permission', async () => {
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...permissions,
      canMaintainDevice: false,
      canInspectDevice: true,
      canUploadMedia: false,
    })
    render(
      <MissionActionGuard missionId="m1" action="upload">
        <div>Readonly Pilot media</div>
      </MissionActionGuard>,
    )
    expect(await screen.findByText('Readonly Pilot media')).toBeInTheDocument()
  })
  it('does not render a flight screen for a maintainer', async () => {
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue(permissions)
    render(
      <MissionActionGuard missionId="m1" action="flight">
        <div>Flight controls</div>
      </MissionActionGuard>,
    )
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.queryByText('Flight controls')).toBeNull()
  })
  it('allows postcheck independently of wizard progress', async () => {
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue(permissions)
    render(
      <MissionActionGuard missionId="m1" action="postflight">
        <div>Inspection form</div>
      </MissionActionGuard>,
    )
    expect(await screen.findByText('Inspection form')).toBeTruthy()
  })
  it('guides a pilot away from operator-only connect steps into the cockpit', async () => {
    window.location.hash = '#portal/staff/connect/m1'
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...permissions,
      canControlFlight: true,
      canInspectDevice: false,
    })
    render(
      <MissionActionGuard missionId="m1" action="connect">
        <div>Connect screen</div>
      </MissionActionGuard>,
    )

    expect(await screen.findByText('Đang mở buồng lái')).toBeTruthy()
    await waitFor(() =>
      expect(window.location.hash).toBe('#portal/staff/flight/m1'),
    )
    expect(screen.queryByText('Connect screen')).toBeNull()
  })
  it('keeps a multi-role staff member on preflight instead of redirecting to cockpit', async () => {
    window.location.hash = '#portal/staff/preflight/m1'
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...permissions,
      canControlFlight: true,
      canOperatePayload: true,
      canMaintainDevice: true,
      canUploadMedia: true,
      canExecuteMonitoringChecklist: true,
    })
    render(
      <MissionActionGuard missionId="m1" action="preflight">
        <div>Precheck flow</div>
      </MissionActionGuard>,
    )

    expect(await screen.findByText('Precheck flow')).toBeTruthy()
    expect(window.location.hash).toBe('#portal/staff/preflight/m1')
  })
  it('fails closed if the backend denies permission', async () => {
    vi.spyOn(missionApi, 'getPermissions').mockRejectedValue(
      new Error('Forbidden'),
    )
    render(
      <MissionActionGuard missionId="m1" action="upload">
        <div>Upload form</div>
      </MissionActionGuard>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể xác nhận quyền Mission.',
    )
    expect(screen.queryByText('Forbidden')).toBeNull()
    expect(screen.queryByText('Upload form')).toBeNull()
  })
})
