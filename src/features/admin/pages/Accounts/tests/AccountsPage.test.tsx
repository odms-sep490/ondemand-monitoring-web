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
    expect(screen.getByRole('heading', { name: 'Tài khoản' })).toBeTruthy()
    act(() => setLanguage('en'))
    expect(screen.getByRole('heading', { name: 'Accounts' })).toBeTruthy()
    act(() => setLanguage('vi'))
  })

  it('sends server-side pagination and role filter queries', async () => {
    render(<AccountsPage />)
    await screen.findAllByLabelText('Xem / sửa thông tin')
    expect(
      requestedUrls.some((u) => /page=0/.test(u) && /size=20/.test(u)),
    ).toBe(true)

    fireEvent.click(screen.getByRole('radio', { name: /Quản lý/ }))
    await waitFor(() =>
      expect(requestedUrls.some((u) => u.includes('role=MANAGER'))).toBe(true),
    )
  })

  it('shows role chips with counts and filters by the selected role', async () => {
    render(<AccountsPage />)
    await waitFor(() =>
      expect(screen.getByTestId('role-tab-count-all').textContent).toMatch(
        /^\d+$/,
      ),
    )
    expect(screen.getByTestId('role-tab-count-customer').textContent).toMatch(
      /^\d+$/,
    )
    fireEvent.click(screen.getByRole('radio', { name: /Khách hàng/ }))
    await waitFor(() =>
      expect(requestedUrls.some((u) => u.includes('role=CUSTOMER'))).toBe(true),
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

  it('shows disabled confirm with unsupported note for reset password', async () => {
    render(<AccountsPage />)
    const buttons = await screen.findAllByLabelText('Reset mật khẩu')
    fireEvent.click(buttons[0])
    expect(screen.getByText('BE chưa hỗ trợ')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Xác nhận reset' }),
    ).toBeDisabled()
  })

  it('opens the create modal when routed with openCreate', () => {
    render(<AccountsPage openCreate />)
    expect(screen.getByRole('dialog')).toBeTruthy()
  })
})
