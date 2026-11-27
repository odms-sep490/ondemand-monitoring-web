import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { env } from '../config/env'
import { authSession } from '../features/auth/api/authApi'
import { Router } from './router'

vi.mock('lottie-react', () => ({
  default: () => null,
  Lottie: () => null,
  useLottie: () => ({ View: null }),
}))
vi.mock('../features/auth/api/authApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../features/auth/api/authApi')>()),
  startAuthSession: () => () => {},
}))
beforeEach(() => {
  authSession.clear()
  window.location.hash = ''
})
afterEach(() => {
  window.location.hash = ''
  vi.restoreAllMocks()
})

describe('Router - authentication pages during service outages', () => {
  it.each([
    ['loading', '#auth/login', 'Đăng nhập'],
    ['unavailable', '#auth/login', 'Đăng nhập'],
    ['loading', '#auth/register', 'Tạo tài khoản khách hàng'],
    ['unavailable', '#auth/register', 'Tạo tài khoản khách hàng'],
  ] as const)(
    'opens %s session / %s without waiting for backend',
    async (status, hash, title) => {
      authSession.setStatus(status)
      window.location.hash = hash
      render(<Router />)
      expect(
        await screen.findByRole('heading', { name: title }),
      ).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeEnabled()
      expect(window.location.hash).toBe(hash)
    },
  )

  it.each(['#auth/login', '#auth/register'] as const)(
    'reports a network error on submission while keeping %s accessible',
    async (hash) => {
      vi.spyOn(env, 'useMockApi', 'get').mockReturnValue(false)
      const fetcher = vi
        .spyOn(globalThis, 'fetch')
        .mockRejectedValue(new TypeError('Failed to fetch'))
      authSession.setStatus('unavailable')
      window.location.hash = hash
      render(<Router />)
      const registration = hash === '#auth/register'
      const title = registration ? 'Tạo tài khoản khách hàng' : 'Đăng nhập'
      expect(
        await screen.findByRole('heading', { name: title }),
      ).toBeInTheDocument()
      expect(fetcher).not.toHaveBeenCalled()
      fireEvent.change(screen.getByLabelText('Email'), {
        target: { value: 'outage@example.com' },
      })
      fireEvent.change(screen.getByLabelText('Mật khẩu'), {
        target: { value: 'Password@123' },
      })
      if (registration) {
        fireEvent.change(screen.getByLabelText('Họ và tên'), {
          target: { value: 'Test Customer' },
        })
        fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu'), {
          target: { value: 'Password@123' },
        })
        fireEvent.click(
          screen.getByLabelText(
            'Tôi đồng ý với Điều khoản sử dụng và chính sách bay an toàn.',
          ),
        )
      }
      fireEvent.submit(screen.getByLabelText('Email').closest('form')!)
      expect(await screen.findByRole('status')).toHaveTextContent(/.+/)
      expect(fetcher).toHaveBeenCalled()
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
      expect(
        screen.getByRole('button', {
          name: registration ? 'Tạo tài khoản' : 'Đăng nhập',
        }),
      ).toBeEnabled()
      expect(window.location.hash).toBe(hash)
      expect(authSession.getStatus()).toBe('unavailable')
    },
  )

  it.each([
    ['loading', '#portal/manager'],
    ['unavailable', '#portal/manager'],
    ['loading', '#profile'],
    ['unavailable', '#profile'],
  ] as const)('still protects %s session / %s', async (status, hash) => {
    authSession.setStatus(status)
    window.location.hash = hash
    render(<Router />)
    expect(
      await screen.findByText(
        status === 'loading'
          ? 'Đang khôi phục phiên đăng nhập…'
          : 'Chưa thể kiểm tra phiên đăng nhập. Vui lòng kiểm tra kết nối và thử lại.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Mật khẩu')).not.toBeInTheDocument()
    expect(window.location.hash).toBe(hash)
  })
})
