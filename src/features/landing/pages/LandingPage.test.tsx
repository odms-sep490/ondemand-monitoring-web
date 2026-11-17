import { act } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { setLanguage } from '../../../shared/i18n'
import { LandingPage } from './LandingPage'

function saveSession(role: 'CUSTOMER' | 'MANAGER') {
  localStorage.setItem('fieldwise.accessToken', 'token.value-123')
  localStorage.setItem(
    'fieldwise.user',
    JSON.stringify({
      id: '1',
      fullName: 'Test User',
      email: 'test@example.com',
      emailVerified: true,
      role,
      isActive: true,
    }),
  )
}

describe('LandingPage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    act(() => setLanguage('vi'))
    document.documentElement.dataset.theme = 'light'
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('renders the four-band editorial structure with services grid, workflow showcase, and structured footer', () => {
    render(<LandingPage />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Giám sát bằng drone, bàn giao đúng chuẩn.',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Kiểm tra chính xác. Quy trình minh bạch.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Tiếp nhận & lập kế hoạch bay')).toBeInTheDocument()
    expect(screen.getByText('Nghiệm thu & mở khóa bản gốc')).toBeInTheDocument()
    expect(screen.getByText('04')).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Công nghệ hỗ trợ. Con người kiểm chứng.',
      }),
    ).toBeInTheDocument()

    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Trung tâm trợ giúp' })).toHaveAttribute(
      'href',
      '#help',
    )
    expect(screen.getByRole('link', { name: 'support@odms.vn' })).toHaveAttribute(
      'href',
      'mailto:support@odms.vn',
    )
  })

  it('shows Đăng nhập and Tạo yêu cầu giám sát in the header and routes guests to auth/login', () => {
    render(<LandingPage />)

    const signInLinks = screen.getAllByRole('link', { name: 'Đăng nhập' })
    expect(signInLinks.length).toBeGreaterThanOrEqual(2)
    for (const link of signInLinks) {
      expect(link).toHaveAttribute('href', '#auth/login')
    }

    const requestLinks = screen.getAllByRole('link', {
      name: 'Tạo yêu cầu giám sát',
    })
    expect(requestLinks.length).toBeGreaterThanOrEqual(4)
    for (const link of requestLinks) {
      expect(link).toHaveAttribute('href', '#auth/login')
    }
  })

  it('keeps Đăng nhập and sends a logged-in CUSTOMER straight to the create-request screen', () => {
    saveSession('CUSTOMER')
    render(<LandingPage />)

    expect(screen.getAllByRole('link', { name: 'Đăng nhập' }).length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByRole('link', { name: 'Vào cổng làm việc' })).not.toBeInTheDocument()

    const requestLinks = screen.getAllByRole('link', {
      name: 'Tạo yêu cầu giám sát',
    })
    for (const link of requestLinks) {
      expect(link).toHaveAttribute('href', '#portal/customer/request')
    }
  })

  it('sends a logged-in MANAGER user to their own role home from Tạo yêu cầu giám sát', () => {
    saveSession('MANAGER')
    render(<LandingPage />)

    expect(screen.getAllByRole('link', { name: 'Đăng nhập' }).length).toBeGreaterThanOrEqual(1)
    const requestLinks = screen.getAllByRole('link', {
      name: 'Tạo yêu cầu giám sát',
    })
    for (const link of requestLinks) {
      expect(link).toHaveAttribute('href', '#portal/manager')
    }
  })

  it('switches copy, page title, and html lang when toggling language to English', () => {
    render(<LandingPage />)

    fireEvent.click(screen.getByRole('button', { name: 'English' }))

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Inspection by drone, delivered on record.',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Precise field checks. Transparent workflow.',
      }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Sign in' }).length).toBeGreaterThanOrEqual(1)
    expect(
      screen.getAllByRole('link', { name: 'Create monitoring request' }).length,
    ).toBeGreaterThanOrEqual(4)
    expect(document.documentElement).toHaveAttribute('lang', 'en')
    expect(document.title).toContain('Drone inspection, delivered on record')
  })

  it('keeps the support assistant available', () => {
    render(<LandingPage />)
    expect(
      screen.getByRole('button', { name: 'Trợ lý OnDemand Monitor' }),
    ).toBeInTheDocument()
  })
})
