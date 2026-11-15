import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { usePostflightAssessment } from '../usePostflightAssessment'
import { ALL_KEYS } from '../postflightHelpers'

const mocks = vi.hoisted(() => ({ save: vi.fn().mockResolvedValue({}), release: vi.fn() }))
vi.mock('../../../../mission/api/missionApi', () => ({ missionApi: { postFlightStatus: mocks.save } }))
vi.mock('../../../api/flightControlApi', () => ({ flightControlApi: { releaseSession: mocks.release } }))

describe('postflight for multiple drones', () => {
  it('saves the selected support drone without ending the mission or copying main telemetry', async () => {
    const setCompleted = vi.fn()
    const onSaved = vi.fn().mockResolvedValue(false)
    const noop = vi.fn()
    const { result } = renderHook(() => usePostflightAssessment({
      setResults: noop, effectiveMissionId: 'mission-1', setError: noop,
      allAssessed: true, setSaving: noop,
      activeData: { id: 'mission-1', deviceId: 'main', status: 'IN_PROGRESS', deviceAssignments: [] },
      results: Object.fromEntries(ALL_KEYS.map(k => [k, 'ok'])), failItems: [],
      deviceId: 'support', notes: '', telemetrySnapshot: null, missionLabel: 'MS-1',
      setCompleted, setTicketSubmitting: noop, setNotes: noop,
      setShowTicketDialog: noop, setTicketCreated: noop, onSaved,
    }))
    await act(async () => { await result.current.handleComplete() })
    expect(mocks.save).toHaveBeenCalledWith('mission-1', 'support', 'AVAILABLE', '', expect.any(Object), null)
    expect(onSaved).toHaveBeenCalledOnce()
    expect(mocks.release).not.toHaveBeenCalled()
    expect(setCompleted).not.toHaveBeenCalled()
  })
})
