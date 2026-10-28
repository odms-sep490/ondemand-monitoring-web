import { describe, expect, it } from 'vitest'

import { managerHref, parseManagerRoute, type ManagerRoute } from './routes'

describe('parseManagerRoute', () => {
  it('parses the dashboard route (MNG-01)', () => {
    expect(parseManagerRoute('#portal/manager')).toEqual({
      screen: 'dashboard',
    })
  })

  it('parses the order queue route (MNG-02)', () => {
    expect(parseManagerRoute('#portal/manager/orders')).toEqual({
      screen: 'orderQueue',
    })
  })

  it('parses the order review route (MNG-03)', () => {
    expect(parseManagerRoute('#portal/manager/orders/ORD-1')).toEqual({
      screen: 'orderReview',
      orderId: 'ORD-1',
    })
  })

  it('parses the create-mission route (MNG-04)', () => {
    expect(parseManagerRoute('#portal/manager/orders/ORD-1/mission')).toEqual({
      screen: 'missionCreate',
      orderId: 'ORD-1',
    })
  })

  it('parses the dispatch route (MNG-05)', () => {
    expect(parseManagerRoute('#portal/manager/missions/MSN-1/detail')).toEqual({
      screen: 'missionDetail',
      missionId: 'MSN-1',
    })
    expect(
      parseManagerRoute('#portal/manager/missions/MSN-1/dispatch'),
    ).toEqual({
      screen: 'missionDispatch',
      missionId: 'MSN-1',
    })
  })

  it('parses the schedule route (MNG-06)', () => {
    expect(parseManagerRoute('#portal/manager/schedule')).toEqual({
      screen: 'schedule',
    })
  })

  it('parses the mission list routes (MNG-08), with and without missionId', () => {
    expect(parseManagerRoute('#portal/manager/missions')).toEqual({
      screen: 'missions',
      missionId: undefined,
    })
    expect(parseManagerRoute('#portal/manager/missions/MSN-1')).toEqual({
      screen: 'missions',
      missionId: 'MSN-1',
    })
  })

  it('parses the fleet routes (MNG-09), with and without droneId', () => {
    expect(parseManagerRoute('#portal/manager/drones')).toEqual({
      screen: 'drones',
      droneId: undefined,
    })
    expect(parseManagerRoute('#portal/manager/drones/DRN-1')).toEqual({
      screen: 'drones',
      droneId: 'DRN-1',
    })
  })

  it('parses the maintenance route (MNG-10)', () => {
    expect(parseManagerRoute('#portal/manager/maintenance')).toEqual({
      screen: 'maintenance',
    })
  })

  it('falls back to notFound for hashes outside the manager prefix', () => {
    expect(parseManagerRoute('#portal/customer')).toEqual({
      screen: 'notFound',
    })
    expect(parseManagerRoute('')).toEqual({ screen: 'notFound' })
  })

  it('falls back to notFound for unknown sub-paths and malformed segments', () => {
    expect(parseManagerRoute('#portal/manager/unknown')).toEqual({
      screen: 'notFound',
    })
    expect(parseManagerRoute('#portal/manager/orders/ORD-1/extra')).toEqual({
      screen: 'notFound',
    })
    expect(
      parseManagerRoute('#portal/manager/orders/ORD-1/not-mission'),
    ).toEqual({ screen: 'notFound' })
    expect(parseManagerRoute('#portal/manager/missions/MSN-1/extra')).toEqual({
      screen: 'notFound',
    })
    expect(parseManagerRoute('#portal/manager/drones/DRN-1/extra')).toEqual({
      screen: 'notFound',
    })
    expect(parseManagerRoute('#portal/manager/schedule/extra')).toEqual({
      screen: 'notFound',
    })
    expect(parseManagerRoute('#portal/manager/maintenance/extra')).toEqual({
      screen: 'notFound',
    })
  })
})

describe('managerHref', () => {
  const cases: Array<[ManagerRoute, string]> = [
    [{ screen: 'dashboard' }, '#portal/manager'],
    [{ screen: 'orderQueue' }, '#portal/manager/orders'],
    [
      { screen: 'orderReview', orderId: 'ORD-1' },
      '#portal/manager/orders/ORD-1',
    ],
    [
      { screen: 'missionCreate', orderId: 'ORD-1' },
      '#portal/manager/orders/ORD-1/mission',
    ],
    [
      { screen: 'missionDispatch', missionId: 'MSN-1' },
      '#portal/manager/missions/MSN-1/dispatch',
    ],
    [{ screen: 'schedule' }, '#portal/manager/schedule'],
    [{ screen: 'missions' }, '#portal/manager/missions'],
    [
      { screen: 'missions', missionId: 'MSN-1' },
      '#portal/manager/missions/MSN-1',
    ],
    [{ screen: 'drones' }, '#portal/manager/drones'],
    [{ screen: 'drones', droneId: 'DRN-1' }, '#portal/manager/drones/DRN-1'],
    [{ screen: 'maintenance' }, '#portal/manager/maintenance'],
    [{ screen: 'notFound' }, '#portal/manager'],
  ]

  it.each(cases)('builds the href for %o', (route, expected) => {
    expect(managerHref(route)).toBe(expected)
  })

  it('round-trips every route through parseManagerRoute', () => {
    for (const [route] of cases) {
      if (route.screen === 'notFound') continue
      expect(parseManagerRoute(managerHref(route))).toEqual(route)
    }
  })
})
