import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { CreateOrderPage } from '../CreateOrderPage'
import { customerApi } from '../../../api/customerApi'
import { CREATE_ORDER_DRAFT_STORAGE_KEY } from '../../../lib/createOrder/draftStorage'
import { ApiError } from '../../../../../shared/api/httpClient'

const originalScrollIntoView = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'scrollIntoView',
)

beforeEach(() => {
  resetMockDb()
  localStorage.removeItem(CREATE_ORDER_DRAFT_STORAGE_KEY)
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  })
})
afterEach(() => {
  resetMockDb()
  vi.restoreAllMocks()
  if (originalScrollIntoView)
    Object.defineProperty(
      HTMLElement.prototype,
      'scrollIntoView',
      originalScrollIntoView,
    )
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView')
})

const next = (label: string) =>
  fireEvent.click(screen.getByRole('button', { name: `Tiếp tục: ${label}` }))

async function renderWizard() {
  const view = render(<CreateOrderPage />)
  await screen.findByRole('button', { name: /Giám sát công trình/ })
  return view
}

/** Step 1 -> step 2 (location). */
async function fillService() {
  fireEvent.click(
    await screen.findByRole('button', { name: /Giám sát công trình/ }),
  )
  fireEvent.change(screen.getByLabelText(/Tiêu đề/), {
    target: { value: 'Đơn kiểm thử' },
  })
  next('Vị trí & vùng giám sát')
}

async function fillLocation(onContent?: () => Promise<void> | void) {
  fireEvent.change(await screen.findByLabelText(/Địa chỉ hoặc khu vực/), {
    target: { value: 'KCN Long Hậu' },
  })
  fireEvent.click(screen.getByText('Tọa độ nâng cao'))
  fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận tọa độ này' }))
  await screen.findByText('Đã xác nhận vị trí')
  next('Nội dung giám sát')
  await onContent?.()
  const forward = await screen.findByRole('button', {
    name: 'Tiếp tục: Chi tiết & quyền giám sát',
  })
  await waitFor(() => expect(forward).toBeEnabled())
  fireEvent.click(forward)
  fireEvent.change(screen.getByLabelText(/Người liên hệ/), { target: { value: 'An' } })
  fireEvent.change(screen.getByLabelText(/Số điện thoại/), { target: { value: '0901234567' } })
  fireEvent.change(screen.getByLabelText(/Điều kiện ra vào/), { target: { value: 'Cổng chính' } })
  fireEvent.click(screen.getByLabelText('Chủ sở hữu / Chủ đầu tư'))
  fireEvent.click(
    screen.getByLabelText(/Tôi xác nhận mình có quyền yêu cầu giám sát/),
  )
  next('Thời gian')
  // The customer picks the time window; nothing is chosen for them.
  const time = (await screen.findByLabelText(/Khung giờ/)) as HTMLSelectElement
  await waitFor(() => expect(time.options.length).toBeGreaterThan(1))
  expect(time.value).toBe('')
  fireEvent.change(time, { target: { value: time.options[1].value } })
}

describe('CreateOrderPage wizard', () => {
  it.each(['mixed', 'empty'] as const)(
    'submits the %s checklist through the complete wizard',
    async (selection) => {
      vi.spyOn(customerApi, 'getServiceChecklist').mockResolvedValue(
        ['Keep', 'Edit', 'Remove'].map((content, index) => ({
          id: `link-${index}`,
          serviceId: 'svc-construction',
          checklistId: `catalog-${index}`,
          checklistVersion: index + 10,
          displayOrder: index,
          content,
          serviceActive: true,
          checklistActive: true,
        })),
      )
      const create = vi.spyOn(customerApi, 'createOrder')
      await renderWizard()
      await fillService()
      await fillLocation(async () => {
        await screen.findByLabelText('Chọn nội dung 1')
        if (selection === 'empty') {
          for (let index = 1; index <= 3; index++)
            fireEvent.click(screen.getByLabelText(`Chọn nội dung ${index}`))
        } else {
          fireEvent.click(screen.getByLabelText('Sửa nội dung 2'))
          fireEvent.change(screen.getByLabelText('Nội dung giám sát 2'), {
            target: { value: 'Edited requirement' },
          })
          fireEvent.click(screen.getByLabelText('Chọn nội dung 3'))
          fireEvent.click(
            screen.getByRole('button', { name: '+ Thêm nội dung' }),
          )
          fireEvent.change(screen.getByLabelText('Nội dung giám sát 4'), {
            target: { value: 'Custom requirement' },
          })
        }
      })
      next('Kết quả bàn giao & xác nhận')
      await waitFor(() =>
        expect(screen.queryByText(/Đang tải kết quả bàn giao/)).toBeNull(),
      )
      fireEvent.click(screen.getByLabelText(/Tôi xác nhận mục đích giám sát/))
      fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))
      await screen.findByRole('dialog')
      fireEvent.click(screen.getByRole('button', { name: 'Xác nhận gửi' }))
      await screen.findByText('Đã tạo yêu cầu')
      expect(create).toHaveBeenCalledTimes(1)
      expect(create.mock.calls[0][0].checklistItems).toEqual(
        selection === 'empty'
          ? []
          : [
              {
                sourceChecklistId: 'catalog-0',
                expectedChecklistVersion: 10,
                minimumEvidenceCount: 1,
                requiredEvidenceType: 'IMAGE',
              },
              {
                sourceChecklistId: 'catalog-1',
                expectedChecklistVersion: 11,
                minimumEvidenceCount: 1,
                requiredEvidenceType: 'IMAGE',
                contentOverride: 'Edited requirement',
              },
              {
                contentOverride: 'Custom requirement',
                minimumEvidenceCount: 1,
                requiredEvidenceType: 'IMAGE',
              },
            ],
      )
    },
  )

  it('shows services and goal fields on step 1', async () => {
    await renderWizard()
    expect(
      await screen.findByRole('button', { name: /Giám sát công trình/ }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/Tiêu đề/)).toBeInTheDocument()
  })

  it('blocks step 1 without a title when the catalog selects its default service', async () => {
    await renderWizard()
    // The default service is applied in an effect after the catalog loads; wait for it.
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Giám sát công trình/ }),
      ).toHaveAttribute('aria-pressed', 'true'),
    )
    next('Vị trí & vùng giám sát')
    expect(await screen.findByText('Nhập tiêu đề yêu cầu.')).toBeInTheDocument()
    expect(screen.queryByText('Chọn dịch vụ giám sát.')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Địa chỉ hoặc khu vực/)).not.toBeInTheDocument()
  })

  it('requires a service and title when the active catalog is empty', async () => {
    vi.spyOn(customerApi, 'listServices').mockResolvedValue([])
    render(<CreateOrderPage />)
    await screen.findByText('Chưa có dịch vụ nào đang hoạt động')
    next('Vị trí & vùng giám sát')
    expect(
      await screen.findByText('Chọn dịch vụ giám sát.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Nhập tiêu đề yêu cầu.')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Địa chỉ hoặc khu vực/)).not.toBeInTheDocument()
  })

  it('shows the real location map on step 2 and requires an address', async () => {
    await renderWizard()
    await fillService()
    expect(
      await screen.findByRole('region', {
        name: 'Bản đồ chọn vị trí giám sát',
      }),
    ).toBeInTheDocument()
    next('Nội dung giám sát')
    expect(
      await screen.findByText('Nhập địa chỉ/khu vực cần giám sát.'),
    ).toBeInTheDocument()
  })

  it('continues from location to schedule after a valid address', async () => {
    await renderWizard()
    await fillService()
    await fillLocation()
    expect(await screen.findByLabelText(/Ngày sớm nhất/)).toBeInTheDocument()
  })

  it('shows the pricing estimate for the chosen service', async () => {
    await renderWizard()
    fireEvent.click(
      await screen.findByRole('button', { name: /Giám sát công trình/ }),
    )
    // The base price shows on the selected service card (step 1 no longer repeats it elsewhere).
    await waitFor(() =>
      expect(screen.getAllByText(/3\.500\.000/).length).toBeGreaterThanOrEqual(
        1,
      ),
    )
    // The AI-analysis add-on was removed from the wizard: the estimate is the service base price.
    expect(screen.queryByLabelText(/AI phân tích hình ảnh/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^\+.*500\.000/)).not.toBeInTheDocument()
  })

  it('shows a retryable error when deliverable types cannot be loaded', async () => {
    vi.spyOn(customerApi, 'listServiceDeliverables')
      .mockRejectedValueOnce(new Error('network failed'))
      .mockResolvedValueOnce([
        {
          id: 'sd-construction-photo',
          serviceId: 'svc-construction',
          serviceName: 'Giám sát công trình',
          deliverableTypeId: 'dt-photo',
          deliverableTypeName: 'Báo cáo Tiến độ',
        },
      ])
    await renderWizard()
    await fillService()
    await fillLocation()
    next('Kết quả bàn giao & xác nhận')

    expect(
      await screen.findByText(
        'Không thể tải loại kết quả bàn giao. Vui lòng thử lại.',
      ),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await waitFor(() =>
      expect(screen.queryByText(/Đang tải kết quả bàn giao/)).toBeNull(),
    )
  })

  it('walks through all steps and submits via the confirm dialog', async () => {
    await renderWizard()
    await fillService()
    await fillLocation()

    next('Kết quả bàn giao & xác nhận')
    await waitFor(() =>
      expect(screen.queryByText(/Đang tải kết quả bàn giao/)).toBeNull(),
    )
    fireEvent.click(screen.getByLabelText(/Tôi xác nhận mục đích giám sát/))

    expect(await screen.findByText('Tóm tắt yêu cầu')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Gửi yêu cầu giám sát?')
    expect(dialog).toHaveTextContent('Đơn kiểm thử')
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận gửi' }))

    expect(await screen.findByText('Đã tạo yêu cầu')).toBeInTheDocument()
    expect(
      window.localStorage.getItem('odm.customer.createOrderDraft.v2'),
    ).toBeNull()
  })

  /** Fills the whole wizard up to the confirm dialog. */
  async function openConfirmDialog() {
    await renderWizard()
    await fillService()
    await fillLocation()
    next('Kết quả bàn giao & xác nhận')
    await waitFor(() =>
      expect(screen.queryByText(/Đang tải kết quả bàn giao/)).toBeNull(),
    )
    fireEvent.click(screen.getByLabelText(/Tôi xác nhận mục đích giám sát/))
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))
    await screen.findByRole('dialog')
  }

  it('shows stale recovery after creation fails, without auto retry', async () => {
    const create = vi.spyOn(customerApi, 'createOrder').mockRejectedValue(
      new ApiError('internal detail', {
        status: 409,
        code: 'ORDER_CHECKLIST_TEMPLATE_CHANGED',
        method: 'POST',
        path: '/api/orders',
      }),
    )
    await openConfirmDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận gửi' }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(screen.queryByText('internal detail')).not.toBeInTheDocument()
    expect(create).toHaveBeenCalledTimes(1)
  }, 60_000)

  it('shows the API error inside the dialog and stays on the form', async () => {
    vi.spyOn(customerApi, 'createOrder').mockRejectedValue(
      new Error('Vùng bị từ chối'),
    )
    await openConfirmDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận gửi' }))
    expect(
      await screen.findByText('Không thể gửi yêu cầu. Vui lòng thử lại.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Vùng bị từ chối')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  }, 60_000)

  it('routes a backend preferredDateFrom error back to the schedule field', async () => {
    vi.spyOn(customerApi, 'createOrder').mockRejectedValueOnce(
      new ApiError(
        'preferredDateFrom must be at least 7 days after the request date',
        { status: 400, method: 'POST', path: '/api/orders' },
      ),
    )
    await renderWizard()
    await fillService()
    await fillLocation()
    next('Kết quả bàn giao & xác nhận')
    await waitFor(() =>
      expect(screen.queryByText(/Đang tải kết quả bàn giao/)).toBeNull(),
    )
    fireEvent.click(screen.getByLabelText(/Tôi xác nhận mục đích giám sát/))
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))
    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận gửi' }))

    expect(
      await screen.findByText(
        'Ngày bay sớm nhất phải cách ngày tạo yêu cầu ít nhất 7 ngày để ODMS chuẩn bị thủ tục giấy phép bay.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByLabelText(/Ngày sớm nhất/)).toHaveFocus(),
    )
  })

  it('asks the customer to choose a time window instead of picking one for them', async () => {
    await renderWizard()
    await fillService()
    await fillLocation()
    const time = screen.getByLabelText(/Khung giờ/) as HTMLSelectElement
    fireEvent.change(time, { target: { value: '' } })
    fireEvent.click(
      screen.getByRole('button', { name: 'Tiếp tục: Kết quả bàn giao & xác nhận' }),
    )
    expect(await screen.findByText('Chọn khung giờ.')).toBeInTheDocument()
    expect(screen.queryByText('Kết quả bàn giao')).toBeNull()
  })

  it('blocks submit until the terms and security commitment are accepted', async () => {
    await renderWizard()
    await fillService()
    await fillLocation()
    next('Kết quả bàn giao & xác nhận')
    await waitFor(() =>
      expect(screen.queryByText(/Đang tải kết quả bàn giao/)).toBeNull(),
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Gửi yêu cầu' }))
    expect(
      await screen.findByText(/Bạn cần đồng ý điều khoản/),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByLabelText(/Tôi xác nhận mục đích giám sát/))
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('sends the chosen result formats, delivery methods and retention', async () => {
    const create = vi.spyOn(customerApi, 'createOrder')
    await renderWizard()
    await fillService()
    await fillLocation()
    next('Kết quả bàn giao & xác nhận')
    await waitFor(() =>
      expect(screen.queryByText(/Đang tải kết quả bàn giao/)).toBeNull(),
    )
    fireEvent.click(screen.getByLabelText('Báo cáo PDF'))
    fireEvent.click(screen.getByLabelText('Email'))
    fireEvent.change(screen.getByLabelText(/Thời hạn lưu trữ dữ liệu/), {
      target: { value: '180' },
    })
    fireEvent.click(screen.getByLabelText(/Tôi xác nhận mục đích giám sát/))
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))
    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận gửi' }))
    await screen.findByText('Đã tạo yêu cầu')
    expect(create.mock.calls[0][0]).toMatchObject({
      resultFormats: ['PHOTO', 'PDF_REPORT'],
      deliveryMethods: ['DOWNLOAD', 'EMAIL'],
      dataRetentionDays: 180,
      termsAccepted: true,
    })
  })

  it('closes the confirm dialog with Escape without submitting', async () => {
    await renderWizard()
    await fillService()
    await fillLocation()
    next('Kết quả bàn giao & xác nhận')
    await waitFor(() =>
      expect(screen.queryByText(/Đang tải kết quả bàn giao/)).toBeNull(),
    )
    fireEvent.click(screen.getByLabelText(/Tôi xác nhận mục đích giám sát/))
    fireEvent.click(await screen.findByRole('button', { name: 'Gửi yêu cầu' }))
    await screen.findByRole('dialog')
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', keyCode: 27 })
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('switches step labels to English', async () => {
    await renderWizard()
    await screen.findByRole('button', { name: /Giám sát công trình/ })
    act(() => setLanguage('en'))
    expect(
      await screen.findByRole('button', {
        name: 'Continue: Location & monitoring area',
      }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/Title/)).toBeInTheDocument()
  })
})
