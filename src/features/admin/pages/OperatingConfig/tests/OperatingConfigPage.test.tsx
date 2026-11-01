import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { OperatingConfigPage } from '../OperatingConfigPage'
import { adminApi } from '../../../api/adminApi'
import { useMockTransport } from './helpers'

useMockTransport()

describe('OperatingConfigPage', () => {
  it('renders the vietnamese title with the sample-data badge', () => {
    render(<OperatingConfigPage />)
    expect(screen.getByText('Cấu hình vận hành')).toBeTruthy()
    expect(screen.getByText('Dữ liệu mẫu')).toBeTruthy()
  })

  it('renders the english title when language is switched', () => {
    render(<OperatingConfigPage />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Operating configuration')).toBeTruthy()
    act(() => setLanguage('vi'))
  })

  it('shows policies and switches to the no-fly zones tab', async () => {
    render(<OperatingConfigPage />)
    expect(await screen.findByText('Tham số vận hành')).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: /Vùng cấm bay/ }))
    expect((await screen.findAllByLabelText(/^Sửa /)).length).toBeGreaterThan(0)
  })

  it('keeps pricing inside operational configuration', async () => {
    vi.spyOn(adminApi, 'listPricingPolicies').mockResolvedValue([])
    render(<OperatingConfigPage />)

    fireEvent.click(screen.getByRole('tab', { name: /Định giá/ }))

    expect(
      await screen.findByRole('heading', {
        name: 'Chính sách giá mặc định',
      }),
    ).toBeInTheDocument()
  })

  it('shows independent quote and deposit timeout settings with the default values', async () => {
    render(<OperatingConfigPage />)

    const quoteTimeout = await screen.findByRole('spinbutton', {
      name: 'Thời hạn khách hàng chấp nhận báo giá',
    })
    const depositTimeout = screen.getByRole('spinbutton', {
      name: 'Thời hạn thanh toán tiền đặt cọc',
    })
    await waitFor(() => expect(quoteTimeout).toHaveValue(48))
    expect(depositTimeout).toHaveValue(24)
    expect(screen.getByRole('button', { name: 'Lưu thời hạn' })).toBeDisabled()
    expect(screen.queryByText(/Nhập số giờ nguyên/)).not.toBeInTheDocument()
    expect(
      screen.getByText(
        'Chưa có thay đổi mới — lịch sử chỉ ghi khi giá trị thay đổi.',
      ),
    ).toBeInTheDocument()
  })

  it('saves both timeout settings and shows field-level audit entries', async () => {
    render(<OperatingConfigPage />)
    const quoteTimeout = await screen.findByRole('spinbutton', {
      name: 'Thời hạn khách hàng chấp nhận báo giá',
    })
    const depositTimeout = screen.getByRole('spinbutton', {
      name: 'Thời hạn thanh toán tiền đặt cọc',
    })

    fireEvent.change(quoteTimeout, { target: { value: '72' } })
    fireEvent.change(depositTimeout, { target: { value: '12' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thời hạn' }))

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Đã cập nhật thời hạn hết hạn.',
    )
    await waitFor(() =>
      expect(screen.getAllByText('Admin Mock')).toHaveLength(2),
    )
    expect(screen.getAllByText('48 giờ')).toHaveLength(1)
    expect(screen.getAllByText('24 giờ')).toHaveLength(1)
    expect(screen.getAllByText('72 giờ')).toHaveLength(1)
    expect(screen.getAllByText('12 giờ')).toHaveLength(1)
  })

  it('rejects zero and values above one year in the editor', async () => {
    const update = vi.spyOn(adminApi, 'updateOrderExpirationSettings')
    render(<OperatingConfigPage />)
    const quoteTimeout = await screen.findByRole('spinbutton', {
      name: 'Thời hạn khách hàng chấp nhận báo giá',
    })
    const save = screen.getByRole('button', { name: 'Lưu thời hạn' })

    fireEvent.change(quoteTimeout, { target: { value: '0' } })
    expect(save).toBeDisabled()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Thời hạn phải lớn hơn 0.',
    )
    fireEvent.change(quoteTimeout, { target: { value: '8761' } })
    expect(save).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Thời hạn không được vượt quá 8.760 giờ.',
    )
    expect(update).not.toHaveBeenCalled()
  })
})
