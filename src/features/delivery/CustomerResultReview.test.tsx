import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setLanguage } from '../../shared/i18n'
import { deliveryApi } from './api'
import { CustomerResultReview } from './CustomerResultReview'

const result = {
  reviewRoundId: 'round-1',
  roundNumber: 2,
  roundVersion: 7,
  publishedAt: '2026-10-30T03:00:00Z',
  checklistRevision: 1,
  canSubmitRevision: true,
  canAcceptResult: true,
  blockedReason: null,
  existingRequest: null,
  page: 0,
  size: 50,
  totalItems: 1,
  items: [
    {
      roundItemId: 'round-item-1',
      orderChecklistItemId: 'check-1',
      title: 'Roof inspection',
      description: 'Inspect the roof',
      executionSteps: ['Capture north side'],
      inputRequirements: [],
      expectedOutputs: ['Clear image'],
      missionId: 'mission-1',
      missionCode: 'M-001',
      evidence: [
        {
          roundEvidenceId: 'ev-1',
          mediaAssetId: 'asset-1',
          type: 'IMAGE',
          fileName: 'roof.jpg',
          size: 2048,
          capturedAt: '2026-10-29T00:00:00Z',
          url: 'https://example.test/signed',
          urlExpiresAt: '2026-11-01T00:00:00Z',
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

describe('CustomerResultReview', () => {
  it('keeps the same round-versioned payload and idempotency key after an uncertain retry', async () => {
    setLanguage('en')
    vi.spyOn(deliveryApi, 'getResultReview').mockResolvedValue(result)
    const send = vi
      .spyOn(deliveryApi, 'requestRevision')
      .mockRejectedValueOnce(new Error('network interrupted'))
      .mockResolvedValue({
        revisionRequestId: 'request-1',
        ticketId: 'ticket-1',
        ticketCode: 'SUP-1',
        reviewRoundId: 'round-1',
        submittedAt: '2026-10-30T04:00:00Z',
        deliveryStatus: 'REVISION_REQUESTED',
      })
    render(
      <CustomerResultReview
        orderId="order-1"
        onComplete={() => undefined}
        onSubmitted={() => undefined}
      />,
    )

    fireEvent.click(
      await screen.findByRole('checkbox', {
        name: 'Request a revision for this checklist item',
      }),
    )
    fireEvent.click(await screen.findByRole('checkbox', { name: /roof.jpg/ }))
    fireEvent.change(
      screen.getByLabelText('Note for this checklist item (required)'),
      { target: { value: 'Please capture the north edge again.' } },
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Send revision request' }),
    )
    fireEvent.click(
      await screen.findByRole('button', { name: 'Confirm and send' }),
    )
    await screen.findByText('network interrupted')
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1))
    fireEvent.click(
      await screen.findByRole('button', { name: 'Retry sending request' }),
    )
    fireEvent.click(
      await screen.findByRole('button', { name: 'Confirm and send' }),
    )
    await waitFor(() => expect(send).toHaveBeenCalledTimes(2))
    const first = send.mock.calls[0][1]
    const second = send.mock.calls[1][1]
    expect(first).toEqual({
      reviewRoundId: 'round-1',
      expectedRoundVersion: 7,
      clientRequestId: expect.any(String),
      generalNote: '',
      items: [
        {
          roundItemId: 'round-item-1',
          reasonCode: 'OTHER',
          note: 'Please capture the north edge again.',
          roundEvidenceIds: ['ev-1'],
        },
      ],
    })
    expect(second).toEqual(first)
  })
})
