import { act } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
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

  it('renders the hero heading, walkthrough, and key sections', () => {
    render(<LandingPage />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Kiểm tra an toàn hơn/,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        name: 'Từ yêu cầu đến báo cáo, trên cùng một hệ thống',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Một yêu cầu, xuyên suốt đến báo cáo',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Xác nhận phạm vi' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Hỗ trợ kiểm tra nhiều loại hiện trường',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Thông tin bạn cần biết' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'OnDemand Monitor - trang chủ' }),
    ).toBeInTheDocument()
  })

  it('sends a guest to registration from the create-request CTA', () => {
    render(<LandingPage />)
    const links = screen.getAllByRole('link', { name: 'Tạo yêu cầu giám sát' })
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link).toHaveAttribute('href', '#auth/register')
    }
  })

  it('sends a logged-in CUSTOMER straight to the create-request screen', () => {
    saveSession('CUSTOMER')
    render(<LandingPage />)
    const links = screen.getAllByRole('link', { name: 'Tạo yêu cầu giám sát' })
    for (const link of links) {
      expect(link).toHaveAttribute('href', '#portal/customer/request')
    }
  })

  it('sends a logged-in MANAGER user to their own role home', () => {
    saveSession('MANAGER')
    render(<LandingPage />)
    const links = screen.getAllByRole('link', { name: 'Tạo yêu cầu giám sát' })
    for (const link of links) {
      expect(link).toHaveAttribute('href', '#portal/manager')
    }
  })

  it('sends "Đăng nhập" to the login screen', () => {
    render(<LandingPage />)
    const links = screen.getAllByRole('link', { name: 'Đăng nhập' })
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link).toHaveAttribute('href', '#auth/login')
    }
  })

  it('opens the only FAQ item that has answer copy, expanded by default', () => {
    render(<LandingPage />)
    const firstQuestion = screen.getByRole('button', {
      name: /Tôi cần cung cấp gì khi tạo yêu cầu\?/,
    })
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByText(/Hãy cung cấp vị trí hoặc khu vực/),
    ).toBeInTheDocument()

    fireEvent.click(firstQuestion)
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'false')
    expect(
      screen.queryByText(/Hãy cung cấp vị trí hoặc khu vực/),
    ).not.toBeInTheDocument()
  })

  it('renders all FAQ questions as expandable accordion items', () => {
    render(<LandingPage />)
    const question = 'Tôi theo dõi tiến độ ở đâu?'
    expect(screen.getByText(question)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: question })).toBeInTheDocument()
  })

  it('preserves active landing controls when language changes', () => {
    render(<LandingPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Xem báo cáo' }))
    fireEvent.click(screen.getByRole('tab', { name: /Báo cáo/ }))
    fireEvent.click(
      within(document.getElementById('how-it-works')!)
        .getByText('Theo dõi ticket')
        .closest('button')!,
    )
    fireEvent.click(
      screen.getByRole('button', { name: /Tôi theo dõi tiến độ ở đâu/ }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }))
    act(() => setLanguage('en'))
    expect(
      screen.getByRole('button', { name: 'Review report' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('tab', { name: /Report/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(
      within(document.getElementById('how-it-works')!)
        .getByText('Track the ticket')
        .closest('button'),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('button', { name: /Where can I track progress/ }),
    ).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('renders the chatbot FAB button', () => {
    render(<LandingPage />)
    expect(
      screen.getByRole('button', { name: 'Trợ lý OnDemand Monitor' }),
    ).toBeInTheDocument()
  })

  it('toggles the mobile navigation menu button', () => {
    render(<LandingPage />)
    const menuButton = screen.getByRole('button', { name: 'Mở menu' })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(menuButton)
    expect(screen.getByRole('button', { name: 'Đóng menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('renders the footer with the OnDemand Monitor brand', () => {
    render(<LandingPage />)
    const footer = screen
      .getByText('© 2026 OnDemand Monitor. Đồ án FA26SE039.')
      .closest('footer') as HTMLElement
    expect(footer).not.toBeNull()
    expect(within(footer).getByText('support@odms.vn')).toBeInTheDocument()
  })

  it('renders the English hero heading and key sections when language is switched', () => {
    render(<LandingPage />)
    act(() => setLanguage('en'))

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Inspect more safely/,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'From request to report, in one system',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Support for a range of inspection sites',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'What you need to know' }),
    ).toBeInTheDocument()

    const links = screen.getAllByRole('link', {
      name: 'Create monitoring request',
    })
    expect(links.length).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('link', { name: 'Log in' }).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getByRole('button', { name: 'OnDemand Monitor assistant' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Open menu' }),
    ).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'en')
    expect(document.title).toContain('Safer site monitoring')
    expect(
      screen.getByText('One ticket follows every request'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Mỗi yêu cầu có một ticket xuyên suốt'),
    ).not.toBeInTheDocument()

    act(() => setLanguage('vi'))
    expect(
      screen.getByRole('heading', { level: 1, name: /Kiểm tra an toàn hơn/ }),
    ).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'vi')
  })
})
