import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { MissionWorkspaceEvent } from '../../notifications/notificationRealtime'
import {
  notifyMissionWorkspaceChanged,
  subscribeMissionWorkspace,
  workspaceComponents,
  type MissionWorkspaceVersion,
  type WorkspaceComponent,
} from './missionWorkspaceUpdates'
import { useMissionWorkspaceUpdates } from './useMissionWorkspaceUpdates'

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  subscribeEvents: vi.fn(),
  subscribeAuth: vi.fn(),
  stopEvents: vi.fn(),
  stopAuth: vi.fn(),
  userId: 'pilot-1' as string | undefined,
  eventListener: undefined as
    ((event?: MissionWorkspaceEvent) => void) | undefined,
  authListener: undefined as (() => void) | undefined,
}))

vi.mock('../../../shared/api/httpClient', () => ({
  apiRequest: mocks.apiRequest,
}))
vi.mock('../../notifications/notificationRealtime', () => ({
  subscribeMissionWorkspaceEvents: mocks.subscribeEvents,
}))
vi.mock('../../auth/api/authApi', () => ({
  authSession: {
    getUser: () => (mocks.userId ? { id: mocks.userId } : undefined),
    getEpoch: () => 'epoch',
    subscribe: mocks.subscribeAuth,
  },
}))

const missionId = 'mission-1'
const subscriptions = new Set<() => void>()

function version(
  overrides: Partial<MissionWorkspaceVersion> = {},
): MissionWorkspaceVersion {
  return {
    missionId,
    checklist: 'checklist-1',
    result: 'result-1',
    permissions: 'permissions-1',
    media: 'media-1',
    corrections: 'corrections-1',
    ...overrides,
  }
}

function subscribe(listener = vi.fn(), id = missionId) {
  const unsubscribe = subscribeMissionWorkspace(id, listener)
  const stop = () => {
    subscriptions.delete(stop)
    unsubscribe()
  }
  subscriptions.add(stop)
  return { listener, stop }
}

function emit(
  components: WorkspaceComponent[] = ['checklist'],
  id = missionId,
) {
  mocks.eventListener!({
    eventId: 'event-1',
    missionId: id,
    components,
    occurredAt: '2026-11-27T10:00:00Z',
  })
}

async function probe() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(100)
  })
}

function deferred() {
  let resolve!: (value: unknown) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<unknown>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.resetAllMocks()
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  mocks.userId = 'pilot-1'
  mocks.eventListener = undefined
  mocks.authListener = undefined
  mocks.apiRequest.mockResolvedValue(version())
  mocks.subscribeEvents.mockImplementation(
    (listener: (event?: MissionWorkspaceEvent) => void) => {
      mocks.eventListener = listener
      return mocks.stopEvents
    },
  )
  mocks.subscribeAuth.mockImplementation((listener: () => void) => {
    mocks.authListener = listener
    return mocks.stopAuth
  })
})

afterEach(() => {
  cleanup()
  subscriptions.forEach((stop) => stop())
  vi.clearAllTimers()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('shared mission workspace version probes', () => {
  it('shares an initial full resync when a write was missed before STOMP connected', async () => {
    // Domain GETs returned old data; the newer version is the only evidence of
    // a write before the event subscription connected. No event is delivered.
    mocks.apiRequest.mockResolvedValue(version({ media: 'media-2' }))
    const first = subscribe()
    const second = subscribe()
    expect(mocks.apiRequest).not.toHaveBeenCalled()
    await probe()

    expect(mocks.apiRequest).toHaveBeenCalledExactlyOnceWith(
      '/api/missions/mission-1/workspace-version',
      { signal: expect.any(AbortSignal) },
    )
    expect(mocks.subscribeEvents).toHaveBeenCalledTimes(1)
    expect(mocks.subscribeAuth).toHaveBeenCalledTimes(1)
    expect(first.listener).toHaveBeenCalledExactlyOnceWith(workspaceComponents)
    expect(second.listener).toHaveBeenCalledExactlyOnceWith(workspaceComponents)
  })

  it('coalesces an event burst and reports only components whose versions changed', async () => {
    const { listener } = subscribe()
    await probe()
    listener.mockClear()
    mocks.apiRequest.mockResolvedValue(
      version({ checklist: 'checklist-2', media: 'media-2' }),
    )
    emit(['result'])
    emit(['media'])
    emit(['permissions', 'checklist'])
    await probe()

    expect(mocks.apiRequest).toHaveBeenCalledTimes(2)
    expect(listener).toHaveBeenCalledExactlyOnceWith(['checklist', 'media'])
  })

  it('does not refetch consumer data when an event leaves all versions unchanged', async () => {
    const { listener } = subscribe()
    await probe()
    listener.mockClear()
    emit([...workspaceComponents])
    await probe()
    expect(mocks.apiRequest).toHaveBeenCalledTimes(2)
    expect(listener).not.toHaveBeenCalled()
  })

  it('keeps different missions isolated and encodes the mission URL', async () => {
    const first = subscribe()
    const second = subscribe(vi.fn(), 'mission /2')
    mocks.apiRequest.mockImplementation(async (url: string) =>
      version({
        missionId: url.includes('mission%20%2F2') ? 'mission /2' : missionId,
      }),
    )
    await probe()
    first.listener.mockClear()
    second.listener.mockClear()
    expect(mocks.apiRequest).toHaveBeenCalledWith(
      '/api/missions/mission%20%2F2/workspace-version',
      { signal: expect.any(AbortSignal) },
    )
    emit(['media'], 'unmounted-mission')
    await probe()
    expect(mocks.apiRequest).toHaveBeenCalledTimes(2)

    mocks.apiRequest.mockResolvedValue(version({ media: 'media-2' }))
    emit(['media'])
    await probe()
    expect(mocks.apiRequest).toHaveBeenCalledTimes(3)
    expect(first.listener).toHaveBeenCalledExactlyOnceWith(['media'])
    expect(second.listener).not.toHaveBeenCalled()
  })

  it.each([
    ['wrong mission', version({ missionId: 'other-mission', media: 'bad' })],
    ['null', null],
    ['missing components', { missionId }],
    ['non-string component', version({ media: 42 as unknown as string })],
  ])(
    'does not trust a %s response or replace its last valid baseline',
    async (_, invalid) => {
      const { listener } = subscribe()
      await probe()
      listener.mockClear()
      mocks.apiRequest.mockResolvedValueOnce(invalid)
      emit(['media'])
      await probe()
      // An invalid probe fails open so normal queries revalidate authorization.
      expect(listener).toHaveBeenCalledExactlyOnceWith(workspaceComponents)
      listener.mockClear()

      emit(['media'])
      await probe()
      expect(listener).not.toHaveBeenCalled()
      mocks.apiRequest.mockResolvedValueOnce(version({ result: 'result-2' }))
      emit(['result'])
      await probe()
      expect(listener).toHaveBeenCalledExactlyOnceWith(['result'])
    },
  )

  it('revalidates all consumers on a failed probe and permits a later retry', async () => {
    const { listener } = subscribe()
    await probe()
    listener.mockClear()
    mocks.apiRequest.mockRejectedValueOnce(new Error('Forbidden'))
    emit()
    await probe()
    expect(listener).toHaveBeenCalledExactlyOnceWith(workspaceComponents)
    listener.mockClear()
    mocks.apiRequest.mockResolvedValueOnce(
      version({ permissions: 'permissions-2' }),
    )
    window.dispatchEvent(new Event('focus'))
    await probe()
    expect(listener).toHaveBeenCalledExactlyOnceWith(['permissions'])
  })

  it.each(['focus', 'online', 'reconnect'])(
    'probes on %s without refetching unchanged consumer data',
    async (trigger) => {
      const { listener } = subscribe()
      await probe()
      expect(listener).toHaveBeenCalledExactlyOnceWith(workspaceComponents)
      listener.mockClear()
      if (trigger === 'reconnect') mocks.eventListener!()
      else window.dispatchEvent(new Event(trigger))
      await probe()
      expect(mocks.apiRequest).toHaveBeenCalledTimes(2)
      expect(listener).not.toHaveBeenCalled()
    },
  )

  it('defers hidden work until the document becomes visible', async () => {
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    const { listener } = subscribe()
    emit(['media'])
    window.dispatchEvent(new Event('focus'))
    mocks.eventListener!()
    await probe()
    expect(mocks.apiRequest).not.toHaveBeenCalled()

    hidden.mockReturnValue(false)
    document.dispatchEvent(new Event('visibilitychange'))
    await probe()
    expect(mocks.apiRequest).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledExactlyOnceWith(workspaceComponents)
  })

  it('does not poll or leave interval timers running while idle', async () => {
    const interval = vi.spyOn(globalThis, 'setInterval')
    subscribe()
    await probe()
    expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(10 * 60_000)
    expect(mocks.apiRequest).toHaveBeenCalledTimes(1)
    expect(interval).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('queues exactly one followup for events arriving during an in-flight probe', async () => {
    const { listener } = subscribe()
    await probe()
    listener.mockClear()
    const pending = deferred()
    mocks.apiRequest.mockReturnValueOnce(pending.promise)
    emit(['checklist'])
    await probe()
    emit(['media'])
    emit(['corrections'])
    await probe()
    expect(mocks.apiRequest).toHaveBeenCalledTimes(2)

    pending.resolve(version())
    await act(async () => {
      await Promise.resolve()
    })
    expect(listener).not.toHaveBeenCalled()
    mocks.apiRequest.mockResolvedValueOnce(version({ media: 'media-2' }))
    await probe()
    expect(mocks.apiRequest).toHaveBeenCalledTimes(3)
    expect(listener).toHaveBeenCalledExactlyOnceWith(['media'])
    expect(vi.getTimerCount()).toBe(0)
  })

  it('fans local writes out to sibling subscribers through a single shared probe', async () => {
    const first = subscribe()
    const second = subscribe()
    const other = subscribe(vi.fn(), 'other-mission')
    mocks.apiRequest.mockImplementation(async (url: string) =>
      version({
        missionId: url.includes('/other-mission/')
          ? 'other-mission'
          : missionId,
      }),
    )
    await probe()
    first.listener.mockClear()
    second.listener.mockClear()
    other.listener.mockClear()
    mocks.apiRequest.mockResolvedValue(
      version({ corrections: 'corrections-2' }),
    )
    notifyMissionWorkspaceChanged(missionId, ['corrections'])
    notifyMissionWorkspaceChanged(missionId, ['corrections'])
    notifyMissionWorkspaceChanged('unmounted-mission', ['media'])
    await probe()

    expect(mocks.apiRequest).toHaveBeenCalledTimes(3)
    expect(first.listener).toHaveBeenCalledExactlyOnceWith(['corrections'])
    expect(second.listener).toHaveBeenCalledExactlyOnceWith(['corrections'])
    expect(other.listener).not.toHaveBeenCalled()
  })

  it('isolates a throwing consumer without broadening sibling invalidations', async () => {
    const broken = vi.fn()
    subscribe(broken)
    const sibling = subscribe()
    await probe()
    broken.mockClear()
    sibling.listener.mockClear()
    broken.mockImplementationOnce(() => {
      throw new Error('Consumer render failed')
    })
    mocks.apiRequest.mockResolvedValue(version({ media: 'media-2' }))
    emit(['media'])
    await probe()

    expect(sibling.listener).toHaveBeenCalledExactlyOnceWith(['media'])
    expect(broken).toHaveBeenCalledTimes(1)
  })
})

describe('workspace subscription lifecycle', () => {
  it('keeps shared work alive until the last subscriber leaves', async () => {
    const first = subscribe()
    const second = subscribe()
    first.stop()
    expect(mocks.stopEvents).not.toHaveBeenCalled()
    expect(mocks.stopAuth).not.toHaveBeenCalled()
    await probe()
    second.listener.mockClear()
    mocks.apiRequest.mockResolvedValue(version({ checklist: 'checklist-2' }))
    emit()
    await probe()
    expect(first.listener).not.toHaveBeenCalled()
    expect(second.listener).toHaveBeenCalledExactlyOnceWith(['checklist'])
    second.stop()
    expect(mocks.stopEvents).toHaveBeenCalledTimes(1)
    expect(mocks.stopAuth).toHaveBeenCalledTimes(1)
  })

  it('cancels a scheduled probe and removes browser listeners on final unsubscribe', async () => {
    const removeWindowListener = vi.spyOn(window, 'removeEventListener')
    const removeDocumentListener = vi.spyOn(document, 'removeEventListener')
    const { listener, stop } = subscribe()
    stop()
    expect(removeWindowListener).toHaveBeenCalledWith(
      'focus',
      expect.any(Function),
    )
    expect(removeWindowListener).toHaveBeenCalledWith(
      'online',
      expect.any(Function),
    )
    expect(removeDocumentListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
    )
    window.dispatchEvent(new Event('focus'))
    window.dispatchEvent(new Event('online'))
    document.dispatchEvent(new Event('visibilitychange'))
    notifyMissionWorkspaceChanged(missionId, ['media'])
    await probe()
    expect(mocks.apiRequest).not.toHaveBeenCalled()
    expect(listener).not.toHaveBeenCalled()
    expect(mocks.stopEvents).toHaveBeenCalledTimes(1)
    expect(mocks.stopAuth).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each(['resolve', 'reject'] as const)(
    'aborts an unsubscribed request and ignores its late %s after remount',
    async (settlement) => {
      const pending = deferred()
      mocks.apiRequest.mockReturnValueOnce(pending.promise)
      const old = subscribe()
      await probe()
      const signal = mocks.apiRequest.mock.calls[0][1].signal as AbortSignal
      old.stop()
      expect(signal.aborted).toBe(true)

      const current = subscribe()
      await probe()
      expect(current.listener).toHaveBeenCalledExactlyOnceWith(
        workspaceComponents,
      )
      current.listener.mockClear()
      if (settlement === 'resolve') pending.resolve(version({ media: 'stale' }))
      else pending.reject(new Error('Late request failure'))
      await act(async () => {
        await Promise.resolve()
      })
      expect(old.listener).not.toHaveBeenCalled()
      expect(current.listener).not.toHaveBeenCalled()
      emit(['media'])
      await probe()
      expect(current.listener).not.toHaveBeenCalled()
      expect(mocks.apiRequest).toHaveBeenCalledTimes(3)
      expect(vi.getTimerCount()).toBe(0)
    },
  )

  it('aborts old-owner work and resets the baseline when authentication changes', async () => {
    const { listener } = subscribe()
    await probe()
    listener.mockClear()
    const pending = deferred()
    mocks.apiRequest.mockReturnValueOnce(pending.promise)
    emit()
    await probe()
    const oldSignal = mocks.apiRequest.mock.calls[1][1].signal as AbortSignal
    mocks.userId = 'pilot-2'
    mocks.authListener!()
    expect(oldSignal.aborted).toBe(true)
    await probe()
    expect(listener).toHaveBeenCalledExactlyOnceWith(workspaceComponents)
    listener.mockClear()
    pending.resolve(version({ media: 'old-owner-version' }))
    await act(async () => {
      await Promise.resolve()
    })
    expect(listener).not.toHaveBeenCalled()
    emit(['media'])
    await probe()
    expect(listener).not.toHaveBeenCalled()
  })

  it('does not probe for an auth notification with the same owner', async () => {
    subscribe()
    await probe()
    mocks.authListener!()
    await probe()
    expect(mocks.apiRequest).toHaveBeenCalledTimes(1)
  })
})

describe('useMissionWorkspaceUpdates with the real shared subscription', () => {
  it('only invokes callbacks watching the components that changed', async () => {
    const checklist = vi.fn()
    const media = vi.fn()
    const permissions = vi.fn()
    renderHook(() =>
      useMissionWorkspaceUpdates(missionId, ['checklist'], checklist),
    )
    renderHook(() => useMissionWorkspaceUpdates(missionId, ['media'], media))
    renderHook(() =>
      useMissionWorkspaceUpdates(missionId, ['permissions'], permissions),
    )
    await probe()
    expect(checklist).toHaveBeenCalledExactlyOnceWith(['checklist'])
    expect(media).toHaveBeenCalledExactlyOnceWith(['media'])
    expect(permissions).toHaveBeenCalledExactlyOnceWith(['permissions'])
    checklist.mockClear()
    media.mockClear()
    permissions.mockClear()
    mocks.apiRequest.mockResolvedValue(
      version({ checklist: 'checklist-2', media: 'media-2' }),
    )
    emit([...workspaceComponents])
    await probe()
    expect(mocks.apiRequest).toHaveBeenCalledTimes(2)
    expect(checklist).toHaveBeenCalledExactlyOnceWith(['checklist'])
    expect(media).toHaveBeenCalledExactlyOnceWith(['media'])
    expect(permissions).not.toHaveBeenCalled()
  })

  it('uses the latest callback and watched components without resubscribing', async () => {
    const original = vi.fn()
    const latest = vi.fn()
    const { rerender } = renderHook(
      ({ components, onChange }) =>
        useMissionWorkspaceUpdates(missionId, components, onChange),
      {
        initialProps: {
          components: ['checklist'] as WorkspaceComponent[],
          onChange: original,
        },
      },
    )
    await probe()
    original.mockClear()
    rerender({ components: ['media'], onChange: latest })
    await probe()
    expect(mocks.apiRequest).toHaveBeenCalledTimes(1)
    expect(mocks.subscribeEvents).toHaveBeenCalledTimes(1)
    mocks.apiRequest.mockResolvedValue(
      version({ checklist: 'checklist-2', media: 'media-2' }),
    )
    emit(['checklist', 'media'])
    await probe()
    expect(original).not.toHaveBeenCalled()
    expect(latest).toHaveBeenCalledExactlyOnceWith(['media'])
  })

  it('does not subscribe while disabled or missionless and cleans up when disabled', async () => {
    const onChange = vi.fn()
    const { rerender } = renderHook(
      ({ id, enabled }) =>
        useMissionWorkspaceUpdates(id, ['media'], onChange, enabled),
      { initialProps: { id: missionId, enabled: false } },
    )
    await probe()
    rerender({ id: '', enabled: true })
    await probe()
    expect(mocks.subscribeEvents).not.toHaveBeenCalled()
    expect(mocks.apiRequest).not.toHaveBeenCalled()
    rerender({ id: missionId, enabled: true })
    await probe()
    expect(mocks.apiRequest).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['media'])
    onChange.mockClear()
    rerender({ id: missionId, enabled: false })
    expect(mocks.stopEvents).toHaveBeenCalledTimes(1)
    notifyMissionWorkspaceChanged(missionId, ['media'])
    await probe()
    expect(onChange).not.toHaveBeenCalled()
    expect(mocks.apiRequest).toHaveBeenCalledTimes(1)
  })
})
