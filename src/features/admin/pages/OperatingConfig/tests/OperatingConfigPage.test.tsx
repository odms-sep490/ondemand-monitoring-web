import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { OperatingConfigPage } from '../OperatingConfigPage'
import { adminApi } from '../../../api/adminApi'
import { useMockTransport } from './helpers'

useMockTransport()

describe('OperatingConfigPage', () => {
  it('renders the vietnamese title without the sample-data badge', () => {
    vi.spyOn(adminApi, 'listPricingPolicies').mockResolvedValue([])
    render(<OperatingConfigPage />)
    expect(screen.getByText('Cấu hình vận hành')).toBeTruthy()
    expect(screen.queryByText('Dữ liệu mẫu')).toBeNull()
  })

  it('renders the english title when language is switched', () => {
    vi.spyOn(adminApi, 'listPricingPolicies').mockResolvedValue([])
    render(<OperatingConfigPage />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Operating configuration')).toBeTruthy()
    act(() => setLanguage('vi'))
  })

  it('shows pricing policies inside operational configuration', async () => {
    vi.spyOn(adminApi, 'listPricingPolicies').mockResolvedValue([])
    render(<OperatingConfigPage />)

    expect(
      await screen.findByRole('heading', {
        name: 'Chính sách giá mặc định',
      }),
    ).toBeInTheDocument()
  })

  describe('order expiration tab', () => {
    const settings = {
      quotationAcceptanceTimeoutHours: 48,
      depositPaymentTimeoutHours: 24,
      updatedBy: 'admin',
      updatedAt: null,
    }

    async function openExpiration() {
      vi.spyOn(adminApi, 'listPricingPolicies').mockResolvedValue([])
      render(<OperatingConfigPage />)
      fireEvent.click(screen.getByRole('tab', { name: 'Hạn đơn hàng' }))
    }

    it('shows independent quote and deposit timeout settings', async () => {
      vi.spyOn(adminApi, 'getOrderExpirationSettings').mockResolvedValue(
        settings,
      )
      vi.spyOn(adminApi, 'listOrderExpirationAudit').mockResolvedValue([])
      await openExpiration()

      const quoteTimeout = await screen.findByRole('spinbutton', {
        name: 'Thời hạn khách hàng chấp nhận báo giá',
      })
      const depositTimeout = screen.getByRole('spinbutton', {
        name: 'Thời hạn thanh toán tiền đặt cọc',
      })
      await waitFor(() => expect(quoteTimeout).toHaveValue('48'))
      expect(depositTimeout).toHaveValue('24')
      expect(
        screen.getByRole('button', { name: 'Lưu thời hạn' }),
      ).toBeDisabled()
    })

    it('saves both timeout settings and reloads the audit trail', async () => {
      vi.spyOn(adminApi, 'getOrderExpirationSettings').mockResolvedValue(
        settings,
      )
      const audit = vi
        .spyOn(adminApi, 'listOrderExpirationAudit')
        .mockResolvedValue([])
      const update = vi
        .spyOn(adminApi, 'updateOrderExpirationSettings')
        .mockResolvedValue({
          ...settings,
          quotationAcceptanceTimeoutHours: 72,
          depositPaymentTimeoutHours: 12,
        })
      await openExpiration()
      const quoteTimeout = await screen.findByRole('spinbutton', {
        name: 'Thời hạn khách hàng chấp nhận báo giá',
      })
      await waitFor(() => expect(quoteTimeout).toHaveValue('48'))
      const depositTimeout = screen.getByRole('spinbutton', {
        name: 'Thời hạn thanh toán tiền đặt cọc',
      })

      fireEvent.change(quoteTimeout, { target: { value: '72' } })
      fireEvent.change(depositTimeout, { target: { value: '12' } })
      fireEvent.click(screen.getByRole('button', { name: 'Lưu thời hạn' }))

      expect(await screen.findByRole('status')).toHaveTextContent(
        'Đã cập nhật thời hạn hết hạn.',
      )
      expect(update).toHaveBeenCalledWith({
        quotationAcceptanceTimeoutHours: 72,
        depositPaymentTimeoutHours: 12,
      })
      await waitFor(() => expect(audit.mock.calls.length).toBeGreaterThan(1))
    })

    it('rejects zero and values above one year in the editor', async () => {
      vi.spyOn(adminApi, 'getOrderExpirationSettings').mockResolvedValue(
        settings,
      )
      vi.spyOn(adminApi, 'listOrderExpirationAudit').mockResolvedValue([])
      const update = vi.spyOn(adminApi, 'updateOrderExpirationSettings')
      await openExpiration()
      const quoteTimeout = await screen.findByRole('spinbutton', {
        name: 'Thời hạn khách hàng chấp nhận báo giá',
      })
      await waitFor(() => expect(quoteTimeout).toHaveValue('48'))
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
})
