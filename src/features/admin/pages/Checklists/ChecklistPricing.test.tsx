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
  basePrice: 200_000,
  includedImageCount: 10,
  includedVideoCount: 1,
  standardVideoDurationSeconds: 30,
  pricingProfile: 'STANDARD',
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
  basePrice: 200_000,
  includedImageCount: 10,
  includedVideoCount: 1,
  pricingProfile: 'STANDARD',
  checklistBasePrice: 200_000,
  checklistIncludedImageCount: 10,
  checklistIncludedVideoCount: 1,
  checklistPricingProfile: 'STANDARD',
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
      pricingProfile: 'STANDARD',
      custom: false,
      includedImageCount: 10,
      includedVideoCount: 1,
      requestedImageCount: 10,
      requestedVideoCount: 1,
      extraImageCount: 0,
      extraVideoCount: 0,
      standardVideoDurationSeconds: 30,
      subtotal: total,
      lines: [
        {
          component: 'BASE',
          category: 'CHECKLIST',
          description: 'Giá cơ bản checklist',
          quantity: 1,
          unitPrice: 200_000,
          amount: 200_000,
          tierFrom: null,
          tierTo: null,
          blockSize: null,
          rounding: null,
        },
        {
          component: 'INCLUDED_IMAGE',
          category: 'MEDIA',
          description: 'Đã bao gồm 10 ảnh',
          quantity: 1,
          unitPrice: 50_000,
          amount: 50_000,
          tierFrom: null,
          tierTo: null,
          blockSize: null,
          rounding: null,
        },
      ],
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
  vi.spyOn(checklistsApi, 'updatePricing').mockResolvedValue(row())
  vi.spyOn(checklistsApi, 'remove').mockResolvedValue(undefined)
  vi.spyOn(catalogApi, 'listServices').mockResolvedValue([
    { id: 's', name: 'Dịch vụ test', basePrice: 1_000_000, isActive: true },
  ])
  vi.spyOn(checklistPricingApi, 'defaultPrice').mockResolvedValue(preview())
  vi.spyOn(checklistPricingApi, 'adminPreview').mockResolvedValue(
    preview(420_000),
  )
})
afterEach(() => {
  vi.restoreAllMocks()
  window.location.hash = ''
})

describe('Checklist create/edit with media pricing', () => {
  it('shows the stored price and allowance in the catalog table', async () => {
    render(<ChecklistCatalogPage />)
    await screen.findByText(priced.content)
    expect(screen.getByText(/10 ảnh · 1 video · STANDARD/)).toBeInTheDocument()
  })

  it('prefills the pricing configuration when editing', async () => {
    render(<ChecklistCatalogPage />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Sửa checklist' }),
    )
    expect(screen.getByLabelText(/Giá công việc kiểm tra/)).toHaveValue(200_000)
    expect(screen.getByLabelText(/Số ảnh đã bao gồm/)).toHaveValue(10)
    expect(screen.getByLabelText(/Số video đã bao gồm/)).toHaveValue(1)
    expect(screen.getByLabelText(/Thời lượng video tiêu chuẩn/)).toHaveValue(30)
    // The pricing profile is not shown at all.
    expect(screen.queryByLabelText(/Hồ sơ giá/)).toBeNull()
  })

  it('sends the configured price and allowance without touching the pricing profile', async () => {
    render(<ChecklistCatalogPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Thêm checklist' }))
    fireEvent.change(screen.getByRole('textbox', { name: /Nội dung/ }), {
      target: { value: 'Kiểm tra cột' },
    })
    fireEvent.change(screen.getByLabelText(/Giá công việc kiểm tra/), {
      target: { value: '150000' },
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
        'BASIC',
        {
          description: '',
          executionSteps: [],
          inputRequirements: [],
          expectedOutputs: [],
          basePrice: 150_000,
          includedImageCount: 20,
          includedVideoCount: 2,
          standardVideoDurationSeconds: 45,
          areaPricingEnabled: false,
          lengthPricingEnabled: false,
          altitudePricingEnabled: false,
          includedAreaHa: 0,
          includedLengthKm: 0,
          includedAltitudeM: 0,
        },
      ),
    )
  })

  it.each([
    ['Giá công việc kiểm tra', '-1'],
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
    expect(await screen.findByText('Giá cơ bản checklist')).toBeInTheDocument()
    expect(screen.getByText('Đã bao gồm 10 ảnh')).toBeInTheDocument()
    expect(screen.getAllByText(/370\.000/).length).toBeGreaterThan(0)
    // price comes only from the checklists: no legacy package row is shown
    expect(screen.queryByText(/Giá gói cũ/)).toBeNull()
  })

  it('recalculates the price after a default checklist is removed', async () => {
    render(<ServiceChecklistPage serviceId="s" />)
    await screen.findByText('Giá cơ bản checklist')
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

  it('marks which values are service overrides and which are inherited', async () => {
    vi.mocked(checklistsApi.template).mockResolvedValue([
      row({ basePrice: 260_000, basePriceOverride: 260_000, required: true }),
    ])
    render(<ServiceChecklistPage serviceId="s" />)
    expect(await screen.findByTitle('Ghi đè')).toHaveTextContent('260.000')
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
      expect(checklistsApi.updatePricing).toHaveBeenCalledWith('s', 'a', {
        basePriceOverride: null,
        includedImageCountOverride: 20,
        includedVideoCountOverride: null,
        pricingProfileOverride: null,
        required: true,
        expectedVersion: 4,
      }),
    )
    // Only this service changed: the shared checklist is not rewritten.
    expect(checklistsApi.update).not.toHaveBeenCalled()
  })

  it('previews an unsaved override without saving it', async () => {
    render(<ServiceChecklistPage serviceId="s" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Cấu hình' }))
    fireEvent.change(
      await screen.findByLabelText(
        'Riêng cho dịch vụ này: Giá công việc kiểm tra (VND)',
      ),
      { target: { value: '250000' } },
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Xem thử giá với cấu hình chưa lưu' }),
    )
    await waitFor(() =>
      expect(checklistPricingApi.adminPreview).toHaveBeenCalledWith({
        serviceId: 's',
        items: [
          expect.objectContaining({ checklistId: 'a', basePrice: 250_000 }),
        ],
      }),
    )
    expect(checklistsApi.updatePricing).not.toHaveBeenCalled()
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
    expect(checklistsApi.updatePricing).not.toHaveBeenCalled()
  })

  it('keeps the stored pricing profile when the admin never touched it', async () => {
    render(<ChecklistCatalogPage />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Sửa checklist' }),
    )
    fireEvent.change(await screen.findByLabelText(/Giá công việc kiểm tra/), {
      target: { value: '210000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    await waitFor(() => expect(checklistsApi.update).toHaveBeenCalledTimes(1))
    const sent = vi.mocked(checklistsApi.update).mock.calls[0][3]
    // Left out of the request, so the backend keeps "STANDARD" instead of clearing it.
    expect(sent).not.toHaveProperty('pricingProfile')
    expect(sent).toMatchObject({ basePrice: 210_000 })
  })

  it('does not show a pricing profile column for the service and keeps its stored override', async () => {
    vi.spyOn(checklistsApi, 'template').mockResolvedValue([
      row({ pricingProfileOverride: 'PREMIUM_2' }),
    ])
    render(<ServiceChecklistPage serviceId="s" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Cấu hình' }))
    await screen.findByLabelText('Riêng cho dịch vụ này: Số ảnh đã bao gồm')
    expect(
      screen.queryByLabelText(/Riêng cho dịch vụ này: Hồ sơ giá/),
    ).toBeNull()
    fireEvent.click(screen.getByLabelText(/Bắt buộc/))
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    await waitFor(() =>
      expect(checklistsApi.updatePricing).toHaveBeenCalledWith(
        's',
        'a',
        expect.objectContaining({ pricingProfileOverride: 'PREMIUM_2' }),
      ),
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
      expect(checklistsApi.updatePricing).toHaveBeenCalledWith(
        's',
        'a',
        expect.objectContaining({ includedImageCountOverride: null }),
      ),
    )
  })
})

describe('parseOverrides', () => {
  const form = {
    basePrice: '',
    images: '',
    videos: '',
    profile: '',
    required: false,
  }
  it('treats blank fields as inherit', () => {
    expect(parseOverrides(form)).toEqual({
      ok: true,
      value: {
        basePriceOverride: null,
        includedImageCountOverride: null,
        includedVideoCountOverride: null,
        pricingProfileOverride: null,
        required: false,
      },
    })
  })
  it('rejects negatives, fractions, excess and bad profiles', () => {
    expect(parseOverrides({ ...form, basePrice: '-1' }).ok).toBe(false)
    expect(parseOverrides({ ...form, images: '1.5' }).ok).toBe(false)
    expect(parseOverrides({ ...form, videos: '501' }).ok).toBe(false)
    expect(parseOverrides({ ...form, profile: 'a b' }).ok).toBe(false)
  })
})
