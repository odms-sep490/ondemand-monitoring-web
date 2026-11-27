import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { AccountsPage } from '../AccountsPage'
import { requestedUrls, useMockTransport } from './helpers'

useMockTransport()

describe('AccountsPage', () => {
  it('renders the vietnamese title and switches to english', () => {
    render(<AccountsPage />)
    expect(screen.getByText('Người dùng')).toBeTruthy()
    act(() => setLanguage('en'))
    expect(screen.getByText('Users')).toBeTruthy()
    act(() => setLanguage('vi'))
  })

  it('sends server-side pagination and role filter queries', async () => {
    render(<AccountsPage />)
    await waitFor(() => expect(screen.getByText(/Trang 1/)).toBeTruthy())
    expect(
      requestedUrls.some((u) => /page=0/.test(u) && /size=20/.test(u)),
    ).toBe(true)

    fireEvent.change(screen.getByLabelText('Vai trò'), {
      target: { value: 'MANAGER' },
    })
    await waitFor(() =>
      expect(requestedUrls.some((u) => u.includes('role=MANAGER'))).toBe(true),
    )
  })

  it('opens the edit modal with data from GET /api/admin/users/{id}', async () => {
    render(<AccountsPage />)
    const buttons = await screen.findAllByLabelText('Xem / sửa thông tin')
    fireEvent.click(buttons[0])
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    await waitFor(() =>
      expect(
        requestedUrls.some((u) => /\/api\/admin\/users\/[^/?]+$/.test(u)),
      ).toBe(true),
    )
    await screen.findByText('Thời gian')
  })

  it('opens the create modal when routed with openCreate', () => {
    render(<AccountsPage openCreate />)
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('clears search, role and status filters and reloads the first page', async () => {
    render(<AccountsPage />)
    await screen.findByRole('table', { name: 'Danh sách tài khoản người dùng' })
    const clear = screen.getByRole('button', { name: 'Xóa bộ lọc' })
    expect(clear).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Vai trò'), {
      target: { value: 'MANAGER' },
    })
    fireEvent.change(screen.getByLabelText('Trạng thái'), {
      target: { value: 'locked' },
    })
    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Tìm người dùng' }),
      { target: { value: 'test' } },
    )
    await waitFor(() =>
      expect(
        requestedUrls.some(
          (url) =>
            url.includes('search=test') &&
            url.includes('role=MANAGER') &&
            url.includes('active=false'),
        ),
      ).toBe(true),
    )
    const requestsBeforeClear = requestedUrls.length
    fireEvent.click(clear)
    expect(screen.getByLabelText('Vai trò')).toHaveValue('')
    expect(screen.getByLabelText('Trạng thái')).toHaveValue('')
    expect(
      screen.getByRole('searchbox', { name: 'Tìm người dùng' }),
    ).toHaveValue('')
    await waitFor(() =>
      expect(
        requestedUrls.slice(requestsBeforeClear).some((url) => {
          const params = new URL(url, 'http://localhost').searchParams
          return (
            params.get('page') === '0' &&
            !params.has('role') &&
            !params.has('active') &&
            !params.has('search')
          )
        }),
      ).toBe(true),
    )
    expect(clear).toBeDisabled()
  })
})
