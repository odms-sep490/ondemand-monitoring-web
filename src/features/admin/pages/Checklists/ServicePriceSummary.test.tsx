import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { ServicePriceSummary } from './ServicePriceSummary'
import type {
  ChecklistPriceBreakdown,
  ServicePricePreview,
} from '../../../../shared/api/checklistPricingApi'

const line = (
  component: string,
  description: string,
  quantity: number,
  unitPrice: number,
) => ({
  component,
  category: 'X',
  description,
  quantity,
  unitPrice,
  amount: quantity * unitPrice,
  tierFrom: null,
  tierTo: null,
  blockSize: null,
  rounding: null,
})

const checklist = (
  patch: Partial<ChecklistPriceBreakdown> = {},
): ChecklistPriceBreakdown => ({
  checklistId: 'c1',
  content: 'Kiểm tra mái',
  pricingProfile: 'DEFAULT',
  custom: false,
  includedImageCount: 10,
  includedVideoCount: 1,
  requestedImageCount: 10,
  requestedVideoCount: 1,
  extraImageCount: 0,
  extraVideoCount: 0,
  standardVideoDurationSeconds: 60,
  lines: [
    line('BASE', 'Giá công việc', 1, 800_000),
    line('INCLUDED_IMAGE', 'Ảnh đã bao gồm', 10, 20_000),
    line('INCLUDED_VIDEO', 'Video đã bao gồm', 1, 150_000),
  ],
  subtotal: 1_150_000,
  quotePending: false,
  ...patch,
})

const preview = (
  patch: Partial<ServicePricePreview> = {},
): ServicePricePreview => ({
  serviceId: 's',
  serviceName: 'Dịch vụ',
  currency: 'VND',
  policyId: 'p',
  policyVersion: 4,
  draftPolicy: false,
  priceSource: 'CHECKLISTS',
  packageFee: 0,
  checklists: [checklist()],
  checklistSubtotal: 1_150_000,
  total: 1_450_000,
  complete: true,
  warnings: [],
  quotePending: false,
  addOns: [{ key: 'AI', description: 'Phân tích ảnh AI', amount: 300_000 }],
  ...patch,
})

describe('ServicePriceSummary', () => {
  it('leads with the total, then one line per checklist split into work and media', () => {
    render(<ServicePriceSummary preview={preview()} />)
    expect(screen.getByText('Tổng giá dịch vụ').nextSibling).toHaveTextContent(
      '1.450.000',
    )
    expect(screen.getByText('Chính sách giá v4')).toBeInTheDocument()
    expect(screen.getByText('1 checklist')).toBeInTheDocument()
    const rows = screen.getAllByRole('row')
    const item = rows.find((row) => within(row).queryByText('Kiểm tra mái'))!
    // work = 800.000, media = 10 x 20.000 + 150.000 = 350.000
    expect(item).toHaveTextContent('800.000')
    expect(item).toHaveTextContent('350.000')
    expect(item).toHaveTextContent('1.150.000')
    expect(item).toHaveTextContent('10 ảnh · 1 video')
  })

  it('keeps the full calculation inside the row instead of repeating it for every checklist', () => {
    const { container } = render(<ServicePriceSummary preview={preview()} />)
    const details = container.querySelector('details')!
    expect(details).not.toHaveAttribute('open')
    expect(within(details).getByText('Ảnh đã bao gồm')).toBeInTheDocument()
    fireEvent.click(within(details).getByText('Kiểm tra mái'))
    expect(details).toHaveAttribute('open')
  })

  it('lists add-ons and states what the figure leaves out', () => {
    render(<ServicePriceSummary preview={preview()} />)
    expect(screen.getByText(/Phân tích ảnh AI/)).toBeInTheDocument()
    expect(screen.getByText('Tổng các checklist')).toBeInTheDocument()
    expect(
      screen.getByText(/Chưa gồm các yếu tố theo từng đơn/),
    ).toBeInTheDocument()
  })

  it('shows extra media and a checklist awaiting a manager quote', () => {
    render(
      <ServicePriceSummary
        preview={preview({
          checklists: [
            checklist({ extraImageCount: 5, requestedImageCount: 15 }),
            checklist({
              checklistId: 'c2',
              content: 'Mục tùy chỉnh',
              custom: true,
              quotePending: true,
              lines: [],
            }),
          ],
          quotePending: true,
        })}
      />,
    )
    expect(screen.getByText(/\+5 ảnh/)).toBeInTheDocument()
    expect(screen.getByText('Ngoài danh mục')).toBeInTheDocument()
    expect(screen.getByText('Chờ Manager báo giá')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'chưa được tính vào tổng',
    )
  })

  it('warns when nothing is priced and shows backend warnings', () => {
    render(
      <ServicePriceSummary
        preview={preview({
          priceSource: 'UNPRICED',
          checklists: [],
          total: 0,
          checklistSubtotal: 0,
          addOns: [],
          warnings: ['Thiếu luật giá ảnh'],
        })}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Thiếu luật giá ảnh')
    expect(
      screen.getByText(/chưa có checklist mặc định nào có giá/),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Chưa có checklist trong cấu hình này.'),
    ).toBeInTheDocument()
  })
})
