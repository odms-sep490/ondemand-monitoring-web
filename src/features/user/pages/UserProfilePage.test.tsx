import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { userProfileApi, type CurrentUserProfile } from '../api/userProfileApi'
import { authApi } from '../../auth/api/authApi'
import { setLanguage } from '../../../shared/i18n'
import { staffLicenseApi } from '../../staff/api/staffLicenseApi'
import { UserProfilePage } from './UserProfilePage'

const user: CurrentUserProfile = {
  id: 'u1',
  email: 'user@example.com',
  fullName: 'Test User',
  role: 'STAFF',
  linkedProviders: ['LOCAL'],
}

beforeEach(() => {
  setLanguage('vi')
  vi.spyOn(staffLicenseApi, 'list').mockResolvedValue([])
})
afterEach(() => vi.restoreAllMocks())

describe('profile local password setup', () => {
  it('shows customer contact profile without technical role and provider labels', async () => {
    vi.spyOn(userProfileApi, 'getCurrent').mockResolvedValue({
      ...user,
      role: 'CUSTOMER',
      customerProfile: {
        phoneNumber: '0901234567',
        companyName: 'Công ty thử nghiệm',
        address: 'Thành phố Hồ Chí Minh',
      },
    })
    render(<UserProfilePage />)
    await screen.findByText('0901234567')
    expect(screen.getByText('Công ty thử nghiệm')).toBeTruthy()
    expect(screen.getByText('Thành phố Hồ Chí Minh')).toBeTruthy()
    expect(screen.queryByText('CUSTOMER')).toBeNull()
    expect(screen.queryByText('LOCAL')).toBeNull()
    expect(screen.queryByLabelText('Mật khẩu mới')).toBeNull()
  })

  it('shows honest empty values when customer contact data is absent', async () => {
    vi.spyOn(userProfileApi, 'getCurrent').mockResolvedValue({
      ...user,
      role: 'CUSTOMER',
    })
    render(<UserProfilePage />)
    await screen.findByText('Test User')
    expect(screen.getAllByText('Chưa cập nhật')).toHaveLength(3)
  })

  it.each([
    ['LOCAL'],
    ['LOCAL', 'GOOGLE'],
  ] as CurrentUserProfile['linkedProviders'][])(
    'does not offer password linking when local identity already exists: %j',
    async (...providers) => {
      vi.spyOn(userProfileApi, 'getCurrent').mockResolvedValue({
        ...user,
        linkedProviders: providers,
      })
      render(<UserProfilePage />)
      await screen.findByText('Test User')
      expect(screen.queryByLabelText('Mật khẩu mới')).toBeNull()
      expect(screen.queryByRole('button', { name: 'Đặt mật khẩu' })).toBeNull()
    },
  )

  it('offers password setup only for Google-only identity, then hides it after success', async () => {
    vi.spyOn(userProfileApi, 'getCurrent').mockResolvedValue({
      ...user,
      linkedProviders: ['GOOGLE'],
    })
    const link = vi.spyOn(authApi, 'linkLocal').mockResolvedValue(undefined)
    render(<UserProfilePage />)
    fireEvent.change(await screen.findByLabelText('Mật khẩu mới'), {
      target: { value: 'NewPassword123!' },
    })
    fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu'), {
      target: { value: 'NewPassword123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Đặt mật khẩu' }))
    await screen.findByRole('status')
    expect(link).toHaveBeenCalledWith('NewPassword123!')
    expect(screen.queryByLabelText('Mật khẩu mới')).toBeNull()
  })

  it('fails closed when identity metadata cannot be loaded', async () => {
    vi.spyOn(userProfileApi, 'getCurrent').mockRejectedValue(
      new Error('Forbidden'),
    )
    render(<UserProfilePage />)
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.queryByLabelText('Mật khẩu mới')).toBeNull()
  })
})
