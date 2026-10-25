import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { MaintenancePage } from '../MaintenancePage'

// Deliberately does NOT import '../../../../../mocks/index': the registered
// /api/maintenance-tickets mock handler returns the manager-side
// `{ items, total }` shape, which this operator screen's
// `allTickets.filter(...)` (assuming a bare array) cannot handle — a
// pre-existing, out-of-scope data-shape mismatch, reported separately.
// Leaving the request unmocked makes it fail safely instead, so the header
// chrome (unconditionally rendered) can still be exercised bilingually.
describe('OperatorMaintenanceScreen', () => {
  it('renders vietnamese chrome text', async () => {
    render(<MaintenancePage />)
    expect(await screen.findByText('Bảo trì & Khôi phục thiết bị')).toBeTruthy()
    expect(screen.getByText(/Đã gán cho tôi/)).toBeTruthy()
  })

  it('renders english chrome text when language is switched', async () => {
    render(<MaintenancePage />)
    await screen.findByText('Bảo trì & Khôi phục thiết bị')
    act(() => setLanguage('en'))
    expect(await screen.findByText('Maintenance & Device Recovery')).toBeTruthy()
    expect(screen.getByText(/Assigned to me/)).toBeTruthy()
  })
})
