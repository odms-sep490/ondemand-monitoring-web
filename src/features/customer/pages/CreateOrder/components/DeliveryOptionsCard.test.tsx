import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createDefaultForm } from '../../../lib/createOrder/draftStorage'
import type { FormErrors, FormState } from '../../../lib/createOrder/types'
import { DeliverablesCard } from './DeliverablesCard'
import { DeliveryOptionsCard } from './DeliveryOptionsCard'

describe('DeliveryOptionsCard review variant', () => {
  it('shows checklist quantities as read-only and keeps PDF, channel and retention editable', () => {
    const update = vi.fn()
    const form: FormState = {
      ...createDefaultForm(),
      resultFormats: ['PHOTO', 'VIDEO'],
      deliveryMethods: ['DOWNLOAD'],
    }

    render(
      <DeliveryOptionsCard
        variant="review"
        form={form}
        errors={{} as FormErrors}
        update={update}
        mediaTotals={{ images: 70, videos: 5 }}
      >
        <DeliverablesCard
          variant="inline"
          deliverables={[
            {
              id: 'deliverable-1',
              serviceId: 'service-1',
              deliverableTypeId: 'photo-video',
              deliverableTypeName: 'Ảnh và video',
            },
          ]}
          loading={false}
          onRetry={vi.fn()}
          mediaTotals={{ images: 70, videos: 5 }}
        />
      </DeliveryOptionsCard>,
    )

    expect(screen.getByText('70')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.queryByText('Loại kết quả')).not.toBeInTheDocument()
    expect(screen.getByText('Theo checklist')).toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', { name: 'Báo cáo PDF' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('checkbox', { name: 'Ảnh' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('checkbox', { name: 'Video' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Tải về' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Email' })).not.toBeChecked()
    expect(
      screen.queryByText(/Ảnh và video tự động theo checklist/),
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText('Thời hạn lưu trữ dữ liệu')).toHaveValue('30')
    expect(
      screen.queryByText('Điều khoản và cam kết bảo mật'),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Báo cáo PDF' }))
    expect(update).toHaveBeenCalledWith('resultFormats', [
      'PHOTO',
      'VIDEO',
      'PDF_REPORT',
    ])
  })
})
