import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { setLanguage } from '../../i18n'
import type { ServicePricePreview } from '../../api/checklistPricingApi'
import { PriceBreakdownView } from './PriceBreakdownView'
import { mapService } from '../../../features/admin/lib/catalogMappers'

const base: ServicePricePreview = {
  serviceId: 's',
  serviceName: 'S',
  currency: 'VND',
  policyId: 'p',
  policyVersion: 2,
  draftPolicy: false,
  priceSource: 'CHECKLISTS',
  packageFee: 0,
  checklists: [],
  checklistSubtotal: 470_000,
  total: 470_000,
  complete: true,
  warnings: [],
  quotePending: false,
}
beforeEach(() => setLanguage('vi'))

describe('PriceBreakdownView price source', () => {
  it('shows the checklists as the whole price', () => {
    render(<PriceBreakdownView preview={base} />)
    expect(screen.getByText(/tổng giá các checklist/)).toBeInTheDocument()
    expect(screen.getAllByText(/470\.000/).length).toBeGreaterThan(0)
  })

  it('says the service is unpriced when no default checklist is priced', () => {
    render(
      <PriceBreakdownView
        preview={{
          ...base,
          priceSource: 'UNPRICED',
          checklistSubtotal: 0,
          total: 0,
        }}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent(/chưa có checklist/)
  })

  it('lists warnings for checklists the policy cannot price', () => {
    render(
      <PriceBreakdownView
        preview={{
          ...base,
          complete: false,
          warnings: ['Check roof: add a tier'],
        }}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Check roof: add a tier',
    )
  })

  it('replaces an unpriced checklist table and warns that it is excluded', () => {
    render(
      <PriceBreakdownView
        preview={{
          ...base,
          quotePending: true,
          checklists: [
            {
              checklistId: null,
              content: 'Custom inspection',
              pricingProfile: 'CUSTOM',
              custom: true,
              includedImageCount: 0,
              includedVideoCount: 0,
              requestedImageCount: 0,
              requestedVideoCount: 0,
              extraImageCount: 0,
              extraVideoCount: 0,
              standardVideoDurationSeconds: null,
              lines: [],
              subtotal: 0,
              quotePending: true,
            },
          ],
        }}
      />,
    )

    expect(screen.getByText('Chờ Manager báo giá')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/chưa được tính/)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})

describe('service contract mapping', () => {
  it('keeps the legacy basePrice and carries the checklist default price separately', () => {
    const service = mapService({
      id: 's',
      name: 'S',
      basePrice: 3_200_000,
      defaultPrice: 470_000,
      priceSource: 'CHECKLISTS',
      isActive: true,
    })
    expect(service.basePrice).toBe(3_200_000)
    expect(service.defaultPrice).toBe(470_000)
    expect(service.priceSource).toBe('CHECKLISTS')
  })
})
