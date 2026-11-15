import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  baseChecklistPricingApi,
  type BaseChecklistPriceRow,
} from '../../../api/baseChecklistPricingApi'
import { BaseChecklistPricingTab } from './BaseChecklistPricingTab'

const row: BaseChecklistPriceRow = {
  checklistId: 'c1',
  name: 'Kiểm tra mái nhà',
  packageNames: [],
  basePrice: 200_000,
  standardAreaM2: 100,
  active: true,
  version: 3,
  calculatedPrice: null,
  calculationDisplay: null,
  calculationError: null,
}

afterEach(() => vi.restoreAllMocks())

describe('BaseChecklistPricingTab', () => {
  it('saves base price and standard area through the Admin pricing API', async () => {
    vi.spyOn(baseChecklistPricingApi, 'list').mockResolvedValue([row])
    vi.spyOn(baseChecklistPricingApi, 'update').mockResolvedValue({
      ...row,
      version: 4,
    })

    render(<BaseChecklistPricingTab />)
    fireEvent.change(
      await screen.findByLabelText('Giá gốc (VNĐ): Kiểm tra mái nhà'),
      {
        target: { value: '250000' },
      },
    )
    fireEvent.change(
      screen.getByLabelText('Diện tích tiêu chuẩn (ha): Kiểm tra mái nhà'),
      {
        target: { value: '0.0125' },
      },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Lưu giá' }))

    await waitFor(() =>
      expect(baseChecklistPricingApi.update).toHaveBeenCalledWith({
        checklistId: 'c1',
        basePrice: 250_000,
        standardAreaM2: 125,
        version: 3,
      }),
    )
    expect(await screen.findByRole('status')).toHaveTextContent('Đã lưu giá')
  })

  it('requests a backend preview for the sample area', async () => {
    vi.spyOn(baseChecklistPricingApi, 'list').mockResolvedValue([row])
    vi.spyOn(baseChecklistPricingApi, 'preview').mockResolvedValue([
      {
        ...row,
        calculatedPrice: 338_600_000,
        calculationDisplay:
          'Giá cơ bản 200.000 VNĐ (bao gồm 0,01 ha) + phụ phí diện tích vượt 20.000.000 VNĐ/ha × 16,92 ha = 338.400.000 VNĐ (làm tròn đến 1.000 VNĐ); tổng 338.600.000 VNĐ.',
      },
    ])

    render(<BaseChecklistPricingTab />)
    fireEvent.click(await screen.findByRole('button', { name: 'Xem trước' }))

    await waitFor(() =>
      expect(baseChecklistPricingApi.preview).toHaveBeenCalledWith(169300),
    )
    expect(
      await screen.findByTitle(
        'Giá cơ bản 200.000 VNĐ (bao gồm 0,01 ha) + phụ phí diện tích vượt 20.000.000 VNĐ/ha × 16,92 ha = 338.400.000 VNĐ (làm tròn đến 1.000 VNĐ); tổng 338.600.000 VNĐ.',
      ),
    ).toBeInTheDocument()
  })
})
