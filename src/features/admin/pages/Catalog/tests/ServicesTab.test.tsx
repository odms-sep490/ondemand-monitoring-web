import { describe, expect, it, vi } from 'vitest'
import { catalogApi } from '../../../api/catalogApi'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { ServicesTab } from '../components/ServicesTab'
import { useMockTransport } from './helpers'

useMockTransport()

describe('ServicesTab', () => {
  it('keeps the newly created service ID when retrying a failed image upload', async () => {
    const oldCreate = URL.createObjectURL
    const oldRevoke = URL.revokeObjectURL
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
    const create = vi.spyOn(catalogApi, 'createService')
    const upload = vi
      .spyOn(catalogApi, 'uploadServiceImage')
      .mockRejectedValueOnce(new Error('Upload unavailable'))
    try {
      render(<ServicesTab />)
      await screen.findByText('Giám sát công trình')
      fireEvent.click(screen.getByText('+ Thêm dịch vụ'))
      fireEvent.change(screen.getByLabelText(/Tên dịch vụ/), {
        target: { value: 'Image service' },
      })
      fireEvent.change(screen.getByLabelText('Ảnh minh họa'), {
        target: {
          files: [new File(['image'], 'image.png', { type: 'image/png' })],
        },
      })
      fireEvent.click(screen.getByText('Lưu'))
      await screen.findByText(
        /Thông tin dịch vụ đã lưu, nhưng chưa cập nhật được ảnh/,
      )
      fireEvent.click(screen.getByText('Lưu'))
      await screen.findByText('Image service')
      expect(create).toHaveBeenCalledTimes(1)
      expect(upload).toHaveBeenCalledTimes(2)
      expect(upload.mock.calls[0][0]).toBe(upload.mock.calls[1][0])
    } finally {
      create.mockRestore()
      upload.mockRestore()
      URL.createObjectURL = oldCreate
      URL.revokeObjectURL = oldRevoke
    }
  })
  it('lists services from the BE-shaped mock', async () => {
    render(<ServicesTab />)
    expect(await screen.findByText('Giám sát công trình')).toBeTruthy()
    expect(screen.getByText('Kiểm tra nhà xưởng')).toBeTruthy()
  })

  it('shows an error state when the request fails', async () => {
    const { setHttpTransport } =
      await import('../../../../../shared/api/httpClient')
    setHttpTransport(async () => new Response('{}', { status: 500 }))
    render(<ServicesTab />)
    await screen.findByText('Thử lại')
  })

  it('creates a service through the modal', async () => {
    render(<ServicesTab />)
    await screen.findByText('Giám sát công trình')
    fireEvent.click(screen.getByText('+ Thêm dịch vụ'))
    fireEvent.change(screen.getByLabelText(/Tên dịch vụ/), {
      target: { value: 'Dịch vụ thử' },
    })
    fireEvent.change(screen.getByLabelText(/Giá danh mục cũ/), {
      target: { value: '1800000' },
    })
    fireEvent.click(screen.getByText('Lưu'))
    expect(await screen.findByText('Dịch vụ thử')).toBeTruthy()
    expect(screen.getByText(/1\.800\.000/)).toBeTruthy()
  })

  it('validates the required name and shows BE errors inline', async () => {
    render(<ServicesTab />)
    await screen.findByText('Giám sát công trình')
    fireEvent.click(screen.getByText('+ Thêm dịch vụ'))
    fireEvent.click(screen.getByText('Lưu'))
    expect(screen.getByText('Bắt buộc')).toBeTruthy()
  })

  it('prefills the edit modal from the BE and saves', async () => {
    render(<ServicesTab />)
    await screen.findByText('Giám sát công trình')
    fireEvent.click(screen.getByLabelText('Sửa Giám sát công trình'))
    const name = (await screen.findByLabelText(
      /Tên dịch vụ/,
    )) as HTMLInputElement
    expect(name.value).toBe('Giám sát công trình')
    expect(screen.getByLabelText(/Giá danh mục cũ/)).toHaveValue(3_500_000)
    expect(
      (screen.getByLabelText(/Mô tả/) as HTMLTextAreaElement).value,
    ).toContain('công trình')
    fireEvent.change(name, { target: { value: 'Tên mới' } })
    fireEvent.click(screen.getByText('Lưu'))
    expect(await screen.findByText('Tên mới')).toBeTruthy()
  })

  it('deletes after a danger confirmation', async () => {
    render(<ServicesTab />)
    await screen.findByText('Giám sát công trình')
    fireEvent.click(
      screen.getByLabelText('Thao tác khác Giám sát công trình'),
    )
    fireEvent.click(screen.getByLabelText('Xoá Giám sát công trình'))
    expect(screen.getByText(/Bạn có chắc muốn xoá/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Xoá' }))
    await waitFor(() =>
      expect(screen.queryByText('Giám sát công trình')).toBeNull(),
    )
  })
})
