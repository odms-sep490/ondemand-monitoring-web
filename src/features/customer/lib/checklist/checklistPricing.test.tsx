import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../../shared/api/httpClient'
import {
  checklistPricingApi,
  type ServicePricePreview,
} from '../../../../shared/api/checklistPricingApi'
import { setLanguage } from '../../../../shared/i18n'
import { customerApi } from '../../api/customerApi'
import { ChecklistEditor } from '../../components/checklist/ChecklistEditor'
import { ChecklistQuoteCard } from '../../components/checklist/ChecklistQuoteCard'
import { ChecklistSnapshotCard } from '../../components/checklist/ChecklistSnapshotCard'
import { useOrderChecklist } from './useOrderChecklist'
import { useChecklistQuote } from './useChecklistQuote'
import { extraMedia, usesMedia } from './types'
import type { ServiceChecklistItem } from './types'

const item = (
  patch: Partial<ServiceChecklistItem> & { id: string; checklistId: string },
): ServiceChecklistItem => ({
  serviceId: 'A',
  content: patch.id,
  displayOrder: 0,
  checklistVersion: 2,
  serviceActive: true,
  checklistActive: true,
  ...patch,
})
const template = (): ServiceChecklistItem[] => [
  item({
    id: 'roof',
    checklistId: 'c-roof',
    content: 'Kiểm tra mái',
    displayOrder: 0,
    includedImageCount: 10,
    includedVideoCount: 1,
  }),
  item({
    id: 'wall',
    checklistId: 'c-wall',
    content: 'Kiểm tra tường',
    displayOrder: 1,
  }),
  item({
    id: 'exit',
    checklistId: 'c-exit',
    content: 'Lối thoát hiểm',
    displayOrder: 2,
    includedImageCount: 2,
    required: true,
  }),
]
const preview: ServicePricePreview = {
  serviceId: 'A',
  serviceName: 'A',
  currency: 'VND',
  policyId: 'p',
  policyVersion: 3,
  draftPolicy: false,
  priceSource: 'CHECKLISTS',
  packageFee: 0,
  checklistSubtotal: 540_000,
  total: 540_000,
  complete: true,
  warnings: [],
  quotePending: false,
  checklists: [
    {
      checklistId: 'c-roof',
      content: 'Kiểm tra mái',
      pricingProfile: 'STANDARD',
      custom: false,
      includedImageCount: 10,
      includedVideoCount: 1,
      requestedImageCount: 30,
      requestedVideoCount: 3,
      extraImageCount: 20,
      extraVideoCount: 2,
      standardVideoDurationSeconds: null,
      subtotal: 540_000,
      lines: [
        {
          component: 'EXTRA_IMAGE',
          category: 'MEDIA',
          description: 'Phần ảnh bổ sung: 10 (từ 0 đến 10, mỗi khối 10)',
          quantity: 1,
          unitPrice: 50_000,
          amount: 50_000,
          tierFrom: 0,
          tierTo: 10,
          blockSize: 10,
          rounding: 'CEILING',
        },
      ],
      quotePending: false,
    },
  ],
}

beforeEach(() => setLanguage('vi'))
afterEach(() => vi.restoreAllMocks())

async function ready() {
  vi.spyOn(customerApi, 'getServiceChecklist').mockResolvedValue(template())
  const hook = renderHook(() => useOrderChecklist('A'))
  await waitFor(() => expect(hook.result.current.status).toBe('ready'))
  return hook
}

describe('Customer checklist media quantities', () => {
  it('starts every row at the included allowance and flags mandatory rows', async () => {
    const { result } = await ready()
    const [roof, wall, exit] = result.current.rows
    expect([roof.requestedImageCount, roof.requestedVideoCount]).toEqual([
      10, 1,
    ])
    expect([wall.requestedImageCount, wall.requestedVideoCount]).toEqual([0, 0])
    expect(exit.mandatory).toBe(true)
    expect(roof.mandatory).toBe(false)
    expect(extraMedia(30, 10)).toBe(20)
    expect(extraMedia(3, 10)).toBe(0)
  })

  it('sends requested counts for media rows and the legacy evidence fields otherwise', async () => {
    const { result } = await ready()
    act(() =>
      result.current.change('roof', {
        requestedImageCount: 30,
        requestedVideoCount: 3,
      }),
    )
    const [roof, wall, exit] = result.current.serialize()
    expect(roof).toEqual({
      sourceChecklistId: 'c-roof',
      expectedChecklistVersion: 2,
      requestedImageCount: 30,
      requestedVideoCount: 3,
    })
    expect(roof).not.toHaveProperty('minimumEvidenceCount')
    expect(wall).toEqual({
      sourceChecklistId: 'c-wall',
      expectedChecklistVersion: 2,
      minimumEvidenceCount: 1,
      requiredEvidenceType: 'IMAGE',
    })
    expect(exit).toMatchObject({
      requestedImageCount: 2,
      requestedVideoCount: 0,
    })
  })

  it('never serialises a price, amount or total', async () => {
    const { result } = await ready()
    act(() => result.current.add())
    const key = result.current.rows.at(-1)!.key
    act(() =>
      result.current.change(key, {
        content: 'Tự thêm',
        requestedImageCount: 4,
      }),
    )
    const serialized = JSON.stringify(result.current.serialize())
    expect(serialized).not.toMatch(/price|amount|total|cost/i)
    expect(result.current.serialize().at(-1)).toEqual({
      contentOverride: 'Tự thêm',
      requestedImageCount: 4,
      requestedVideoCount: 0,
    })
  })

  it('treats a row as media-priced as soon as the customer asks for media', async () => {
    const { result } = await ready()
    const wall = result.current.rows[1]
    expect(usesMedia(wall)).toBe(false)
    act(() => result.current.change('wall', { requestedVideoCount: 1 }))
    expect(usesMedia(result.current.rows[1])).toBe(true)
  })

  it('rejects a row with an allowance but no requested media', async () => {
    const { result } = await ready()
    act(() =>
      result.current.change('roof', {
        requestedImageCount: 0,
        requestedVideoCount: 0,
      }),
    )
    expect(result.current.valid).toBe(false)
    expect(result.current.validation).toContain(
      'ít nhất một ảnh hoặc một video',
    )
  })

  it.each([-1, 501, 1.5])('rejects the media count %s', async (value) => {
    const { result } = await ready()
    act(() => result.current.change('roof', { requestedImageCount: value }))
    expect(result.current.valid).toBe(false)
    expect(result.current.validation).toContain('0 đến 500')
  })

  it('only sends the selected rows to the quote', async () => {
    const { result } = await ready()
    act(() => result.current.change('wall', { selected: false }))
    expect(result.current.quoteItems()).toEqual([
      {
        sourceChecklistId: 'c-roof',
        requestedImageCount: 10,
        requestedVideoCount: 1,
      },
      {
        sourceChecklistId: 'c-exit',
        requestedImageCount: 2,
        requestedVideoCount: 0,
      },
    ])
  })

  it('has no quote while the form is invalid', async () => {
    const { result } = await ready()
    act(() => result.current.change('roof', { content: '   ' }))
    expect(result.current.quoteItems()).toBeNull()
  })
})

describe('ChecklistEditor media inputs', () => {
  it('shows included, requested and extra media and cannot drop a mandatory row', async () => {
    vi.spyOn(customerApi, 'getServiceChecklist').mockResolvedValue(template())
    function Harness() {
      const checklist = useOrderChecklist('A')
      return <ChecklistEditor checklist={checklist} />
    }
    render(<Harness />)
    await screen.findByDisplayValue('Kiểm tra mái')
    expect(
      screen.getAllByText(
        /Đã bao gồm: 10 ảnh · 1 video · Bổ sung: 0 ảnh · 0 video/,
      ).length,
    ).toBeGreaterThan(0)
    fireEvent.change(screen.getByLabelText('Số ảnh tối thiểu 1'), {
      target: { value: '30' },
    })
    expect(
      await screen.findByText(/Bổ sung: 20 ảnh · 0 video/),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText(/Chọn|select/i, { selector: '[disabled]' }),
    ).toBeDisabled()
    expect(screen.getByText('Bắt buộc')).toBeInTheDocument()
  })
})

describe('ChecklistQuoteCard', () => {
  it('asks the backend for the price using choices and quantities only', async () => {
    const quote = vi
      .spyOn(checklistPricingApi, 'customerQuote')
      .mockResolvedValue(preview)
    const hook = renderHook(() =>
      useChecklistQuote('A', [
        {
          sourceChecklistId: 'c-roof',
          requestedImageCount: 30,
          requestedVideoCount: 3,
        },
      ]),
    )
    await waitFor(() => expect(hook.result.current.preview).toEqual(preview))
    render(<ChecklistQuoteCard quote={hook.result.current} />)
    expect(await screen.findByText(/Phần ảnh bổ sung/)).toBeInTheDocument()
    expect(screen.getByText(/Bổ sung: 20 ảnh · 2 video/)).toBeInTheDocument()
    expect(screen.getAllByText(/540\.000/).length).toBeGreaterThan(0)
    expect(quote).toHaveBeenCalledWith(
      'A',
      [
        {
          sourceChecklistId: 'c-roof',
          requestedImageCount: 30,
          requestedVideoCount: 3,
        },
      ],
      expect.any(AbortSignal),
    )
  })

  it('does not call the backend while the form is incomplete', async () => {
    const quote = vi.spyOn(checklistPricingApi, 'customerQuote')
    renderHook(() => useChecklistQuote('A', null))
    await new Promise((resolve) => setTimeout(resolve, 600))
    expect(quote).not.toHaveBeenCalled()
  })

  it('recalculates through the backend when VIDEO is selected or removed', async () => {
    const quote = vi.spyOn(checklistPricingApi, 'customerQuote').mockResolvedValue(preview)
    const hook = renderHook(
      ({ resultFormats }) =>
        useChecklistQuote('A', [{ sourceChecklistId: 'c-roof' }], {
          resultFormats,
        }),
      { initialProps: { resultFormats: [] as string[] } },
    )
    await waitFor(() => expect(quote).toHaveBeenCalledTimes(1))

    hook.rerender({ resultFormats: ['VIDEO'] })
    await waitFor(() => expect(quote).toHaveBeenCalledTimes(2))
    expect(quote).toHaveBeenLastCalledWith(
      'A',
      [{ sourceChecklistId: 'c-roof' }],
      expect.any(AbortSignal),
      { resultFormats: ['VIDEO'] },
    )

    hook.rerender({ resultFormats: [] })
    await waitFor(() => expect(quote).toHaveBeenCalledTimes(3))
    expect(quote).toHaveBeenLastCalledWith(
      'A',
      [{ sourceChecklistId: 'c-roof' }],
      expect.any(AbortSignal),
      { resultFormats: [] },
    )
  })

  it('shows the backend message when media pricing is not configured', async () => {
    vi.spyOn(checklistPricingApi, 'customerQuote').mockRejectedValue(
      new ApiError('Media pricing backend message', {
        status: 409,
        code: 'MEDIA_PRICING_NOT_CONFIGURED',
        method: 'POST',
        path: '/api/pricing/checklist-quote',
      }),
    )
    const hook = renderHook(() =>
      useChecklistQuote('A', [{ content: 'Tự thêm' }]),
    )
    await waitFor(() => expect(hook.result.current.error).not.toBeNull())
    render(<ChecklistQuoteCard quote={hook.result.current} />)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Media pricing backend message',
    )
    expect(screen.queryByText(/0\s?₫/)).toBeNull()
  })
})

describe('ChecklistSnapshotCard', () => {
  it('shows the frozen requested and included media of a V3 snapshot', () => {
    render(
      <ChecklistSnapshotCard
        items={[
          {
            id: 's1',
            sourceChecklistId: 'c-roof',
            content: 'Kiểm tra mái',
            displayOrder: 0,
            sourceType: 'SERVICE_TEMPLATE',
            evidencePolicyVersion: 3,
            requestedImageCount: 30,
            requestedVideoCount: 3,
            includedImageCountSnapshot: 10,
            includedVideoCountSnapshot: 1,
          },
        ]}
      />,
    )
    expect(screen.getByText(/Số ảnh yêu cầu: 30/)).toBeInTheDocument()
    expect(screen.getByText(/Số video yêu cầu: 3/)).toBeInTheDocument()
    expect(screen.getByText(/Đã bao gồm: 10 ảnh · 1 video/)).toBeInTheDocument()
  })

  it('shows no amount while a customer-added checklist awaits manager pricing', () => {
    render(
      <ChecklistSnapshotCard
        items={[
          {
            id: 'custom-1',
            sourceChecklistId: null,
            content: 'Kiểm tra mái phía sau',
            displayOrder: 0,
            sourceType: 'CUSTOMER_CUSTOM',
            pricingStatus: 'NEEDS_MANAGER_REVIEW',
            priceAvailable: false,
            approvedPrice: null,
          },
        ]}
      />,
    )
    expect(
      screen.getByText('Đang chờ quản lý xem xét giá.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/880.000/)).not.toBeInTheDocument()
  })

  it('shows only the approved additional-service price', () => {
    render(
      <ChecklistSnapshotCard
        items={[
          {
            id: 'custom-1',
            sourceChecklistId: null,
            content: 'Kiểm tra mái phía sau',
            displayOrder: 0,
            sourceType: 'CUSTOMER_CUSTOM',
            pricingStatus: 'ADJUSTED_AND_APPROVED',
            priceAvailable: true,
            approvedPrice: 800_000,
          },
        ]}
      />,
    )
    expect(screen.getByText(/Dịch vụ bổ sung: 800.000/)).toBeInTheDocument()
    expect(screen.queryByText(/880.000/)).not.toBeInTheDocument()
  })
})

describe('Cost shown where the customer chooses', () => {
  it('puts the price on each selected row and folds the explanation away', async () => {
    vi.spyOn(customerApi, 'getServiceChecklist').mockResolvedValue(template())
    vi.spyOn(checklistPricingApi, 'customerQuote').mockResolvedValue(preview)
    function Harness() {
      const checklist = useOrderChecklist('A')
      return <ChecklistEditor variant="compact" quote checklist={checklist} />
    }
    const { container } = render(<Harness />)
    // The price of the roof checklist sits on its own row.
    const row = (await screen.findByText('Kiểm tra mái')).closest(
      '.checklist-row',
    )!
    await waitFor(() => expect(row).toHaveTextContent('540.000'))
    // The explanation is a folded section, free of internal pricing terms.
    const details = container.querySelector('details.checklist-quote-details')!
    expect(details).not.toHaveAttribute('open')
    expect(details).not.toHaveTextContent('STANDARD')
    expect(details).not.toHaveTextContent('Hồ sơ giá')
    expect(details).not.toHaveTextContent('Đơn giá')
    expect(details).toHaveTextContent('Tổng dự kiến')
  })

  it('does not scroll the list inside the page', async () => {
    vi.spyOn(customerApi, 'getServiceChecklist').mockResolvedValue(template())
    function Harness() {
      const checklist = useOrderChecklist('A')
      return <ChecklistEditor variant="compact" checklist={checklist} />
    }
    const { container } = render(<Harness />)
    await screen.findByText('Kiểm tra mái')
    const list = container.querySelector('.checklist-fields') as HTMLElement
    expect(list.style.overflowY).toBe('')
    expect(list.style.maxHeight).toBe('')
  })

  it('does not show the previous price for a changed selection while a new one is calculated', async () => {
    vi.spyOn(checklistPricingApi, 'customerQuote')
      .mockResolvedValueOnce(preview)
      .mockImplementationOnce(
        () => new Promise(() => undefined) as Promise<ServicePricePreview>,
      )
    const hook = renderHook(
      ({ images }) =>
        useChecklistQuote('A', [
          { sourceChecklistId: 'c-roof', requestedImageCount: images },
        ]),
      { initialProps: { images: 10 } },
    )
    await waitFor(() =>
      expect(hook.result.current.preview?.total).toBe(540_000),
    )
    hook.rerender({ images: 20 })
    await waitFor(() => expect(hook.result.current.loading).toBe(true))
    // A quote belongs to the exact selection it was computed for: a stale figure
    // for the old selection must not be shown while the next price is worked out.
    expect(hook.result.current.preview).toBeNull()
  })

  it('drops the old price when the service changes', async () => {
    vi.spyOn(checklistPricingApi, 'customerQuote')
      .mockResolvedValueOnce(preview)
      .mockImplementationOnce(
        () => new Promise(() => undefined) as Promise<ServicePricePreview>,
      )
    const hook = renderHook(
      ({ service }) =>
        useChecklistQuote(service, [{ sourceChecklistId: 'c-roof' }]),
      { initialProps: { service: 'A' } },
    )
    await waitFor(() => expect(hook.result.current.preview).not.toBeNull())
    hook.rerender({ service: 'B' })
    await waitFor(() => expect(hook.result.current.loading).toBe(true))
    expect(hook.result.current.preview).toBeNull()
  })
})

describe('Repeating orders', () => {
  it('tells the customer the price already covers every visit', async () => {
    const repeated = {
      ...preview,
      occurrences: 4,
      total: 2_160_000,
      checklistSubtotal: 2_160_000,
    }
    vi.spyOn(checklistPricingApi, 'customerQuote').mockResolvedValue(repeated)
    const hook = renderHook(() =>
      useChecklistQuote('A', [{ sourceChecklistId: 'c-roof' }], {
        occurrences: 4,
      }),
    )
    await waitFor(() =>
      expect(hook.result.current.preview?.occurrences).toBe(4),
    )
    const { container } = render(
      <ChecklistQuoteCard quote={hook.result.current} />,
    )
    expect(container.querySelector('details')).toHaveTextContent(
      'Giá đã nhân cho 4 lần thực hiện theo lịch định kỳ.',
    )
    expect(checklistPricingApi.customerQuote).toHaveBeenCalledWith(
      'A',
      [{ sourceChecklistId: 'c-roof' }],
      expect.any(AbortSignal),
      { occurrences: 4 },
    )
  })

  it('says nothing about visits for a single-visit order', async () => {
    vi.spyOn(checklistPricingApi, 'customerQuote').mockResolvedValue(preview)
    const hook = renderHook(() =>
      useChecklistQuote('A', [{ sourceChecklistId: 'c-roof' }]),
    )
    await waitFor(() => expect(hook.result.current.preview).not.toBeNull())
    const { container } = render(
      <ChecklistQuoteCard quote={hook.result.current} />,
    )
    expect(container.querySelector('details')).not.toHaveTextContent(
      'lần thực hiện',
    )
  })
})
