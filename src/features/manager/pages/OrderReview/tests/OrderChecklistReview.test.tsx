import {
  act,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  resetHttpTransport,
  setHttpTransport,
  type HttpTransport,
} from '../../../../../shared/api/httpClient'
import { setLanguage } from '../../../../../shared/i18n'
import { ordersApi } from '../../../api/ordersApi'
import type { OrderChecklistSnapshot } from '../../../types/orders'
import { OrderReviewPage } from '../OrderReviewPage'
import { OrderChecklistCard } from '../../MissionDetail/components/OrderChecklistCard'
import { orderReviewPageMessages } from '../OrderReviewPage.messages'

const snapshot: OrderChecklistSnapshot[] = [
  {
    id: 'edited',
    sourceChecklistId: 'C1',
    sourceType: 'SERVICE_TEMPLATE',
    content: 'Check emergency exits on floors 1-3',
    displayOrder: 2,
    minimumEvidenceCount: 3,
    requiredEvidenceType: 'VIDEO',
  },
  {
    id: 'kept',
    sourceChecklistId: 'C2',
    sourceType: 'SERVICE_TEMPLATE',
    content: 'Check PPE',
    displayOrder: 0,
  },
  {
    id: 'custom',
    sourceChecklistId: null,
    sourceType: 'CUSTOMER_CUSTOM',
    content: 'Check temporary barriers',
    displayOrder: 1,
  },
]
const backendOrder = {
  id: 'order-history',
  orderStatus: 'PENDING',
  customerId: 'customer',
  customerName: 'Customer',
  serviceId: 'service',
  serviceName: 'Monitoring',
  description: '',
  address: null,
  deliverables: [],
  latitude: null,
  longitude: null,
  preferredDateFrom: '2026-10-05',
  preferredDateTo: '2026-10-05',
  preferredTimeName: 'Morning',
  createdAt: '2026-10-04T00:00:00Z',
  checklistSnapshotAt: '2026-10-04T00:00:00Z',
  checklistItems: snapshot,
}
const response = (data: unknown) =>
  new Response(JSON.stringify({ success: true, data }), { status: 200 })

function serveOrder(data: unknown = backendOrder) {
  const transport = vi.fn<HttpTransport>(async (url, init) => {
    const path = new URL(url, 'http://localhost').pathname
    if (
      path === '/api/orders/order-history' &&
      (!init?.method || init.method === 'GET')
    )
      return response(data)
    if (path === '/api/orders/order-history/approve')
      return response({ ...backendOrder, orderStatus: 'APPROVED' })
    if (path === '/api/orders/order-history/approval') return response(null)
    return response(null)
  })
  setHttpTransport(transport)
  return transport
}

beforeEach(() => setLanguage('vi'))
afterEach(() => {
  resetHttpTransport()
  vi.restoreAllMocks()
  window.location.hash = ''
})

describe('Manager historical checklist review through Order API', () => {
  it.each(['vi', 'en'] as const)(
    'renders mixed historical content/provenance read only in %s, without fetching the catalog',
    async (language) => {
      setLanguage(language)
      render(
        <OrderChecklistCard
          order={backendOrder as unknown as import('../../../types/orders').OrderDetail}
          t={orderReviewPageMessages[language]}
        />,
      )
      const region = await screen.findByRole('region', {
        name:
          language === 'vi' ? 'Nội dung giám sát' : 'Monitoring requirements',
      })
      expect(
        within(region)
          .getAllByRole('listitem')
          .map((item) => item.querySelector('p')?.textContent),
      ).toEqual([
        'Check PPE',
        'Check temporary barriers',
        'Check emergency exits on floors 1-3',
      ])
      expect(
        within(region).getAllByText(
          language === 'vi' ? 'Nội dung từ dịch vụ' : 'Service requirement',
        ),
      ).toHaveLength(2)
      expect(
        within(region).getByText(
          language === 'vi'
            ? 'Nội dung khách hàng bổ sung'
            : 'Customer-added requirement',
        ),
      ).toBeInTheDocument()
      expect(
        within(region).getByText(
          language === 'vi'
            ? 'Bằng chứng: tối thiểu 3 · Video'
            : 'Evidence: at least 3 · Video',
        ),
      ).toBeInTheDocument()
      for (const role of ['button', 'checkbox', 'textbox'])
        expect(within(region).queryByRole(role)).not.toBeInTheDocument()
      expect(within(region).queryByText('C1')).not.toBeInTheDocument()
      expect(snapshot.map((item) => item.id)).toEqual([
        'edited',
        'kept',
        'custom',
      ])
    },
  )

  it('keeps requirement metadata optional for legacy snapshots', async () => {
    const { readOrderChecklistSnapshot } =
      await import('../../../lib/orderChecklistSnapshot')
    const legacy = readOrderChecklistSnapshot(
      {
        checklistItems: [
          {
            id: 'legacy',
            sourceChecklistId: 'C-LEGACY',
            sourceType: 'SERVICE_TEMPLATE',
            content: 'Legacy item',
            displayOrder: 0,
          },
        ],
        checklistSnapshotAt: '2025-01-01T00:00:00Z',
      },
      'order-history',
    )
    expect(legacy.checklistItems[0]).not.toHaveProperty('minimumEvidenceCount')
    expect(legacy.checklistItems[0]).not.toHaveProperty('requiredEvidenceType')
    const partial = readOrderChecklistSnapshot(
      {
        checklistItems: [
          {
            id: 'partial',
            sourceChecklistId: null,
            sourceType: 'CUSTOMER_CUSTOM',
            content: 'Partial metadata',
            displayOrder: 0,
            requiredEvidenceType: 'VIDEO',
          },
        ],
        checklistSnapshotAt: '2025-01-01T00:00:00Z',
      },
      'order-history',
    )
    expect(partial.checklistItems[0]).toMatchObject({
      requiredEvidenceType: 'VIDEO',
    })
    expect(partial.checklistItems[0]).not.toHaveProperty('minimumEvidenceCount')
  })

  it('renders the evidence requirement as plain read-only snapshot metadata', async () => {
    render(
      <OrderChecklistCard
        order={{
          ...backendOrder,
          checklistItems: [
            {
              ...snapshot[2],
              minimumEvidenceCount: 2,
              requiredEvidenceType: 'IMAGE',
            },
          ],
        } as unknown as import('../../../types/orders').OrderDetail}
        t={orderReviewPageMessages.vi}
      />,
    )
    const region = await screen.findByRole('region', {
      name: 'Nội dung giám sát',
    })
    expect(
      within(region).getByText('Bằng chứng: tối thiểu 2 · Ảnh'),
    ).toBeInTheDocument()
    expect(within(region).queryByRole('button')).not.toBeInTheDocument()
    expect(within(region).queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('renders a service-only snapshot', async () => {
    render(
      <OrderChecklistCard
        order={{
          ...backendOrder,
          checklistItems: snapshot.filter(
            (item) => item.sourceType === 'SERVICE_TEMPLATE',
          ),
        } as unknown as import('../../../types/orders').OrderDetail}
        t={orderReviewPageMessages.vi}
      />,
    )
    const region = await screen.findByRole('region', {
      name: 'Nội dung giám sát',
    })
    expect(within(region).getAllByRole('listitem')).toHaveLength(2)
    expect(
      within(region).queryByText('Nội dung khách hàng bổ sung'),
    ).not.toBeInTheDocument()
  })

  it('does not duplicate the checklist in the order-information step', async () => {
    const transport = serveOrder()
    render(<OrderReviewPage orderId="order-history" />)
    await screen.findByText('Lịch thực hiện & khu vực giám sát')
    expect(
      screen.queryByRole('region', { name: 'Nội dung giám sát' }),
    ).not.toBeInTheDocument()
    expect(
      transport.mock.calls.some(([url]) => url.includes('/api/services/')),
    ).toBe(false)
  })

  it('does not show an empty snapshot while Order Detail is loading', async () => {
    let resolve!: (value: Response) => void
    setHttpTransport(async (url) =>
      new URL(url).pathname === '/api/orders/order-history'
        ? new Promise<Response>((done) => {
            resolve = done
          })
        : response(null),
    )
    render(<OrderReviewPage orderId="order-history" />)
    expect(screen.getByText('Đang tải…')).toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: 'Nội dung giám sát' }),
    ).not.toBeInTheDocument()
    await act(async () => resolve(response(backendOrder)))
    expect(
      screen.queryByRole('region', { name: 'Nội dung giám sát' }),
    ).not.toBeInTheDocument()
  })

  it.each(['http', 'malformed'] as const)(
    'shows Order error, not empty requirements, for %s failure',
    async (failure) => {
      if (failure === 'malformed')
        serveOrder({
          ...backendOrder,
          checklistItems: [{ ...snapshot[0], sourceType: 'UNKNOWN' }],
        })
      else
        setHttpTransport(
          async () =>
            new Response(
              JSON.stringify({ success: false, code: 'SERVER_ERROR' }),
              { status: 500 },
            ),
        )
      render(<OrderReviewPage orderId="order-history" />)
      expect(
        await screen.findByText('Không tải được hồ sơ đơn'),
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('region', { name: 'Nội dung giám sát' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Duyệt & lên lịch' }),
      ).not.toBeInTheDocument()
    },
  )

  it('does not expose the legacy approve-and-schedule bypass', async () => {
    const transport = serveOrder()
    render(<OrderReviewPage orderId="order-history" />)
    await screen.findByText('Lịch thực hiện & khu vực giám sát')
    expect(
      screen.queryByRole('button', { name: 'Duyệt & lên lịch' }),
    ).not.toBeInTheDocument()
    const writes = transport.mock.calls.filter(
      ([, init]) => init?.method === 'POST',
    )
    expect(writes).toHaveLength(0)
  })

  it('preserves snapshot fields on legacy Manager projections too', async () => {
    serveOrder({
      ...backendOrder,
      customer: { fullName: 'Legacy mock customer' },
      status: 'PENDING',
    })
    const detail = await ordersApi.getOrder('order-history')
    expect(detail.checklistItems).toEqual(snapshot)
    expect(detail.checklistSnapshotAt).toBe(backendOrder.checklistSnapshotAt)
  })

  it.each([
    { checklistItems: 'invalid' },
    { checklistItems: null },
    { checklistItems: undefined },
    { checklistSnapshotAt: 'invalid-date' },
    { checklistItems: [{ ...snapshot[0], displayOrder: -1 }] },
    { checklistItems: [{ ...snapshot[0], content: '' }] },
    { checklistItems: [{ ...snapshot[0], minimumEvidenceCount: 51 }] },
    { checklistItems: [{ ...snapshot[0], requiredEvidenceType: 'AUDIO' }] },
    { checklistItems: [{ ...snapshot[0], sourceChecklistId: null }] },
    { checklistItems: [{ ...snapshot[2], sourceChecklistId: 'fake-source' }] },
    { checklistItems: [snapshot[0], snapshot[0]] },
  ])(
    'rejects malformed snapshot instead of fabricating empty history: %j',
    async (invalid) => {
      serveOrder({ ...backendOrder, ...invalid })
      await expect(ordersApi.getOrder('order-history')).rejects.toMatchObject({
        code: 'INVALID_ORDER_CHECKLIST_SNAPSHOT',
      })
    },
  )
})
