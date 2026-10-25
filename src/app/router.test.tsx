import {
  configure,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { authSession } from '../features/auth/api/authApi'
import { managerApi } from '../features/manager/api/dashboardApi'
import { ordersApi } from '../features/manager/api/ordersApi'
import type { ManagerDashboardResponse } from '../features/manager/types/dashboard'
import { Router } from './router'

configure({ asyncUtilTimeout: 10000 })

// jsdom does not fire `hashchange` automatically when `location.hash` is set
// programmatically (unlike a real browser), so tests that simulate the user
// navigating (back/forward, a pasted link) set the hash and dispatch the
// event by hand.
function navigateHash(hash: string) {
  window.location.hash = hash
  fireEvent(window, new HashChangeEvent('hashchange'))
}

beforeEach(() => {
  window.location.hash = ''
})

afterEach(() => {
  window.location.hash = ''
})

vi.setConfig({ testTimeout: 15000 })

describe('Router - auth hash sync (regression)', () => {
  it.each(['#portal/manager/missions', '#portal/staff/missions', '#profile'])(
    'redirects unauthenticated navigation after render without React warnings: %s',
    async (hash) => {
      authSession.clear()
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
      try {
        window.location.hash = '#auth/login'
        render(<Router />)
        navigateHash(hash)
        await waitFor(() => expect(window.location.hash).toBe('#auth/login'))
        expect(
          await screen.findByRole('heading', { name: 'Đăng nhập' }),
        ).toBeInTheDocument()
        expect(errors).not.toHaveBeenCalled()
      } finally {
        errors.mockRestore()
      }
    },
  )
  it('shows the login form for #auth/login and the register form for #auth/register', async () => {
    window.location.hash = '#auth/login'
    render(<Router />)
    expect(
      await screen.findByRole('heading', { name: 'Đăng nhập' }),
    ).toBeInTheDocument()

    navigateHash('#auth/register')
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Tạo tài khoản khách hàng' }),
      ).toBeInTheDocument(),
    )

    navigateHash('#auth/login')
    expect(
      await screen.findByRole('heading', { name: 'Đăng nhập' }),
    ).toBeInTheDocument()
  })

  it('keeps switching correctly across repeated register <-> login navigation', async () => {
    window.location.hash = '#auth/register'
    render(<Router />)
    expect(
      await screen.findByRole('heading', { name: 'Tạo tài khoản khách hàng' }),
    ).toBeInTheDocument()

    navigateHash('#auth/login')
    expect(
      await screen.findByRole('heading', { name: 'Đăng nhập' }),
    ).toBeInTheDocument()

    navigateHash('#auth/register')
    expect(
      await screen.findByRole('heading', { name: 'Tạo tài khoản khách hàng' }),
    ).toBeInTheDocument()
  })

  it('updates the hash when using the in-page mode switch buttons', async () => {
    window.location.hash = '#auth/login'
    render(<Router />)

    fireEvent.click(await screen.findByRole('button', { name: 'Đăng ký' }))
    expect(window.location.hash).toBe('#auth/register')
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Tạo tài khoản khách hàng' }),
      ).toBeInTheDocument(),
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Đăng nhập' }))
    expect(window.location.hash).toBe('#auth/login')
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Đăng nhập' }),
      ).toBeInTheDocument(),
    )
  })
})

describe('Router - manager routes (#portal/manager*)', () => {
  const sampleDashboard: ManagerDashboardResponse = {
    kpis: {
      pendingOrders: { count: 6, detail: '2 quá 24h' },
      missionsToday: { count: 5, detail: '3 đã xong' },
      missionsInFlight: { count: 1, detail: '' },
      dronesReady: { ready: 5, total: 9, detail: '1 bảo trì' },
      actionItems: { count: 4, detail: '2 upload · 2 lỗi media' },
    },
    missionStatusByDay: [],
    droneStatusBreakdown: [],
    actionItems: [],
    flyingMission: null,
    navCounts: {
      pendingOrders: 6,
      openMaintenanceTickets: 3,
      mediaNeedsAction: 6,
    },
  }

  beforeEach(() => {
    localStorage.setItem('fieldwise.accessToken', 'mock.staff.token')
    localStorage.setItem(
      'fieldwise.user',
      JSON.stringify({
        id: '1',
        fullName: 'Lê Thị Thanh Hằng',
        email: 'hang.le@odms.vn',
        role: 'MANAGER',
      }),
    )
  })

  afterEach(() => {
    authSession.clear()
    vi.restoreAllMocks()
  })

  it('routes a MANAGER user hitting #portal/manager to the Manager dashboard', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleDashboard)
    window.location.hash = '#portal/manager'
    render(<Router />)

    await waitFor(() =>
      expect(screen.getByText('Dashboard điều hành')).toBeInTheDocument(),
    )
  })
  it('allows authenticated Admin into Manager planning without granting crew authority', async () => {
    const user = authSession.getUser()!
    localStorage.setItem(
      'fieldwise.user',
      JSON.stringify({ ...user, role: 'ADMIN' }),
    )
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleDashboard)
    window.location.hash = '#portal/manager'
    render(<Router />)
    await waitFor(() =>
      expect(screen.getByText('Dashboard điều hành')).toBeInTheDocument(),
    )
  })

  it('routes nested #portal/manager/... hashes to the Manager area too', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleDashboard)
    vi.spyOn(ordersApi, 'getQueue').mockResolvedValue([])
    window.location.hash = '#portal/manager/orders'
    render(<Router />)

    await waitFor(() =>
      expect(screen.getByText('Hàng đợi duyệt đơn')).toBeInTheDocument(),
    )
  })

  it('does not route #portal/manager/assignments to the legacy FIELDWISE staff shell', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleDashboard)
    window.location.hash = '#portal/manager/assignments'
    render(<Router />)

    await waitFor(() =>
      expect(screen.getByText('Không tìm thấy màn hình')).toBeInTheDocument(),
    )
    expect(screen.queryByText('FIELDWISE')).not.toBeInTheDocument()
  })
})

describe('Router - customer support navigation', () => {
  beforeEach(() => {
    localStorage.setItem('fieldwise.accessToken', 'mock.customer.token')
    localStorage.setItem(
      'fieldwise.user',
      JSON.stringify({
        id: 'customer-1',
        fullName: 'Customer',
        email: 'customer@example.com',
        role: 'CUSTOMER',
      }),
    )
  })

  afterEach(() => {
    authSession.clear()
  })

  it('marks Help & FAQ active instead of Dashboard on the help page', async () => {
    window.location.hash = '#help'
    render(<Router />)

    expect(
      await screen.findByRole('link', { name: 'Trợ giúp & FAQ' }),
    ).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Tổng quan' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('marks Support tickets active instead of Dashboard on the tickets page', async () => {
    window.location.hash = '#help/tickets'
    render(<Router />)

    expect(
      await screen.findByRole('link', { name: 'Yêu cầu hỗ trợ' }),
    ).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Tổng quan' })).not.toHaveAttribute(
      'aria-current',
    )
  })
})
