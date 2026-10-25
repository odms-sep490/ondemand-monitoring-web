import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../../shared/api/httpClient'
import {
  resetHttpTransport,
  setHttpTransport,
} from '../../../../shared/api/httpClient'
import { setLanguage } from '../../../../shared/i18n'
import { customerApi } from '../../api/customerApi'
import { ChecklistEditor } from '../../components/checklist/ChecklistEditor'
import { ChecklistSnapshotCard } from '../../components/checklist/ChecklistSnapshotCard'
import { OrderDetailPage } from '../../pages/OrderDetail/OrderDetailPage'
import { useRequestSubmit } from '../../pages/CustomerCreateRequest/hooks/useRequestSubmit'
import { useSubmitOrder } from '../../pages/CreateOrder/hooks/useSubmitOrder'
import { checklistError, isStaleChecklist } from './errors'
import { useOrderChecklist } from './useOrderChecklist'
import type { ServiceChecklistItem } from './types'
import { normalizeContent } from './types'
import type { CreateOrderPayload } from '../../api/customerApi'

const template = (serviceId = 'A'): ServiceChecklistItem[] => [
  {
    id: 'link-2',
    serviceId,
    checklistId: 'catalog-2',
    content: 'Second',
    displayOrder: 2,
    checklistVersion: 7,
    serviceActive: true,
    checklistActive: true,
  },
  {
    id: 'link-1',
    serviceId,
    checklistId: 'catalog-1',
    content: 'First',
    displayOrder: 1,
    checklistVersion: 3,
    serviceActive: true,
    checklistActive: true,
  },
]
const apiError = (code: string, status = 409) =>
  new ApiError('technical secret', {
    code,
    status,
    method: 'POST',
    path: '/api/orders',
  })
beforeEach(() => setLanguage('vi'))
afterEach(() => {
  vi.restoreAllMocks()
  resetHttpTransport()
})

describe('Order checklist state and editor', () => {
  it('matches backend Unicode whitespace without stripping BOM content', () => {
    expect(normalizeContent('\u0085 Check\u0085 PPE \u0085')).toBe('Check PPE')
    expect(normalizeContent('\ufeffCheck\ufeff')).toBe('\ufeffCheck\ufeff')
  })

  it.each(['duplicate', 'missing'] as const)(
    'rejects %s source identity in a template',
    async (invalid) => {
      const items = template()
      items[1].checklistId = invalid === 'duplicate' ? items[0].checklistId : ''
      vi.spyOn(customerApi, 'getServiceChecklist').mockResolvedValue(items)
      const { result } = renderHook(() => useOrderChecklist('A'))
      await waitFor(() => expect(result.current.status).toBe('error'))
      expect(result.current.valid).toBe(false)
      expect(() => result.current.serialize()).toThrow()
    },
  )

  it('rejects duplicate content separated by backend Unicode NEL whitespace', async () => {
    vi.spyOn(customerApi, 'getServiceChecklist').mockResolvedValue(template())
    const { result } = renderHook(() => useOrderChecklist('A'))
    await waitFor(() => expect(result.current.valid).toBe(true))
    act(() => {
      result.current.change('link-1', { content: 'Check\u0085PPE' })
      result.current.change('link-2', { content: ' check PPE ' })
    })
    expect(result.current.validation).toContain('trùng')
  })
  it('clears customization when the service is deselected and selected again', async () => {
    vi.spyOn(customerApi, 'getServiceChecklist').mockResolvedValue(template())
    const { result, rerender } = renderHook(({ id }) => useOrderChecklist(id), {
      initialProps: { id: 'A' },
    })
    await waitFor(() => expect(result.current.valid).toBe(true))
    act(() => result.current.change('link-1', { content: 'Edited' }))
    rerender({ id: '' })
    expect(result.current.status).toBe('idle')
    expect(result.current.rows).toEqual([])
    rerender({ id: 'A' })
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.valid).toBe(true))
    expect(result.current.rows[0].content).toBe('First')
  })
  it('loads defaults in display order; KEEP preserves catalog IDs and catalog versions', async () => {
    vi.spyOn(customerApi, 'getServiceChecklist').mockResolvedValue(template())
    const { result } = renderHook(() => useOrderChecklist('A'))
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.valid).toBe(true))
    expect(
      result.current.rows.map((row) => [
        row.minimumEvidenceCount,
        row.requiredEvidenceType,
      ]),
    ).toEqual([
      [1, 'IMAGE'],
      [1, 'IMAGE'],
    ])
    expect(result.current.serialize()).toEqual([
      {
        sourceChecklistId: 'catalog-1',
        expectedChecklistVersion: 3,
        minimumEvidenceCount: 1,
        requiredEvidenceType: 'IMAGE',
      },
      {
        sourceChecklistId: 'catalog-2',
        expectedChecklistVersion: 7,
        minimumEvidenceCount: 1,
        requiredEvidenceType: 'IMAGE',
      },
    ])
  })

  it('serializes per-item evidence type/count, validates the 1–50 range, and keeps [] for none', async () => {
    vi.spyOn(customerApi, 'getServiceChecklist').mockResolvedValue(template())
    const { result } = renderHook(() => useOrderChecklist('A'))
    await waitFor(() => expect(result.current.valid).toBe(true))
    act(() =>
      result.current.change('link-1', {
        minimumEvidenceCount: 3,
        requiredEvidenceType: 'VIDEO',
      }),
    )
    expect(result.current.serialize()[0]).toMatchObject({
      minimumEvidenceCount: 3,
      requiredEvidenceType: 'VIDEO',
    })
    act(() =>
      result.current.change('link-2', { requiredEvidenceType: 'IMAGE' }),
    )
    expect(result.current.serialize()[1]).toMatchObject({
      minimumEvidenceCount: 1,
      requiredEvidenceType: 'IMAGE',
    })
    act(() => result.current.change('link-1', { minimumEvidenceCount: 51 }))
    expect(result.current.valid).toBe(false)
    expect(result.current.validation).toContain('1 đến 50')
    expect(() => result.current.serialize()).toThrow()
    act(() => result.current.change('link-1', { minimumEvidenceCount: 50 }))
    expect(result.current.valid).toBe(true)
    act(() => result.current.change('link-1', { minimumEvidenceCount: 0 }))
    expect(result.current.valid).toBe(false)
  })

  it('EDIT keeps source/version, REMOVE excludes item, CUSTOM normalizes content; remove all stays []', async () => {
    vi.spyOn(customerApi, 'getServiceChecklist').mockResolvedValue(template())
    const { result } = renderHook(() => useOrderChecklist('A'))
    await waitFor(() => expect(result.current.valid).toBe(true))
    act(() => {
      result.current.change('link-1', { content: ' Edited  first ' })
      result.current.change('link-2', { selected: false })
      result.current.add()
    })
    const custom = result.current.rows[2].key
    act(() => result.current.change(custom, { content: ' My\nrequirement ' }))
    expect(result.current.serialize()).toEqual([
      {
        sourceChecklistId: 'catalog-1',
        expectedChecklistVersion: 3,
        minimumEvidenceCount: 1,
        requiredEvidenceType: 'IMAGE',
        contentOverride: 'Edited first',
      },
      {
        contentOverride: 'My requirement',
        minimumEvidenceCount: 1,
        requiredEvidenceType: 'IMAGE',
      },
    ])
    act(() => {
      result.current.remove(custom)
      result.current.change('link-1', { selected: false })
    })
    expect(result.current.serialize()).toEqual([])
    expect(JSON.stringify({ checklistItems: result.current.serialize() })).toBe(
      '{"checklistItems":[]}',
    )
  })

  it('clears edited/custom A items on service switch and ignores late responses', async () => {
    let resolveA!: (items: ServiceChecklistItem[]) => void
    const load = vi
      .spyOn(customerApi, 'getServiceChecklist')
      .mockImplementation((serviceId) =>
        serviceId === 'A'
          ? new Promise((resolve) => {
              resolveA = resolve
            })
          : Promise.resolve(template(serviceId)),
      )
    const { result, rerender } = renderHook(({ id }) => useOrderChecklist(id), {
      initialProps: { id: 'A' },
    })
    rerender({ id: 'B' })
    expect(result.current.rows).toEqual([])
    expect(() => result.current.serialize()).toThrow()
    await waitFor(() => expect(result.current.valid).toBe(true))
    await act(async () => resolveA(template()))
    expect(result.current.rows[0].content).toBe('First')
    expect(load.mock.calls[0][1]?.aborted).toBe(true)
    act(() => {
      result.current.change('link-1', { content: 'B edited' })
      result.current.add()
    })
    rerender({ id: 'C' })
    expect(result.current.rows).toEqual([])
    await waitFor(() => expect(result.current.rows).toHaveLength(2))
    expect(result.current.rows[0].content).toBe('First')
  })

  it('handles empty templates, errors, retry, and refuses missing catalog versions', async () => {
    const load = vi
      .spyOn(customerApi, 'getServiceChecklist')
      .mockRejectedValueOnce(apiError('SERVER_ERROR', 500))
      .mockResolvedValueOnce([])
    const { result } = renderHook(() => useOrderChecklist('A'))
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.error).not.toContain('technical secret')
    act(() => result.current.reload())
    await waitFor(() => expect(result.current.valid).toBe(true))
    expect(result.current.serialize()).toEqual([])
    load.mockResolvedValueOnce([
      {
        ...template()[0],
        checklistVersion: undefined,
      } as unknown as ServiceChecklistItem,
    ])
    act(() => result.current.reload())
    await waitFor(() => expect(result.current.status).toBe('error'))
  })

  it('validates blank, normalized duplicate, maximum content length and count', async () => {
    vi.spyOn(customerApi, 'getServiceChecklist').mockResolvedValue(template())
    const { result } = renderHook(() => useOrderChecklist('A'))
    await waitFor(() => expect(result.current.valid).toBe(true))
    act(() => result.current.change('link-1', { content: '  ' }))
    expect(result.current.valid).toBe(false)
    act(() => result.current.change('link-1', { content: ' second\n ' }))
    expect(result.current.validation).toContain('trùng')
    act(() => result.current.change('link-1', { content: 'x'.repeat(501) }))
    expect(result.current.validation).toContain('500')
    act(() => result.current.change('link-1', { content: 'x'.repeat(500) }))
    expect(result.current.valid).toBe(true)
    act(() => {
      for (let i = 0; i < 110; i++) result.current.add()
    })
    expect(result.current.selectedCount).toBe(100)
  })

  it('offers explicit stale recovery and discards edits only when customer reloads', async () => {
    const load = vi
      .spyOn(customerApi, 'getServiceChecklist')
      .mockResolvedValue(template())
    function Editor() {
      const checklist = useOrderChecklist('A')
      return (
        <>
          <ChecklistEditor checklist={checklist} />
          <button onClick={checklist.markStale}>Stale</button>
        </>
      )
    }
    render(<Editor />)
    const first = await screen.findByLabelText('Nội dung giám sát 1')
    fireEvent.change(first, { target: { value: 'Edited' } })
    fireEvent.click(screen.getByRole('button', { name: 'Stale' }))
    expect(first).toHaveValue('Edited')
    expect(screen.getByText(/Tải lại sẽ bỏ toàn bộ/)).toBeInTheDocument()
    expect(load).toHaveBeenCalledTimes(1)
    fireEvent.click(
      screen.getByRole('button', { name: 'Tải lại danh sách (bỏ chỉnh sửa)' }),
    )
    await waitFor(() =>
      expect(screen.getByLabelText('Nội dung giám sát 1')).toHaveValue('First'),
    )
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('shows service defaults and supports remove, restore, edit and custom controls', async () => {
    vi.spyOn(customerApi, 'getServiceChecklist').mockResolvedValue(template())
    function Editor() {
      return <ChecklistEditor checklist={useOrderChecklist('A')} />
    }
    render(<Editor />)
    await screen.findByLabelText('Nội dung giám sát 1')
    expect(
      screen.getByText(
        /Thay đổi danh sách có thể làm thay đổi chi phí dự kiến/,
      ),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/Mặc định của dịch vụ/)).toHaveLength(2)
    expect(screen.getByLabelText('Nội dung giám sát 1')).toHaveValue('First')
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Bỏ khỏi yêu cầu' })[0],
    )
    expect(screen.getByLabelText('Nội dung giám sát 1')).toBeDisabled()
    expect(screen.getByLabelText('Nội dung giám sát 1')).toHaveValue('First')
    fireEvent.click(screen.getByRole('button', { name: 'Thêm lại' }))
    expect(screen.getByLabelText('Nội dung giám sát 1')).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: '+ Thêm nội dung' }))
    fireEvent.change(screen.getByLabelText('Nội dung giám sát 3'), {
      target: { value: 'Custom' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Xóa nội dung bổ sung' }),
    )
    expect(
      screen.queryByLabelText('Nội dung giám sát 3'),
    ).not.toBeInTheDocument()
  })

  it('has one keyboard-accessible edit action per compact row and keeps changes when switching views', async () => {
    vi.spyOn(customerApi, 'getServiceChecklist').mockResolvedValue(template())
    function CompactEditor() {
      return <ChecklistEditor variant="compact" checklist={useOrderChecklist('A')} />
    }
    render(<CompactEditor />)

    const edit = await screen.findByRole('button', { name: 'Sửa nội dung 1' })
    expect(screen.getAllByRole('button', { name: 'Sửa nội dung 1' })).toHaveLength(1)
    expect(screen.getByRole('checkbox', { name: 'Chọn nội dung 1' })).toBeChecked()

    expect(
      screen.getByRole('checkbox', { name: 'Chọn nội dung 1' }),
    ).toHaveAttribute('aria-describedby', 'checklist-summary-link-1')

    fireEvent.click(edit)
    const content = screen.getByLabelText('Nội dung giám sát 1')
    expect(content).toHaveFocus()
    fireEvent.change(content, { target: { value: 'Updated monitoring content' } })
    fireEvent.click(screen.getByRole('button', { name: 'Xong' }))

    expect(screen.getByRole('button', { name: 'Sửa nội dung 1' })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Dạng nhóm' }))
    expect(screen.getByText('Updated monitoring content')).toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', {
        name: 'Chọn nội dung 1',
      }),
    ).toBeChecked()

    fireEvent.change(screen.getByRole('searchbox', { name: 'Tìm nội dung giám sát' }), {
      target: { value: 'Updated' },
    })
    expect(screen.getByText('Updated monitoring content')).toBeInTheDocument()
    expect(screen.queryByText('Second')).not.toBeInTheDocument()
  })

  it('does not display unselected catalog items outside the service package', async () => {
    vi.spyOn(customerApi, 'getServiceChecklist').mockResolvedValue(template())
    const loadCatalog = vi
      .spyOn(customerApi, 'getChecklistCatalog')
      .mockResolvedValue([
        {
          id: 'outside-package',
          content: 'Outside package',
          version: 4,
          includedImageCount: 0,
          includedVideoCount: 0,
        },
      ])

    function Editor() {
      return <ChecklistEditor checklist={useOrderChecklist('A')} />
    }

    render(<Editor />)
    await screen.findByText('First')
    await waitFor(() => expect(loadCatalog).toHaveBeenCalled())

    expect(screen.getByText('Second')).toBeInTheDocument()
    expect(screen.queryByText('Outside package')).not.toBeInTheDocument()
    expect(screen.queryByText('Danh mục bổ sung')).not.toBeInTheDocument()
  })
})

it.each(['vi', 'en'] as const)(
  'distinguishes explicit empty from legacy snapshots in %s',
  (language) => {
    setLanguage(language)
    const { rerender } = render(
      <ChecklistSnapshotCard items={[]} snapshotAt={null} />,
    )
    const legacy =
      language === 'vi'
        ? 'Yêu cầu này chưa lưu danh sách nội dung giám sát.'
        : 'This request has no saved monitoring requirements.'
    const empty =
      language === 'vi'
        ? 'Yêu cầu được gửi không kèm nội dung giám sát.'
        : 'This request was submitted with no monitoring requirements.'
    expect(screen.getByText(legacy)).toBeInTheDocument()
    rerender(
      <ChecklistSnapshotCard items={[]} snapshotAt="2026-10-04T00:00:00Z" />,
    )
    expect(screen.getByText(empty)).toBeInTheDocument()
    expect(screen.queryByText(legacy)).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  },
)

describe.each([
  ['wizard', useSubmitOrder],
  ['quick form', useRequestSubmit],
] as const)('%s submission', (_, useSubmit) => {
  it('detects specific stale code, closes confirmation and prevents double submit', async () => {
    let reject!: (error: unknown) => void
    const create = vi.spyOn(customerApi, 'createOrder').mockImplementation(
      () =>
        new Promise((_, fail) => {
          reject = fail
        }),
    )
    const onTemplateChanged = vi.fn()
    const onError = vi.fn()
    const { result } = renderHook(() =>
      useSubmit({
        validate: () => true,
        buildPayload: () =>
          ({ checklistItems: [] }) as unknown as CreateOrderPayload,
        onError,
        onTemplateChanged,
      }),
    )
    act(() => result.current.openConfirm())
    act(() => {
      void result.current.submit()
      void result.current.submit()
    })
    expect(create).toHaveBeenCalledTimes(1)
    expect(create.mock.calls[0][0].checklistItems).toEqual([])
    await act(async () => reject(apiError('ORDER_CHECKLIST_TEMPLATE_CHANGED')))
    expect(onTemplateChanged).toHaveBeenCalledTimes(1)
    expect(result.current.confirmOpen).toBe(false)
    expect(onError).toHaveBeenLastCalledWith(
      expect.stringContaining('đã thay đổi'),
    )
    expect(result.current.submitting).toBe(false)
  })

  it('does not treat other conflicts as a stale checklist', async () => {
    vi.spyOn(customerApi, 'createOrder').mockRejectedValue(
      apiError('SERVICE_INACTIVE'),
    )
    const onTemplateChanged = vi.fn()
    const onError = vi.fn()
    const { result } = renderHook(() =>
      useSubmit({
        validate: () => true,
        buildPayload: () => ({}) as CreateOrderPayload,
        onError,
        onTemplateChanged,
      }),
    )
    await act(async () => result.current.submit())
    expect(onTemplateChanged).not.toHaveBeenCalled()
    expect(onError).toHaveBeenLastCalledWith(
      expect.stringContaining('không còn hoạt động'),
    )
  })
})

it('maps structured 400/401/403/404/server/network errors without exposing backend messages', () => {
  for (const status of [400, 401, 403, 404, 409, 500]) {
    const error = apiError('OTHER', status)
    expect(isStaleChecklist(error)).toBe(false)
    expect(checklistError(error)).not.toContain('technical secret')
  }
  expect(checklistError(new Error('stack trace'))).not.toContain('stack trace')
})

it('serializes checklist evidence requirements into the actual create request body', async () => {
  const bodies: Record<string, unknown>[] = []
  setHttpTransport(async (_url, init) => {
    bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>)
    return new Response(
      JSON.stringify({ success: true, data: { id: 'created' } }),
      { status: 200 },
    )
  })
  await customerApi.createOrder({
    checklistItems: [
      {
        sourceChecklistId: 'template-1',
        expectedChecklistVersion: 2,
        minimumEvidenceCount: 4,
        requiredEvidenceType: 'VIDEO',
      },
      {
        contentOverride: 'Custom item',
        minimumEvidenceCount: 2,
        requiredEvidenceType: 'IMAGE',
      },
    ],
  } as CreateOrderPayload)
  expect(bodies[0].checklistItems).toEqual([
    {
      sourceChecklistId: 'template-1',
      expectedChecklistVersion: 2,
      minimumEvidenceCount: 4,
      requiredEvidenceType: 'VIDEO',
    },
    {
      contentOverride: 'Custom item',
      minimumEvidenceCount: 2,
      requiredEvidenceType: 'IMAGE',
    },
  ])
})

it('uses the existing API transport and preserves omitted/null/[] request semantics', async () => {
  const bodies: Record<string, unknown>[] = []
  const transport = vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === 'POST') bodies.push(JSON.parse(String(init.body)))
    return new Response(
      JSON.stringify({
        success: true,
        data: url.includes('/checklists') ? template() : { id: 'created' },
      }),
      { status: 200 },
    )
  })
  setHttpTransport(transport)
  const controller = new AbortController()
  await customerApi.getServiceChecklist('a/b', controller.signal)
  expect(transport.mock.calls[0][0]).toContain('/api/services/a%2Fb/checklists')
  expect(transport.mock.calls[0][1]?.signal).toBe(controller.signal)
  for (const selection of [undefined, null, []]) {
    await customerApi.createOrder({
      checklistItems: selection,
    } as CreateOrderPayload)
  }
  expect(bodies[0]).not.toHaveProperty('checklistItems')
  expect(bodies[1].checklistItems).toBeNull()
  expect(bodies[2].checklistItems).toEqual([])
})

it('order detail renders stored snapshot in order, read only, without loading current template', async () => {
  const load = vi.spyOn(customerApi, 'getServiceChecklist')
  vi.spyOn(customerApi, 'getOrderById').mockResolvedValue({
    id: 'history',
    customerId: 'customer',
    title: 'History',
    orderStatus: 'APPROVED',
    serviceId: 'A',
    checklistSnapshotAt: '2026-10-04T00:00:00Z',
    checklistItems: [
      {
        id: 's2',
        sourceChecklistId: null,
        content: 'Stored custom',
        displayOrder: 2,
        sourceType: 'CUSTOMER_CUSTOM',
      },
      {
        id: 's1',
        sourceChecklistId: 'deleted-catalog',
        content: 'Stored original',
        displayOrder: 1,
        sourceType: 'SERVICE_TEMPLATE',
        minimumEvidenceCount: 2,
        requiredEvidenceType: 'IMAGE',
      },
    ],
  })
  render(<OrderDetailPage orderId="history" />)
  const region = await screen.findByRole('region', {
    name: 'Nội dung giám sát',
  })
  await within(region).findByText('Stored original')
  expect(
    within(region)
      .getAllByRole('listitem')
      .map((item) => item.querySelector('span')?.textContent),
  ).toEqual(['Stored original', 'Stored custom'])
  expect(within(region).getByText(/2 · Ảnh/)).toBeInTheDocument()
  expect(within(region).queryByRole('textbox')).not.toBeInTheDocument()
  expect(within(region).queryByRole('button')).not.toBeInTheDocument()
  expect(load).not.toHaveBeenCalled()
})
