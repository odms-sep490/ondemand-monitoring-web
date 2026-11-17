import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ChecklistCatalogPage } from './ChecklistCatalogPage'
import { ServiceChecklistPage } from './ServiceChecklistPage'
import { parseOverrides } from '../../lib/serviceOverrides'
import {
  checklistsApi,
  type ChecklistDefinition,
  type ServiceChecklist,
} from '../../api/checklistsApi'
import { catalogApi } from '../../api/catalogApi'
import {
  checklistPricingApi,
  type ServicePricePreview,
} from '../../../../shared/api/checklistPricingApi'

const priced: ChecklistDefinition = {
  id: 'a',
  content: 'Kiểm tra mái nhà',
  isActive: true,
  version: 3,
  createdAt: '2026-10-05T00:00:00Z',
  updatedAt: null,
  includedImageCount: 10,
  includedVideoCount: 1,
  standardVideoDurationSeconds: 30,
}
const page = (items = [priced]) => ({
  items,
  page: 0,
  totalItems: items.length,
  totalPages: 1,
  first: true,
  last: true,
})
const row = (patch: Partial<ServiceChecklist> = {}): ServiceChecklist => ({
  id: 'link',
  serviceId: 's',
  serviceName: 'Dịch vụ test',
  serviceActive: true,
  checklistId: 'a',
  content: priced.content,
  checklistActive: true,
  displayOrder: 0,
  version: 4,
  checklistVersion: 3,
  includedImageCount: 10,
  includedVideoCount: 1,
  checklistIncludedImageCount: 10,
  checklistIncludedVideoCount: 1,
  ...patch,
})
const preview = (total = 370_000): ServicePricePreview => ({
  serviceId: 's',
  serviceName: 'Dịch vụ test',
  currency: 'VND',
  policyId: 'p',
  policyVersion: 4,
  draftPolicy: false,
  priceSource: 'CHECKLISTS',
  packageFee: 0,
  checklistSubtotal: total,
  total,
  complete: true,
  warnings: [],
  quotePending: false,
  checklists: [
    {
      checklistId: 'a',
      content: priced.content,
      custom: false,
      includedImageCount: 10,
      includedVideoCount: 1,
      requestedImageCount: 10,
      requestedVideoCount: 1,
      extraImageCount: 0,
      extraVideoCount: 0,
      standardVideoDurationSeconds: 30,
      basePrice: 200_000,
      standardAreaM2: 100,
      actualAreaM2: total / 2_000,
      calculationDisplay: `200000 × (${total / 2_000} / 100) = ${total} VNĐ`,
      subtotal: total,
      lines: [],
      quotePending: false,
    },
  ],
})

beforeEach(() => {
  vi.spyOn(checklistsApi, 'list').mockResolvedValue(page())
  vi.spyOn(checklistsApi, 'create').mockResolvedValue(priced)
  vi.spyOn(checklistsApi, 'update').mockResolvedValue(priced)
  vi.spyOn(checklistsApi, 'get').mockResolvedValue(priced)
  vi.spyOn(checklistsApi, 'template').mockResolvedValue([row()])
  vi.spyOn(checklistsApi, 'updateRequirements').mockResolvedValue(row())
  vi.spyOn(checklistsApi, 'remove').mockResolvedValue(undefined)
  vi.spyOn(catalogApi, 'listServices').mockResolvedValue([
    { id: 's', name: 'Dịch vụ test', defaultPrice: 1_000_000, isActive: true },
  ])
  vi.spyOn(checklistPricingApi, 'defaultPrice').mockResolvedValue(preview())
})
afterEach(() => {
  vi.restoreAllMocks()
  window.location.hash = ''
})

describe('Checklist evidence configuration', () => {
  it('shows included evidence counts in the catalog table without pricing profiles', async () => {
    render(<ChecklistCatalogPage />)
    await screen.findByText(priced.content)
    expect(screen.getByText(/10 ảnh.*1 video/)).toBeInTheDocument()
    expect(screen.queryByText('STANDARD')).toBeNull()
  })

  it('prefills evidence requirements without showing price or profile fields', async () => {
    render(<ChecklistCatalogPage />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Sửa checklist' }),
    )
    expect(screen.queryByLabelText(/Giá công việc kiểm tra/)).toBeNull()
    expect(screen.getByLabelText(/Số ảnh đã bao gồm/)).toHaveValue(10)
    expect(screen.getByLabelText(/Số video đã bao gồm/)).toHaveValue(1)
    expect(screen.getByLabelText(/Thời lượng video tiêu chuẩn/)).toHaveValue(30)
    expect(screen.queryByLabelText(/Hồ sơ giá/)).toBeNull()
  })

  it('sends evidence requirements and guidance while leaving Base Checklist price untouched', async () => {
    render(<ChecklistCatalogPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Thêm checklist' }))
    fireEvent.change(screen.getByRole('textbox', { name: /Nội dung/ }), {
      target: { value: 'Kiểm tra cột' },
    })
    fireEvent.change(screen.getByLabelText(/Số ảnh đã bao gồm/), {
      target: { value: '20' },
    })
    fireEvent.change(screen.getByLabelText(/Số video đã bao gồm/), {
      target: { value: '2' },
    })
    fireEvent.change(screen.getByLabelText(/Thời lượng video tiêu chuẩn/), {
      target: { value: '45' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    await waitFor(() =>
      expect(checklistsApi.create).toHaveBeenCalledWith(
        'Kiểm tra cột',
        {
          description: '',
          executionSteps: [],
          inputRequirements: [],
          expectedOutputs: [],
          includedImageCount: 20,
          includedVideoCount: 2,
          standardVideoDurationSeconds: 45,
        },
      ),
    )
  })

  it.each([
    ['Số ảnh đã bao gồm', '501'],
    ['Số video đã bao gồm', '1.5'],
    ['Thời lượng video tiêu chuẩn', '7201'],
  ])('rejects %s = %s before any request', async (label, value) => {
    render(<ChecklistCatalogPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Thêm checklist' }))
    fireEvent.change(screen.getByRole('textbox', { name: /Nội dung/ }), {
      target: { value: 'Kiểm tra cột' },
    })
    fireEvent.change(screen.getByLabelText(new RegExp(label)), {
      target: { value },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    expect((await screen.findAllByRole('alert')).length).toBeGreaterThan(0)
    expect(checklistsApi.create).not.toHaveBeenCalled()
  })
})

describe('Service default checklists and price', () => {
  it('shows the backend-calculated default price with its breakdown', async () => {
    render(<ServiceChecklistPage serviceId="s" />)
    expect(
      await screen.findByText('Giá mặc định của dịch vụ'),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(checklistPricingApi.defaultPrice).toHaveBeenCalledWith(
        's',
        expect.any(AbortSignal),
      ),
    )
    expect(
      await screen.findByText('200000 × (185 / 100) = 370000 VNĐ'),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/370\.000/).length).toBeGreaterThan(0)
    // price comes only from the checklists: no legacy package row is shown
    expect(screen.queryByText(/Giá gói cũ/)).toBeNull()
  })

  it('recalculates the price after a default checklist is removed', async () => {
    render(<ServiceChecklistPage serviceId="s" />)
    await screen.findByText('200000 × (185 / 100) = 370000 VNĐ')
    const before = vi.mocked(checklistPricingApi.defaultPrice).mock.calls.length
    fireEvent.click(
      await screen.findByRole('button', { name: /Gỡ checklist:/ }),
    )
    fireEvent.click(
      (await screen.findAllByRole('button', { name: 'Gỡ checklist' })).at(-1)!,
    )
    await waitFor(() =>
      expect(
        vi.mocked(checklistPricingApi.defaultPrice).mock.calls.length,
      ).toBeGreaterThan(before),
    )
  })

  it('marks evidence allowances that are service overrides', async () => {
    vi.mocked(checklistsApi.template).mockResolvedValue([
      row({ includedImageCount: 26, includedImageCountOverride: 26, required: true }),
    ])
    render(<ServiceChecklistPage serviceId="s" />)
    expect(await screen.findByTitle('Ghi đè')).toHaveTextContent('26 ảnh')
    expect(screen.getAllByTitle('Kế thừa').length).toBeGreaterThan(0)
    expect(screen.getByText('Bắt buộc')).toBeInTheDocument()
  })

  it('saves per-service overrides with the association version and leaves blanks inherited', async () => {
    render(<ServiceChecklistPage serviceId="s" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Cấu hình' }))
    fireEvent.change(
      await screen.findByLabelText('Riêng cho dịch vụ này: Số ảnh đã bao gồm'),
      { target: { value: '20' } },
    )
    fireEvent.click(screen.getByLabelText(/Bắt buộc/))
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    await waitFor(() =>
      expect(checklistsApi.updateRequirements).toHaveBeenCalledWith('s', 'a', {
        includedImageCountOverride: 20,
        includedVideoCountOverride: null,
        required: true,
        expectedVersion: 4,
      }),
    )
    // Only this service changed: the shared checklist is not rewritten.
    expect(checklistsApi.update).not.toHaveBeenCalled()
  })

  it('does not send an invalid override', async () => {
    render(<ServiceChecklistPage serviceId="s" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Cấu hình' }))
    fireEvent.change(
      await screen.findByLabelText(
        'Riêng cho dịch vụ này: Số video đã bao gồm',
      ),
      { target: { value: '-3' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(checklistsApi.updateRequirements).not.toHaveBeenCalled()
  })

  it('does not send legacy pricing fields when updating evidence requirements', async () => {
    render(<ChecklistCatalogPage />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Sửa checklist' }),
    )
    fireEvent.change(await screen.findByLabelText(/Số ảnh đã bao gồm/), {
      target: { value: '12' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    await waitFor(() => expect(checklistsApi.update).toHaveBeenCalledTimes(1))
    const sent = vi.mocked(checklistsApi.update).mock.calls[0][2]
    expect(sent).not.toHaveProperty('basePrice')
    expect(sent).not.toHaveProperty('pricingProfile')
    expect(sent).not.toHaveProperty('areaPricingEnabled')
    expect(sent).toMatchObject({ includedImageCount: 12 })
  })

  it('does not show or resend a legacy service pricing profile', async () => {
    vi.spyOn(checklistsApi, 'template').mockResolvedValue([
      row(),
    ])
    render(<ServiceChecklistPage serviceId="s" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Cấu hình' }))
    await screen.findByLabelText('Riêng cho dịch vụ này: Số ảnh đã bao gồm')
    expect(screen.queryByLabelText(/Hồ sơ giá/)).toBeNull()
    fireEvent.click(screen.getByLabelText(/Bắt buộc/))
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    await waitFor(() =>
      expect(checklistsApi.updateRequirements).toHaveBeenCalledWith('s', 'a', {
        includedImageCountOverride: null,
        includedVideoCountOverride: null,
        required: true,
        expectedVersion: 4,
      }),
    )
  })

  it('treats an override equal to the base value as inherited', async () => {
    render(<ServiceChecklistPage serviceId="s" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Cấu hình' }))
    fireEvent.change(
      await screen.findByLabelText('Riêng cho dịch vụ này: Số ảnh đã bao gồm'),
      { target: { value: '10' } },
    )
    fireEvent.click(screen.getByLabelText(/Bắt buộc/))
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    await waitFor(() =>
      expect(checklistsApi.updateRequirements).toHaveBeenCalledWith(
        's',
        'a',
        expect.objectContaining({ includedImageCountOverride: null }),
      ),
    )
  })
})

describe('parseOverrides', () => {
  const form = {
    images: '',
    videos: '',
    required: false,
  }
  it('treats blank fields as inherit', () => {
    expect(parseOverrides(form)).toEqual({
      ok: true,
      value: {
        includedImageCountOverride: null,
        includedVideoCountOverride: null,
        required: false,
      },
    })
  })
  it('rejects negative, fractional and excess evidence counts', () => {
    expect(parseOverrides({ ...form, images: '1.5' }).ok).toBe(false)
    expect(parseOverrides({ ...form, videos: '501' }).ok).toBe(false)
  })
})
