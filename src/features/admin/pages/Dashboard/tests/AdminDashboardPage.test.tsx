import { act } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../../shared/i18n'
import { adminApi } from '../../../api/adminApi'
import { adminDevicesApi } from '../../../api/adminDevicesApi'
import { adminUsersApi } from '../../../api/adminUsersApi'
import { catalogApi } from '../../../api/catalogApi'
import { checklistsApi } from '../../../api/checklistsApi'
import type { PricingPolicy } from '../../../types/pricing'
import { AdminDashboardPage } from '../AdminDashboardPage'

// Recharts needs ResizeObserver, which jsdom lacks.
class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', RO)

const page = <T,>(items: T[], totalItems = items.length) => ({
  items,
  page: 0,
  size: 1,
  totalItems,
  totalPages: 1,
  first: true,
  last: true,
})

const user = (id: string, createdAt: string) => ({
  id,
  fullName: `User ${id}`,
  email: `${id}@x.vn`,
  role: 'CUSTOMER' as const,
  active: true,
  emailVerified: true,
  createdAt,
})

function mockAll() {
  vi.spyOn(adminUsersApi, 'listUsers').mockImplementation(async (q = {}) => {
    if (q.size === 200)
      return page([user('u1', new Date().toISOString())], 40) as never
    if (q.role) return page([], q.role === 'ADMIN' ? 2 : 10) as never
    if (q.active === false) return page([], 4) as never
    if (q.emailVerified === false) return page([], 3) as never
    return page([], q.active === true ? 36 : 40) as never
  })
  vi.spyOn(adminDevicesApi, 'list').mockImplementation(
    async ({ status }) =>
      page(
        [],
        (
          { AVAILABLE: 5, MAINTENANCE: 2, OFFLINE: 1 } as Record<string, number>
        )[status ?? ''] ?? 0,
      ) as never,
  )
  vi.spyOn(adminDevicesApi, 'listModels').mockResolvedValue([
    { id: 'm', code: 'M', modelName: 'M', manufacturer: 'X' },
  ])
  vi.spyOn(catalogApi, 'listServices').mockResolvedValue([
    { id: 's1', name: 'A', basePrice: 0, isActive: true },
    { id: 's2', name: 'B', basePrice: 0, isActive: true },
    { id: 's3', name: 'C', basePrice: 0, isActive: false },
  ])
  vi.spyOn(catalogApi, 'listPreferredTimes').mockResolvedValue([])
  vi.spyOn(checklistsApi, 'list').mockImplementation(
    async (_s, active) => page([], active ? 7 : 1) as never,
  )
  vi.spyOn(checklistsApi, 'template').mockImplementation(async (id) =>
    id === 's1' ? [{ id: 'c' } as never] : [],
  )
  vi.spyOn(adminApi, 'listPricingPolicies').mockResolvedValue([
    { id: 'p1', name: 'Bảng giá 2026', version: 3, status: 'ACTIVE' },
    { id: 'p2', name: 'Nháp', version: 4, status: 'DRAFT' },
  ] as PricingPolicy[])
  vi.spyOn(adminApi, 'getOrderExpirationSettings').mockResolvedValue({
    quotationAcceptanceTimeoutHours: 48,
    depositPaymentTimeoutHours: 24,
    updatedBy: 'a',
    updatedAt: null,
  })
}

beforeEach(() => act(() => setLanguage('vi')))
afterEach(() => vi.restoreAllMocks())

const kpi = (title: string) =>
  screen.getByText(title).closest('.mgr-stat') as HTMLElement

describe('AdminDashboardPage', () => {
  it('shows KPI values, alerts and system config from the admin APIs', async () => {
    mockAll()
    render(<AdminDashboardPage />)

    await waitFor(() =>
      expect(within(kpi('Tài khoản')).getByText('40')).toBeTruthy(),
    )
    expect(within(kpi('Tài khoản bị khóa')).getByText('4')).toBeTruthy()
    expect(within(kpi('Thiết bị sẵn sàng')).getByText('5')).toBeTruthy()
    expect(within(kpi('Bảo trì / ngoại tuyến')).getByText('3')).toBeTruthy()
    expect(within(kpi('Dịch vụ đang hoạt động')).getByText('2')).toBeTruthy()
    expect(within(kpi('Checklist đang dùng')).getByText('7')).toBeTruthy()

    expect(
      await screen.findByText('3 thiết bị bảo trì hoặc ngoại tuyến'),
    ).toBeTruthy()
    expect(
      screen.getByText('1 dịch vụ đang hoạt động chưa có checklist'),
    ).toBeTruthy()
    expect(screen.getByText('1 chính sách giá đang là bản nháp')).toBeTruthy()
    expect(screen.getByText('4 tài khoản đang bị khóa')).toBeTruthy()

    expect(await screen.findByText('Bảng giá 2026')).toBeTruthy()
    expect(screen.getByText('48 giờ')).toBeTruthy()
    expect(screen.getByText('User u1')).toBeTruthy()
  })

  it('keeps the rest of the page when one source fails', async () => {
    mockAll()
    vi.spyOn(adminDevicesApi, 'list').mockRejectedValue(new Error('boom'))
    render(<AdminDashboardPage />)

    await waitFor(() =>
      expect(within(kpi('Tài khoản')).getByText('40')).toBeTruthy(),
    )
    await waitFor(() =>
      expect(
        screen.getAllByText('Không tải được dữ liệu này').length,
      ).toBeGreaterThan(0),
    )
    expect(within(kpi('Dịch vụ đang hoạt động')).getByText('2')).toBeTruthy()
    expect(await screen.findByText('Bảng giá 2026')).toBeTruthy()
    expect(screen.queryByText(/thiết bị bảo trì hoặc ngoại tuyến/)).toBeNull()
  })
})
