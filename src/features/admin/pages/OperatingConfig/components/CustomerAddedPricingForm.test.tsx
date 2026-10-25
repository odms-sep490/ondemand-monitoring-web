import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import {
  CustomerAddedPricingForm,
  isCustomerAddedRule,
} from './CustomerAddedPricingForm'
import { newMediaRule } from '../../../lib/mediaPricingRules'
import type { PricingRule } from '../../../types/pricing'

function Harness({
  initial,
  onRules,
}: {
  initial: PricingRule[]
  onRules: (rules: PricingRule[]) => void
}) {
  const [rules, setRules] = useState(initial)
  return (
    <CustomerAddedPricingForm
      rules={rules}
      onChange={(next) => {
        setRules(next)
        onRules(next)
      }}
    />
  )
}

const rule = (
  component: Parameters<typeof newMediaRule>[1],
  patch: Partial<PricingRule>,
): PricingRule => ({
  ...newMediaRule('GENERIC_CUSTOMER_ADDED', component, []),
  ...patch,
})

describe('CustomerAddedPricingForm', () => {
  it('shows the stored numbers in plain words', () => {
    render(
      <Harness
        onRules={() => undefined}
        initial={[
          rule('CHECKLIST_BASE', { fixedAmount: 200_000 }),
          rule('INCLUDED_IMAGE', { includedQuantity: 5 }),
          rule('INCLUDED_AREA', { includedQuantity: 5 }),
          rule('EXTRA_AREA', { fixedAmount: 50_000 }),
        ]}
      />,
    )
    expect(screen.getByLabelText('Giá cơ bản')).toHaveValue('200.000')
    expect(screen.getByLabelText('Số ảnh đã bao gồm')).toHaveValue(5)
    expect(screen.getByLabelText('Diện tích đã bao gồm')).toHaveValue(5)
    expect(
      screen.getByLabelText('Phụ thu diện tích vượt định mức'),
    ).toHaveValue('50.000')
    // Not configured yet: empty, not zero.
    expect(screen.getByLabelText('Số video đã bao gồm')).toHaveValue(null)
  })

  it('edits an existing rule in place without touching the others', () => {
    let latest: PricingRule[] = []
    render(
      <Harness
        onRules={(next) => (latest = next)}
        initial={[
          rule('CHECKLIST_BASE', { fixedAmount: 200_000 }),
          rule('EXTRA_AREA', { fixedAmount: 50_000 }),
        ]}
      />,
    )
    fireEvent.change(screen.getByLabelText('Giá cơ bản'), {
      target: { value: '250000' },
    })
    expect(latest).toHaveLength(2)
    expect(
      latest.find((r) => r.mediaComponent === 'CHECKLIST_BASE')?.fixedAmount,
    ).toBe(250_000)
    expect(
      latest.find((r) => r.mediaComponent === 'EXTRA_AREA')?.fixedAmount,
    ).toBe(50_000)
  })

  it('creates the missing rule for the customer-added profile when a number is typed', () => {
    let latest: PricingRule[] = []
    render(<Harness onRules={(next) => (latest = next)} initial={[]} />)
    fireEvent.change(screen.getByLabelText('Diện tích đã bao gồm'), {
      target: { value: '5' },
    })
    fireEvent.change(
      screen.getByLabelText('Phụ thu diện tích vượt định mức'),
      { target: { value: '50000' } },
    )
    const area = latest.find((r) => r.mediaComponent === 'INCLUDED_AREA')!
    expect(area.pricingProfile).toBe('GENERIC_CUSTOMER_ADDED')
    expect(area.includedQuantity).toBe(5)
    expect(area.fixedAmount).toBe(0)
    expect(
      latest.find((r) => r.mediaComponent === 'EXTRA_AREA')?.fixedAmount,
    ).toBe(50_000)
    expect(latest.every(isCustomerAddedRule)).toBe(true)
  })

  it('does not invent a rule for an empty field', () => {
    let latest: PricingRule[] | null = null
    render(<Harness onRules={(next) => (latest = next)} initial={[]} />)
    fireEvent.change(screen.getByLabelText('Giá cơ bản'), {
      target: { value: '' },
    })
    expect(latest).toBeNull()
  })

  it('formats money for reading and exposes plain digits while editing', () => {
    render(
      <Harness
        onRules={() => undefined}
        initial={[rule('CHECKLIST_BASE', { fixedAmount: 200_000 })]}
      />,
    )
    const input = screen.getByLabelText('Giá cơ bản')
    expect(input).toHaveValue('200.000')
    fireEvent.focus(input)
    expect(input).toHaveValue('200000')
    fireEvent.change(input, { target: { value: '250000' } })
    fireEvent.blur(input)
    expect(input).toHaveValue('250.000')
  })
})
