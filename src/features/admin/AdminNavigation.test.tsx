import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { setLanguage } from '../../shared/i18n'
import { AdminLayout } from './AdminLayout'
import { parseAdminRoute } from './routes'

describe('Admin operational configuration navigation', () => {
  it('shows one operational configuration entry and no standalone pricing entry', () => {
    setLanguage('vi')
    render(
      <AdminLayout
        route={{ screen: 'operatingConfig' }}
        breadcrumb="Cấu hình vận hành"
      >
        <div>Nội dung</div>
      </AdminLayout>,
    )

    expect(
      screen.getByRole('link', { name: 'Cấu hình vận hành' }),
    ).toHaveAttribute('aria-current', 'page')
    expect(
      screen.queryByRole('link', { name: 'Cấu hình giá' }),
    ).not.toBeInTheDocument()
  })

  it('does not retain the removed standalone pricing route', () => {
    expect(parseAdminRoute('#portal/admin/pricing')).toEqual({
      screen: 'notFound',
    })
  })
})

describe('Admin shell', () => {
  it('lists every admin section and marks the one for the current route', () => {
    setLanguage('vi')
    render(
      <AdminLayout route={{ screen: 'devices' }} breadcrumb="Thiết bị">
        <div>Nội dung</div>
      </AdminLayout>,
    )
    const nav = screen.getByRole('menu', { name: 'Điều hướng quản trị' })
    for (const name of [
      'Tổng quan',
      'Tài khoản',
      'Danh mục',
      'Checklist',
      'Thiết bị',
      'Cấu hình vận hành',
    ]) {
      expect(within(nav).getByRole('link', { name })).toBeInTheDocument()
    }
    expect(within(nav).getByRole('link', { name: 'Thiết bị' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(nav).getByRole('link', { name: 'Thiết bị' })).toHaveAttribute(
      'href',
      '#portal/admin/devices',
    )
    expect(
      within(nav).getByRole('link', { name: 'Tài khoản' }),
    ).not.toHaveAttribute('aria-current')
  })

  it('no longer has a Roles page: the old hash falls back to accounts', () => {
    expect(parseAdminRoute('#portal/admin/roles')).toEqual({
      screen: 'accounts',
    })
    setLanguage('vi')
    render(
      <AdminLayout route={{ screen: 'accounts' }} breadcrumb="Tài khoản">
        <div>Nội dung</div>
      </AdminLayout>,
    )
    expect(
      screen.queryByRole('link', { name: 'Vai trò' }),
    ).not.toBeInTheDocument()
  })

  it('highlights the overview item on the admin root', () => {
    expect(parseAdminRoute('#portal/admin')).toEqual({ screen: 'dashboard' })
    expect(parseAdminRoute('#portal/admin/dashboard')).toEqual({
      screen: 'dashboard',
    })
    expect(parseAdminRoute('#portal/admin/devices')).toEqual({
      screen: 'devices',
    })
  })

  it('moves the menu into a drawer below 768px', async () => {
    setLanguage('vi')
    const original = window.matchMedia
    window.matchMedia = ((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia
    try {
      render(
        <AdminLayout route={{ screen: 'accounts' }} breadcrumb="Tài khoản">
          <div>Nội dung</div>
        </AdminLayout>,
      )
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Mở điều hướng' }))
      const nav = await screen.findByRole('menu', {
        name: 'Điều hướng quản trị',
      })
      expect(
        within(nav).getByRole('link', { name: 'Tài khoản' }),
      ).toHaveAttribute('aria-current', 'page')
    } finally {
      window.matchMedia = original
    }
  })
})
