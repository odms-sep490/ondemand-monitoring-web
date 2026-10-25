import { afterEach, describe, expect, it } from 'vitest'

import {
  ApiError,
  resetHttpTransport,
  setHttpTransport,
} from '../../../shared/api/httpClient'
import { resetMockDb } from '../../../mocks/db'
import { mockFetch } from '../../../mocks'
import { ordersApi } from './ordersApi'
import { missionsApi, toMissionCalendarItem } from './missionsApi'
import type { MissionResponse } from '../types/missions'
import type { CreateMissionRequest } from '../types/missions'

const validRequest: CreateMissionRequest = {
  scopeLabel: 'Whole Order scope',
  scheduledStart: '2026-09-26T08:00:00+07:00',
  scheduledEnd: '2026-09-26T09:00:00+07:00',
  checklistIds: ['checklist-item-1'],
}

describe('Staff mission response mapping', () => {
  it('keeps unavailable schedule and assignment details unknown', () => {
    const item = toMissionCalendarItem({
      id: 'mission-1',
      orderId: 'order-1',
      orderTitle: 'Survey',
      missionCode: 'MS-001',
      status: 'SCHEDULED',
      scheduledStartAt: '2026-09-24T03:00:00Z',
      droneId: 'drone-1',
      droneCode: 'DRN-001',
      operatorId: 'operator-1',
      address: 'Site A',
      latitude: 10.5,
      longitude: 106.5,
    } as MissionResponse)

    expect(item.missionCode).toBe('MS-001')
    expect(item.serviceLabel).toBe('Survey')
    expect(item.scheduledEndAt).toBeNull()
    expect(item.operatorName).toBeNull()
    expect(item.orderCode).toBeNull()
  })
})

describe('missionsApi (mock mode)', () => {
  afterEach(() => {
    resetHttpTransport()
    resetMockDb()
  })

  it('createMission attaches a plan to the bare CREATED mission approve() makes', async () => {
    setHttpTransport(mockFetch)
    await ordersApi.approve('ord-2609-0157')
    const mission = await missionsApi.createMission(
      'ord-2609-0157',
      validRequest,
    )
    expect(mission.missionCode).toBe('MSN-2609-0157-1')
    expect(mission.flightPlan).toBeNull()
    expect(mission.scheduledStartAt).toBe(validRequest.scheduledStart)
  })

  it('createMission starts a new attempt when the mission already has a plan', async () => {
    // msn-2609-0153-1 is seeded with a flight plan already attached (the
    // MNG-05 default-state demo mission) — a second createMission call for
    // the same order must not overwrite it.
    setHttpTransport(mockFetch)
    const mission = await missionsApi.createMission(
      'ord-2609-0153',
      validRequest,
    )
    expect(mission.missionCode).toBe('MSN-2609-0153-2')
  })

  it('createMission 409s for a non-APPROVED order', async () => {
    setHttpTransport(mockFetch)
    await expect(
      missionsApi.createMission('ord-2609-0160', validRequest),
    ).rejects.toMatchObject({ status: 409 })
  })

  it('getMission resolves the seeded demo mission', async () => {
    setHttpTransport(mockFetch)
    const mission = await missionsApi.getMission('msn-2609-0153-1')
    expect(mission.orderCode).toBe('ORD-2609-0153')
    expect(mission.nearestBase).toBe('Trạm Nhà Bè')
  })

  it('getMission 404s for an unknown id', async () => {
    setHttpTransport(mockFetch)
    await expect(
      missionsApi.getMission('does-not-exist'),
    ).rejects.toMatchObject({ status: 404 })
  })

  it('getResourceSuggestions resolves the default feasible scenario', async () => {
    setHttpTransport(mockFetch)
    const suggestions =
      await missionsApi.getResourceSuggestions('msn-2609-0153-1')
    expect(suggestions.feasible).toBe(true)
    expect(suggestions.topDrones).toHaveLength(3)
    expect(suggestions.topDrones[0].code).toBe('DRN-01')
  })

  it('getResourceSuggestions resolves the insufficient scenario via query flag', async () => {
    setHttpTransport(mockFetch)
    const suggestions = await missionsApi.getResourceSuggestions(
      'msn-2609-0153-1',
      { scenario: 'insufficient' },
    )
    expect(suggestions.feasible).toBe(false)
    expect(suggestions.alternatives).toHaveLength(3)
  })

  it('assignDrone assigns and moves the mission to RESOURCE_ASSIGNING', async () => {
    setHttpTransport(mockFetch)
    const mission = await missionsApi.assignDrone('msn-2609-0153-1', 'DRN-01')
    expect(mission.status).toBe('RESOURCE_ASSIGNING')
    expect(mission.droneId).toBe('drn-01')
  })

  it('assignDrone 409s SCHEDULE_CONFLICT for DRN-04 against the seeded booking', async () => {
    setHttpTransport(mockFetch)
    try {
      await missionsApi.assignDrone('msn-2609-0153-1', 'DRN-04')
      throw new Error('expected rejection')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).status).toBe(409)
      expect((err as ApiError).code).toBe('SCHEDULE_CONFLICT')
    }
  })

  it('assignDrone then assignOperator moves the mission to WAITING_OPERATOR_ACCEPTANCE', async () => {
    setHttpTransport(mockFetch)
    const afterDrone = await missionsApi.assignDrone(
      'msn-2609-0153-1',
      'DRN-01',
    )
    expect(afterDrone.status).toBe('RESOURCE_ASSIGNING')
    const afterOperator = await missionsApi.assignOperator(
      'msn-2609-0153-1',
      'HT',
    )
    expect(afterOperator.status).toBe('WAITING_OPERATOR_ACCEPTANCE')
  })

  it('releaseAssignment requires a non-blank reason', async () => {
    setHttpTransport(mockFetch)
    await missionsApi.assignDrone('msn-2609-0153-1', 'DRN-01')
    await expect(
      missionsApi.releaseAssignment(
        'msn-2609-0153-1',
        'mda-msn-2609-0153-1-drn-01',
        '',
      ),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('releaseAssignment releases the drone and returns the mission to CREATED', async () => {
    setHttpTransport(mockFetch)
    await missionsApi.assignDrone('msn-2609-0153-1', 'DRN-01')
    const released = await missionsApi.releaseAssignment(
      'msn-2609-0153-1',
      'mda-msn-2609-0153-1-drn-01',
      'Drone bị gọi bảo trì khẩn',
    )
    expect(released.status).toBe('CREATED')
    expect(released.droneId).toBeNull()
  })
})

// ── P6 API client tests ───────────────────────────────────────────────────

describe('missionsApi.listMissions', () => {
  it('returns items array', async () => {
    setHttpTransport(mockFetch)
    const result = await missionsApi.listMissions()
    expect(Array.isArray(result.items)).toBe(true)
    expect(result.items.length).toBeGreaterThan(0)
  })

  it('filters by status', async () => {
    setHttpTransport(mockFetch)
    const result = await missionsApi.listMissions({ status: 'IN_FLIGHT' })
    expect(result.items.every((m) => m.status === 'IN_FLIGHT')).toBe(true)
  })
})

describe('missionsApi.patchSchedule', () => {
  it('updates the mission schedule', async () => {
    setHttpTransport(mockFetch)
    const updated = await missionsApi.patchSchedule('msn-2609-0153-1', {
      scheduledStart: '2026-09-26T10:00:00+07:00',
      scheduledEnd: '2026-09-26T11:30:00+07:00',
    })
    expect(updated.scheduledStartAt).toBe('2026-09-26T10:00:00+07:00')
  })

  it('throws ApiError 400 when body incomplete', async () => {
    setHttpTransport(mockFetch)
    await expect(
      missionsApi.patchSchedule('msn-2609-0153-1', {
        scheduledStart: '',
        scheduledEnd: '',
      }),
    ).rejects.toBeInstanceOf(ApiError)
  })
})

describe('missionsApi.getLive', () => {
  it('returns telemetry for MSN-2609-0142-1', async () => {
    setHttpTransport(mockFetch)
    const live = await missionsApi.getLive('msn-2609-0142-1')
    expect(live.missionStatus).toBe('IN_FLIGHT')
    expect(live.batteryPct).toBe(71)
    expect(live.livestream?.isLive).toBe(true)
  })
})

describe('missionsApi.createIncident', () => {
  it('creates an incident', async () => {
    setHttpTransport(mockFetch)
    const incident = await missionsApi.createIncident('msn-2609-0142-1', {
      type: 'WIND',
      description: 'Gió mạnh',
    })
    expect(incident.type).toBe('WIND')
  })
})

describe('missionsApi.cancelMission', () => {
  it('cancels the mission', async () => {
    setHttpTransport(mockFetch)
    const m = await missionsApi.cancelMission('msn-2609-0142-1', {
      expectedPlanRevision: 0,
      reason: 'Thời tiết xấu',
    })
    expect(m.status).toBe('CANCELLED')
  })
})

describe('mission staff assignment contract', () => {
  it('assigns the selected flight operator as PILOT, not payload OPERATOR', async () => {
    let submitted: unknown
    setHttpTransport(async (_url, init) => {
      submitted = JSON.parse(String(init?.body))
      return Response.json({ success: true, data: { id: 'mission-1' } })
    })
    await missionsApi.assignOperator('mission-1', 'staff-1')
    expect(submitted).toEqual({ staffId: 'staff-1', assignedRole: 'PILOT' })
  })
})
