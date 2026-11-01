import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { TimeslotsTab } from '../components/TimeslotsTab'
import { pickOption, useMockTransport } from './helpers'

useMockTransport()

describe('TimeslotsTab', () => {
  it('lists preferred times with HH:mm windows', async () => {
    render(<TimeslotsTab />)
    expect(await screen.findByLabelText('Sửa Buổi chiều')).toBeTruthy()
    expect(screen.getByText('12:00 – 17:00')).toBeTruthy()
  })

  it('creates a timeslot through the modal', async () => {
    render(<TimeslotsTab />)
    await screen.findByLabelText('Sửa Buổi chiều')
    fireEvent.click(screen.getByText('Thêm khung giờ'))
    await pickOption(/Mã khung giờ/, 'NIGHT · Ban đêm')
    fireEvent.change(screen.getByLabelText('Tên hiển thị (Tiếng Việt)'), {
      target: { value: 'Đêm khuya' },
    })
    fireEvent.change(screen.getByLabelText('Tên hiển thị (English)'), {
      target: { value: 'Late night' },
    })
    fireEvent.click(screen.getByText('Lưu'))
    expect(await screen.findByText('Đêm khuya')).toBeTruthy()
  })

  it('shows the BE conflict error for a duplicate code', async () => {
    render(<TimeslotsTab />)
    await screen.findByLabelText('Sửa Buổi chiều')
    fireEvent.click(screen.getByText('Thêm khung giờ'))
    fireEvent.change(screen.getByLabelText('Tên hiển thị (Tiếng Việt)'), {
      target: { value: 'Trùng' },
    })
    fireEvent.change(screen.getByLabelText('Tên hiển thị (English)'), {
      target: { value: 'Duplicate' },
    })
    fireEvent.click(screen.getByText('Lưu'))
    expect(await screen.findByText('Code already exists')).toBeTruthy()
  })

  it('prefills edit from the BE and deletes with confirmation', async () => {
    render(<TimeslotsTab />)
    await screen.findByLabelText('Sửa Buổi chiều')
    fireEvent.click(screen.getByLabelText('Sửa Buổi chiều'))
    const name = (await screen.findByLabelText(
      'Tên hiển thị (Tiếng Việt)',
    )) as HTMLInputElement
    expect(name.value).toBe('Buổi chiều')
    expect((screen.getByLabelText(/Bắt đầu/) as HTMLInputElement).value).toBe(
      '12:00',
    )
    fireEvent.click(screen.getByText('Hủy'))

    fireEvent.click(screen.getByLabelText('Xóa Buổi chiều'))
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))
    await waitFor(() =>
      expect(screen.queryByLabelText('Sửa Buổi chiều')).toBeNull(),
    )
  })
})
