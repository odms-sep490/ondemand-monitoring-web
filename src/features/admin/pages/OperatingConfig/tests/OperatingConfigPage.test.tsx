import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

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
})
