import { describe, expect, it } from 'vitest'

import { env } from '../../config/env'
import { mockFetch } from '../mockServer'
import { createdOrders } from './customerOrdersStore'
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

  it('keeps customer order status updates out of the manager feed', async () => {
    const underReviewOrder = {
      id: 'notification-under-review-order',
      orderCode: 'ORD-UNDER-REVIEW',
      customerId: 'mock-customer-bao-le',
      orderStatus: 'UNDER_REVIEW',
      createdAt: '2026-11-12T10:00:00.000Z',
      updatedAt: '2026-11-12T10:01:00.000Z',
    }
    createdOrders.push(underReviewOrder)

    try {
      const [manager, customer] = await Promise.all([
        load('mock-staff-token'),
        load('mock-customer-token'),
      ])

      expect(manager.payload.data.items).not.toContainEqual(
        expect.objectContaining({
          entityId: underReviewOrder.id,
          type: 'ORDER_UNDER_REVIEW',
        }),
      )
      expect(customer.payload.data.items).toContainEqual(
        expect.objectContaining({
          entityId: underReviewOrder.id,
          type: 'ORDER_UNDER_REVIEW',
        }),
      )
    } finally {
      const index = createdOrders.indexOf(underReviewOrder)
      if (index >= 0) createdOrders.splice(index, 1)
    }
  })

  it('requires a recognized demo session', async () => {
    const { status, payload } = await load()

    expect(status).toBe(401)
    expect(payload.code).toBe('UNAUTHORIZED')
  })
})
