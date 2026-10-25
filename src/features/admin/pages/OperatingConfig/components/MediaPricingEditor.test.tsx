import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { useState } from 'react'
import { MediaPricingEditor } from './MediaPricingEditor'
import { PricingPolicyTab } from './PricingPolicyTab'
import { adminApi } from '../../../api/adminApi'
import { catalogApi } from '../../../api/catalogApi'
import { checklistsApi } from '../../../api/checklistsApi'
import { newMediaRule } from '../../../lib/mediaPricingRules'
import { checklistPricingApi } from '../../../../../shared/api/checklistPricingApi'
import { setLanguage } from '../../../../../shared/i18n'
import type { PricingPolicy, PricingRule } from '../../../types/pricing'

beforeEach(() => {
  setLanguage('vi')
  vi.spyOn(catalogApi, 'listServices').mockResolvedValue([
    { id: 's', name: 'Dịch vụ test', basePrice: 1_000_000, isActive: true },
  ])
  vi.spyOn(checklistsApi, 'list').mockResolvedValue({
    items: [
      {
        id: 'checklist-x',
        content: 'Kiểm tra tình trạng tổng thể công trình',
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: null,
        version: 1,
        basePrice: 100_000,
        includedImageCount: 1,
        includedVideoCount: 1,
        pricingProfile: 'STANDARD',
      },
    ],
    page: 0,
    totalItems: 1,
    totalPages: 1,
    first: true,
    last: true,
  })
})
afterEach(() => vi.restoreAllMocks())

const tier = (from: number, to: number | null, price: number): PricingRule => ({
  ...newMediaRule('STANDARD', 'EXTRA_IMAGE', []),
  ruleKey: `STANDARD:EXTRA_IMAGE:${from}`,
  minValue: from,
  maxValue: to,
  unitSize: 10,
  fixedAmount: price,
})

function Harness({
  initial,
  onRules,
}: {
  initial: PricingRule[]
  onRules?: (r: PricingRule[]) => void
}) {
  const [rules, setRules] = useState(initial)
  return (
    <MediaPricingEditor
      rules={rules}
      draftId="draft-1"
      onChange={(next) => {
        setRules(next)
        onRules?.(next)
      }}
    />
  )
}

describe('MediaPricingEditor', () => {
  it('separates included media from extra media tiers', () => {
    render(
      <Harness
        initial={[
          {
            ...newMediaRule('STANDARD', 'INCLUDED_IMAGE', []),
            fixedAmount: 50_000,
          },
          tier(0, 10, 50_000),
          tier(10, null, 40_000),
        ]}
      />,
    )
    expect(screen.getByText(/Ảnh\/video đã bao gồm/)).toBeInTheDocument()
    expect(screen.getByText(/Ảnh\/video bổ sung/)).toBeInTheDocument()
    expect(screen.getAllByTestId('media-rule')).toHaveLength(3)
  })

  it('edits a tier price and block size through the rule list', () => {
    const seen: PricingRule[][] = []
    render(
      <Harness
        initial={[tier(0, null, 50_000)]}
        onRules={(r) => seen.push(r)}
      />,
    )
    const row = screen.getByTestId('media-rule')
    fireEvent.change(within(row).getByLabelText('Giá mỗi khối (VND)'), {
      target: { value: '45000' },
    })
    fireEvent.change(within(row).getByLabelText('Kích thước khối'), {
      target: { value: '5' },
    })
    expect(seen.at(-1)![0]).toMatchObject({ fixedAmount: 45_000, unitSize: 5 })
  })

  it('adds a continuing tier for a profile and removes a rule', () => {
    const seen: PricingRule[][] = []
    render(
      <Harness initial={[tier(0, 10, 50_000)]} onRules={(r) => seen.push(r)} />,
    )
    fireEvent.change(screen.getByPlaceholderText('Tên hồ sơ giá mới'), {
      target: { value: 'standard' },
    })
    fireEvent.change(screen.getByLabelText('Thành phần'), {
      target: { value: 'EXTRA_IMAGE' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Thêm quy tắc' }))
    expect(seen.at(-1)).toHaveLength(2)
    expect(seen.at(-1)![1]).toMatchObject({
      pricingProfile: 'STANDARD',
      minValue: 10,
    })
    fireEvent.click(screen.getAllByRole('button', { name: 'Xóa' })[0])
    expect(seen.at(-1)).toHaveLength(1)
  })

  it('reports overlapping tiers next to the rows', () => {
    render(<Harness initial={[tier(0, 10, 50_000), tier(5, null, 40_000)]} />)
    expect(
      screen.getAllByText('Các bậc giá chồng lấn.').length,
    ).toBeGreaterThan(0)
    expect(screen.getByText(/Cần sửa trước khi lưu: 1/)).toBeInTheDocument()
  })

  it('adds an extra-image rule targeted to a selected checklist', async () => {
    const seen: PricingRule[][] = []
    render(<Harness initial={[]} onRules={(rules) => seen.push(rules)} />)

    fireEvent.change(await screen.findByLabelText('Checklist áp dụng'), {
      target: { value: 'checklist-x' },
    })
    expect(screen.getByText(/Giá cơ bản: 100\.000 VND/)).toBeInTheDocument()
    expect(screen.getByText(/Đã bao gồm: 1 ảnh · 1 video/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Thành phần'), {
      target: { value: 'EXTRA_IMAGE' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Thêm quy tắc' }))

    expect(seen.at(-1)?.at(-1)).toMatchObject({
      checklistDefinitionId: 'checklist-x',
      checklistDefinitionName: 'Kiểm tra tình trạng tổng thể công trình',
      pricingProfile: 'STANDARD',
      mediaComponent: 'EXTRA_IMAGE',
    })
  })

  it('previews a price with the saved draft policy', async () => {
    const adminPreview = vi
      .spyOn(checklistPricingApi, 'adminPreview')
      .mockResolvedValue({
        serviceId: 's',
        serviceName: 'Dịch vụ test',
        currency: 'VND',
        policyId: 'draft-1',
        policyVersion: 5,
        draftPolicy: true,
        priceSource: 'CHECKLISTS',
        packageFee: 0,
        checklists: [],
        checklistSubtotal: 0,
        total: 1_000_000,
        complete: true,
        warnings: [],
        quotePending: false,
      })
    render(<Harness initial={[tier(0, null, 50_000)]} />)
    await screen.findByRole('option', { name: 'Dịch vụ test' })
    fireEvent.click(screen.getByRole('button', { name: 'Xem thử' }))
    await waitFor(() =>
      expect(adminPreview).toHaveBeenCalledWith({
        serviceId: 's',
        policyId: 'draft-1',
        items: undefined,
        areaHa: 0,
        lengthKm: 0,
        altitudeM: 0,
      }),
    )
    expect(
      await screen.findByText('Chính sách giá v5 (bản nháp)'),
    ).toBeInTheDocument()
  })
})

describe('PricingPolicyTab with MEDIA rules', () => {
  const draft: PricingPolicy = {
    id: 'draft-1',
    name: 'Draft',
    version: 2,
    status: 'DRAFT',
    currency: 'VND',
    effectiveFrom: null,
    effectiveTo: null,
    managerMaxDiscountPercent: 25,
    managerMaxMarkupPercent: 25,
    highRiskDiscountPercent: 10,
    minimumPriceRatio: 0.75,
    minimumPrice: 100_000,
    rules: [tier(0, 10, 50_000), tier(5, null, 40_000)],
  }

  it('does not save or publish a draft whose tiers overlap', async () => {
    vi.spyOn(adminApi, 'listPricingPolicies').mockResolvedValue([draft])
    const update = vi
      .spyOn(adminApi, 'updatePricingPolicy')
      .mockResolvedValue(draft)
    const publish = vi
      .spyOn(adminApi, 'publishPricingPolicy')
      .mockResolvedValue(draft)
    render(<PricingPolicyTab />)
    const save = (
      await screen.findAllByRole('button', { name: 'Lưu bản nháp' })
    )[0]
    expect(save).toBeDisabled()
    expect(
      screen.getAllByRole('button', { name: 'Áp dụng' })[0],
    ).toBeDisabled()
    fireEvent.click(save)
    expect(update).not.toHaveBeenCalled()
    expect(publish).not.toHaveBeenCalled()
  })

  it('saves the media fields of a valid draft', async () => {
    const valid = {
      ...draft,
      rules: [tier(0, 10, 50_000), tier(10, null, 40_000)],
    }
    vi.spyOn(adminApi, 'listPricingPolicies').mockResolvedValue([valid])
    const update = vi
      .spyOn(adminApi, 'updatePricingPolicy')
      .mockResolvedValue(valid)
    render(<PricingPolicyTab />)
    fireEvent.click(
      (await screen.findAllByRole('button', { name: 'Lưu bản nháp' }))[0],
    )
    await waitFor(() => expect(update).toHaveBeenCalled())
    const body = update.mock.calls[0][1]
    expect(body.rules).toHaveLength(2)
    expect(body.rules[1]).toMatchObject({
      category: 'MEDIA',
      pricingProfile: 'STANDARD',
      mediaComponent: 'EXTRA_IMAGE',
      minValue: 10,
      maxValue: null,
      unitSize: 10,
      fixedAmount: 40_000,
      roundingMode: 'CEILING',
    })
    expect(body.rules[0]).not.toHaveProperty('id')
  })

  it('keeps the active policy read-only and clones it on the server', async () => {
    const active = { ...draft, id: 'active-1', status: 'ACTIVE' as const }
    const list = vi
      .spyOn(adminApi, 'listPricingPolicies')
      .mockResolvedValueOnce([active])
      .mockResolvedValue([active, draft])
    const clone = vi
      .spyOn(adminApi, 'clonePricingPolicy')
      .mockResolvedValue(draft)

    render(<PricingPolicyTab />)
    expect(
      await screen.findByText(
        /Chính sách giá đang áp dụng không thể chỉnh sửa/,
      ),
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Tạo bản nháp mới' }),
    )

    await waitFor(() => expect(clone).toHaveBeenCalledWith('active-1'))
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2))
    expect(await screen.findByLabelText('Tên chính sách')).toHaveValue('Draft')
  })

  it('adds, edits, enables and removes ordinary draft rules before saving', async () => {
    vi.spyOn(adminApi, 'listPricingPolicies').mockResolvedValue([
      { ...draft, rules: [tier(0, null, 50_000)] },
    ])
    const update = vi
      .spyOn(adminApi, 'updatePricingPolicy')
      .mockResolvedValue(draft)

    render(<PricingPolicyTab />)
    fireEvent.click(
      await screen.findByRole('tab', { name: /Quy tắc nâng cao/ }),
    )
    fireEvent.click(screen.getByRole('button', { name: '+ Thêm quy tắc' }))
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))
    expect(screen.queryByLabelText('Mã quy tắc')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '+ Thêm quy tắc' }))
    fireEvent.change(screen.getByLabelText('Mã quy tắc'), {
      target: { value: 'AREA_EXTRA' },
    })
    fireEvent.change(screen.getByLabelText('Cách tính'), {
      target: { value: 'FIXED' },
    })
    fireEvent.change(screen.getByLabelText('Cách tính'), {
      target: { value: 'PER_BLOCK' },
    })
    fireEvent.change(screen.getByLabelText('Giá trị đến'), {
      target: { value: '100' },
    })
    fireEvent.click(screen.getByLabelText('Đang áp dụng'))
    fireEvent.click(
      within(screen.getByRole('region', { name: 'Tạo quy tắc giá' })).getByRole(
        'button',
        { name: 'Thêm quy tắc' },
      ),
    )
    fireEvent.click(screen.getAllByRole('button', { name: 'Lưu bản nháp' })[0])

    await waitFor(() => expect(update).toHaveBeenCalled())
    expect(update.mock.calls[0][1].rules.at(-1)).toMatchObject({
      category: 'AREA',
      calculationType: 'PER_BLOCK',
      ruleKey: 'AREA_EXTRA',
      maxValue: 100,
      enabled: false,
      roundingMode: 'CEILING',
    })
  })

  it('cancels an edit session: confirms before dropping changes, then offers to continue the draft', async () => {
    vi.spyOn(adminApi, 'listPricingPolicies').mockResolvedValue([
      { ...draft, rules: [tier(0, null, 50_000)] },
    ])
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<PricingPolicyTab />)
    fireEvent.change(await screen.findByLabelText('Tên chính sách'), {
      target: { value: 'Changed' },
    })
    fireEvent.click(screen.getAllByRole('button', { name: 'Hủy thay đổi' })[0])
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(
      await screen.findByRole('button', {
        name: 'Tiếp tục chỉnh sửa bản nháp',
      }),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Tên chính sách')).not.toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Tiếp tục chỉnh sửa bản nháp' }),
    )
    expect(await screen.findByLabelText('Tên chính sách')).toHaveValue('Draft')
  })
})
