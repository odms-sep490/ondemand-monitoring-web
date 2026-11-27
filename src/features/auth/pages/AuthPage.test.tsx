import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { resetMockDb } from '../../../mocks/db'
import { setLanguage } from '../../../shared/i18n'
import { authSession, authApi, AuthApiError } from '../api/authApi'
import { AuthPage } from './AuthPage'

function fillLoginForm(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: email },
  })
  fireEvent.change(screen.getByLabelText('Mật khẩu'), {
    target: { value: password },
  })
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  window.location.hash = ''
  resetMockDb()
})

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  window.location.hash = ''
  resetMockDb()
  vi.restoreAllMocks()
})

describe('AuthPage - login', () => {
  it('signs in a known mock user and redirects to their role home', async () => {
    render(<AuthPage initialMode="login" />)
    fillLoginForm('hang.le@odms.vn', 'Demo@123')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    })

    await waitFor(() => expect(window.location.hash).toBe('#portal/manager'))
    expect(authSession.getAccessToken()).toBe('mock-staff-token')
  })

  it('shows the "Sai thông tin" alert for INVALID_CREDENTIALS', async () => {
    render(<AuthPage initialMode="login" />)
    fillLoginForm('hang.le@odms.vn', 'wrong-password')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    })

    expect(
      await screen.findByText('Email hoặc mật khẩu không đúng.'),
    ).toBeInTheDocument()
    expect(window.location.hash).toBe('')
  })

  it('shows the "Tài khoản khoá" alert for ACCOUNT_DISABLED', async () => {
    render(<AuthPage initialMode="login" />)
    fillLoginForm('locked.demo@odms.vn', 'Demo@123')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    })

    expect(await screen.findByText('Tài khoản đã bị khoá.')).toBeInTheDocument()
    expect(
      screen.getByText('Liên hệ quản trị viên qua support@odms.vn để mở lại.'),
    ).toBeInTheDocument()
  })

  it('shows the loading label and disables the button while submitting', async () => {
    render(<AuthPage initialMode="login" />)
    fillLoginForm('hang.le@odms.vn', 'Demo@123')

    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    // Assert synchronously, before the (0ms-latency) mock login promise
    // resolves and flips the button back to its idle label.
    const button = screen.getByRole('button', { name: 'Đang đăng nhập...' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')

    await waitFor(() => expect(window.location.hash).toBe('#portal/manager'))
  })

  it('passes an unknown email through to the real network', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: false, message: 'Not found' }), {
        status: 404,
      }),
    )

    render(<AuthPage initialMode="login" />)
    fillLoginForm('someone-real@example.com', 'whatever')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    })

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())
  })
})

describe('AuthPage - register', () => {
  it('blocks submit and shows an error when passwords do not match', async () => {
    render(<AuthPage initialMode="register" />)

    fireEvent.change(screen.getByLabelText('Họ và tên'), {
      target: { value: 'Nguyễn Văn A' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'a@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Mật khẩu'), {
      target: { value: 'Password123' },
    })
    fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu'), {
      target: { value: 'Different123' },
    })
    fireEvent.click(
      screen.getByLabelText(
        'Tôi đồng ý với Điều khoản sử dụng và chính sách bay an toàn.',
      ),
    )

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }))
    })

    expect(await screen.findByText('Mật khẩu không khớp')).toBeInTheDocument()
  })

  it('requires the terms checkbox before the form can be submitted', () => {
    render(<AuthPage initialMode="register" />)
    const checkbox = screen.getByLabelText(
      'Tôi đồng ý với Điều khoản sử dụng và chính sách bay an toàn.',
    )
    expect(checkbox).toBeRequired()
  })
})

describe('AuthPage - language', () => {
  it('renders English titles and labels when language is switched', () => {
    render(<AuthPage initialMode="login" />)
    act(() => setLanguage('en'))

    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument()
    expect(screen.getByText('Welcome back.')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
  })
})

describe('AuthPage - localized service errors', () => {
  afterEach(() => setLanguage('vi'))

  it.each([
    [
      'vi',
      'login',
      'Không thể kết nối đến dịch vụ xác thực. Vui lòng thử lại.',
    ],
    [
      'en',
      'login',
      'Unable to reach the authentication service. Please try again.',
    ],
    [
      'vi',
      'register',
      'Không thể kết nối đến dịch vụ xác thực. Vui lòng thử lại.',
    ],
    [
      'en',
      'register',
      'Unable to reach the authentication service. Please try again.',
    ],
  ] as const)(
    'localizes %s / %s connection failures',
    async (language, mode, message) => {
      setLanguage(language)
      vi.spyOn(authApi, mode).mockRejectedValue(
        new AuthApiError(
          'Unable to reach the authentication service. Please try again.',
          'AUTH_SERVICE_UNAVAILABLE',
        ),
      )
      render(<AuthPage initialMode={mode} />)
      fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'test@example.com' },
      })
      fireEvent.change(
        screen.getByLabelText(language === 'vi' ? 'Mật khẩu' : 'Password'),
        { target: { value: 'Password@123' } },
      )
      if (mode === 'register') {
        fireEvent.change(
          screen.getByLabelText(language === 'vi' ? 'Họ và tên' : 'Full name'),
          { target: { value: 'Test Customer' } },
        )
        fireEvent.change(
          screen.getByLabelText(
            language === 'vi' ? 'Xác nhận mật khẩu' : 'Confirm password',
          ),
          { target: { value: 'Password@123' } },
        )
      }
      fireEvent.submit(screen.getByLabelText('Email').closest('form')!)
      expect(await screen.findByRole('status')).toHaveTextContent(message)
      expect(screen.getByLabelText('Email')).toBeEnabled()
    },
  )

  it.each([
    new AuthApiError(
      'Internal authentication provider details',
      'INTERNAL_SERVER_ERROR',
      undefined,
      503,
    ),
    new AuthApiError(
      'Unable to initialize CSRF protection.',
      'CSRF_TOKEN_UNAVAILABLE',
    ),
  ])(
    'does not expose English infrastructure errors in Vietnamese',
    async (failure) => {
      setLanguage('vi')
      vi.spyOn(authApi, 'login').mockRejectedValue(failure)
      render(<AuthPage initialMode="login" />)
      fillLoginForm('test@example.com', 'Password@123')
      fireEvent.submit(screen.getByLabelText('Email').closest('form')!)
      expect(await screen.findByRole('status')).toHaveTextContent(
        'Không thể kết nối đến dịch vụ xác thực. Vui lòng thử lại.',
      )
      expect(screen.queryByText(failure.message)).not.toBeInTheDocument()
    },
  )
})
