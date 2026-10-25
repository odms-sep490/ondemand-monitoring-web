import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiRequest } from '../../../../../shared/api/httpClient'
import type { OrderDetailView } from '../../../lib/orders/types'
import { ReviewNotice } from './ReviewNotice'

vi.mock('../../../../../shared/api/httpClient', () => ({
  apiRequest: vi.fn(),
}))

const order = {
  id: 'order-1',
  status: 'NEEDS_INFO',
  rejectReason: 'Cần xác nhận quyền truy cập hiện trường',
  reviewByName: 'Manager',
  reviewAt: '2026-10-13T08:00:00Z',
} as OrderDetailView

describe('ReviewNotice', () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset()
    vi.mocked(apiRequest).mockResolvedValue(undefined)
  })

  it('lets the customer submit additional information and reloads the order', async () => {
    const onInformationSubmitted = vi.fn()
    render(
      <ReviewNotice
        order={order}
        onInformationSubmitted={onInformationSubmitted}
      />,
    )

    expect(
      screen.getByText(/Cần xác nhận quyền truy cập hiện trường/),
    ).toBeInTheDocument()
    const submit = screen.getByRole('button', { name: 'Gửi lại cho manager' })
    expect(submit).toBeEnabled()
    fireEvent.click(submit)
    expect(
      screen.getByText('Vui lòng nhập thông tin cần bổ sung trước khi gửi.'),
    ).toBeVisible()

    fireEvent.change(
      screen.getByLabelText('Nhập thông tin hoặc xác nhận bổ sung...'),
      { target: { value: 'Chủ đất đã đồng ý, số liên hệ 0900000000' } },
    )
    expect(submit).toBeEnabled()
    fireEvent.click(submit)

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        '/api/orders/order-1/additional-information',
        {
          method: 'POST',
          body: {
            information: 'Chủ đất đã đồng ý, số liên hệ 0900000000',
            siteContactName: '',
            siteContactPhone: '',
            accessNotes: '',
            monitoringRelationship: null,
            monitoringAuthorizationConfirmed: false,
            monitoringAuthorizationDocuments: [],
          },
        },
      ),
    )
    expect(onInformationSubmitted).toHaveBeenCalledOnce()
    expect(screen.getByText('Đã gửi thông tin bổ sung.')).toBeInTheDocument()
  })

  it('requires and submits a document when the manager requests authorization evidence', async () => {
    render(
      <ReviewNotice
        order={{
          ...order,
          rejectReason:
            'Khách hàng cần bổ sung: Giấy tờ chứng minh quyền sử dụng hoặc giấy ủy quyền tại khu vực',
        }}
      />,
    )

    expect(screen.getByText('Tài liệu xác minh quyền truy cập')).toBeVisible()
    const submit = screen.getByRole('button', { name: 'Gửi lại cho manager' })
    expect(submit).toBeEnabled()
    fireEvent.click(submit)
    expect(
      screen.getByText('Vui lòng tải lên giấy tờ được yêu cầu.'),
    ).toBeVisible()

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    fireEvent.change(input, {
      target: {
        files: [
          new File(['authorization'], 'uy-quyen.pdf', {
            type: 'application/pdf',
          }),
        ],
      },
    })

    await waitFor(() => expect(screen.getByText('uy-quyen.pdf')).toBeVisible())
    fireEvent.click(submit)

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        '/api/orders/order-1/additional-information',
        expect.objectContaining({
          method: 'POST',
          body: expect.objectContaining({
            information:
              'Đã bổ sung tài liệu xác minh quyền truy cập hiện trường.',
            monitoringAuthorizationDocuments: [
              expect.objectContaining({
                documentType: 'AUTHORIZATION_LETTER',
                documentName: 'uy-quyen.pdf',
                fileName: 'uy-quyen.pdf',
                contentType: 'application/pdf',
              }),
            ],
          }),
        }),
      ),
    )
  })

  it('shows only the requested location correction fields', async () => {
    render(
      <ReviewNotice
        order={{
          ...order,
          requestedUpdateScope: 'LOCATION',
          address: 'Vị trí cũ',
          latitude: 10.64,
          longitude: 106.69,
          radiusM: 300,
        }}
      />,
    )

    expect(screen.getByText('Cập nhật khu vực giám sát')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Vị trí cũ')).toBeInTheDocument()
    expect(
      screen.queryByText('Người liên hệ hiện trường'),
    ).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Vĩ độ'), {
      target: { value: '10.65' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Cập nhật khu vực và gửi lại' }),
    )

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith('/api/orders/order-1', {
        method: 'PATCH',
        body: expect.objectContaining({
          address: 'Vị trí cũ',
          latitude: 10.65,
          longitude: 106.69,
          radiusM: 300,
        }),
      }),
    )
  })
})
