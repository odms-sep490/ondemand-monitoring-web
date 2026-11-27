import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { MissionChecklistPanel } from './MissionChecklistPanel'
import { notifyFlightLocalMediaChanged } from './MissionCapturedMediaPanel'
import type { Mission } from '../../../types/omss'
import type { MissionChecklistResponse } from '../../../../mission/types/checklistExecution'

const state = vi.hoisted(() => ({
  reload: vi.fn(),
  local: undefined as MissionChecklistResponse | undefined,
  jobs: [] as Array<{ id: string; stage: string }>,
}))
vi.mock('./MissionCapturedMediaPanel', () => ({ notifyFlightLocalMediaChanged: vi.fn() }))
vi.mock('../../../../mission/hooks/useMissionMonitoring', () => ({
  useMissionMonitoring: () => ({
    reload: state.reload, loading: false, error: undefined,
    data: { checklist: { missionId: 'm1', executions: [] }, permissions: {}, result: null },
  }),
}))
vi.mock('../../../../media/upload/useStaffLocalEvidence', () => ({
  useStaffLocalEvidence: () => ({ data: state.local, loading: !state.local }),
}))
vi.mock('../../../../mission/hooks/useMissionEvidenceQueue', () => ({
  useMissionEvidenceQueue: () => ({ jobs: state.jobs }),
}))
vi.mock('../../../../mission/components/MonitoringChecklistSection', () => ({
  MonitoringChecklistSection: ({ data, refresh, loading }: { data?: MissionChecklistResponse; refresh: () => void; loading: boolean }) => (
    <div>
      <button onClick={refresh}>Refresh checklist</button>
      {data && <input aria-label="Row draft" disabled={loading} />}
    </div>
  ),
}))
const mission = { id: 'MS-1', backendId: 'm1', maxAltitudeM: 10, estimatedMinutes: 20 } as Mission
const checklist = { missionId: 'm1', executions: [], readyForSubmission: false, legacySnapshot: false }
beforeEach(() => {
  vi.clearAllMocks()
  state.local = checklist
  state.jobs = []
  state.reload = vi.fn()
})

it('does not replay finished queue refreshes when callback identities change', async () => {
  state.jobs = [{ id: 'job1', stage: 'DONE' }]
  const first = vi.fn()
  const { rerender } = render(<MissionChecklistPanel mission={mission} progress={0} onChecklistChanged={first} />)
  await waitFor(() => expect(first).toHaveBeenCalledOnce())
  expect(notifyFlightLocalMediaChanged).toHaveBeenCalledExactlyOnceWith('m1')
  const latest = vi.fn()
  const latestReload = vi.fn()
  state.reload = latestReload
  rerender(<MissionChecklistPanel mission={mission} progress={1} onChecklistChanged={latest} />)
  expect(latest).not.toHaveBeenCalled()
  expect(latestReload).not.toHaveBeenCalled()
  expect(notifyFlightLocalMediaChanged).toHaveBeenCalledOnce()
  fireEvent.click(screen.getByText('Refresh checklist'))
  expect(latest).toHaveBeenCalledOnce()
  expect(latestReload).toHaveBeenCalledOnce()
})

it('keeps checklist rows and drafts mounted while local evidence resolves', () => {
  const { rerender } = render(<MissionChecklistPanel mission={mission} progress={0} />)
  const input = screen.getByRole('textbox', { name: 'Row draft' })
  fireEvent.change(input, { target: { value: 'unsaved observation' } })
  state.local = undefined
  rerender(<MissionChecklistPanel mission={mission} progress={1} />)
  expect(screen.getByRole('textbox')).toBe(input)
  expect(input).toHaveValue('unsaved observation')
  expect(input).toBeDisabled()
  state.local = { ...checklist }
  rerender(<MissionChecklistPanel mission={mission} progress={2} />)
  expect(screen.getByRole('textbox')).toBe(input)
  expect(input).toBeEnabled()
  state.local = undefined
  rerender(<MissionChecklistPanel mission={{ ...mission, backendId: 'm2' }} progress={0} />)
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
})
