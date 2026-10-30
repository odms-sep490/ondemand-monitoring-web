import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setLanguage } from '../../../../shared/i18n'
import { QuoteSection } from '../components/QuoteSection'
import type { CustomerQuote } from '../../types'
const quote: CustomerQuote = {
  id: 'q',
  orderId: 'o',
  version: 1,
  status: 'APPROVED',
  estimatedBaseAmount: 0,
  approvedAdditionalServiceAmount: 0,
  finalOrderAmount: 0,
  pricingFinalized: true,
  approvedAt: null,
  acceptedAt: null,
  items: [],
}
describe('quote acceptance guidance', () => {
  it('does not warn for valid empty catalog snapshots or infer custom work from absent snapshots', () => {
    const view = render(
      <QuoteSection
        quote={{
          ...quote,
          checklistGuidanceSnapshot: { schemaVersion: 1, items: [] },
        }}
        legalReady
        invoice={null}
        busy={false}
        legalStatus="APPROVED"
        accept={async () => {}}
      />,
    )
    expect(screen.queryByText('Hướng dẫn thuộc báo giá này')).toBeNull()
    expect(screen.queryByText(/Báo giá chưa có hướng dẫn/)).toBeNull()
    view.rerender(
      <QuoteSection
        quote={quote}
        legalReady
        invoice={null}
        busy={false}
        legalStatus="APPROVED"
        accept={async () => {}}
      />,
    )
    expect(screen.queryByText('Hướng dẫn thuộc báo giá này')).toBeNull()
  })

  it('shows every section of the quote snapshot alongside acceptance', () => {
    render(
      <QuoteSection
        quote={{
          ...quote,
          checklistGuidanceSnapshot: {
            schemaVersion: 1,
            items: [
              {
                itemId: 'i',
                checklistRevision: 2,
                guidanceVersion: 3,
                description: 'Frozen scope',
                executionSteps: ['Frozen steps'],
                inputRequirements: ['Frozen inputs'],
                expectedOutputs: ['Frozen outputs'],
              },
            ],
          },
        }}
        legalReady
        invoice={null}
        busy={false}
        legalStatus="APPROVED"
        accept={async () => {}}
      />,
    )
    for (const text of [
      'Frozen scope',
      'Frozen steps',
      'Frozen inputs',
      'Frozen outputs',
    ])
      expect(screen.getByText(text)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Chấp nhận/ }),
    ).toBeInTheDocument()
  })
  it('renders accepted legacy quotes with a missing-guidance notice in both languages', () => {
    render(
      <QuoteSection
        quote={{ ...quote, status: 'ACCEPTED_BY_CUSTOMER' }}
        legalReady
        invoice={null}
        busy={false}
        legalStatus="APPROVED"
        accept={async () => {}}
      />,
    )
    expect(screen.getByText('Chưa có hướng dẫn chi tiết')).toBeInTheDocument()
    act(() => setLanguage('en'))
    expect(
      screen.getByText('No detailed guidance available'),
    ).toBeInTheDocument()
  })
})
