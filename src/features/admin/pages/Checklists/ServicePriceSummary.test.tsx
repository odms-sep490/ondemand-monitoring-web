import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ServicePriceSummary } from './ServicePriceSummary'
import type { ChecklistPriceBreakdown, ServicePricePreview } from '../../../../shared/api/checklistPricingApi'

const checklist = (id: string, content: string, price: number): ChecklistPriceBreakdown => ({
  checklistId: id,
  content,
  pricingProfile: 'DEFAULT',
  custom: false,
  includedImageCount: 0,
  includedVideoCount: 0,
  requestedImageCount: 0,
  requestedVideoCount: 0,
  extraImageCount: 0,
  extraVideoCount: 0,
  standardVideoDurationSeconds: null,
  basePrice: price / 1.5,
  standardAreaM2: 100,
  actualAreaM2: 150,
  calculationDisplay: `${price / 1.5} × (150 / 100) = ${price} VND`,
  lines: [],
  subtotal: price,
  quotePending: false,
})

const preview = (patch: Partial<ServicePricePreview> = {}): ServicePricePreview => ({
  serviceId: 's',
  serviceName: 'Inspection',
  currency: 'VND',
  policyId: null,
  policyVersion: 0,
  draftPolicy: false,
  priceSource: 'CHECKLISTS',
  packageFee: 0,
  checklists: [checklist('c1', 'Roof', 300_000), checklist('c2', 'Wall', 450_000)],
  checklistSubtotal: 750_000,
  total: 750_000,
  complete: true,
  warnings: [],
  quotePending: false,
  ...patch,
})

describe('ServicePriceSummary', () => {
  it('shows each Base Checklist formula and the backend total', () => {
    render(<ServicePriceSummary preview={preview()} />)

    expect(screen.getAllByText(/750\.000/)).toHaveLength(3)
    expect(screen.getByText('Roof')).toBeInTheDocument()
    expect(screen.getByText(/300\.000/)).toBeInTheDocument()
    expect(screen.getByText('200000 × (150 / 100) = 300000 VND')).toBeInTheDocument()
    expect(screen.getByText('Wall')).toBeInTheDocument()
    expect(screen.getByText('300000 × (150 / 100) = 450000 VND')).toBeInTheDocument()
  })

  it('shows backend warnings for incomplete Base Checklist configuration', () => {
    render(<ServicePriceSummary preview={preview({ warnings: ['Configure standard area for Roof'] })} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Configure standard area for Roof')
  })
})
