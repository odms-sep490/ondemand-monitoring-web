import { describe, expect, it } from 'vitest'

import { parseCustomerOrderNotification } from './notificationRealtime'

describe('customer order websocket events', () => {
  it.each([
    ['QUOTE_APPROVED', 'ORDER_QUOTE_APPROVED'],
    ['FINAL_PAYMENT_REQUIRED', 'ORDER_FINAL_PAYMENT_REQUIRED'],
  ] as const)(
    'maps %s to an actionable order notification',
    (eventType, type) => {
      expect(
        parseCustomerOrderNotification(
          JSON.stringify({
            eventType,
            orderId: 'order-123',
            occurredAt: '2026-11-12T10:00:00Z',
          }),
        ),
      ).toEqual({
        id: `order:order-123:${type}:2026-11-12T10:00:00Z`,
        type,
        entityId: 'order-123',
        reference: 'order-123',
        createdAt: '2026-11-12T10:00:00Z',
      })
    },
  )

  it('ignores unknown or malformed event messages', () => {
    expect(parseCustomerOrderNotification('{bad json')).toBeUndefined()
    expect(
      parseCustomerOrderNotification(
        JSON.stringify({
          eventType: 'ORDER_CANCELLED',
          orderId: 'order-123',
          occurredAt: '2026-11-12T10:00:00Z',
        }),
      ),
    ).toBeUndefined()
  })
})
