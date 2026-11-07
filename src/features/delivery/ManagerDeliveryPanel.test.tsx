import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../shared/api/httpClient'
import { setLanguage } from '../../shared/i18n'
import { deliveryApi } from './api'
import type { ManagerChecklistDelivery, ChecklistDeliveryDraft } from './api'
import type { Delivery } from './types'
import { ManagerDeliveryPanel } from './ManagerDeliveryPanel'

const delivery: Delivery = {
  orderId: 'o',
  deliveryStatus: 'READY_FOR_MANAGER_REVIEW',
  missionStatus: 'COMPLETED',
  orderStatus: 'PROCESSING',
  invoiceStatus: 'PAID',
  totalAmount: 100,
  paidAmount: 100,
  remainingAmount: 0,
  deliveryNotes: null,
  previewReleasedAt: null,
  customerAcceptedAt: null,
  revisionRequestedAt: null,
  revisionReason: null,
  revisionCount: 0,
  finalPaymentConfirmedAt: null,
  originalsReleasedAt: null,
  assets: [],
}
const checklists: ManagerChecklistDelivery = {
  orderId: 'o',
  deliveryStatus: 'READY_FOR_MANAGER_REVIEW',
  deliveryVersion: 1,
  currentReviewRoundId: null,
  currentReviewRoundVersion: null,
  checklists: [
    {
      orderChecklistItemId: 'c',
      title: 'Roof',
      minimumImageCount: 1,
      minimumVideoCount: 0,
      minimumEvidenceCount: 1,
      requiredEvidenceType: 'IMAGE',
      eligibleMedia: [],
      currentBundle: [],
    },
  ],
}
const draft: ChecklistDeliveryDraft = {
  orderId: 'o',
  version: 1,
  caseId: null,
  baseReviewRoundId: null,
  expectedDeliveryVersion: 1,
  notes: null,
  checklists: [],
  updatedAt: null,
  stale: false,
}
beforeEach(() => {
  setLanguage('en')
  vi.spyOn(deliveryApi, 'managerGet').mockResolvedValue(delivery)
  vi.spyOn(deliveryApi, 'managerGetChecklists').mockResolvedValue(checklists)
  vi.spyOn(deliveryApi, 'managerGetChecklistDraft').mockResolvedValue(draft)
  vi.spyOn(deliveryApi, 'managerGetRevisionCase').mockRejectedValue(
    new ApiError('none', { status: 404, method: 'GET', path: '/' }),
  )
})
afterEach(() => {
  vi.restoreAllMocks()
  setLanguage('vi')
})

describe('manager publication boundaries', () => {
  it('shows automatic initial publication state without a manual composer', async () => {
    const publish = vi.spyOn(deliveryApi, 'managerPublishChecklists')
    render(<ManagerDeliveryPanel orderId="o" />)
    expect(
      await screen.findByText(
        /Results are sent automatically when every mission/,
      ),
    ).toBeInTheDocument()
    expect(document.querySelector('.delivery-composer')).toBeNull()
    fireEvent.click(screen.getByText('Roof'))
    expect(document.querySelector('.delivery-replacement-picker')).toBeNull()
    expect(publish).not.toHaveBeenCalled()
  })
  it('retains the composer for explicit legacy exceptions', async () => {
    render(<ManagerDeliveryPanel orderId="o" allowLegacyPublication />)
    await screen.findByText('Roof')
    expect(document.querySelector('.delivery-composer')).not.toBeNull()
    expect(
      screen.queryByText(/Results are sent automatically when every mission/),
    ).toBeNull()
  })
  it('retains manual revision publication for an existing review round', async () => {
    vi.mocked(deliveryApi.managerGet).mockResolvedValue({
      ...delivery,
      deliveryStatus: 'REVISION_REQUESTED',
    })
    vi.mocked(deliveryApi.managerGetChecklists).mockResolvedValue({
      ...checklists,
      deliveryStatus: 'REVISION_REQUESTED',
      currentReviewRoundId: 'round',
      currentReviewRoundVersion: 2,
    })
    render(<ManagerDeliveryPanel orderId="o" />)
    await screen.findByText('Roof')
    expect(document.querySelector('.delivery-composer')).not.toBeNull()
  })
})
