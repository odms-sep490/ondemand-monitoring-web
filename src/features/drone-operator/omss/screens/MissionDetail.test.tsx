import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setLanguage } from '../../../../shared/i18n'
import type { Drone, Mission } from '../../types/omss'
import MissionDetail from './MissionDetail'

const mission = {
  id: 'MS-8E897AE9',
  orderRef: 'ORD-1',
  title: '5243523',
  state: 'IN_FLIGHT',
  priority: 'NORMAL',
  customer: 'Seed Customer',
  droneId: 'DRN-0048',
  operatorId: 'OP-1',
  location: 'Landslide',
  lat: 0,
  lng: 0,
  scheduledAt: new Date().toISOString(),
  estimatedMinutes: 6,
  distanceKm: 0.6,
  flightPlanId: 'PLAN-1',
  maxAltitudeM: 36,
  notes: '',
  routePoints: [],
} as Mission

const drone = {
  id: 'DRN-0048',
  name: 'DRN-0048',
  model: 'X500',
  serialNumber: 'DRN-0048',
  state: 'ACTIVE_MISSION',
  battery: 90,
  gpsCount: 12,
  storageMB: 100,
} as Drone

beforeEach(() => {
  // This suite asserts on the screen's original (English) copy; setup.ts
  // resets the language back to 'vi' afterEach.
  setLanguage('en')
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('MissionDetail reconnect action', () => {
  it('keeps GCS reconnect available for an in-flight mission', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const onScreen = vi.fn()

    render(
      <MissionDetail
        mission={mission}
        drone={drone}
        onScreen={onScreen}
        onBack={vi.fn()}
        onStartFlight={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Reconnect GCS' }))
    expect(onScreen).toHaveBeenCalledWith('gcs-connect')
  })
})
