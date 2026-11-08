import { act } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../shared/i18n'
import { LandingPage } from './LandingPage'

vi.mock('lottie-react', () => ({
  Lottie: () => <div data-testid="drone-lottie" />,
}))

// jsdom does not implement SVG geometry; the flight scene measures its path.
beforeAll(() => {
  Object.defineProperty(window.SVGElement.prototype, 'getTotalLength', {
    configurable: true,
    value: () => 100,
  })
})

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

  it('renders one scroll-driven flight scene with mission chapters', () => {
    render(<LandingPage />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Kiểm tra an toàn hơn. Nắm rõ kết quả.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('flight-mission-experience')).toBeInTheDocument()
    expect(screen.getByTestId('drone-lottie')).toBeInTheDocument()
    expect(document.querySelector('.lp-journey-hud')).not.toBeInTheDocument()
    expect(document.querySelector('.lp-flight-dock')).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Quét toàn cảnh từng dãy pin.',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Hạ cánh an toàn. Sẵn sàng cho lần bay tiếp.',
      }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
  })

  it('sends a guest to login from the create-request CTA', () => {
    render(<LandingPage />)
    const links = screen.getAllByRole('link', { name: 'Tạo yêu cầu giám sát' })
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link).toHaveAttribute('href', '#auth/login')
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

  it('does not show a separate login link in the main navigation', () => {
    render(<LandingPage />)
    expect(
      screen.queryByRole('link', { name: 'Đăng nhập' }),
    ).not.toBeInTheDocument()
  })

  it('keeps the mobile navigation open while changing language', () => {
    render(<LandingPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }))
    act(() => setLanguage('en'))
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Inspect with confidence. See every result.',
      }),
    ).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'en')
    expect(document.title).toContain('Track missions from request to result')
  })

  it('keeps the assistant available alongside the scroll journey', () => {
    render(<LandingPage />)
    expect(
      screen.getByRole('button', { name: 'Trợ lý OnDemand Monitor' }),
    ).toBeInTheDocument()
  })
})
