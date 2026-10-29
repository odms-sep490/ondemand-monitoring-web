import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { ChecklistCatalogPage } from './ChecklistCatalogPage'
import { ServiceChecklistPage } from './ServiceChecklistPage'
import {
  checklistsApi,
  type ChecklistAudit,
  type ChecklistDefinition,
  type ServiceChecklist,
} from '../../api/checklistsApi'
import { catalogApi } from '../../api/catalogApi'
import { checklistPricingApi } from '../../../../shared/api/checklistPricingApi'

const shared: ChecklistDefinition = {
  id: 'a',
  content: 'Kiểm tra mái nhà',
  description: 'Phạm vi kiểm tra mái',
  executionSteps: ['Bay lưới song song', 'Chụp cận'],
  isActive: true,
  version: 3,
  createdAt: '2026-10-05T00:00:00Z',
  updatedAt: null,
  basePrice: 200_000,
  includedImageCount: 10,
  includedVideoCount: 1,
  usedByServiceCount: 3,
  usedByOrderCount: 12,
}
const link = (patch: Partial<ServiceChecklist> = {}): ServiceChecklist => ({
  id: 'link',
  serviceId: 's',
  serviceName: 'Dịch vụ test',
  serviceActive: true,
  checklistId: 'a',
  content: shared.content,
  checklistActive: true,
  displayOrder: 0,
  version: 4,
  checklistVersion: 3,
  basePrice: 200_000,
  includedImageCount: 10,
  includedVideoCount: 1,
  checklistBasePrice: 200_000,
  checklistIncludedImageCount: 10,
  checklistIncludedVideoCount: 1,
  usedByServiceCount: 3,
  ...patch,
})
const page = (items = [shared]) => ({
  items,
  page: 0,
  totalItems: items.length,
  totalPages: 1,
  first: true,
  last: true,
})
const audit = (patch: Partial<ChecklistAudit> = {}): ChecklistAudit => ({
  id: 'e1',
  action: 'CHECKLIST_UPDATED',
  checklistId: 'a',
  checklistContent: shared.content,
  serviceId: null,
  serviceName: null,
  actorId: 'u1',
  actorName: 'Admin An',
  changes: [{ field: 'basePrice', from: '200000', to: '250000' }],
  createdAt: '2026-10-06T08:30:00Z',
  ...patch,
})

beforeEach(() => {
  vi.spyOn(checklistsApi, 'list').mockResolvedValue(page())
  vi.spyOn(checklistsApi, 'get').mockResolvedValue(shared)
  vi.spyOn(checklistsApi, 'update').mockResolvedValue(shared)
  vi.spyOn(checklistsApi, 'updatePricing').mockResolvedValue(link())
  vi.spyOn(checklistsApi, 'template').mockResolvedValue([link()])
  vi.spyOn(checklistsApi, 'fork').mockResolvedValue(link({ checklistId: 'a2' }))
  vi.spyOn(checklistsApi, 'audits').mockResolvedValue({
    items: [audit()],
    page: 0,
    totalItems: 1,
    totalPages: 1,
    first: true,
    last: true,
  })
  vi.spyOn(catalogApi, 'listServices').mockResolvedValue([
    { id: 's', name: 'Dịch vụ test', basePrice: 3_200_000, isActive: true },
  ])
  vi.spyOn(checklistPricingApi, 'defaultPrice').mockRejectedValue(
    new Error('n/a'),
  )
})
afterEach(() => {
  vi.restoreAllMocks()
  window.location.hash = ''
})

describe('Library page', () => {
  it('shows how many services and orders use each checklist', async () => {
    render(<ChecklistCatalogPage />)
    expect(
      await screen.findByRole('button', { name: '3 dịch vụ · 12 đơn' }),
    ).toBeInTheDocument()
  })

  it('makes the admin acknowledge a change to a checklist shared by several services', async () => {
    render(<ChecklistCatalogPage />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Sửa checklist' }),
    )
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('note')).toHaveTextContent(
      'đang dùng ở 3 dịch vụ',
    )
    // Nothing changed yet, so there is nothing to acknowledge.
    expect(within(dialog).getByRole('button', { name: 'Lưu' })).toBeEnabled()
    fireEvent.change(within(dialog).getByLabelText(/Mô tả chi tiết/), {
      target: { value: 'Mô tả mới' },
    })
    const save = within(dialog).getByRole('button', { name: 'Lưu' })
    expect(save).toBeDisabled()
    fireEvent.click(
      within(dialog).getByLabelText(
        'Tôi hiểu thay đổi này áp dụng cho 3 dịch vụ',
      ),
    )
    expect(save).toBeEnabled()
    fireEvent.click(save)
    await waitFor(() => expect(checklistsApi.update).toHaveBeenCalledTimes(1))
  })

  it('does not gate a checklist that only one service uses', async () => {
    vi.spyOn(checklistsApi, 'list').mockResolvedValue(
      page([{ ...shared, usedByServiceCount: 1 }]),
    )
    render(<ChecklistCatalogPage />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Sửa checklist' }),
    )
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).queryByRole('note')).toBeNull()
    fireEvent.change(within(dialog).getByLabelText(/Mô tả chi tiết/), {
      target: { value: 'Mô tả mới' },
    })
    expect(within(dialog).getByRole('button', { name: 'Lưu' })).toBeEnabled()
  })

  it('shows the change history in the same dialog', async () => {
    render(<ChecklistCatalogPage />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Sửa checklist' }),
    )
    fireEvent.click(
      await screen.findByRole('button', { name: 'Lịch sử thay đổi' }),
    )
    expect(
      await screen.findByText('Sửa nội dung dùng chung'),
    ).toBeInTheDocument()
    expect(screen.getByText(/bởi Admin An/)).toBeInTheDocument()
    expect(screen.getByText('Giá công việc')).toBeInTheDocument()
    expect(screen.getByText('200000')).toBeInTheDocument()
    expect(screen.getByText('250000')).toBeInTheDocument()
    expect(checklistsApi.audits).toHaveBeenCalledWith(
      { checklistId: 'a', page: 0 },
      expect.anything(),
    )
  })

  it('says so when there is no history yet', async () => {
    vi.spyOn(checklistsApi, 'audits').mockResolvedValue({
      items: [],
      page: 0,
      totalItems: 0,
      totalPages: 0,
      first: true,
      last: true,
    })
    render(<ChecklistCatalogPage />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Sửa checklist' }),
    )
    fireEvent.click(
      await screen.findByRole('button', { name: 'Lịch sử thay đổi' }),
    )
    expect(
      await screen.findByText('Chưa có thay đổi nào được ghi nhận.'),
    ).toBeInTheDocument()
  })
})

describe('Service configuration page', () => {
  it('marks checklists shared with other services', async () => {
    render(<ServiceChecklistPage serviceId="s" />)
    expect(await screen.findByText('Dùng ở 3 dịch vụ')).toBeInTheDocument()
  })

  it('splits the form into a content page and a price page instead of one long scroll', async () => {
    render(<ServiceChecklistPage serviceId="s" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Cấu hình' }))
    const dialog = await screen.findByRole('dialog')
    expect(
      await within(dialog).findByRole('tab', {
        name: 'Nội dung',
        selected: true,
      }),
    ).toBeInTheDocument()
    expect(
      within(dialog)
        .getByLabelText(/Mô tả chi tiết/)
        .closest('[aria-hidden="true"]'),
    ).toBeNull()
    expect(within(dialog).getByLabelText(/Mô tả chi tiết/)).toHaveValue(
      'Phạm vi kiểm tra mái',
    )
    // The price page is not on screen until it is opened.
    expect(
      within(dialog)
        .getByLabelText('Giá công việc kiểm tra (VND)')
        .closest('[aria-hidden="true"]'),
    ).not.toBeNull()
    fireEvent.click(
      within(dialog).getByRole('tab', { name: 'Giá và định mức' }),
    )
    // Both scopes of the same price sit side by side, with labels that tell them apart.
    expect(
      within(dialog)
        .getByLabelText('Giá công việc kiểm tra (VND)')
        .closest('[aria-hidden="true"]'),
    ).toBeNull()
    expect(
      within(dialog).getByLabelText('Giá công việc kiểm tra (VND)'),
    ).toHaveValue(200_000)
    expect(
      within(dialog).getByLabelText(
        'Riêng cho dịch vụ này: Giá công việc kiểm tra (VND)',
      ),
    ).toHaveValue(null)
    expect(
      within(dialog)
        .getByLabelText(/Mô tả chi tiết/)
        .closest('[aria-hidden="true"]'),
    ).not.toBeNull()
    expect(checklistsApi.get).toHaveBeenCalledWith('a', expect.anything())
  })

  it('takes the admin to the page that has the problem', async () => {
    render(<ServiceChecklistPage serviceId="s" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Cấu hình' }))
    fireEvent.click(await screen.findByRole('tab', { name: 'Giá và định mức' }))
    fireEvent.change(
      screen.getByLabelText('Riêng cho dịch vụ này: Số ảnh đã bao gồm'),
      {
        target: { value: '-3' },
      },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    expect(
      await within(screen.getByRole('dialog')).findByRole('alert'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('tab', { name: 'Giá và định mức', selected: true }),
    ).toBeInTheDocument()
    // An empty content jumps back to the content page.
    fireEvent.click(screen.getByRole('tab', { name: 'Nội dung' }))
    fireEvent.change(screen.getByRole('textbox', { name: /^Nội dung/ }), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByRole('tab', { name: 'Giá và định mức' }))
    // The content change touches a shared checklist, so it has to be acknowledged before saving.
    fireEvent.click(
      screen.getByLabelText('Tôi hiểu thay đổi này áp dụng cho 3 dịch vụ'),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    await waitFor(() =>
      expect(
        screen.getByRole('tab', { name: 'Nội dung', selected: true }),
      ).toBeInTheDocument(),
    )
  })

  it('lets the admin change only this service without touching the shared checklist or acknowledging anything', async () => {
    render(<ServiceChecklistPage serviceId="s" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Cấu hình' }))
    fireEvent.change(
      await screen.findByLabelText(
        'Riêng cho dịch vụ này: Giá công việc kiểm tra (VND)',
      ),
      { target: { value: '700000' } },
    )
    const save = screen.getByRole('button', { name: 'Lưu' })
    expect(save).toBeEnabled()
    fireEvent.click(save)
    await waitFor(() =>
      expect(checklistsApi.updatePricing).toHaveBeenCalledTimes(1),
    )
    expect(checklistsApi.update).not.toHaveBeenCalled()
  })

  it('asks for acknowledgement before a shared change and saves both parts in order', async () => {
    render(<ServiceChecklistPage serviceId="s" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Cấu hình' }))
    fireEvent.change(
      await screen.findByLabelText('Giá công việc kiểm tra (VND)'),
      {
        target: { value: '900000' },
      },
    )
    fireEvent.change(
      screen.getByLabelText('Riêng cho dịch vụ này: Số ảnh đã bao gồm'),
      { target: { value: '20' } },
    )
    const save = screen.getByRole('button', { name: 'Lưu' })
    expect(save).toBeDisabled()
    fireEvent.click(
      screen.getByLabelText('Tôi hiểu thay đổi này áp dụng cho 3 dịch vụ'),
    )
    fireEvent.click(save)
    await waitFor(() =>
      expect(checklistsApi.updatePricing).toHaveBeenCalledTimes(1),
    )
    expect(checklistsApi.update).toHaveBeenCalledWith(
      'a',
      'Kiểm tra mái nhà',
      'BASIC',
      expect.objectContaining({ basePrice: 900_000 }),
    )
    expect(
      vi.mocked(checklistsApi.update).mock.invocationCallOrder[0],
    ).toBeLessThan(
      vi.mocked(checklistsApi.updatePricing).mock.invocationCallOrder[0],
    )
  })

  it('offers a private copy of a shared checklist and moves only this service onto it', async () => {
    render(<ServiceChecklistPage serviceId="s" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Cấu hình' }))
    expect(
      await screen.findByText('Chỉ muốn đổi cho dịch vụ này?'),
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Tạo bản sao riêng cho dịch vụ này' }),
    )
    // A confirmation step guards the action.
    expect(checklistsApi.fork).not.toHaveBeenCalled()
    fireEvent.click(
      within(
        screen.getByText(/Tạo bản sao riêng và chuyển/).parentElement!,
      ).getByRole('button', {
        name: 'Tạo bản sao riêng cho dịch vụ này',
      }),
    )
    await waitFor(() =>
      expect(checklistsApi.fork).toHaveBeenCalledWith('s', 'a'),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('does not offer a copy when only this service uses the checklist', async () => {
    vi.spyOn(checklistsApi, 'get').mockResolvedValue({
      ...shared,
      usedByServiceCount: 1,
    })
    render(<ServiceChecklistPage serviceId="s" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Cấu hình' }))
    await screen.findByLabelText(/Mô tả chi tiết/)
    expect(screen.queryByText('Chỉ muốn đổi cho dịch vụ này?')).toBeNull()
    expect(screen.queryByRole('note')).toBeNull()
  })

  it('shows this checklist history, including what other services did with it', async () => {
    vi.spyOn(checklistsApi, 'audits').mockResolvedValue({
      items: [
        audit({
          action: 'SERVICE_CHECKLIST_UPDATED',
          serviceId: 's2',
          serviceName: 'Dịch vụ khác',
          changes: [{ field: 'required', from: 'false', to: 'true' }],
        }),
      ],
      page: 0,
      totalItems: 1,
      totalPages: 1,
      first: true,
      last: true,
    })
    render(<ServiceChecklistPage serviceId="s" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Cấu hình' }))
    fireEvent.click(
      await screen.findByRole('button', { name: 'Lịch sử thay đổi' }),
    )
    expect(
      await screen.findByText('Sửa cấu hình theo dịch vụ'),
    ).toBeInTheDocument()
    expect(screen.getByText('Dịch vụ: Dịch vụ khác')).toBeInTheDocument()
  })
})
