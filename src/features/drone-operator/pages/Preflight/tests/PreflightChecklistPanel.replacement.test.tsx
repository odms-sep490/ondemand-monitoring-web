import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PreflightChecklistPanel } from '../components/PreflightChecklistPanel'

const { requestDeviceReplacement } = vi.hoisted(() => ({
  requestDeviceReplacement: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../../mission/api/missionApi', () => ({
  missionApi: { requestDeviceReplacement },
}))

vi.mock('../usePreflightGroups', () => ({
  usePreflightGroups: () => ({
    RUNTIME_GROUPS: [],
    ALL_ITEMS: [],
    storageKey: 'preflight-test',
  }),
}))

vi.mock('../usePreflightProgress', () => ({
  usePreflightProgress: () => ({
    itemStates: {},
    nOk: 3,
    nTotal: 11,
    failedItems: [{ label: 'Cánh quạt' }],
    runtimeItemsReady: false,
    progress: 27,
    hasTriggered: true,
    canContinueToHandover: false,
    isAlreadyInFlight: false,
    isFailed: true,
  }),
}))

vi.mock('../usePreflightBackendSync', () => ({
  usePreflightBackendSync: () => ({ syncRuntimeStatusToBackend: vi.fn() }),
}))

vi.mock('../usePreflightActions', () => ({
  usePreflightActions: () => ({ handleTriggerCheck: vi.fn() }),
}))

vi.mock('../usePreflightRuntimeEffects', () => ({
  usePreflightRuntimeEffects: vi.fn(),
}))

vi.mock('../usePreflightPersistenceEffects', () => ({
  usePreflightPersistenceEffects: vi.fn(),
}))

vi.mock('../components/PreflightHeader', () => ({
  PreflightHeader: () => null,
}))

vi.mock('../components/PreflightGroupList', () => ({
  PreflightGroupList: () => null,
}))

vi.mock('../components/PreflightSummary', () => ({
  PreflightSummary: ({
    replacementRequesting,
    replacementRequested,
    onRequestDroneReplacement,
  }: {
    replacementRequesting: boolean
    replacementRequested: boolean
    onRequestDroneReplacement: () => void
  }) => (
    <div>
      <p>{replacementRequested ? 'Đã gửi yêu cầu' : 'Có thể gửi yêu cầu'}</p>
      <button
        type="button"
        disabled={replacementRequesting || replacementRequested}
        onClick={onRequestDroneReplacement}
      >
        Yêu cầu đổi drone
      </button>
    </div>
  ),
}))

describe('PreflightChecklistPanel replacement request state', () => {
  beforeEach(() => {
    requestDeviceReplacement.mockClear()
    requestDeviceReplacement.mockResolvedValue(undefined)
  })

  it('clears an old request for the replaced assignment and allows a new request', async () => {
    const { rerender } = render(
      <PreflightChecklistPanel
        missionId="mission-1"
        deviceId="drone-old"
        deviceAssignmentId="assignment-old"
        replacementRequestPending
      />,
    )

    expect(screen.getByText('Đã gửi yêu cầu')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Yêu cầu đổi drone' }),
    ).toHaveProperty('disabled', true)

    rerender(
      <PreflightChecklistPanel
        missionId="mission-1"
        deviceId="drone-new"
        deviceAssignmentId="assignment-new"
        replacementRequestPending={false}
      />,
    )

    const replacementButton = screen.getByRole('button', {
      name: 'Yêu cầu đổi drone',
    })
    expect(screen.getByText('Có thể gửi yêu cầu')).toBeTruthy()
    expect(replacementButton).toHaveProperty('disabled', false)

    fireEvent.click(replacementButton)

    await waitFor(() => {
      expect(requestDeviceReplacement).toHaveBeenCalledWith(
        'mission-1',
        'Cánh quạt',
      )
    })
    expect(await screen.findByText('Đã gửi yêu cầu')).toBeTruthy()
    expect(replacementButton).toHaveProperty('disabled', true)
  })
})
