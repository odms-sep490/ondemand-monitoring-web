import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setLanguage } from '../../../shared/i18n'
import { supportApi } from '../api/supportApi'
import { TicketResultReviewCard } from './TicketResultReviewCard'

const response = {
  ticketId: 'ticket-1',
  ticketCode: 'TKT-2026-000000000001',
  orderId: 'order-1',
  reviewRoundId: 'round-1',
  roundNumber: 3,
  roundVersion: 5,
  publishedAt: '2026-10-31T05:00:00Z',
  generalNote: 'Please focus on the north wing.',
  submittedAt: '2026-10-31T06:00:00Z',
  items: [
    {
      roundItemId: 'round-item-1',
      orderChecklistItemId: 'check-1',
      title: 'Roof inspection',
      description: 'Inspect the roof',
      executionSteps: [],
      inputRequirements: [],
      expectedOutputs: [],
      missionId: 'mission-1',
      missionCode: 'M-001',
      reasonCode: 'POOR_QUALITY' as const,
      note: 'The image is too blurry to review.',
      roundEvidenceIds: ['evidence-1'],
      evidence: [
        {
          roundEvidenceId: 'evidence-1',
          mediaAssetId: 'asset-1',
          type: 'IMAGE',
          fileName: 'roof.jpg',
          size: 1024,
          capturedAt: '2026-10-30T05:00:00Z',
          url: 'https://example.test/evidence',
          urlExpiresAt: '2026-11-01T05:00:00Z',
          downloadable: true,
          accessReason: null,
        },
      ],
    },
  ],
}

afterEach(() => {
  vi.restoreAllMocks()
  setLanguage('vi')
})

describe('TicketResultReviewCard', () => {
  it('shows submitted general and per-checklist feedback with selected evidence', async () => {
    setLanguage('en')
    vi.spyOn(supportApi, 'getResultReview').mockResolvedValue(response)
    render(<TicketResultReviewCard ticketId="ticket-1" />)

    expect(
      await screen.findByText('The image is too blurry to review.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Please focus on the north wing.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Poor quality')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'roof.jpg' })).toHaveAttribute(
      'href',
      'https://example.test/evidence',
    )
  })

  it('renders an explicit empty state when the ticket has no selected feedback', async () => {
    vi.spyOn(supportApi, 'getResultReview').mockResolvedValue({
      ...response,
      generalNote: null,
      items: [],
    })
    render(<TicketResultReviewCard ticketId="ticket-2" />)

    expect(
      await screen.findByText('Phiếu này chưa có nội dung đánh giá kết quả.'),
    ).toBeInTheDocument()
  })
})
