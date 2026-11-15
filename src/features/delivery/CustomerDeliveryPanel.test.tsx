import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setLanguage } from '../../shared/i18n'
import { deliveryApi } from './api'
import { financeApi } from '../finance/api'
import { env } from '../../config/env'
import { CustomerDeliveryPanel } from './CustomerDeliveryPanel'
import type { Delivery } from './types'

const reviewRound = {
  reviewRoundId: 'round-1',
  roundNumber: 1,
  roundVersion: 3,
  publishedAt: '2026-10-30T03:00:00Z',
  checklistRevision: 1,
  canSubmitRevision: true,
  canAcceptResult: true,
  blockedReason: null,
  existingRequest: null,
  page: 0,
  size: 100,
  totalItems: 1,
  items: [
    {
      roundItemId: 'item-1',
      orderChecklistItemId: 'check-1',
      title: 'Roof inspection',
      description: null,
      executionSteps: [],
      inputRequirements: [],
      expectedOutputs: [],
      missionId: null,
      missionCode: null,
      evidence: [],
    },
  ],
}

const pending: Delivery = {
  orderId: 'o1',
  deliveryStatus: 'FINAL_PAYMENT_PENDING',
  missionStatus: 'COMPLETED',
  orderStatus: 'PROCESSING',
  invoiceStatus: 'PARTIALLY_PAID',
  totalAmount: 1000,
  paidAmount: 300,
  remainingAmount: 700,
  deliveryNotes: null,
  previewReleasedAt: '2026-10-30T03:00:00Z',
  customerAcceptedAt: '2026-10-30T03:01:00Z',
  revisionRequestedAt: null,
  revisionReason: null,
  revisionCount: 0,
  finalPaymentConfirmedAt: null,
  originalsReleasedAt: null,
  assets: [],
}

const delivery: Delivery = {
  orderId: 'order-1',
  deliveryStatus: 'PROCESSING',
  missionStatus: 'IN_PROGRESS',
  orderStatus: 'COMPLETED',
  invoiceStatus: 'ISSUED',
  totalAmount: 1000,
  paidAmount: 0,
  remainingAmount: 1000,
  deliveryNotes: null,
  previewReleasedAt: null,
  customerAcceptedAt: null,
  revisionRequestedAt: null,
  revisionReason: null,
  revisionCount: 0,
  finalPaymentConfirmedAt: null,
  originalsReleasedAt: null,
  assets: [],
}

beforeEach(() => {
  vi.spyOn(deliveryApi, 'missionDeliveries').mockResolvedValue([])
  setLanguage('vi')
  vi.spyOn(deliveryApi, 'get').mockResolvedValue(pending)
  vi.spyOn(deliveryApi, 'previews').mockResolvedValue(pending)
})

afterEach(() => {
  vi.restoreAllMocks()
  setLanguage('vi')
})

describe('Customer delivery payment placement', () => {
  it('keeps the order summary independent from the Mission selected for review', async () => {
    vi.mocked(deliveryApi.missionDeliveries).mockResolvedValue([
      {
        missionId: 'mission-a',
        missionCode: 'MS-A',
        status: 'FINAL_PAYMENT_PENDING',
      },
      { missionId: 'mission-b', missionCode: 'MS-B', status: 'PROCESSING' },
    ])
    vi.mocked(deliveryApi.get).mockImplementation(
      async (_orderId, _signal, missionId) => (missionId ? pending : delivery),
    )
    const onStateChange = vi.fn()
    render(<CustomerDeliveryPanel orderId="o1" onStateChange={onStateChange} />)
    await waitFor(() =>
      expect(onStateChange).toHaveBeenCalledWith(delivery, 'ready'),
    )
    expect(deliveryApi.get).toHaveBeenCalledWith('o1', undefined, 'mission-a')
    expect(onStateChange).not.toHaveBeenCalledWith(pending, 'ready')
    fireEvent.click(screen.getByRole('tab', { name: 'MS-B' }))
    await waitFor(() =>
      expect(deliveryApi.get).toHaveBeenCalledWith(
        'o1',
        undefined,
        'mission-b',
      ),
    )
  })

  it('keeps result acceptance available without a payment prompt', async () => {
    const review = { ...pending, deliveryStatus: 'CUSTOMER_REVIEW' as const }
    vi.mocked(deliveryApi.get).mockResolvedValue(review)
    vi.mocked(deliveryApi.previews).mockResolvedValue(review)
    vi.spyOn(deliveryApi, 'getResultReview').mockResolvedValue({
      reviewRoundId: 'round-1',
      roundNumber: 1,
      roundVersion: 3,
      publishedAt: '2026-10-30T03:00:00Z',
      checklistRevision: 1,
      canSubmitRevision: true,
      canAcceptResult: true,
      blockedReason: null,
      existingRequest: null,
      page: 0,
      size: 50,
      totalItems: 1,
      items: [
        {
          roundItemId: 'item-1',
          orderChecklistItemId: 'check-1',
          title: 'Roof inspection',
          description: 'Inspect roof condition',
          executionSteps: [],
          inputRequirements: [],
          expectedOutputs: [],
          missionId: null,
          missionCode: null,
          evidence: [],
        },
      ],
    })
    render(<CustomerDeliveryPanel orderId="o1" />)
    await screen.findByRole('button', { name: 'Chấp nhận toàn bộ kết quả' })
    expect(
      screen.queryByRole('button', { name: /thanh toán|VNPAY/i }),
    ).not.toBeInTheDocument()
  })

  it('shows accepted results without offering another payment', async () => {
    setLanguage('en')
    const accepted = {
      ...pending,
      deliveryStatus: 'READY_FOR_DELIVERY' as const,
      invoiceStatus: 'PAID',
      paidAmount: 1000,
      remainingAmount: 0,
    }
    vi.mocked(deliveryApi.get).mockResolvedValue(accepted)
    vi.mocked(deliveryApi.previews).mockResolvedValue(accepted)
    render(<CustomerDeliveryPanel orderId="o1" />)

    expect(
      await screen.findByText(
        'Original files become available to download after full payment and resolution of all revision items.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /pay|VNPAY/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Accept all results' }),
    ).not.toBeInTheDocument()
  })

  it('keeps legacy accepted results free of payment prompts', async () => {
    setLanguage('en')
    render(<CustomerDeliveryPanel orderId="o1" />)
    expect(
      await screen.findByText(
        'Original files become available to download after full payment and resolution of all revision items.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /pay|VNPAY/i }),
    ).not.toBeInTheDocument()
  })
})

describe('CustomerDeliveryPanel', () => {
  it('loads originals immediately after fully paid acceptance returns DELIVERED', async () => {
    setLanguage('en')
    const review = {
      ...pending,
      deliveryStatus: 'CUSTOMER_REVIEW' as const,
      paidAmount: 1000,
      remainingAmount: 0,
    }
    const delivered = {
      ...review,
      deliveryStatus: 'DELIVERED' as const,
      assets: [
        {
          id: 'original',
          type: 'IMAGE',
          fileName: 'roof.jpg',
          size: 100,
          url: 'https://example.test/original',
          urlExpiresAt: '',
          downloadable: true,
        },
      ],
    }
    vi.mocked(deliveryApi.get).mockResolvedValue(review)
    vi.mocked(deliveryApi.previews).mockResolvedValue(review)
    vi.spyOn(deliveryApi, 'getResultReview').mockResolvedValue(reviewRound)
    const originals = vi
      .spyOn(deliveryApi, 'originals')
      .mockResolvedValue(delivered)
    vi.spyOn(deliveryApi, 'accept').mockImplementation(async () => {
      vi.mocked(deliveryApi.get).mockResolvedValue(delivered)
      return delivered
    })
    render(<CustomerDeliveryPanel orderId="o1" />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Accept all results' }),
    )
    fireEvent.click(
      await screen.findByRole('button', { name: 'Confirm and send' }),
    )
    await waitFor(() =>
      expect(originals).toHaveBeenCalledWith('o1', undefined, undefined),
    )
    expect(
      await screen.findByRole('button', { name: /Download/ }),
    ).toBeEnabled()
    expect(
      screen.queryByRole('button', { name: 'Accept all results' }),
    ).toBeNull()
  })

  it('shows one success notification and a compact persistent ticket status after submitting', async () => {
    setLanguage('en')
    const review = { ...pending, deliveryStatus: 'CUSTOMER_REVIEW' as const }
    const revision = {
      ...pending,
      deliveryStatus: 'REVISION_REQUESTED' as const,
    }
    vi.mocked(deliveryApi.get).mockResolvedValue(review)
    vi.mocked(deliveryApi.previews).mockResolvedValue(review)
    vi.spyOn(deliveryApi, 'getResultReview').mockResolvedValue(reviewRound)
    vi.spyOn(deliveryApi, 'requestRevision').mockImplementation(async () => {
      vi.mocked(deliveryApi.get).mockResolvedValue(revision)
      vi.mocked(deliveryApi.previews).mockResolvedValue(revision)
      return {
        revisionRequestId: 'request-1',
        ticketId: 'ticket-1',
        ticketCode: 'TKT-1',
        reviewRoundId: 'round-1',
        submittedAt: '2026-10-30T04:00:00Z',
        deliveryStatus: 'REVISION_REQUESTED',
      }
    })
    render(<CustomerDeliveryPanel orderId="o1" />)
    fireEvent.click(await screen.findByRole('tab', { name: /Roof inspection/ }))
    fireEvent.click(
      await screen.findByRole('checkbox', {
        name: 'Request a revision for this checklist item',
      }),
    )
    fireEvent.change(
      screen.getByLabelText('Note for this checklist item (required)'),
      { target: { value: 'Missing images.' } },
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Send revision request' }),
    )
    fireEvent.click(
      await screen.findByRole('button', { name: 'Confirm and send' }),
    )
    await screen.findByText('Awaiting manager review')
    const panel = document.getElementById('customer-delivery-panel')!
    expect(
      await within(panel).findByRole('link', { name: 'View ticket TKT-1' }),
    ).toHaveAttribute('href', '#help/tickets/ticket-1')
    await waitFor(() =>
      expect(
        document.querySelectorAll(
          '.ant-notification-topRight .ant-notification-notice',
        ),
      ).toHaveLength(1),
    )
    expect(
      panel.querySelector('.ant-alert-success, .ant-alert-warning'),
    ).toBeNull()
  })

  it('restores the ticket shortcut after reload without showing another success notification', async () => {
    setLanguage('en')
    const revision = {
      ...pending,
      deliveryStatus: 'REVISION_REQUESTED' as const,
    }
    vi.mocked(deliveryApi.get).mockResolvedValue(revision)
    vi.mocked(deliveryApi.previews).mockResolvedValue(revision)
    vi.spyOn(deliveryApi, 'getResultReview').mockResolvedValue({
      ...reviewRound,
      existingRequest: {
        revisionRequestId: 'request-1',
        ticketId: 'ticket-1',
        ticketCode: 'TKT-1',
      },
    })
    render(<CustomerDeliveryPanel orderId="o1" />)
    expect(
      await screen.findByRole('link', { name: 'View ticket TKT-1' }),
    ).toHaveAttribute('href', '#help/tickets/ticket-1')
    expect(document.querySelector('.ant-notification-notice')).toBeNull()
  })

  it('shows a retryable error and recovers to a clear empty-assets state', async () => {
    setLanguage('vi')
    const getDelivery = vi
      .spyOn(deliveryApi, 'get')
      .mockRejectedValueOnce(new Error('Mất kết nối'))
      .mockResolvedValue(delivery)

    render(<CustomerDeliveryPanel orderId="order-1" />)

    expect(await screen.findByText('Mất kết nối')).toBeInTheDocument()
    screen.getByRole('button', { name: 'Thử lại' }).click()

    expect(
      await screen.findByText('Chưa có tệp kết quả được gửi ở bước này.'),
    ).toBeInTheDocument()
    expect(getDelivery).toHaveBeenCalledTimes(2)
  })

  it('shows an inline mission payment card when accepted results are locked and opens checkout directly', async () => {
    setLanguage('vi')
    const lockedDelivery: Delivery = {
      ...pending,
      deliveryStatus: 'DELIVERED',
      assets: [
        {
          id: 'asset-1',
          type: 'IMAGE',
          fileName: 'site-1.jpg',
          size: 54_000,
          url: null,
          urlExpiresAt: null,
          previewUrl: 'https://cdn.example.com/site-1-preview.jpg',
          thumbnailUrl: 'https://cdn.example.com/site-1-thumb.jpg',
          previewStatus: 'READY',
          downloadable: false,
        },
      ],
    }
    vi.mocked(deliveryApi.get).mockResolvedValue(lockedDelivery)
    vi.spyOn(deliveryApi, 'originals').mockResolvedValue(lockedDelivery)
    vi.spyOn(
      financeApi,
      'getCustomerMissionPaymentAllocations',
    ).mockResolvedValue({
      invoiceId: 'inv-1',
      allocationTargetAmount: 1_785_000,
      allocatedAmount: 1_785_000,
      allocationComplete: true,
      milestones: [
        {
          id: 'milestone-1',
          missionId: 'mission-1',
          missionCode: 'MS-86576',
          scopeLabel: 'Toàn bộ phạm vi đơn hàng',
          amount: 1_785_000,
          currency: 'VND',
          status: 'UNPAID',
          handedOverAt: '2026-11-15T09:50:09Z',
          paymentExpiresAt: '2026-11-16T09:50:09Z',
          payments: [],
        },
      ],
    })
    const createMissionPayment = vi
      .spyOn(financeApi, 'createMissionPayment')
      .mockResolvedValue({
        id: 'pay-1',
        invoiceId: 'inv-1',
        paymentCode: 1001,
        missionPaymentMilestoneId: 'milestone-1',
        type: 'MISSION_PAYMENT',
        amount: 1_785_000,
        currency: 'VND',
        provider: 'VNPAY',
        status: 'PENDING',
        transactionReference: 'REF-1',
        providerTransactionId: null,
        paymentUrl: null,
        paidAt: null,
      })
    const onOpenFinance = vi.fn()

    render(
      <CustomerDeliveryPanel orderId="o1" onOpenFinance={onOpenFinance} />,
    )

    expect(
      await screen.findByText('Đã duyệt kết quả — thanh toán để tải bản gốc'),
    ).toBeInTheDocument()
    expect(screen.getByText('MS-86576')).toBeInTheDocument()

    const payButton = screen.getByRole('button', {
      name: /Thanh toán 1\.785\.000/i,
    })
    fireEvent.click(payButton)
    await waitFor(() =>
      expect(createMissionPayment).toHaveBeenCalledWith('milestone-1'),
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Xem hóa đơn & lịch sử' }),
    )
    expect(onOpenFinance).toHaveBeenCalledTimes(1)
  })

  it('unlocks original downloads in-place after quick mission payment succeeds', async () => {
    setLanguage('vi')
    vi.spyOn(env, 'testPaymentsEnabled', 'get').mockReturnValue(true)
    const lockedDelivery: Delivery = {
      ...pending,
      deliveryStatus: 'DELIVERED',
      assets: [
        {
          id: 'asset-1',
          type: 'IMAGE',
          fileName: 'site-1.jpg',
          size: 54_000,
          url: null,
          urlExpiresAt: null,
          previewUrl: 'https://cdn.example.com/site-1-preview.jpg',
          thumbnailUrl: 'https://cdn.example.com/site-1-thumb.jpg',
          previewStatus: 'READY',
          downloadable: false,
        },
      ],
    }
    const unlockedDelivery: Delivery = {
      ...lockedDelivery,
      invoiceStatus: 'PAID',
      paidAmount: 1000,
      remainingAmount: 0,
      assets: [
        {
          ...lockedDelivery.assets[0],
          url: 'https://cdn.example.com/site-1-original.jpg',
          downloadable: true,
        },
      ],
    }
    vi.mocked(deliveryApi.get).mockResolvedValue(lockedDelivery)
    const originalsMock = vi
      .spyOn(deliveryApi, 'originals')
      .mockResolvedValue(lockedDelivery)
    const allocationsMock = vi
      .spyOn(financeApi, 'getCustomerMissionPaymentAllocations')
      .mockResolvedValue({
        invoiceId: 'inv-1',
        allocationTargetAmount: 1_785_000,
        allocatedAmount: 1_785_000,
        allocationComplete: true,
        milestones: [
          {
            id: 'milestone-1',
            missionId: 'mission-1',
            missionCode: 'MS-86576',
            scopeLabel: 'Toàn bộ phạm vi đơn hàng',
            amount: 1_785_000,
            currency: 'VND',
            status: 'UNPAID',
            handedOverAt: '2026-11-15T09:50:09Z',
            paymentExpiresAt: null,
            payments: [],
          },
        ],
      })
    const completeTestMissionPayment = vi
      .spyOn(financeApi, 'completeTestMissionPayment')
      .mockImplementation(async () => {
        vi.mocked(deliveryApi.get).mockResolvedValue(unlockedDelivery)
        originalsMock.mockResolvedValue(unlockedDelivery)
        allocationsMock.mockResolvedValue({
          invoiceId: 'inv-1',
          allocationTargetAmount: 1_785_000,
          allocatedAmount: 1_785_000,
          allocationComplete: true,
          milestones: [
            {
              id: 'milestone-1',
              missionId: 'mission-1',
              missionCode: 'MS-86576',
              scopeLabel: 'Toàn bộ phạm vi đơn hàng',
              amount: 1_785_000,
              currency: 'VND',
              status: 'PAID',
              handedOverAt: '2026-11-15T09:50:09Z',
              paymentExpiresAt: null,
              payments: [],
            },
          ],
        })
        return {
          id: 'pay-test-1',
          invoiceId: 'inv-1',
          paymentCode: 1002,
          missionPaymentMilestoneId: 'milestone-1',
          type: 'MISSION_PAYMENT',
          amount: 1_785_000,
          currency: 'VND',
          provider: 'VNPAY',
          status: 'SUCCESS',
          transactionReference: 'TEST-1',
          providerTransactionId: null,
          paymentUrl: null,
          paidAt: '2026-11-15T09:52:00Z',
        }
      })
    const onPaymentCompleted = vi.fn()

    render(
      <CustomerDeliveryPanel
        orderId="o1"
        onPaymentCompleted={onPaymentCompleted}
      />,
    )

    const quickPay = await screen.findByRole('button', {
      name: 'Thanh toán nhanh (Test)',
    })
    fireEvent.click(quickPay)

    await waitFor(() =>
      expect(completeTestMissionPayment).toHaveBeenCalledWith('milestone-1'),
    )
    expect(
      await screen.findByRole('button', { name: 'Tải bản gốc' }),
    ).toBeInTheDocument()
    expect(onPaymentCompleted).toHaveBeenCalledTimes(1)
  })
})
