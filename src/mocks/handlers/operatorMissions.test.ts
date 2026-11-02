import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { env } from '../../config/env'
import { resetMockDb } from '../db'
import { mockFetch } from '../mockServer'
import '../index'

const base = env.apiBaseUrl

async function call(method: string, path: string, body?: unknown) {
  const response = await mockFetch(`${base}${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: response.status, payload: await response.json() }
}

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('POST /api/operator/missions/:id/accept', () => {
  it('accepts a pending mission', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0152-1/accept',
    )
    expect(status).toBe(200)
    expect(payload.data.status).toBe('ACCEPTED')
    expect(payload.data.acceptedAt).toBeTruthy()
  })

  it('rejects accept on a non-pending mission', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0141-1/accept',
    )
    expect(status).toBe(409)
    expect(payload.success).toBe(false)
  })

  it('404s for unknown mission', async () => {
    const { status } = await call('POST', '/api/operator/missions/NOPE/accept')
    expect(status).toBe(404)
  })
})

describe('POST /api/operator/missions/:id/reject', () => {
  it('rejects a pending mission with reason', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0152-1/reject',
      { reason: 'Trùng lịch cá nhân', notes: 'Đã có lịch bay khác' },
    )
    expect(status).toBe(200)
    expect(payload.data.status).toBe('REJECTED')
    expect(payload.data.rejectReason).toContain('Trùng lịch cá nhân')
  })

  it('requires a reason', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0152-1/reject',
      {},
    )
    expect(status).toBe(400)
  })

  it('rejects reject on a non-pending mission', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0141-1/reject',
      {
        reason: 'Lý do khác',
      },
    )
    expect(status).toBe(409)
  })
})

describe('POST /api/operator/missions/:id/connect', () => {
  it('connects with a gcs id', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/connect',
      { gcsId: 'DJI-RC-PLUS-7A31' },
    )
    expect(status).toBe(200)
    expect(payload.data.status).toBe('CONNECTED')
    expect(payload.data.connectedAt).toBeTruthy()
  })

  it('requires a gcsId', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/connect',
    )
    expect(status).toBe(400)
  })

  it('404s for unknown mission', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/NOPE/connect',
      { gcsId: 'y' },
    )
    expect(status).toBe(404)
  })
})

describe('POST /api/operator/missions/:id/handover', () => {
  it('requires the drone to be connected first', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/handover',
    )
    expect(status).toBe(409)
  })

  it('confirms handover after a successful connect', async () => {
    await call('POST', '/api/operator/missions/MSN-2609-0142-1/connect', {
      gcsId: 'DJI-RC-PLUS-7A31',
    })
    const { status, payload } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/handover',
    )
    expect(status).toBe(200)
    expect(payload.data.status).toBe('CONFIRMED')
    expect(payload.data.confirmedAt).toBeTruthy()
  })

  it('404s for unknown mission', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/NOPE/handover',
    )
    expect(status).toBe(404)
  })
})

describe('POST /api/operator/missions/:id/preflight', () => {
  it('saves a checklist of items', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/preflight',
      { items: [{ key: 'battery', result: 'ok' }] },
    )
    expect(status).toBe(200)
    expect(payload.data.items).toHaveLength(1)
    expect(payload.data.savedAt).toBeTruthy()
  })

  it('requires a note when an item fails', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/preflight',
      { items: [{ key: 'weather', result: 'fail' }] },
    )
    expect(status).toBe(400)
  })

  it('accepts a fail item with a note', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/preflight',
      { items: [{ key: 'weather', result: 'fail', note: 'Gió giật mạnh' }] },
    )
    expect(status).toBe(200)
  })

  it('requires items', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/preflight',
      {},
    )
    expect(status).toBe(400)
  })

  it('404s for unknown mission', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/NOPE/preflight',
      {
        items: [{ key: 'battery', result: 'ok' }],
      },
    )
    expect(status).toBe(404)
  })
})

describe('GET /api/operator/missions/:id/media', () => {
  it('returns the seeded media queue for the mission', async () => {
    const { status, payload } = await call(
      'GET',
      '/api/operator/missions/MSN-2609-0142-1/media',
    )
    expect(status).toBe(200)
    expect(payload.data.files).toHaveLength(20)
  })

  it('404s for unknown mission', async () => {
    const { status } = await call('GET', '/api/operator/missions/NOPE/media')
    expect(status).toBe(404)
  })
})

describe('POST /api/operator/missions/:id/media/:fileId/retry', () => {
  it('bumps the attempt and marks the file uploaded', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/media/IMG_0211.JPG/retry',
    )
    expect(status).toBe(200)
    expect(payload.data.status).toBe('UPLOADED')
    expect(payload.data.attempt).toBe(2)
  })

  it('refuses to retry a file that already used all attempts', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/media/VID_0031.MP4/retry',
    )
    expect(status).toBe(409)
  })

  it('404s for unknown file', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/media/NOPE.JPG/retry',
    )
    expect(status).toBe(404)
  })
})

describe('POST /api/operator/missions/:id/postflight', () => {
  const ALL_OK = [
    { key: 'battery_ok', result: 'ok' },
    { key: 'motor_ok', result: 'ok' },
    { key: 'camera_ok', result: 'ok' },
    { key: 'gps_ok', result: 'ok' },
    { key: 'communication_ok', result: 'ok' },
    { key: 'physical_condition_ok', result: 'ok' },
  ]

  it('saves the checklist and completes the mission when overall_ok', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/postflight',
      { items: ALL_OK },
    )
    expect(status).toBe(200)
    expect(payload.data.overallOk).toBe(true)
    expect(payload.data.savedAt).toBeTruthy()

    const mission = await call('GET', '/api/operator/missions/MSN-2609-0142-1')
    expect(mission.payload.data.status).toBe('COMPLETED')
  })

  it('does not complete the mission when an item fails', async () => {
    const items = ALL_OK.map((i) =>
      i.key === 'motor_ok' ? { ...i, result: 'fail' } : i,
    )
    const { status, payload } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/postflight',
      { items },
    )
    expect(status).toBe(200)
    expect(payload.data.overallOk).toBe(false)

    const mission = await call('GET', '/api/operator/missions/MSN-2609-0142-1')
    expect(mission.payload.data.status).not.toBe('COMPLETED')
  })

  it('requires all 6 items', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/postflight',
      { items: [{ key: 'battery_ok', result: 'ok' }] },
    )
    expect(status).toBe(400)
  })

  it('404s for unknown mission', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/NOPE/postflight',
      { items: ALL_OK },
    )
    expect(status).toBe(404)
  })
})

describe('POST /api/operator/missions/:id/maintenance-ticket', () => {
  it('creates a ticket with the given issue type and severity', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/maintenance-ticket',
      {
        issueType: 'MOTOR_VIBRATION',
        severity: 'HIGH',
        description: 'Rung động cơ bất thường',
      },
    )
    expect(status).toBe(200)
    expect(payload.data.id).toBeTruthy()
    expect(payload.data.issueType).toBe('MOTOR_VIBRATION')
    expect(payload.data.droneCode).toBeTruthy()
  })

  it('requires issueType and severity', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/maintenance-ticket',
      { description: 'x' },
    )
    expect(status).toBe(400)
  })

  it('404s for unknown mission', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/NOPE/maintenance-ticket',
      { issueType: 'OTHER', severity: 'LOW' },
    )
    expect(status).toBe(404)
  })
})
