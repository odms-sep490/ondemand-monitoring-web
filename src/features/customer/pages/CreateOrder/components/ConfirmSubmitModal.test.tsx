import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../../shared/i18n'
import { createDefaultForm } from '../../../lib/createOrder/draftStorage'
import { ConfirmSubmitModal } from './ConfirmSubmitModal'

beforeEach(() => setLanguage('vi'))

const base = () => ({
  form: {
    ...createDefaultForm(),
    title: 'Test',
    address: 'KCN Long Hậu',
    preferredDateFrom: '2026-10-23',
    preferredDateTo: '2026-10-23',
    resultFormats: ['PHOTO', 'VIDEO'] as ('PHOTO' | 'VIDEO')[],
    deliveryMethods: ['DOWNLOAD'] as 'DOWNLOAD'[],
  },
  pricingEstimate: null,
  submitting: false,
  error: null,
  onConfirm: vi.fn(),
  onClose: vi.fn(),
})

describe('ConfirmSubmitModal', () => {
  it('summarises content, media, schedule, area and results before sending', () => {
    render(
      <ConfirmSubmitModal
        {...base()}
        checklistCount={4}
        mediaTotals={{ images: 3, videos: 1 }}
      />,
    )
    expect(screen.getByText(/4 nội dung · 3 ảnh · 1 video/)).toBeInTheDocument()
    expect(screen.getByText('Vùng bay')).toBeInTheDocument()
    expect(screen.getByText('Định dạng kết quả')).toBeInTheDocument()
    expect(screen.getByText('Thời hạn lưu trữ')).toBeInTheDocument()
  })

  it('says the cost excludes items still awaiting a Manager quote', () => {
    render(
      <ConfirmSubmitModal
        {...base()}
        pricingEstimate={{
          serviceId: 's',
          servicePrice: 1,
          additionalRequirements: [],
          totalPrice: 1,
          quotePending: true,
        }}
      />,
    )
    expect(screen.getByText(/chưa gồm các nội dung bạn tự thêm/)).toBeInTheDocument()
  })
})
