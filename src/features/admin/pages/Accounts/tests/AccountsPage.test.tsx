import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { AccountsPage } from '../AccountsPage'
import { chooseSelectOption } from '../../../testUtils'
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

    await chooseSelectOption('Vai trò', 'Quản lý')
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

  it('shows disabled confirm with unsupported note for reset password', async () => {
    render(<AccountsPage />)
    const buttons = await screen.findAllByLabelText('Reset mật khẩu')
    fireEvent.click(buttons[0])
    expect(screen.getByText('Máy chủ chưa hỗ trợ')).toBeTruthy()
    expect(screen.getByText('Xác nhận reset').closest('button')).toBeDisabled()
  })

  it('opens the create modal when routed with openCreate', () => {
    render(<AccountsPage openCreate />)
    expect(screen.getByRole('dialog')).toBeTruthy()
  })
})
