import { act } from 'react'
import {
  render,
  screen,
  within,
  waitFor,
  fireEvent,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  customerMissionReportApi,
  type CustomerMissionSummary,
  type CustomerMissionReport,
  type CustomerChecklistReportItem,
} from '../../api/customerMissionReportApi'
import { customerMediaApi } from '../../api/customerMediaApi'
import { customerApi } from '../../api/customerApi'
import { customerHref, parseCustomerRoute } from '../../routes'
import { setLanguage } from '../../../../shared/i18n'
import { ApiError } from '../../../../shared/api/httpClient'
import { CustomerOrderMissionsSection } from './CustomerOrderMissionsSection'
import { CustomerMissionReportPage } from './CustomerMissionReportPage'
import { OrderDetailPage } from '../../pages/OrderDetail/OrderDetailPage'
import type { OrderCreateResponse } from '../../api/orderApi'

const mission = (id: string, available = false): CustomerMissionSummary => ({
  missionId: id,
  orderId: 'o',
  missionCode: id.toUpperCase(),
  scopeLabel: `Scope ${id}`,
  status: available ? 'COMPLETED' : 'IN_PROGRESS',
  scheduledStartAt: null,
  scheduledEndAt: null,
  replacesMissionId: null,
  reportAvailable: available,
})
const item = (id: string): CustomerChecklistReportItem => ({
  executionId: `execution-${id}`,
  orderChecklistItemId: id,
  content: `Snapshot ${id}`,
  sourceType: 'CUSTOMER_CUSTOM',
  displayOrder: 0,
  status: 'COMPLETED',
  assessment: 'NON_COMPLIANT',
  observation: null,
  unableToVerifyReason: null,
})
const report = (id: string, available = true): CustomerMissionReport => ({
  mission: mission(id, available),
  reportAvailable: available,
  result: available
    ? {
        id: `r-${id}`,
        summary: `Summary ${id}`,
        startedAt: null,
        endedAt: null,
        completedAt: null,
        durationSeconds: null,
      }
    : null,
  checklistItems: available ? ['A', 'C', 'E'].map(item) : [],
})
beforeEach(() => {
  setLanguage('en')
  vi.spyOn(customerMissionReportApi, 'list').mockResolvedValue([])
  vi.spyOn(customerMissionReportApi, 'report').mockImplementation(
    async (_, id) => report(id),
  )
  vi.spyOn(customerMediaApi, 'listMissionMedia').mockImplementation(
    async (id) => ({
      items: [
        {
          mediaId: `X-${id}`,
          missionId: id,
          fileName: `photo-${id}.jpg`,
          sourceType: 'DRONE_CAMERA',
          mediaType: 'IMAGE',
          downloadUrl: 'https://example.test/photo.jpg',
        },
      ],
      page: 0,
      totalItems: 1,
      totalPages: 1,
      first: true,
      last: true,
    }),
  )
})
afterEach(() => {
  vi.restoreAllMocks()
  setLanguage('vi')
})

describe('Customer aggregate/report publication', () => {
  it('shows compact published summary, actual duration and read-only checklist labels', async () => {
    setLanguage('vi')
    const data = report('m1')
    data.mission.scheduledStartAt = '2026-10-09T07:55:00+07:00'
    data.mission.scheduledEndAt = '2026-10-09T10:55:00+07:00'
    data.result!.durationSeconds = 1800
    vi.mocked(customerMissionReportApi.report).mockResolvedValue(data)
    render(<CustomerMissionReportPage orderId="o" missionId="m1" />)
    expect(
      await screen.findByText('Báo cáo đã được công bố'),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Báo cáo phiên giám sát',
    )
    expect(screen.getByRole('region', { name: 'Tổng quan' })).toHaveTextContent(
      '30 phút',
    )
    expect(screen.getByRole('region', { name: 'Tổng quan' })).toHaveTextContent(
      'Scope m1',
    )
    expect(
      screen.getByText('Bạn có thể xem đầy đủ kết quả và media của Mission.'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Trạng thái')).toHaveLength(3)
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(
      screen.queryByText(/COMPLETED|NON_COMPLIANT|CUSTOMER_CUSTOM/),
    ).toBeNull()
  })
  it('refreshes publication and exact-Mission media from the page action', async () => {
    vi.mocked(customerMissionReportApi.report)
      .mockResolvedValueOnce(report('m1', false))
      .mockResolvedValue(report('m1'))
    render(<CustomerMissionReportPage orderId="o" missionId="m1" />)
    await screen.findByText('Report is not available yet.')
    await screen.findByRole('button', { name: 'View photo-m1.jpg' })
    fireEvent.click(screen.getByRole('button', { name: 'Refresh report' }))
    await screen.findByText('Report has been published')
    await screen.findByText('Summary m1')
    await waitFor(() =>
      expect(customerMediaApi.listMissionMedia).toHaveBeenCalledTimes(2),
    )
    expect(customerMissionReportApi.report).toHaveBeenCalledTimes(2)
  })
  it('shows an approved M1 report independently while M2 remains unfinished', async () => {
    vi.mocked(customerMissionReportApi.list).mockResolvedValue([
      mission('m1', true),
      mission('m2', false),
    ])
    render(<CustomerMissionReportPage orderId="o" missionId="m1" />)
    expect(await screen.findByText('Summary m1')).toBeInTheDocument()
    expect(screen.queryByText('Scope m2')).toBeNull()
    expect(screen.queryByText('Summary m2')).toBeNull()
  })
  it('shows all published media in a gallery without internal review metadata', async () => {
    vi.mocked(customerMediaApi.listMissionMedia).mockResolvedValue({
      items: [1, 2, 3, 4].map((i) => ({
        mediaId: `media-${i}`,
        missionId: 'm1',
        fileName: `capture-${i}.jpg`,
        mediaType: 'IMAGE',
        fileSize: 456000,
        capturedAt: '2026-10-09T01:00:00Z',
        downloadUrl: 'https://example.test/capture.jpg',
      })),
      page: 0,
      totalItems: 4,
      totalPages: 1,
      first: true,
      last: true,
    })
    render(<CustomerMissionReportPage orderId="o" missionId="m1" />)
    const gallery = await screen.findByRole('region', {
      name: 'Session photos and videos',
    })
    await within(gallery).findByRole('button', { name: 'View capture-4.jpg' })
    expect(
      within(gallery).getAllByRole('button', { name: /^View capture/ }),
    ).toHaveLength(4)
    expect(gallery).not.toHaveTextContent(
      /PENDING_MANAGER_APPROVAL|REJECTED|revision/,
    )
  })
  it('renders zero Missions without a fake count or completion claim', async () => {
    render(<CustomerOrderMissionsSection orderId="o" />)
    expect(
      await screen.findByText('Monitoring has not been scheduled yet.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Total sessions')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
  })
  it('renders three exact Mission links and uses public availability', async () => {
    vi.mocked(customerMissionReportApi.list).mockResolvedValue([
      mission('m1', true),
      mission('m2'),
      mission('m3'),
    ])
    render(<CustomerOrderMissionsSection orderId="o" />)
    expect(
      await screen.findByRole('link', { name: 'View report M1' }),
    ).toHaveAttribute('href', '#portal/customer/orders/o/missions/m1/report')
    expect(
      screen.getByRole('link', { name: 'View monitoring session M2' }),
    ).toHaveAttribute('href', '#portal/customer/orders/o/missions/m2/report')
    expect(
      screen.getByRole('link', { name: 'View monitoring session M3' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(3)
    expect(
      screen.queryByText(
        /PENDING_MANAGER_APPROVAL|REJECTED|revision|safe-stop/i,
      ),
    ).not.toBeInTheDocument()
  })
  it.each(['IN_PROGRESS', 'COMPLETED'] as const)(
    'keeps canonical Order %s with separate reports',
    async (status) => {
      vi.spyOn(customerApi, 'getOrderById').mockResolvedValue({
        id: 'o',
        customerId: 'customer-a',
        title: 'Order O',
        orderStatus: status,
        checklistItems: [],
      } as OrderCreateResponse)
      vi.mocked(customerMissionReportApi.list).mockResolvedValue([
        mission('m1', true),
        mission('m2', status === 'COMPLETED'),
      ])
      render(<OrderDetailPage orderId="o" />)
      await screen.findByRole('link', { name: 'View report M1' })
      const header = document.querySelector('.od-header') ?? document.body
      expect(
        within(header as HTMLElement).getByText(
          status === 'COMPLETED' ? 'Completed' : 'In progress',
          { selector: '.mgr-status-tag' },
        ),
      ).toBeInTheDocument()
      expect(screen.queryByText('Order completed')).not.toBeInTheDocument()
    },
  )
  it('renders replacement chains only between visible siblings after remount', async () => {
    vi.mocked(customerMissionReportApi.list).mockResolvedValue([
      { ...mission('m1'), status: 'CANCELLED' },
      { ...mission('m2'), status: 'CANCELLED', replacesMissionId: 'm1' },
      { ...mission('m3'), replacesMissionId: 'm2' },
      { ...mission('m4'), replacesMissionId: 'hidden' },
    ])
    const first = render(<CustomerOrderMissionsSection orderId="o" />)
    await screen.findByRole('article', { name: 'M3' })
    first.unmount()
    render(<CustomerOrderMissionsSection orderId="o" />)
    const card = await screen.findByRole('article', { name: 'M3' })
    expect(within(card).getByRole('link', { name: 'M2' })).toHaveAttribute(
      'href',
      '#portal/customer/orders/o/missions/m2/report',
    )
    expect(
      within(screen.getByRole('article', { name: 'M1' })).getByRole('link', {
        name: 'M2',
      }),
    ).toBeInTheDocument()
    expect(screen.queryByText('hidden')).not.toBeInTheDocument()
  })
  it('publishes only Mission A/C/E and its media, and returns to the same Order', async () => {
    render(<CustomerMissionReportPage orderId="o" missionId="m1" />)
    expect(await screen.findByText('Summary m1')).toBeInTheDocument()
    const checklist = screen.getByRole('region', {
      name: 'Monitoring requirement results',
    })
    for (const id of ['A', 'C', 'E'])
      expect(within(checklist).getByText(`Snapshot ${id}`)).toBeInTheDocument()
    expect(screen.queryByText('Snapshot B')).not.toBeInTheDocument()
    expect(screen.queryByText('Snapshot D')).not.toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: 'View photo-m1.jpg' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('photo-m2.jpg')).not.toBeInTheDocument()
    expect(screen.getByText('Drone camera')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Order' })).toHaveAttribute(
      'href',
      '#portal/customer/orders/o',
    )
    expect(customerMissionReportApi.report).toHaveBeenCalledWith(
      'o',
      'm1',
      expect.any(AbortSignal),
    )
    expect(customerMediaApi.listMissionMedia).toHaveBeenCalledWith(
      'm1',
      0,
      12,
      expect.any(AbortSignal),
    )
    expect(
      screen.queryByRole('button', { name: /edit|attach|cleanup|finalize/i }),
    ).not.toBeInTheDocument()
  })
  it('hides unpublished result/checklist even if an incomplete fixture includes content; media stays independent', async () => {
    vi.mocked(customerMissionReportApi.report).mockResolvedValue({
      ...report('m1'),
      reportAvailable: false,
      mission: mission('m1'),
    })
    render(<CustomerMissionReportPage orderId="o" missionId="m1" />)
    expect(
      await screen.findByText('Report is not available yet.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Summary m1')).not.toBeInTheDocument()
    expect(screen.queryByText('Snapshot A')).not.toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: 'View photo-m1.jpg' }),
    ).toBeInTheDocument()
  })
  it('handles approved empty checklist/media and keeps UNABLE_TO_VERIFY distinct from non-compliance', async () => {
    const published = report('m1')
    published.checklistItems = [
      {
        ...item('E'),
        status: 'UNABLE_TO_VERIFY',
        unableToVerifyReason: 'View obstructed',
      },
    ]
    vi.mocked(customerMissionReportApi.report).mockResolvedValue(published)
    vi.mocked(customerMediaApi.listMissionMedia).mockResolvedValue({
      items: [],
      page: 0,
      totalItems: 0,
      totalPages: 0,
      first: true,
      last: true,
    })
    const mounted = render(
      <CustomerMissionReportPage orderId="o" missionId="m1" />,
    )
    expect(await screen.findByText('View obstructed')).toBeInTheDocument()
    expect(
      await screen.findByText('No published photos or videos yet.'),
    ).toBeInTheDocument()
    mounted.unmount()
    vi.mocked(customerMissionReportApi.report).mockResolvedValue({
      ...published,
      checklistItems: [],
    })
    render(<CustomerMissionReportPage orderId="o" missionId="m1" />)
    expect(
      await screen.findByText(
        'No checklist requirements were assigned to this session.',
      ),
    ).toBeInTheDocument()
  })
  it('denies cross-customer report errors without fetching media or showing raw errors', async () => {
    vi.mocked(customerMissionReportApi.report).mockRejectedValue(
      new ApiError('SECRET database detail', {
        code: 'ACCESS_DENIED',
        status: 403,
        method: 'GET',
        path: '/report',
      }),
    )
    render(<CustomerMissionReportPage orderId="o" missionId="foreign" />)
    expect(await screen.findByRole('alert')).not.toHaveTextContent('SECRET')
    expect(customerMediaApi.listMissionMedia).not.toHaveBeenCalled()
    expect(screen.queryByText('Snapshot A')).not.toBeInTheDocument()
  })
  it('does not display sibling media from an invalid response', async () => {
    vi.mocked(customerMediaApi.listMissionMedia).mockResolvedValue({
      items: [{ mediaId: 'Y', missionId: 'm2', fileName: 'sibling.jpg' }],
      page: 0,
      totalItems: 1,
      totalPages: 1,
      first: true,
      last: true,
    })
    render(<CustomerMissionReportPage orderId="o" missionId="m1" />)
    await screen.findByRole('alert')
    expect(screen.queryByText('sibling.jpg')).not.toBeInTheDocument()
  })
  it('retains the legacy missionId history route and roundtrips the new Order/Mission report route', () => {
    const route = {
      screen: 'missionReport' as const,
      orderId: 'o/a',
      missionId: 'm/b',
    }
    expect(parseCustomerRoute(customerHref(route))).toEqual(route)
    expect(parseCustomerRoute('#portal/customer/mission-history/m1')).toEqual({
      screen: 'missionHistoryDetail',
      missionId: 'm1',
    })
  })
  it('retries a read error and updates Vietnamese/English report labels', async () => {
    vi.mocked(customerMissionReportApi.report)
      .mockRejectedValueOnce(new Error('secret'))
      .mockResolvedValue(report('m1'))
    render(<CustomerMissionReportPage orderId="o" missionId="m1" />)
    await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button', { name: 'Refresh report' }))
    await screen.findByText('Summary m1')
    act(() => setLanguage('vi'))
    await waitFor(() =>
      expect(screen.getByText('Kết quả yêu cầu giám sát')).toBeInTheDocument(),
    )
  })
})
