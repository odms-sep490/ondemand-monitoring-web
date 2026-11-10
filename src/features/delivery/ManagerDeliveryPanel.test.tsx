import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../shared/api/httpClient'
import { setLanguage } from '../../shared/i18n'
import { deliveryApi } from './api'
import type {
  ManagerChecklistDelivery,
  ChecklistDeliveryDraft,
  ResultRevisionCase,
  ResultReviewEvidence,
} from './api'
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
  vi.spyOn(deliveryApi, 'missionDeliveries').mockResolvedValue([])
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
  function reviewCase(
    evidence: ResultReviewEvidence[] = [],
  ): ResultRevisionCase {
    return {
      caseId: 'case',
      orderId: 'o',
      ticketId: 'ticket',
      ticketCode: 'TKT-1',
      status: 'OPEN',
      active: true,
      version: 1,
      openedAt: '2026-11-01T10:00:00Z',
      items: [
        {
          caseItemId: 'case-item',
          orderChecklistItemId: 'c',
          title: 'Reported checklist',
          scopeDecision: 'PENDING',
          strategy: 'UNDECIDED',
          status: 'NEEDS_TRIAGE',
          scopeReason: null,
          managerInstructions: null,
          assignedReworkMissionId: null,
          assignedReworkMissionStatus: null,
          version: 1,
          feedback: [
            {
              requestId: 'r1',
              roundNumber: 1,
              reasonCode: 'WRONG_LOCATION',
              customerNote: 'First feedback',
              submittedAt: '2026-11-01T10:00:00Z',
              evidence,
            },
          ],
        },
      ],
    }
  }
  const flagged: ResultReviewEvidence = {
    roundEvidenceId: 'selected-evidence',
    mediaAssetId: 'selected-asset',
    type: 'IMAGE',
    fileName: 'flagged-photo.jpg',
    size: 2000,
    capturedAt: null,
    url: null,
    thumbnailUrl: '/flagged-thumb.jpg',
    previewUrl: '/flagged-preview.jpg',
    previewStatus: 'READY',
    urlExpiresAt: null,
    downloadable: false,
    accessReason: null,
  }

  it('shows the exact flagged media under its feedback round and opens the selected video', async () => {
    const revision = reviewCase([flagged])
    revision.items[0].feedback.push({
      requestId: 'r2',
      roundNumber: 2,
      reasonCode: 'POOR_QUALITY',
      customerNote: 'Second feedback',
      submittedAt: '2026-11-02T10:00:00Z',
      evidence: [
        {
          ...flagged,
          roundEvidenceId: 'selected-video',
          mediaAssetId: 'video',
          type: 'VIDEO',
          fileName: 'flagged-video.mp4',
          thumbnailUrl: '/video-poster.jpg',
          previewUrl: '/video-preview.mp4',
        },
      ],
    })
    vi.mocked(deliveryApi.managerGetRevisionCase).mockResolvedValue(revision)
    render(<ManagerDeliveryPanel orderId="o" />)
    fireEvent.click(await screen.findByText('Reported checklist'))
    const first = (await screen.findByText('First feedback')).closest(
      'article',
    )!
    const second = screen.getByText('Second feedback').closest('article')!
    expect(within(first).getByText('Result round 1')).toBeInTheDocument()
    expect(within(first).getByRole('img')).toHaveAttribute(
      'src',
      '/flagged-thumb.jpg',
    )
    expect(within(first).queryByText('flagged-video.mp4')).toBeNull()
    expect(within(second).getByText('Result round 2')).toBeInTheDocument()
    expect(within(second).queryByText('flagged-photo.jpg')).toBeNull()
    fireEvent.click(
      within(second).getByRole('button', {
        name: 'View video flagged-video.mp4',
      }),
    )
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByLabelText('flagged-video.mp4', { selector: 'video' }),
    ).toHaveAttribute('src', '/video-preview.mp4')
  })

  it('explains when the customer did not flag individual media', async () => {
    vi.mocked(deliveryApi.managerGetRevisionCase).mockResolvedValue(
      reviewCase(),
    )
    render(<ManagerDeliveryPanel orderId="o" />)
    fireEvent.click(await screen.findByText('Reported checklist'))
    expect(
      await screen.findByText(
        'The customer reported this checklist without flagging specific media.',
      ),
    ).toBeInTheDocument()
  })

  it('keeps the flagged filename visible when retention has expired', async () => {
    vi.mocked(deliveryApi.managerGetRevisionCase).mockResolvedValue(
      reviewCase([
        {
          ...flagged,
          accessReason: 'RETENTION_EXPIRED',
          thumbnailUrl: null,
          previewUrl: null,
        },
      ]),
    )
    render(<ManagerDeliveryPanel orderId="o" />)
    fireEvent.click(await screen.findByText('Reported checklist'))
    expect(
      await screen.findByText(
        'This media has reached the end of its retention period.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('flagged-photo.jpg')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'flagged-photo.jpg' })).toBeNull()
  })

  it('shows automatic initial publication state without a manual composer', async () => {
    const publish = vi.spyOn(deliveryApi, 'managerPublishChecklists')
    render(<ManagerDeliveryPanel orderId="o" />)
    expect(
      await screen.findByText(
        /Results are sent automatically after each mission/,
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
      screen.queryByText(/Results are sent automatically after each mission/),
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
