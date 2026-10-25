import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../../../shared/api/httpClient'
import { financeApi } from '../../api'
import { ManagerPricingPanel } from '../ManagerPricingPanel'

afterEach(() => vi.restoreAllMocks())

function reviewWith(amount: number) {
  return {
    orderId: 'order-1',
    orderCode: 'ORD-1',
    customerName: 'Customer',
    serviceName: 'Site monitoring',
    basePackagePrice: 0,
    systemCalculation: {
      policyId: 'policy-1',
      policyVersion: 3,
      currency: 'VND',
      systemCalculatedAmount: amount,
      customWork: true,
      assessmentComplete: true,
      items: [
        {
          category: 'RESOURCE' as const,
          description: 'Extra requirement',
          quantity: 1,
          unitPrice: amount,
          amount,
          orderChecklistItemId: 'additional-1',
        },
      ],
    },
    checklistItems: [
      {
        id: 'additional-1',
        sourceChecklistId: null,
        content: 'Extra requirement',
        displayOrder: 1,
        sourceType: 'CUSTOMER_CUSTOM' as const,
        reviewStatus: 'ADDITIONAL' as const,
        managerNote: null,
        managerQuoteRequired: false,
        managerQuotedPrice: null,
      },
    ],
    currentQuote: null,
    quoteHistory: [],
  }
}

describe('ManagerPricingPanel', () => {
  it('shows manager-required pricing without a draft button', async () => {
    vi.spyOn(financeApi, 'getPricingReview').mockResolvedValue({
      orderId: 'order-1',
      orderCode: 'ORD-1',
      customerName: 'Customer',
      serviceName: 'Site monitoring',
      basePackagePrice: 5_000_000,
      checklistItems: [
        {
          id: 'custom-1',
          sourceChecklistId: null,
          content: 'Inspect custom structure',
          displayOrder: 1,
          sourceType: 'CUSTOMER_CUSTOM',
          reviewStatus: 'INCLUDED',
          managerNote: null,
          managerQuoteRequired: true,
          managerQuotedPrice: null,
        },
      ],
      currentQuote: null,
      quoteHistory: [],
    })
    render(<ManagerPricingPanel orderId="order-1" />)
    await screen.findByText('Inspect custom structure')
    expect(screen.getByLabelText('Giá duyệt (VND)')).toHaveValue('0')
    // Draft saving was removed: the manager only approves, and the backend reports missing prices there.
    expect(screen.queryByRole('button', { name: 'Lưu nháp' })).toBeNull()
  })

  it('does not overwrite an edited item price when another checklist mutation refetches the review', async () => {
    const review = {
      orderId: 'order-1',
      orderCode: 'ORD-1',
      customerName: 'Customer',
      serviceName: 'Site monitoring',
      basePackagePrice: 5_000_000,
      systemCalculation: {
        policyId: 'policy-1',
        policyVersion: 3,
        currency: 'VND',
        systemCalculatedAmount: 5_030_000,
        customWork: true,
        assessmentComplete: true,
        items: [
          {
            category: 'RESOURCE' as const,
            description: 'Custom work',
            quantity: 1,
            unitPrice: 30_000,
            amount: 30_000,
            orderChecklistItemId: 'additional-1',
          },
        ],
      },
      checklistItems: [
        {
          id: 'additional-1',
          sourceChecklistId: null,
          content: 'Extra requirement',
          displayOrder: 1,
          sourceType: 'CUSTOMER_CUSTOM' as const,
          reviewStatus: 'ADDITIONAL' as const,
          managerNote: null,
          managerQuoteRequired: false,
          managerQuotedPrice: null,
        },
        {
          id: 'pending-1',
          sourceChecklistId: null,
          content: 'Another requirement',
          displayOrder: 2,
          sourceType: 'CUSTOMER_CUSTOM' as const,
          reviewStatus: 'PENDING' as const,
          managerNote: null,
          managerQuoteRequired: false,
          managerQuotedPrice: null,
        },
      ],
      currentQuote: null,
      quoteHistory: [],
    }
    vi.spyOn(financeApi, 'getPricingReview').mockResolvedValue(review)
    vi.spyOn(financeApi, 'reviewChecklist').mockResolvedValue({
      ...review.checklistItems[1],
      reviewStatus: 'DUPLICATE',
    })

    render(<ManagerPricingPanel orderId="order-1" />)
    const input = await screen.findByLabelText('Giá duyệt (VND)')
    fireEvent.change(input, { target: { value: '30001' } })
    fireEvent.change(screen.getAllByLabelText('Phân loại')[1], {
      target: { value: 'DUPLICATE' },
    })

    await waitFor(() =>
      expect(financeApi.getPricingReview).toHaveBeenCalledTimes(2),
    )
    expect(screen.getByLabelText('Giá duyệt (VND)')).toHaveValue('30001')
    expect(screen.getAllByText(/\+1/).length).toBeGreaterThan(0)
  })

  it('initializes prices from the newly selected order', async () => {
    vi.spyOn(financeApi, 'getPricingReview').mockImplementation(async (id) => ({
      orderId: id,
      orderCode: id,
      customerName: 'Customer',
      serviceName: 'Site monitoring',
      basePackagePrice: 5_000_000,
      checklistItems: [
        {
          id: `${id}-item`,
          sourceChecklistId: null,
          content: `${id} requirement`,
          displayOrder: 1,
          sourceType: 'CUSTOMER_CUSTOM',
          reviewStatus: 'ADDITIONAL',
          managerNote: null,
          managerQuoteRequired: false,
          managerQuotedPrice: id === 'order-1' ? 30_000 : 45_000,
        },
      ],
      currentQuote: null,
      quoteHistory: [],
    }))

    const view = render(<ManagerPricingPanel orderId="order-1" />)
    expect(await screen.findByLabelText('Giá duyệt (VND)')).toHaveValue('30000')
    view.rerender(<ManagerPricingPanel orderId="order-2" />)
    await screen.findByText('order-2 requirement')
    expect(screen.getByLabelText('Giá duyệt (VND)')).toHaveValue('45000')
  })

  it('shows package checklist as auto-priced without a review control', async () => {
    vi.spyOn(financeApi, 'getPricingReview').mockResolvedValue({
      orderId: 'order-1',
      orderCode: 'ORD-1',
      customerName: 'Customer',
      serviceName: 'Site monitoring',
      basePackagePrice: 5_000_000,
      checklistItems: [
        {
          id: 'pending-1',
          sourceChecklistId: 'template-1',
          content: 'Requirement awaiting review',
          displayOrder: 1,
          sourceType: 'SERVICE_TEMPLATE',
          reviewStatus: 'PENDING',
          managerNote: null,
          managerQuoteRequired: false,
          managerQuotedPrice: null,
        },
      ],
      currentQuote: null,
      quoteHistory: [],
    })
    vi.spyOn(financeApi, 'reviewChecklist').mockResolvedValue({
      id: 'pending-1',
      sourceChecklistId: 'template-1',
      content: 'Requirement awaiting review',
      displayOrder: 1,
      sourceType: 'SERVICE_TEMPLATE',
      reviewStatus: 'INCLUDED',
      managerNote: null,
      managerQuoteRequired: false,
      managerQuotedPrice: null,
    })
    const onChecklistReviewChanged = vi.fn()

    render(
      <ManagerPricingPanel
        orderId="order-1"
        onChecklistReviewChanged={onChecklistReviewChanged}
      />,
    )
    await screen.findByText('Requirement awaiting review')
    expect(
      screen.queryByRole('combobox', { name: 'Phân loại' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Tự động tính giá')).toBeInTheDocument()
    expect(onChecklistReviewChanged).not.toHaveBeenCalled()
  })

  it('shows the system price and lets the manager approve a customer-added item unchanged', async () => {
    vi.spyOn(financeApi, 'getPricingReview').mockResolvedValue({
      orderId: 'order-1',
      orderCode: 'ORD-1',
      customerName: 'Customer',
      serviceName: 'Site monitoring',
      basePackagePrice: 5_000_000,
      systemCalculation: {
        policyId: 'policy-1',
        policyVersion: 3,
        currency: 'VND',
        systemCalculatedAmount: 6_300_000,
        customWork: true,
        assessmentComplete: true,
        items: [
          {
            category: 'PACKAGE',
            description: 'Site monitoring',
            quantity: 1,
            unitPrice: 5_000_000,
            amount: 5_000_000,
          },
          {
            category: 'RESOURCE',
            description: 'Custom work assessment',
            quantity: 1,
            unitPrice: 1_300_000,
            amount: 1_300_000,
            orderChecklistItemId: 'additional-1',
          },
        ],
      },
      checklistItems: [
        {
          id: 'included-1',
          sourceChecklistId: 'template-1',
          content: 'Default requirement',
          displayOrder: 1,
          sourceType: 'SERVICE_TEMPLATE',
          reviewStatus: 'INCLUDED',
          managerNote: null,
          managerQuoteRequired: true,
          managerQuotedPrice: null,
        },
        {
          id: 'additional-1',
          sourceChecklistId: null,
          content: 'Extra requirement',
          displayOrder: 2,
          sourceType: 'CUSTOMER_CUSTOM',
          reviewStatus: 'ADDITIONAL',
          managerNote: null,
          managerQuoteRequired: false,
          managerQuotedPrice: null,
        },
      ],
      currentQuote: null,
      quoteHistory: [],
    })
    const save = vi.spyOn(financeApi, 'saveDraft').mockResolvedValue({
      id: 'quote-1',
      orderId: 'order-1',
      version: 1,
      status: 'DRAFT',
      packagePrice: 5_000_000,
      additionalAmount: 1_300_000,
      discountAmount: 0,
      adjustmentAmount: 0,
      totalAmount: 6_300_000,
      managerNote: null,
      approvedByName: null,
      approvedAt: null,
      acceptedAt: null,
      items: [],
    })

    render(<ManagerPricingPanel orderId="order-1" />)
    await screen.findAllByText('Extra requirement')
    expect(screen.getByRole('button', { name: 'Duyệt báo giá' })).toBeEnabled()
    expect(screen.queryByLabelText('Giá gói (VND)')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Đánh giá công việc tùy chỉnh' }),
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText('Giá duyệt (VND)')).toHaveValue('1300000')
    // Draft saving was removed from the manager flow.
    expect(screen.queryByRole('button', { name: 'Lưu nháp' })).toBeNull()
    expect(save).not.toHaveBeenCalled()
  })

  it('reloads the prices and does not approve when the pricing policy changed under the manager', async () => {
    const load = vi
      .spyOn(financeApi, 'getPricingReview')
      .mockResolvedValueOnce(reviewWith(427_570))
      .mockResolvedValue(reviewWith(327_570))
    const save = vi.spyOn(financeApi, 'saveDraft').mockRejectedValue(
      new ApiError('stale', {
        status: 409,
        code: 'STALE_PRICING_POLICY',
        method: 'PUT',
        path: '/quotes/draft',
      }),
    )
    const approve = vi.spyOn(financeApi, 'approveQuote')

    render(<ManagerPricingPanel orderId="order-1" />)
    await screen.findAllByText('Extra requirement')
    expect(screen.getByLabelText('Giá duyệt (VND)')).toHaveValue('427570')
    fireEvent.click(screen.getByRole('button', { name: 'Duyệt báo giá' }))

    expect(
      await screen.findByText(
        /Chính sách giá vừa được cập nhật/,
        {},
        { timeout: 4000 },
      ),
    ).toBeInTheDocument()
    expect(save.mock.calls[0][1].expectedPolicyVersion).toBe(3)
    expect(approve).not.toHaveBeenCalled()
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2), {
      timeout: 4000,
    })
    await waitFor(
      () =>
        expect(screen.getByLabelText('Giá duyệt (VND)')).toHaveValue('327570'),
      { timeout: 4000 },
    )
  })

  it('shows the reason the server gives when approval is refused', async () => {
    vi.spyOn(financeApi, 'getPricingReview').mockResolvedValue(
      reviewWith(327_570),
    )
    vi.spyOn(financeApi, 'saveDraft').mockRejectedValue(
      new ApiError('Missing: Legal check', {
        status: 409,
        code: 'ORDER_REVIEW_INCOMPLETE',
        method: 'PUT',
        path: '/quotes/draft',
      }),
    )
    render(<ManagerPricingPanel orderId="order-1" />)
    await screen.findAllByText('Extra requirement')
    fireEvent.click(screen.getByRole('button', { name: 'Duyệt báo giá' }))
    expect(
      await screen.findByText(
        /Đơn chưa đủ điều kiện duyệt: Missing: Legal check/,
        {},
        { timeout: 4000 },
      ),
    ).toBeInTheDocument()
  })

  it('shows the allowed price range on the item and blocks approval while the price is outside it', async () => {
    vi.spyOn(financeApi, 'getPricingReview').mockResolvedValue({
      ...reviewWith(400_000),
      managerMaxDiscountPercent: 25,
      managerMaxMarkupPercent: 25,
    })
    const save = vi.spyOn(financeApi, 'saveDraft')
    render(<ManagerPricingPanel orderId="order-1" />)
    await screen.findAllByText('Extra requirement')
    expect(
      screen.getByText(/Được duyệt: .*300\.000.*500\.000/),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Giá duyệt (VND)'), {
      target: { value: '200000' },
    })
    expect(
      await screen.findByText(/Ngoài khoảng cho phép: .*300\.000.*500\.000/),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Duyệt báo giá' })).toBeDisabled()
    expect(save).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Giá duyệt (VND)'), {
      target: { value: '350000' },
    })
    expect(screen.queryByText(/Ngoài khoảng cho phép/)).not.toBeInTheDocument()
  })

  it('removes draft saving and blocks approval while a custom item is pending', async () => {
    vi.spyOn(financeApi, 'getPricingReview').mockResolvedValue({
      orderId: 'order-1',
      orderCode: 'ORD-1',
      customerName: 'Customer',
      serviceName: 'Site monitoring',
      basePackagePrice: 5_000_000,
      checklistItems: [
        {
          id: 'pending-1',
          sourceChecklistId: 'template-1',
          content: 'Requirement awaiting review',
          displayOrder: 1,
          sourceType: 'CUSTOMER_CUSTOM',
          reviewStatus: 'PENDING',
          managerNote: null,
          managerQuoteRequired: false,
          managerQuotedPrice: null,
        },
      ],
      currentQuote: null,
      quoteHistory: [],
    })
    vi.spyOn(financeApi, 'saveDraft').mockResolvedValue({
      id: 'quote-1',
      orderId: 'order-1',
      version: 1,
      status: 'DRAFT',
      packagePrice: 5_000_000,
      additionalAmount: 0,
      discountAmount: 0,
      adjustmentAmount: 0,
      totalAmount: 5_000_000,
      managerNote: null,
      approvedByName: null,
      approvedAt: null,
      acceptedAt: null,
      items: [],
    })
    const approve = vi.spyOn(financeApi, 'approveQuote')

    render(<ManagerPricingPanel orderId="order-1" />)

    await screen.findByText('Requirement awaiting review')
    expect(screen.getByText('0/1 nội dung đã xem xét')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Còn 1 nội dung cần chọn cách tính giá trước khi duyệt.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Duyệt báo giá' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Lưu nháp' })).toBeNull()
    expect(approve).not.toHaveBeenCalled()
  })

  it('approves pending legacy package requirements without sending a review mutation', async () => {
    vi.spyOn(financeApi, 'getPricingReview').mockResolvedValue({
      orderId: 'order-1',
      orderCode: 'ORD-1',
      customerName: 'Customer',
      serviceName: 'Site monitoring',
      basePackagePrice: 5_000_000,
      checklistItems: [
        {
          id: 'package-1',
          sourceChecklistId: 'template-1',
          content: 'Package requirement',
          displayOrder: 1,
          sourceType: 'SERVICE_TEMPLATE',
          reviewStatus: 'PENDING',
          managerNote: null,
          managerQuoteRequired: false,
          managerQuotedPrice: null,
        },
      ],
      currentQuote: null,
      quoteHistory: [],
    })
    const reviewItem = vi
      .spyOn(financeApi, 'reviewChecklist')
      .mockResolvedValue({
        id: 'package-1',
        sourceChecklistId: 'template-1',
        content: 'Package requirement',
        displayOrder: 1,
        sourceType: 'SERVICE_TEMPLATE',
        reviewStatus: 'INCLUDED',
        managerNote: null,
        managerQuoteRequired: false,
        managerQuotedPrice: null,
      })
    const draft = {
      id: 'quote-1',
      orderId: 'order-1',
      version: 1,
      status: 'DRAFT' as const,
      packagePrice: 5_000_000,
      additionalAmount: 0,
      discountAmount: 0,
      adjustmentAmount: 0,
      totalAmount: 5_000_000,
      managerNote: null,
      approvedByName: null,
      approvedAt: null,
      acceptedAt: null,
      items: [],
    }
    vi.spyOn(financeApi, 'saveDraft').mockResolvedValue(draft)
    const approve = vi.spyOn(financeApi, 'approveQuote').mockResolvedValue({
      ...draft,
      status: 'APPROVED',
    })

    render(<ManagerPricingPanel orderId="order-1" />)
    await screen.findByText('Package requirement')
    const button = screen.getByRole('button', { name: 'Duyệt báo giá' })
    expect(button).toBeEnabled()
    fireEvent.click(button)

    await screen.findByText(/Duyệt báo giá thành công/)
    expect(reviewItem).not.toHaveBeenCalled()
    expect(approve).toHaveBeenCalledTimes(1)
  })

  it('shows success and locks the approval button immediately after approval', async () => {
    const review = {
      orderId: 'order-1',
      orderCode: 'ORD-1',
      customerName: 'Customer',
      serviceName: 'Site monitoring',
      basePackagePrice: 5_000_000,
      checklistItems: [
        {
          id: 'included-1',
          sourceChecklistId: 'template-1',
          content: 'Default requirement',
          displayOrder: 1,
          sourceType: 'SERVICE_TEMPLATE' as const,
          reviewStatus: 'INCLUDED' as const,
          managerNote: null,
          managerQuoteRequired: false,
          managerQuotedPrice: null,
        },
      ],
      currentQuote: null,
      quoteHistory: [],
    }
    const draft = {
      id: 'quote-1',
      orderId: 'order-1',
      version: 1,
      status: 'DRAFT' as const,
      packagePrice: 5_000_000,
      additionalAmount: 0,
      discountAmount: 0,
      adjustmentAmount: 0,
      totalAmount: 5_000_000,
      managerNote: null,
      approvedByName: null,
      approvedAt: null,
      acceptedAt: null,
      items: [],
    }
    vi.spyOn(financeApi, 'getPricingReview').mockResolvedValue(review)
    vi.spyOn(financeApi, 'saveDraft').mockResolvedValue(draft)
    const approve = vi.spyOn(financeApi, 'approveQuote').mockResolvedValue({
      ...draft,
      status: 'APPROVED',
    })

    render(<ManagerPricingPanel orderId="order-1" />)
    await screen.findByText('Default requirement')
    fireEvent.click(screen.getByRole('button', { name: 'Duyệt báo giá' }))

    expect(
      await screen.findByText(
        'Duyệt báo giá thành công. Báo giá đã sẵn sàng để khách hàng chấp nhận.',
      ),
    ).toBeInTheDocument()
    const approvedButton = screen.getByRole('button', {
      name: 'Đã duyệt thành công',
    })
    expect(approvedButton).toBeDisabled()

    fireEvent.click(approvedButton)
    expect(approve).toHaveBeenCalledTimes(1)
  })
})
