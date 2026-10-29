import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { chooseSelectOption } from '../../../testUtils'
import { PricingDraftEditor } from './PricingDraftEditor'
import { newMediaRule } from '../../../lib/mediaPricingRules'
import type { PricingPolicy } from '../../../types/pricing'

const draft: PricingPolicy = {
  id: 'd',
  name: 'Draft',
  version: 4,
  status: 'DRAFT',
  currency: 'VND',
  effectiveFrom: null,
  effectiveTo: null,
  managerMaxDiscountPercent: 10,
  managerMaxMarkupPercent: 20,
  highRiskDiscountPercent: 5,
  minimumPriceRatio: 0.75,
  minimumPrice: 500_000,
  rules: [
    {
      ...newMediaRule('DEFAULT', 'EXTRA_IMAGE', []),
      minValue: 0,
      maxValue: null,
      unitSize: 10,
      fixedAmount: 50_000,
    },
  ],
}

function setup(policy = draft, dirty = false) {
  const setDraft = vi.fn()
  const onCancel = vi.fn()
  render(
    <PricingDraftEditor
      draft={policy}
      setDraft={setDraft}
      busy={false}
      dirty={dirty}
      onSave={vi.fn()}
      onPublish={vi.fn()}
      onCancel={onCancel}
    />,
  )
  return Object.assign(setDraft, { onCancel })
}

describe('PricingDraftEditor', () => {
  it('opens on the common prices and keeps the long rule list behind another tab', () => {
    setup()
    expect(screen.getByText('Chính sách giá v4')).toBeInTheDocument()
    expect(screen.getByLabelText('Giảm giá tối đa (%)')).toBeInTheDocument()
    expect(screen.getByText('Ảnh từ 1 trở lên')).toBeInTheDocument()
    expect(screen.getByText(/50\.000 ₫/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Ảnh vượt định mức: giá mỗi khối')).not.toBeInTheDocument()
    expect(screen.queryByText('Quy tắc tính giá')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: /Quy tắc nâng cao/ }))
    expect(screen.getByText('Quy tắc tính giá')).toBeInTheDocument()
  })

  it('edits a shared media tier in place', () => {
    const setDraft = setup()
    const group = screen.getByRole('region', { name: 'Ảnh vượt định mức' })
    fireEvent.click(within(group).getByRole('button', { name: 'Chỉnh sửa' }))
    fireEvent.change(screen.getByLabelText('Ảnh vượt định mức: giá mỗi khối'), {
      target: { value: '60000' },
    })
    expect(setDraft.mock.calls[0][0].rules[0].fixedAmount).toBe(60000)
  })

  it('shows only the fields needed by the selected calculation method', async () => {
    const policy: PricingPolicy = {
      ...draft,
      rules: [
        {
          ...draft.rules[0],
          category: 'AREA' as const,
          mediaComponent: null,
          pricingProfile: null,
          checklistDefinitionId: null,
          checklistDefinitionName: null,
          description: 'Phụ thu diện tích',
        },
      ],
    }
    function StatefulEditor() {
      const [value, setValue] = useState(policy)
      return (
        <PricingDraftEditor
          draft={value}
          setDraft={setValue}
          busy={false}
          dirty={false}
          onSave={vi.fn()}
          onPublish={vi.fn()}
          onCancel={vi.fn()}
        />
      )
    }
    render(<StatefulEditor />)
    fireEvent.click(screen.getByRole('tab', { name: /Quy tắc nâng cao/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Chỉnh sửa' }))
    expect(screen.getByLabelText('Kích thước khối')).toBeInTheDocument()
    await chooseSelectOption('Cách tính', 'Giá cố định')
    expect(screen.getByLabelText('Giá cố định')).toBeInTheDocument()
    expect(screen.queryByLabelText('Kích thước khối')).not.toBeInTheDocument()
  })

  it('blocks saving while the tiers overlap and says why', () => {
    const overlapping = {
      ...draft,
      rules: [
        draft.rules[0],
        {
          ...draft.rules[0],
          ruleKey: 'DEFAULT:EXTRA_IMAGE:2',
          minValue: 5,
        },
      ],
    }
    setup(overlapping)
    expect(
      screen.getAllByRole('button', { name: 'Lưu bản nháp' })[0],
    ).toBeDisabled()
    expect(
      screen.getAllByRole('button', { name: 'Áp dụng' })[0],
    ).toBeDisabled()
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
  })

  it('derives the price floor ratio from the maximum discount instead of asking for it', () => {
    const setDraft = setup()
    expect(screen.queryByLabelText('Tỷ lệ giá sàn')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Giảm giá tối đa (%)'), {
      target: { value: '20' },
    })
    expect(setDraft.mock.calls[0][0]).toMatchObject({
      managerMaxDiscountPercent: 20,
      minimumPriceRatio: 0.8,
    })
  })

  it('refuses a high-risk threshold above the maximum discount', () => {
    setup({ ...draft, highRiskDiscountPercent: 30 })
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ngưỡng rủi ro cao không được lớn hơn',
    )
    expect(
      screen.getAllByRole('button', { name: 'Lưu bản nháp' })[0],
    ).toBeDisabled()
  })

  it('lets the admin leave: Đóng when nothing changed, Hủy thay đổi when there is something unsaved', () => {
    const clean = setup()
    fireEvent.click(screen.getAllByRole('button', { name: 'Đóng' })[0])
    expect(clean.onCancel).toHaveBeenCalledTimes(1)
  })

  it('names the cancel button after what it discards', () => {
    setup(draft, true)
    expect(
      screen.getAllByRole('button', { name: 'Hủy thay đổi' }).length,
    ).toBeGreaterThan(0)
  })
})
