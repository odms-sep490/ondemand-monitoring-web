import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PricingPolicyOverview } from './PricingPolicyOverview'
import { newMediaRule } from '../../../lib/mediaPricingRules'
import type { PricingPolicy, PricingRule } from '../../../types/pricing'

const tier = (
  component: 'EXTRA_IMAGE' | 'EXTRA_VIDEO',
  from: number,
  to: number | null,
  price: number,
  unit: number,
): PricingRule => ({
  ...newMediaRule('DEFAULT', component, []),
  ruleKey: `DEFAULT:${component}:${from}`,
  minValue: from,
  maxValue: to,
  unitSize: unit,
  fixedAmount: price,
})

const policy = (patch: Partial<PricingPolicy> = {}): PricingPolicy => ({
  id: 'a',
  name: 'DEFAULT_POLICY',
  version: 3,
  status: 'ACTIVE',
  currency: 'VND',
  effectiveFrom: '2026-09-01T00:00:00Z',
  effectiveTo: null,
  managerMaxDiscountPercent: 10,
  managerMaxMarkupPercent: 20,
  highRiskDiscountPercent: 5,
  minimumPriceRatio: 0.75,
  minimumPrice: 500_000,
  rules: [
    tier('EXTRA_IMAGE', 10, null, 40_000, 10),
    tier('EXTRA_IMAGE', 0, 10, 50_000, 10),
    tier('EXTRA_VIDEO', 0, null, 100_000, 1),
    {
      ...newMediaRule('GENERIC_CUSTOMER_ADDED', 'CHECKLIST_BASE', []),
      fixedAmount: 200_000,
    },
    {
      ...newMediaRule('GENERIC_CUSTOMER_ADDED', 'INCLUDED_AREA', []),
      includedQuantity: 5,
      fixedAmount: 0,
    },
    {
      ...newMediaRule('GENERIC_CUSTOMER_ADDED', 'EXTRA_AREA', []),
      fixedAmount: 50_000,
    },
  ],
  ...patch,
})

describe('PricingPolicyOverview', () => {
  it('summarises the policy in force: limits, customer-added prices and the shared media tiers', () => {
    render(
      <PricingPolicyOverview
        active={policy()}
        policies={[policy()]}
        busy={false}
        onClone={() => undefined}
      />,
    )
    expect(
      screen.getByText(/Chính sách giá v3 · /, { selector: 'h3' }),
    ).toBeInTheDocument()
    expect(screen.getByText('10%')).toBeInTheDocument()
    expect(screen.getByText('0,75')).toBeInTheDocument()
    const added = screen.getByRole('region', { name: 'Giá yêu cầu bổ sung' })
    expect(added).toHaveTextContent('200.000')
    expect(added).toHaveTextContent('5 ha')
    expect(added).toHaveTextContent('50.000')
    const media = screen.getByRole('region', {
      name: 'Bảng giá ảnh và video dùng chung',
    })
    // Tiers are listed in order whatever order they are stored in.
    const lines = Array.from(media.querySelectorAll('li')).map(
      (li) => li.textContent,
    )
    expect(lines[0]).toContain('0–10 ảnh')
    expect(lines[1]).toContain('từ 10 ảnh')
    expect(media).toHaveTextContent('100.000')
  })

  it('offers copying to a draft as the one way to change anything', () => {
    const clone = vi.fn()
    render(
      <PricingPolicyOverview
        active={policy()}
        policies={[policy()]}
        busy={false}
        onClone={clone}
      />,
    )
    expect(screen.getByRole('note')).toHaveTextContent('không thể chỉnh sửa')
    fireEvent.click(
      screen.getByRole('button', { name: 'Tạo bản nháp mới' }),
    )
    expect(clone).toHaveBeenCalledTimes(1)
  })

  it('disables the copy while busy and says when a price is not configured', () => {
    const noArea = policy({
      rules: policy().rules.filter((r) => r.mediaComponent !== 'EXTRA_AREA'),
    })
    render(
      <PricingPolicyOverview
        active={noArea}
        policies={[noArea]}
        busy
        onClone={() => undefined}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Tạo bản nháp mới' }),
    ).toBeDisabled()
    expect(screen.getByText('Chưa cấu hình')).toBeInTheDocument()
  })

  it('explains the empty state and lists versions newest first', () => {
    const older = policy({
      id: 'o',
      version: 1,
      status: 'SUPERSEDED',
      effectiveTo: '2026-09-01T00:00:00Z',
    })
    const { rerender } = render(
      <PricingPolicyOverview
        active={undefined}
        policies={[]}
        busy={false}
        onClone={() => undefined}
      />,
    )
    expect(
      screen.getByText('Chưa có chính sách giá đang áp dụng'),
    ).toBeInTheDocument()
    rerender(
      <PricingPolicyOverview
        active={policy()}
        policies={[older, policy()]}
        busy={false}
        onClone={() => undefined}
      />,
    )
    const versions = screen.getByRole('region', { name: 'Các phiên bản' })
    const rows = Array.from(versions.querySelectorAll('li')).map(
      (li) => li.textContent,
    )
    expect(rows[0]).toContain('Chính sách giá v3')
    expect(rows[1]).toContain('Chính sách giá v1')
  })
})
