import { describe, expect, it } from 'vitest'

import { parseCustomerRoute } from '../customer/routes'
import { parseManagerRoute } from '../manager/routes'
import { parseOperatorRoute } from '../drone-operator/routes'
import { notificationHref, notificationsHref } from './routes'
import type { AppNotification } from './types'

const orderNotification: AppNotification = {
  id: 'order:order-1:created',
  type: 'ORDER_CREATED',
  entityId: 'order-1',
  reference: 'ORD-1',
  createdAt: '2026-11-12T10:00:00Z',
}

const missionNotification: AppNotification = {
  id: 'mission:mission-1:completed',
  type: 'MISSION_COMPLETED',
  entityId: 'mission-1',
  relatedEntityId: 'order-1',
  reference: 'MS-1',
  createdAt: '2026-11-12T10:00:00Z',
}

describe('notification routes', () => {
  it.each(['MISSION_STAFF_REPLACEMENT_REQUIRED', 'MISSION_DRONE_REPLACEMENT_REQUIRED'] as const)(
    'opens the saved plan for %s', (type) => {
      const href = notificationHref({ ...missionNotification, type }, 'MANAGER')!
      expect(href).toBe('#portal/manager/missions/mission-1/detail?tab=plan')
      expect(parseManagerRoute(href)).toEqual({ screen: 'missionDetail', missionId: 'mission-1' })
    },
  )
  it('maps order notifications to existing customer and manager order details', () => {
    expect(
      parseCustomerRoute(notificationHref(orderNotification, 'CUSTOMER')!),
    ).toEqual({
      screen: 'orderDetail',
      orderId: 'order-1',
    })
    expect(
      parseManagerRoute(notificationHref(orderNotification, 'MANAGER')!),
    ).toEqual({
      screen: 'orderReview',
      orderId: 'order-1',
    })
  })

  it.each([
    'ORDER_CREATED',
    'ORDER_UNDER_REVIEW',
    'ORDER_NEEDS_INFO',
    'ORDER_APPROVED',
    'ORDER_REJECTED',
    'ORDER_IN_PROGRESS',
    'ORDER_COMPLETED',
    'ORDER_CANCELLED',
    'ORDER_DEPOSIT_PAID',
    'ORDER_QUOTE_APPROVED',
    'ORDER_FINAL_PAYMENT_REQUIRED',
  ] as const)(
    'routes %s to the related order for customer and admin',
    (type) => {
      const notification = { ...orderNotification, type }
      expect(
        parseCustomerRoute(notificationHref(notification, 'CUSTOMER')!),
      ).toEqual({ screen: 'orderDetail', orderId: 'order-1' })
      expect(
        parseManagerRoute(notificationHref(notification, 'ADMIN')!),
      ).toEqual({ screen: 'orderReview', orderId: 'order-1' })
    },
  )

  it('maps mission notifications to an implemented route for each role', () => {
    expect(
      parseCustomerRoute(notificationHref(missionNotification, 'CUSTOMER')!),
    ).toEqual({
      screen: 'orderDetail',
      orderId: 'order-1',
    })
    expect(
      parseCustomerRoute(
        notificationHref(
          { ...missionNotification, relatedEntityId: undefined },
          'CUSTOMER',
        )!,
      ),
    ).toEqual({ screen: 'notifications' })
    expect(
      parseManagerRoute(notificationHref(missionNotification, 'MANAGER')!),
    ).toEqual({
      screen: 'missionDetail',
      missionId: 'mission-1',
    })
    expect(
      parseOperatorRoute(notificationHref(missionNotification, 'STAFF')!),
    ).toEqual({
      screen: 'missionDetail',
      missionId: 'mission-1',
    })
  })

  it('uses an implemented notification center for each role', () => {
    expect(parseCustomerRoute(notificationsHref('CUSTOMER')!)).toEqual({
      screen: 'notifications',
    })
    expect(parseManagerRoute(notificationsHref('MANAGER')!)).toEqual({
      screen: 'notifications',
    })
    expect(parseOperatorRoute(notificationsHref('STAFF')!)).toEqual({
      screen: 'notifications',
    })
    expect(parseManagerRoute(notificationsHref('ADMIN')!)).toEqual({
      screen: 'notifications',
    })
  })
})
