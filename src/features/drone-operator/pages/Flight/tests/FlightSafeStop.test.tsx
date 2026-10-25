import { act } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { missionApi } from '../../../../mission/api/missionApi'
import type { Mission } from '../../../../mission/types/mission'
import { FlightPage } from '../FlightPage'

vi.mock('../components/InFlightControl', () => ({
  default: (props: {
    normalFlightAllowed: boolean
    terminationAllowed: boolean
    operationalMessage?: string
    onRTB: () => void
  }) => (
    <div>
      <span>
        {props.normalFlightAllowed ? 'Flight allowed' : 'Flight locked'}
      </span>
      <span>
        {props.terminationAllowed
          ? 'Termination allowed'
          : 'Termination locked'}
      </span>
      <span>{props.operationalMessage}</span>
      <button onClick={props.onRTB}>Return</button>
    </div>
  ),
}))

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})
const mission = { id: 'm', status: 'IN_FLIGHT', deviceId: 'd' } as Mission
const access = {
  canRespond: false,
  canControlFlight: true,
  canOperatePayload: false,
  canInspectDevice: false,
  canMaintainDevice: false,
  canUploadMedia: false,
  canTerminateFlight: false,
}

describe('active cockpit safe-stop contract', () => {
  it.each([
    new TypeError('Failed to fetch'),
    new DOMException('Aborted', 'AbortError'),
  ])('network failure degrades to a localized error: %s', async (error) => {
    vi.spyOn(missionApi, 'getMissionById').mockRejectedValue(error)
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue(access)
    await act(async () => {
      render(<FlightPage missionId="m" />)
    })
    expect(screen.getByRole('heading')).toBeInTheDocument()
    expect(screen.queryByText(error.message)).not.toBeInTheDocument()
    expect(screen.queryByText('Flight allowed')).not.toBeInTheDocument()
  })
  it('ignores a late response from the previous Mission after a route switch', async () => {
    let resolvePrevious!: (value: Mission) => void
    const previous = new Promise<Mission>((resolve) => {
      resolvePrevious = resolve
    })
    vi.spyOn(missionApi, 'getMissionById').mockImplementation((id) =>
      id === 'm'
        ? previous
        : Promise.resolve({ ...mission, id, safeStopStatus: 'REQUESTED' }),
    )
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue(access)
    const view = render(<FlightPage missionId="m" />)
    await act(async () => {
      view.rerender(<FlightPage missionId="m2" />)
    })
    expect(screen.getByText('Đang dừng an toàn')).toBeInTheDocument()
    await act(async () => {
      resolvePrevious(mission)
    })
    expect(screen.getByText('Đang dừng an toàn')).toBeInTheDocument()
    expect(screen.getByText('Flight locked')).toBeInTheDocument()
  })
  it.each([401, 403, 404, 409, 500])(
    'permission HTTP %s renders a localized error instead of blanking',
    async (status) => {
      vi.spyOn(missionApi, 'getMissionById').mockResolvedValue(mission)
      vi.spyOn(missionApi, 'getPermissions').mockRejectedValue(
        new Error('HTTP ' + status),
      )
      await act(async () => {
        render(<FlightPage missionId="m" />)
      })
      expect(screen.getByRole('heading')).toBeInTheDocument()
      expect(screen.queryByText('HTTP ' + status)).not.toBeInTheDocument()
      expect(screen.queryByText('Flight allowed')).not.toBeInTheDocument()
    },
  )
  it('does not poll or update a cockpit after unmount', async () => {
    vi.useFakeTimers()
    const get = vi
      .spyOn(missionApi, 'getMissionById')
      .mockResolvedValue(mission)
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue(access)
    let unmount: () => void = () => {}
    await act(async () => {
      unmount = render(<FlightPage missionId="m" />).unmount
    })
    unmount()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000)
    })
    expect(get).toHaveBeenCalledTimes(1)
  })
  it('reacts to a request while already open, without re-enabling normal flight', async () => {
    vi.useFakeTimers()
    const get = vi
      .spyOn(missionApi, 'getMissionById')
      .mockResolvedValue(mission)
    const permissions = vi
      .spyOn(missionApi, 'getPermissions')
      .mockResolvedValue(access)
    await act(async () => {
      render(<FlightPage missionId="m" />)
    })
    expect(screen.getByText('Flight allowed')).toBeInTheDocument()
    get.mockResolvedValue({
      ...mission,
      safeStopStatus: 'REQUESTED',
      safeStopRequestedAt: 'now',
    })
    permissions.mockResolvedValue({
      ...access,
      canControlFlight: false,
      canTerminateFlight: true,
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })
    expect(screen.getByText('Flight locked')).toBeInTheDocument()
    expect(screen.getByText('Termination allowed')).toBeInTheDocument()
    expect(screen.getByText('Đang dừng an toàn')).toBeInTheDocument()
  })

  it('a return command during safe-stop does not pretend landing or reopen preflight', async () => {
    vi.spyOn(missionApi, 'getMissionById').mockResolvedValue({
      ...mission,
      safeStopStatus: 'REQUESTED',
    })
    vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
      ...access,
      canControlFlight: false,
      canTerminateFlight: true,
    })
    vi.spyOn(missionApi, 'markReturning').mockResolvedValue({
      ...mission,
      status: 'RETURNING',
      safeStopStatus: 'REQUESTED',
    })
    const postflight = vi.spyOn(missionApi, 'startPostflight')
    await act(async () => {
      render(<FlightPage missionId="m" />)
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Return' }))
    })
    expect(postflight).not.toHaveBeenCalled()
    expect(screen.getByText('Flight locked')).toBeInTheDocument()
  })
})
