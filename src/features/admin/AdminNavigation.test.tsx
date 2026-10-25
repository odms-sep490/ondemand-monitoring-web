import { render, screen } from '@testing-library/react'
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
