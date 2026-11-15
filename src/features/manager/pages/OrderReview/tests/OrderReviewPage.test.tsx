import { act } from 'react'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../../../../shared/api/httpClient'
import { setLanguage } from '../../../../../shared/i18n'
import { ordersApi } from '../../../api/ordersApi'
import { planningApi } from '../../../api/planningApi'
import { readinessApi } from '../../../api/readinessApi'
import {
  customerApi,
  type FlightAreaAssessment,
} from '../../../../customer/api/customerApi'
import { financeApi } from '../../../../finance/api'
import type { Quote } from '../../../../finance/types'
import type { OrderDetail } from '../../../types/orders'
import type { OrderReadiness } from '../../../types/readiness'
import { OrderReviewPage } from '../OrderReviewPage'

const order: OrderDetail = {
  id: 'ord-2609-0157',
  code: 'ORD-2609-0157',
  status: 'PENDING',
  customer: {
    fullName: 'Lê Quốc Bảo',
    companyName: 'Công ty CP Logistics Cát Lái',
    email: 'bao.le@logisticscatlai.vn',
    phone: '0918 227 640',
  },
  serviceName: 'Tuần tra an ninh khu vực',
  preferredDate: '25/09',
  preferredTimeName: 'Chiều',
  preferredWindow: '25/09/2026 · Chiều 13:00–17:00',
  submittedAt: '2026-09-18T08:15:00+07:00',
  addressText: 'Cảng Cát Lái, P. Cát Lái, TP. Thủ Đức',
  center: { lat: 10.7686, lon: 106.7952 },
  radiusM: 600,
  mediaRequirements: [{ label: 'VIDEO × 2 · 300 giây · 1080p' }],
  purpose: 'Tuần tra bãi container ngoài giờ',
  attachments: [],
  legalReviewStatus: 'NOT_REQUIRED',
}

// Order without design-sourced detail content (e.g. ORD-2609-0149) — every
// field beyond the evidenced queue-row data is null.
const unsourcedOrder: OrderDetail = {
  id: 'ord-2609-0149',
  code: 'ORD-2609-0149',
  status: 'PENDING',
  customer: {
    fullName: 'Nguyễn Minh Khoa',
    companyName: 'Công ty CP Xây dựng Phú Thịnh',
    email: null,
    phone: null,
  },
  serviceName: 'Tuần tra an ninh khu vực',
  preferredDate: '23/09',
  preferredTimeName: 'Chiều',
  preferredWindow: null,
  submittedAt: '2026-09-18T12:32:00+07:00',
  addressText: null,
  center: null,
  radiusM: null,
  mediaRequirements: null,
  purpose: null,
  attachments: null,
  legalReviewStatus: 'NOT_REQUIRED',
}

const quote: Quote = {
  id: 'quote',
  orderId: order.id,
  version: 1,
  status: 'DRAFT',
  packagePrice: 1000000,
  additionalAmount: 0,
  discountAmount: 0,
  adjustmentAmount: 0,
  totalAmount: 1000000,
  managerNote: null,
  approvedByName: null,
  approvedAt: null,
  acceptedAt: null,
  items: [],
}
function mockPricing() {
  vi.spyOn(financeApi, 'getPricingReview').mockResolvedValue({
    orderId: order.id,
    orderCode: order.code,
    customerName: 'Customer',
    serviceName: order.serviceName,
    basePackagePrice: 1000000,
    checklistItems: [],
    currentQuote: null,
    quoteHistory: [],
  })
  vi.spyOn(financeApi, 'saveDraft').mockResolvedValue(quote)
}

const approvableReadiness: OrderReadiness = {
  orderId: order.id,
  canApprove: true,
  recommendation: 'APPROVE',
  blockingReasons: [],
  criteria: [],
}

function mockReadiness() {
  vi.spyOn(readinessApi, 'get').mockResolvedValue(approvableReadiness)
}

function mockHappyPath() {
  mockPricing()
  mockReadiness()
  vi.spyOn(ordersApi, 'getOrder').mockResolvedValue(order)
  // Leaving the intake step of a PENDING Order starts the review first.
  vi.spyOn(ordersApi, 'startReview').mockResolvedValue(undefined as never)
}

function mockApprovedPlanning() {
  vi.mocked(ordersApi.getOrder).mockResolvedValue({
    ...order,
    status: 'APPROVED',
  })
  vi.spyOn(planningApi, 'getOrderMissions').mockResolvedValue([])
  vi.spyOn(planningApi, 'getExecutionPlan').mockResolvedValue({
    orderId: order.id,
    planStatus: 'DRAFT',
    revision: 1,
    missions: [],
    coverage: {
      total: 0,
      covered: 0,
      uncovered: 0,
      repeated: 0,
      coverageReady: true,
      uncoveredItemIds: [],
    },
    blockers: [],
  })
}

/** Moves Request -> Area check. Starting the review is async, so wait for it. */
async function openAreaStep() {
  fireEvent.click(
    await screen.findByRole('button', { name: 'Tiếp: Điều kiện duyệt' }),
  )
  await screen.findByRole('heading', { name: 'Kiểm tra vùng giám sát' })
}

/** The stepper only reopens finished steps, so walk Request -> Area -> Criteria -> Quote with the Next buttons. */
async function openPricingStep() {
  await openAreaStep()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Tiếp: Điều kiện duyệt' }),
  )
  const next = await screen.findByRole('button', {
    name: 'Tiếp: Danh mục kiểm tra & báo giá',
  })
  await waitFor(() => expect(next).toBeEnabled())
  fireEvent.click(next)
}

afterEach(() => {
  vi.restoreAllMocks()
  window.location.hash = ''
})

describe('OrderReviewPage', () => {
  it('reuses the initial exact Order read when the planning workspace mounts', async () => {
    mockHappyPath()
    mockApprovedPlanning()
    render(<OrderReviewPage orderId={order.id} />)
    await waitFor(() =>
      expect(planningApi.getExecutionPlan).toHaveBeenCalledTimes(1),
    )
    await waitFor(() =>
      expect(planningApi.getOrderMissions).toHaveBeenCalledTimes(1),
    )
    expect(ordersApi.getOrder).toHaveBeenCalledTimes(1)
  })
  it('approval stays in Order planning even when a legacy response contains a Mission identity', async () => {
    mockHappyPath()
    vi.spyOn(financeApi, 'approveQuote').mockImplementation(async () => {
      vi.mocked(ordersApi.getOrder).mockResolvedValue({
        ...order,
        status: 'APPROVED',
      })
      return { ...quote, status: 'APPROVED' }
    })
    vi.spyOn(planningApi, 'getOrderMissions').mockResolvedValue([])
    vi.spyOn(planningApi, 'getExecutionPlan').mockResolvedValue({
      orderId: order.id,
      planStatus: 'DRAFT',
      revision: 1,
      missions: [],
      coverage: {
        total: 0,
        covered: 0,
        uncovered: 0,
        repeated: 0,
        coverageReady: true,
        uncoveredItemIds: [],
      },
      blockers: [],
    })
    window.location.hash = '#portal/manager/orders/' + order.id
    render(<OrderReviewPage orderId={order.id} />)
    await openPricingStep()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Duyệt báo giá' }),
    )
    await screen.findByRole('heading', { name: /ORD-2609-0157/, level: 2 })
    expect(window.location.hash).toBe('#portal/manager/orders/' + order.id)
    expect(
      screen.queryByRole('heading', { name: 'Gán nguồn lực' }),
    ).not.toBeInTheDocument()
  })
  it.each(['APPROVED', 'IN_PROGRESS', 'COMPLETED'] as const)(
    'shows the Order code heading for %s Orders',
    async (status) => {
      mockHappyPath()
      vi.mocked(ordersApi.getOrder).mockResolvedValue({ ...order, status })
      vi.spyOn(planningApi, 'getOrderMissions').mockResolvedValue([])
      vi.spyOn(planningApi, 'getExecutionPlan').mockResolvedValue({
        orderId: order.id,
        planStatus: 'FINALIZED',
        revision: 3,
        missions: [],
        coverage: {
          total: 0,
          covered: 0,
          uncovered: 0,
          repeated: 0,
          coverageReady: true,
          uncoveredItemIds: [],
        },
        blockers: [],
      })
      render(<OrderReviewPage orderId={order.id} />)
      expect(
        await screen.findByRole('heading', {
          name: /ORD-2609-0157/,
          level: 2,
        }),
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Duyệt & lên lịch' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Từ chối' }),
      ).not.toBeInTheDocument()
      expect(screen.queryByText('Chờ duyệt')).not.toBeInTheDocument()
      expect(
        screen.queryByRole('heading', { name: 'Chi tiết đơn hàng' }),
      ).not.toBeInTheDocument()
    },
  )
  it('renders FEASIBLE order data', async () => {
    mockHappyPath()
    render(<OrderReviewPage orderId="ord-2609-0157" />)

    await waitFor(() => screen.getByText('Lê Quốc Bảo'))
    expect(screen.getByText('Lê Quốc Bảo')).toBeInTheDocument()
    expect(screen.getByText('#ORD-2609-0157')).toBeInTheDocument()
    expect(screen.getByText('Khách hàng doanh nghiệp')).toBeInTheDocument()
    expect(screen.getByText('Tiếp nhận')).toBeInTheDocument()
    expect(screen.queryByText('Tình trạng nguồn lực')).not.toBeInTheDocument()
  })

  it('shows the area address directly below the map', async () => {
    mockHappyPath()
    render(<OrderReviewPage orderId="ord-2609-0157" />)

    expect(screen.queryByText('Địa chỉ khu vực')).not.toBeInTheDocument()
    await openAreaStep()

    // The review is started (async) before the area step opens.
    expect(screen.getByText('Địa chỉ khu vực')).toBeInTheDocument()
    expect(ordersApi.startReview).toHaveBeenCalledWith(order.id)
    expect(
      within(
        document.querySelector<HTMLElement>('.odm-or-review-stage')!,
      ).getByText('Cảng Cát Lái, P. Cát Lái, TP. Thủ Đức'),
    ).toBeInTheDocument()
  })

  it('keeps the condition step usable when the ministry provider is unavailable', async () => {
    mockHappyPath()
    vi.mocked(ordersApi.getOrder).mockResolvedValue({
      ...order,
      center: { lat: 10.700001, lon: 106.700001 },
    })
    vi.spyOn(customerApi, 'getFlightAreaAssessment').mockResolvedValue({
      location: {
        latitude: 10.700001,
        longitude: 106.700001,
        radiusMeters: 600,
      },
      ministryFlightBan: {
        available: false,
        violatedZones: [],
        sourceUrl: 'https://cambay.mod.gov.vn/',
        errorCode: 'PROVIDER_UNAVAILABLE',
      },
    } as unknown as FlightAreaAssessment)

    render(<OrderReviewPage orderId="ord-2609-0157" />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Tiếp: Điều kiện duyệt' }),
    )

    expect(
      await screen.findByText('Kết quả kiểm tra khu vực'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Đối chiếu bản đồ Bộ Quốc phòng'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('Mở bản đồ cấm bay của Bộ Quốc phòng'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(
        'Không tải được kết quả kiểm tra vùng. Vui lòng thử lại.',
      ),
    ).not.toBeInTheDocument()
  })

  it('keeps the area assessment when switching steps instead of requesting it again', async () => {
    mockHappyPath()
    vi.mocked(ordersApi.getOrder).mockResolvedValue({
      ...order,
      center: { lat: 10.712345, lon: 106.612345 },
    })
    const assessmentSpy = vi
      .spyOn(customerApi, 'getFlightAreaAssessment')
      .mockResolvedValue({
        location: {
          latitude: 10.712345,
          longitude: 106.612345,
          radiusMeters: 600,
        },
        ministryFlightBan: {
          available: true,
          violatedZones: [],
          sourceUrl: 'https://cambay.mod.gov.vn/',
        },
      } as unknown as FlightAreaAssessment)
    render(<OrderReviewPage orderId="ord-2609-0157" />)

    fireEvent.click(
      await screen.findByRole('button', { name: 'Tiếp: Điều kiện duyệt' }),
    )
    await screen.findByText('Không giao với vùng cấm bay')
    // The stepper is display-only; use the Back button to return to the request.
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }))
    fireEvent.click(
      await screen.findByRole('button', { name: 'Tiếp: Điều kiện duyệt' }),
    )
    await screen.findByText('Không giao với vùng cấm bay')

    expect(assessmentSpy).toHaveBeenCalledTimes(1)
  })

  it('shows only the ministry flight-ban result for the area check', async () => {
    mockHappyPath()
    vi.spyOn(customerApi, 'getFlightAreaAssessment').mockResolvedValue({
      location: { latitude: 10.7686, longitude: 106.7952, radiusMeters: 600 },
      ministryFlightBan: {
        available: true,
        violatedZones: ['VN-P-01'],
        sourceUrl: 'https://cambay.mod.gov.vn/',
      },
    } as unknown as FlightAreaAssessment)
    render(<OrderReviewPage orderId="ord-2609-0157" />)

    fireEvent.click(
      await screen.findByRole('button', { name: 'Tiếp: Điều kiện duyệt' }),
    )
    expect(
      await screen.findByText('Cần đối chiếu vùng cấm bay'),
    ).toBeInTheDocument()
    expect(screen.getByText('VN-P-01')).toBeInTheDocument()
    expect(screen.queryByText('Độ cao mặt đất tại vị trí')).toBeNull()
    expect(screen.queryByText('Công trình trong khu vực')).toBeNull()
    expect(screen.queryByText('Rủi ro cao')).toBeNull()
  })

  it('cleans legacy raw JSON media labels before rendering', async () => {
    mockPricing()
    vi.spyOn(ordersApi, 'getOrder').mockResolvedValue({
      ...order,
      mediaRequirements: [
        {
          label:
            'Báo cáo Phân tích Nhiệt · {"radiusM":100,"quantity":10,"mediaType":"IMAGE","resolution":"4K","estimatedAreaHa":3.1}',
        },
      ],
    })
    render(<OrderReviewPage orderId="ord-2609-0157" />)

    await waitFor(() => screen.getByText('Lê Quốc Bảo'))
    expect(
      screen.getByText(
        'Báo cáo Phân tích Nhiệt · Ảnh · 10 mục · 4K · 100 m · 3.1 ha',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/\{"radiusM"/)).not.toBeInTheDocument()
  })

  it('does not repeat deliverable format in the order details', async () => {
    mockPricing()
    vi.spyOn(ordersApi, 'getOrder').mockResolvedValue({
      ...order,
      resultFormats: ['VIDEO'],
      deliverables: [
        {
          id: 'deliverable-video',
          deliverableTypeId: 'video',
          deliverableTypeName: 'Video',
          defaultFormat: 'MP4',
          requirement: {
            mediaType: 'VIDEO',
            quantity: 10,
            resolution: '4K',
          },
        },
      ],
    })
    render(<OrderReviewPage orderId="ord-2609-0157" />)

    await screen.findByText('Lê Quốc Bảo')
    expect(screen.queryByText('Định dạng kết quả')).not.toBeInTheDocument()
    expect(
      screen.getByText('Video', { selector: 'strong' }),
    ).toBeInTheDocument()
    expect(screen.getByText('10 mục · 4K')).toBeInTheDocument()
    expect(screen.queryByText('Video · 10 mục · 4K')).not.toBeInTheDocument()
  })

  it('shows a different order without obsolete analysis copy', async () => {
    mockHappyPath()
    vi.mocked(ordersApi.getOrder).mockResolvedValue({
      ...order,
      id: 'ord-2609-0160',
      code: 'ORD-2609-0160',
    })
    render(<OrderReviewPage orderId="ord-2609-0160" />)

    expect(await screen.findByText('#ORD-2609-0160')).toBeInTheDocument()
    expect(screen.queryByText('Tình trạng nguồn lực')).not.toBeInTheDocument()
    expect(ordersApi.getOrder).toHaveBeenCalledWith(
      'ord-2609-0160',
      expect.any(AbortSignal),
    )
    expect(screen.queryByText('RỦI RO')).not.toBeInTheDocument()
  })

  it('approves the quote before entering inline Order planning', async () => {
    mockHappyPath()
    const approveSpy = vi
      .spyOn(financeApi, 'approveQuote')
      .mockImplementation(async () => {
        mockApprovedPlanning()
        return { ...quote, status: 'APPROVED' }
      })
    const briefSpy = vi.spyOn(ordersApi, 'getOrderForMission')
    window.location.hash = '#portal/manager/orders/' + order.id
    render(<OrderReviewPage orderId="ord-2609-0157" />)
    await waitFor(() => screen.getByText('Lê Quốc Bảo'))
    await openPricingStep()

    fireEvent.click(
      await screen.findByRole('button', { name: 'Duyệt báo giá' }),
    )

    expect(
      await screen.findByRole('heading', {
        name: /ORD-2609-0157/,
        level: 2,
      }),
    ).toBeInTheDocument()
    expect(approveSpy).toHaveBeenCalledExactlyOnceWith(order.id, quote.id)
    expect(briefSpy).not.toHaveBeenCalled()
    expect(window.location.hash).toBe('#portal/manager/orders/' + order.id)
  })

  it('does not automatically dispatch a legacy Mission returned by approval', async () => {
    mockHappyPath()
    vi.spyOn(financeApi, 'approveQuote').mockImplementation(async () => {
      mockApprovedPlanning()
      return { ...quote, status: 'APPROVED' }
    })
    const briefSpy = vi.spyOn(ordersApi, 'getOrderForMission')
    window.location.hash = '#portal/manager/orders/' + order.id
    render(<OrderReviewPage orderId="ord-2609-0157" />)
    await waitFor(() =>
      screen.getByRole('heading', { name: 'Chi tiết đơn hàng' }),
    )
    await openPricingStep()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Duyệt báo giá' }),
    )
    expect(
      await screen.findByRole('heading', {
        name: /ORD-2609-0157/,
        level: 2,
      }),
    ).toBeInTheDocument()
    expect(window.location.hash).toBe('#portal/manager/orders/' + order.id)
    expect(
      screen.queryByRole('heading', { name: 'Gán nguồn lực' }),
    ).not.toBeInTheDocument()
    expect(briefSpy).not.toHaveBeenCalled()
  })

  it('shows the 409 error state', async () => {
    vi.spyOn(ordersApi, 'getOrder').mockRejectedValue(
      new ApiError('Đơn không còn ở trạng thái chờ duyệt', {
        status: 409,
        code: 'ORDER_NOT_UNDER_REVIEW',
        method: 'GET',
        path: '/orders/ord-2609-0157',
      }),
    )

    render(<OrderReviewPage orderId="ord-2609-0157" />)

    await waitFor(() => screen.getByText('Không tải được hồ sơ đơn'))
    expect(
      screen.getByText(/Đơn không còn ở trạng thái chờ duyệt/),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Về hàng đợi' })).toHaveAttribute(
      'href',
      '#portal/manager/orders',
    )
  })

  it('renders an order without detail source without crashing and hides absent optional details', async () => {
    mockPricing()
    mockReadiness()
    vi.spyOn(ordersApi, 'getOrder').mockResolvedValue(unsourcedOrder)
    vi.spyOn(ordersApi, 'startReview').mockResolvedValue(undefined as never)

    render(<OrderReviewPage orderId="ord-2609-0149" />)

    await waitFor(() =>
      screen.getByRole('heading', { name: 'Chi tiết đơn hàng' }),
    )
    expect(screen.getByText('Nguyễn Minh Khoa')).toBeInTheDocument()
    expect(
      screen.queryByText('Chưa có dữ liệu tệp đính kèm cho đơn này.'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Tình trạng nguồn lực')).not.toBeInTheDocument()
    expect(screen.queryByText('Không có email')).not.toBeInTheDocument()
    await openPricingStep()
    // Action bar still renders — the page didn't crash on null fields.
    expect(
      await screen.findByRole('button', { name: 'Duyệt báo giá' }),
    ).toBeInTheDocument()
  })

  it('renders English labels and the uppercase English verdict after switching language', async () => {
    mockHappyPath()
    render(<OrderReviewPage orderId="ord-2609-0157" />)
    await waitFor(() =>
      screen.getByRole('heading', { name: 'Chi tiết đơn hàng' }),
    )
    await openPricingStep()

    act(() => setLanguage('en'))

    expect(
      screen.getByRole('heading', { name: 'Order details' }),
    ).toBeInTheDocument()
  })
})
