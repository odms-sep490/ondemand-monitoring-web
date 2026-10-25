import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createDefaultForm } from '../../../lib/createOrder/draftStorage'
import { RequestSummaryCard } from './RequestSummaryCard'

describe('RequestSummaryCard', () => {
  it('presents the request title as labelled content and only links to earlier steps', () => {
    const onEdit = vi.fn()
    render(
      <RequestSummaryCard
        form={{
          ...createDefaultForm(),
          title: 'v',
          address: 'Cần Đước, Tây Ninh',
          serviceId: 'service-1',
        }}
        service={{ id: 'service-1', name: 'Giám sát công trình', basePrice: 3_500_000 }}
        mediaTotals={{ images: 70, videos: 5 }}
        checklistCounts={{ total: 6, packageSelected: 6, packageTotal: 6, additional: 0 }}
        onEdit={onEdit}
      />,
    )

    const title = screen.getByText('Tiêu đề yêu cầu').parentElement
    expect(title).not.toBeNull()
    expect(within(title as HTMLElement).getByText('v')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sửa: Dịch vụ' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sửa: Kết quả' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sửa: Nhận kết quả' })).not.toBeInTheDocument()

    const labels = screen.getAllByRole('term').map((node) => node.textContent)
    expect(labels.indexOf('Khu vực')).toBeLessThan(labels.indexOf('Thời gian'))
  })
})
