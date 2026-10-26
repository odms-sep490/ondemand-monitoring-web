import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { authSession } from '../auth/api/authApi'
import { ManagerLayout } from './ManagerLayout'

beforeEach(() => {
  localStorage.setItem('fieldwise.accessToken', 'mock-staff-token')
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
})

describe('ManagerLayout', () => {
  it('renders every nav group and item from the design sidebar', () => {
    render(
      <ManagerLayout route={{ screen: 'dashboard' }} breadcrumb="Dashboard">
        <div>content</div>
      </ManagerLayout>,
    )

    for (const group of ['Điều hành', 'Nguồn lực']) {
      expect(screen.getByText(group)).toBeInTheDocument()
    }

    for (const item of [
      'Đơn hàng',
      'Nhiệm vụ',
      'Lịch nhiệm vụ',
      'Đội drone',
      'Bảo trì',
    ]) {
      expect(screen.getByText(item)).toBeInTheDocument()
    }
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
  })

  it('does not render a "Thông báo" nav link (SYS-06 out of scope)', () => {
    render(
      <ManagerLayout route={{ screen: 'dashboard' }} breadcrumb="Dashboard">
        <div>content</div>
      </ManagerLayout>,
    )
    expect(screen.queryByText('Thông báo')).not.toBeInTheDocument()
  })

  it('highlights the active nav item for the current route', () => {
    render(
      <ManagerLayout route={{ screen: 'maintenance' }} breadcrumb="Bảo trì">
        <div>content</div>
      </ManagerLayout>,
    )
    const active = screen.getByRole('link', { name: /Bảo trì/ })
    expect(active).toHaveAttribute('aria-current', 'page')
    const inactive = screen.getByRole('link', { name: 'Dashboard' })
    expect(inactive).not.toHaveAttribute('aria-current')
  })

  it('shows nav badges from the counts prop', () => {
    render(
      <ManagerLayout
        route={{ screen: 'dashboard' }}
        breadcrumb="Dashboard"
        counts={{ pendingOrders: 6 }}
      >
        <div>content</div>
      </ManagerLayout>,
    )
    const ordersLink = screen.getByRole('link', { name: /Đơn hàng/ })
    expect(ordersLink).toHaveTextContent('6')
  })

  it('shows name, email and a logout button in the avatar dropdown', async () => {
    render(
      <ManagerLayout route={{ screen: 'dashboard' }} breadcrumb="Dashboard">
        <div>content</div>
      </ManagerLayout>,
    )
    expect(screen.getByText('LH')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Lê Thị Thanh Hằng' }))
    expect(await screen.findByText('hang.le@odms.vn')).toBeInTheDocument()
    expect(screen.getAllByText('Lê Thị Thanh Hằng').length).toBeGreaterThan(0)
    expect(
      screen.getByRole('button', { name: /Đăng xuất/ }),
    ).toBeInTheDocument()
  })

  it('renders the breadcrumb and children', () => {
    render(
      <ManagerLayout route={{ screen: 'dashboard' }} breadcrumb="Dashboard">
        <div>page content marker</div>
      </ManagerLayout>,
    )
    expect(screen.getByText('page content marker')).toBeInTheDocument()
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
  })
})
