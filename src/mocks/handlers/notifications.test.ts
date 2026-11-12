import { describe, expect, it } from 'vitest'

import { env } from '../../config/env'
import { mockFetch } from '../mockServer'
import '../index'

async function load(token?: string) {
  const response = await mockFetch(
    `${env.apiBaseUrl}/api/notifications?limit=30`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  )
  return { status: response.status, payload: await response.json() }
}

describe('GET /api/notifications mock feed', () => {
  it('returns customer order states for the signed-in demo customer', async () => {
    const { status, payload } = await load('mock-customer-token')

    expect(status).toBe(200)
    expect(payload.data.items).toContainEqual(
      expect.objectContaining({
        type: 'ORDER_IN_PROGRESS',
        entityId: 'cus-ord-001',
        reference: 'ORD-2609-0142',
      }),
    )
    expect(payload.data.items).not.toContainEqual(
      expect.objectContaining({ entityId: 'cus-ord-002' }),
    )
  })

  it('returns manager work items and staff assignments by role', async () => {
    const manager = await load('mock-staff-token')
    const staff = await load('mock-drone-op-token')

    expect(manager.payload.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'ORDER_CREATED' }),
      ]),
    )
    expect(staff.payload.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'MISSION_ASSIGNED' }),
      ]),
    )
  })

  it('requires a recognized demo session', async () => {
    const { status, payload } = await load()

    expect(status).toBe(401)
    expect(payload.code).toBe('UNAUTHORIZED')
  })
})
