import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ServicePricePreview } from '../../../../shared/api/checklistPricingApi'
import type { ChecklistQuoteState } from '../../lib/checklist/useChecklistQuote'
import { ChecklistQuoteCard } from './ChecklistQuoteCard'

describe('ChecklistQuoteCard', () => {
  it('shows the backend formula and both area inputs to the customer', () => {
    const preview: ServicePricePreview = {
      serviceId: 's1',
      serviceName: 'Monitoring',
      currency: 'VND',
      policyId: 'legacy',
      policyVersion: 2,
      draftPolicy: false,
      priceSource: 'CHECKLISTS',
      packageFee: 0,
      checklists: [
        {
          checklistId: 'c1',
          content: 'Roof inspection',
          pricingProfile: 'STANDARD',
          custom: false,
          includedImageCount: 0,
          includedVideoCount: 0,
          requestedImageCount: 0,
          requestedVideoCount: 0,
          extraImageCount: 0,
          extraVideoCount: 0,
          standardVideoDurationSeconds: null,
          basePrice: 200_000,
          standardAreaM2: 100,
          actualAreaM2: 150,
          calculationDisplay:
            'Giá cơ bản 200.000 VNĐ (bao gồm 0,01 ha) + phụ phí diện tích vượt 20.000.000 VNĐ/ha × 0,005 ha = 100.000 VNĐ (làm tròn đến 1.000 VNĐ); tổng 300.000 VNĐ.',
          lines: [],
          subtotal: 300_000,
          quotePending: false,
        },
      ],
      checklistSubtotal: 300_000,
      total: 300_000,
      complete: true,
      warnings: [],
      quotePending: false,
    }
    const quote: ChecklistQuoteState = {
      preview,
      error: null,
      loading: false,
    }

    render(<ChecklistQuoteCard quote={quote} />)

    expect(
      screen.getByText(
        'Giá cơ bản 200.000 VNĐ (bao gồm 0,01 ha) + phụ phí diện tích vượt 20.000.000 VNĐ/ha × 0,005 ha = 100.000 VNĐ (làm tròn đến 1.000 VNĐ); tổng 300.000 VNĐ.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Giá cơ bản và phụ phí diện tích vượt')).toBeInTheDocument()
    expect(screen.getByText(/200\.000\s*₫/)).toBeInTheDocument()
    expect(screen.getByText('100 m²')).toBeInTheDocument()
    expect(screen.getByText('150 m²')).toBeInTheDocument()
  })
})
