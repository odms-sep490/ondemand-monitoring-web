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
    await screen.findAllByText('0901234567')
    expect(screen.getAllByText('Công ty thử nghiệm')[0]).toBeTruthy()
    expect(screen.getAllByText('Thành phố Hồ Chí Minh')[0]).toBeTruthy()
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
    await screen.findAllByText('Test User')
    expect(screen.getAllByText('Chưa cập nhật').length).toBeGreaterThanOrEqual(
      6,
    )
    expect(screen.queryByText('Độ hoàn thiện hồ sơ')).not.toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('validates and saves customer profile edits', async () => {
    vi.spyOn(userProfileApi, 'getCurrent').mockResolvedValue({
      ...user,
      role: 'CUSTOMER',
      customerProfile: {},
    })
    const update = vi.spyOn(userProfileApi, 'update').mockResolvedValue({
      ...user,
      role: 'CUSTOMER',
    })
    render(<UserProfilePage />)
    fireEvent.click(
      await screen.findByRole('button', { name: /Chỉnh sửa hồ sơ/ }),
    )
    fireEvent.change(screen.getByLabelText('Số CCCD'), {
      target: { value: '123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    expect(await screen.findByText('Số CCCD gồm đúng 12 chữ số.')).toBeTruthy()
    expect(update).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Số CCCD'), {
      target: { value: '012345678901' },
    })
    fireEvent.change(screen.getByLabelText('Họ và tên'), {
      target: { value: 'New Name' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() => expect(update).toHaveBeenCalled())
    expect(update.mock.calls[0][0]).toMatchObject({
      fullName: 'New Name',
      citizenIdentificationNumber: '012345678901',
    })
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Lưu thay đổi' })).toBeNull(),
    )
  })

  it('shows only the name field to non-customers and surfaces BE errors', async () => {
    vi.spyOn(userProfileApi, 'getCurrent').mockResolvedValue(user)
    vi.spyOn(userProfileApi, 'update').mockRejectedValue(
      new Error('Server says no'),
    )
    render(<UserProfilePage />)
    fireEvent.click(
      await screen.findByRole('button', { name: /Chỉnh sửa hồ sơ/ }),
    )
    expect(screen.queryByLabelText('Số CCCD')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    expect(await screen.findByText('Server says no')).toBeTruthy()
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
      await screen.findAllByText('Test User')
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

it.each(['CUSTOMER', 'MANAGER', 'ADMIN', 'STAFF'] as const)(
  'uses the compact profile without account security details for %s',
  async (role) => {
    vi.spyOn(userProfileApi, 'getCurrent').mockResolvedValue({ ...user, role })
    render(<UserProfilePage />)
    await screen.findByRole('heading', { name: 'Thông tin cá nhân' })
    expect(
      screen.queryByRole('heading', { name: 'Tài khoản & bảo mật' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Mã tài khoản')).not.toBeInTheDocument()
    expect(screen.queryByText('Phương thức đăng nhập')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Chỉnh sửa hồ sơ/ }),
    ).toBeEnabled()
  },
)

it('keeps password setup separate from profile editing', async () => {
  vi.spyOn(userProfileApi, 'getCurrent').mockResolvedValue({
    ...user,
    linkedProviders: ['GOOGLE'],
  })
  const { container } = render(<UserProfilePage />)
  await screen.findByLabelText('Mật khẩu mới')
  fireEvent.click(screen.getByRole('button', { name: /Chỉnh sửa hồ sơ/ }))
  expect(container.querySelectorAll('form')).toHaveLength(2)
  expect(container.querySelector('form form')).toBeNull()
})
