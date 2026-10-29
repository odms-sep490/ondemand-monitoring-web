import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { AuditLogPage } from '../AuditLogPage'
import { useMockTransport } from './helpers'

useMockTransport()

describe('AuditLogPage', () => {
  it('renders the vietnamese title with the sample-data badge', () => {
    render(<AuditLogPage />)
    expect(screen.getByText('Nhật ký hệ thống')).toBeTruthy()
    expect(screen.getByText('Dữ liệu mẫu')).toBeTruthy()
  })

  it('renders the english title when language is switched', () => {
    render(<AuditLogPage />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Audit log')).toBeTruthy()
    act(() => setLanguage('vi'))
  })

  it('lists entries and opens/closes the detail modal', async () => {
    render(<AuditLogPage />)
    const view = (await screen.findAllByLabelText(/^Xem diff /))[0]
    fireEvent.click(view)
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('Chi tiết thay đổi')).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: 'Đóng' }).at(-1)!)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('filters by action and shows the empty state when nothing matches', async () => {
    render(<AuditLogPage />)
    await screen.findAllByLabelText(/^Xem diff /)
    fireEvent.change(screen.getByLabelText('Lọc theo loại thực thể'), {
      target: { value: 'zzz-no-such-entity' },
    })
    expect(await screen.findByText('Không có bản ghi nào')).toBeTruthy()
  })

  it('pages forward when there is more than one page', async () => {
    render(<AuditLogPage />)
    await screen.findAllByLabelText(/^Xem diff /)
    const next = screen.getByTitle('Trang sau')
    if (!next.className.includes('ant-pagination-disabled')) {
      fireEvent.click(next)
      await waitFor(() =>
        expect(
          document
            .querySelector('.ant-pagination-item-active')
            ?.getAttribute('title'),
        ).toBe('2'),
      )
    }
  })

  it('shows an inline notice instead of an alert when exporting', async () => {
    render(<AuditLogPage />)
    fireEvent.click(screen.getByText('Xuất CSV'))
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('shows an error state when the request fails', async () => {
    const { setHttpTransport } = await import('../../../../../shared/api/httpClient')
    setHttpTransport(async () => new Response('{}', { status: 500 }))
    render(<AuditLogPage />)
    await screen.findByText('Thử lại')
  })
})
