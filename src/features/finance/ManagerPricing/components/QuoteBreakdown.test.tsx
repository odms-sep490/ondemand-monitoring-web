import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuoteBreakdown } from './QuoteBreakdown'

describe('QuoteBreakdown', () => {
  it('shows the Base Checklist formula alongside the Manager system amount', () => {
    render(
      <QuoteBreakdown
        checklistItems={[]}
        items={[
          {
            category: 'CHECKLIST',
            description: 'Roof inspection · 200000 × (150 / 100) = 300000 VNĐ',
            amount: 300_000,
            orderChecklistItemId: 'item-1',
          },
        ]}
      />,
    )

    expect(screen.getByText(/200000 × \(150 \/ 100\) = 300000 VNĐ/)).toBeInTheDocument()
    expect(screen.getAllByText(/300\.000\s*₫/).length).toBeGreaterThan(0)
  })
})
