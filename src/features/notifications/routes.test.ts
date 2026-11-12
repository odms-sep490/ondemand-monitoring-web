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

  it('maps mission notifications to the existing detail route for each role', () => {
    expect(
      parseCustomerRoute(notificationHref(missionNotification, 'CUSTOMER')!),
    ).toEqual({
      screen: 'missionHistoryDetail',
      missionId: 'mission-1',
    })
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
  })
})
