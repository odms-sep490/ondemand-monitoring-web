import { act, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, afterEach } from 'vitest'

import { setLanguage } from '../../../../shared/i18n'
import MediaUpload from './MediaUpload'
import type { Mission } from '../../types/omss'

vi.mock('../../../media/api/operatorMediaApi', () => ({
  operatorMediaApi: {
    list: vi.fn().mockResolvedValue([]),
    status: vi.fn(),
    upload: vi.fn(),
    discard: vi.fn(),
    previewUrl: vi.fn(() => ''),
  },
}))

const mission = {
  id: 'MS-1',
  backendId: 'MS-1',
  orderRef: 'ORD-1',
  title: 'Mission',
  state: 'IN_FLIGHT',
  priority: 'NORMAL',
  droneId: 'DRN-1',
  operatorId: 'OP-1',
  customer: 'Customer',
  location: 'Loc',
  lat: 0,
  lng: 0,
  scheduledAt: new Date().toISOString(),
  estimatedMinutes: 5,
  distanceKm: 1,
  flightPlanId: 'PLAN-1',
  maxAltitudeM: 30,
  notes: '',
} as Mission

afterEach(() => {
  vi.clearAllMocks()
})

describe('MediaUpload', () => {
  it('renders Vietnamese text by default', async () => {
    render(
      <MediaUpload mission={mission} onDone={vi.fn()} onManual={vi.fn()} />,
    )
    await waitFor(() =>
      expect(screen.getByText('Kiểm tra media đã chụp')).toBeInTheDocument(),
    )
  })

  it('renders English text after switching language', async () => {
    render(
      <MediaUpload mission={mission} onDone={vi.fn()} onManual={vi.fn()} />,
    )
    act(() => setLanguage('en'))
    await waitFor(() =>
      expect(screen.getByText('Review captured media')).toBeInTheDocument(),
    )
  })
})
