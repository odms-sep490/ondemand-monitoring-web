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

  it('allows replacing prior media with backend-verified supplemental media of a completed rework mission', async () => {
    const revision = reviewCase([flagged])
    revision.items[0] = {
      ...revision.items[0],
      scopeDecision: 'IN_SCOPE',
      strategy: 'REWORK',
      status: 'IN_PROGRESS',
      scopeReason: 'Valid customer rework',
      assignedReworkMissionId: 'rework-1',
      assignedReworkMissionStatus: 'COMPLETED',
    }
    vi.mocked(deliveryApi.managerGet).mockResolvedValue({
      ...delivery,
      deliveryStatus: 'REVISION_REQUESTED',
    })
    vi.mocked(deliveryApi.managerGetRevisionCase).mockResolvedValue(revision)
    vi.mocked(deliveryApi.managerGetChecklists).mockResolvedValue({
      ...checklists,
      deliveryStatus: 'REVISION_REQUESTED',
      currentReviewRoundId: 'round-1',
      currentReviewRoundVersion: 1,
      checklists: [
        {
          ...checklists.checklists[0],
          currentBundle: [
            {
              roundEvidenceId: 're-old',
              mediaAssetId: 'old-asset',
              type: 'IMAGE',
              fileName: 'old-roof.jpg',
              size: 1024,
              capturedAt: null,
              missionId: 'orig-1',
              missionCode: 'MS-ORIG-1',
              url: '/old.jpg',
              thumbnailUrl: '/old-thumb.jpg',
              previewUrl: '/old-preview.jpg',
              urlExpiresAt: null,
              accessReason: null,
              changeType: 'INITIAL',
              previewStatus: 'READY',
            },
          ],
          eligibleMedia: [
            {
              roundEvidenceId: null,
              mediaAssetId: 'supp-asset',
              type: 'IMAGE',
              fileName: 'supp-roof.jpg',
              size: 2048,
              capturedAt: null,
              missionId: 'rework-supp-1',
              missionCode: 'MS-SUPP-1',
              url: '/supp.jpg',
              thumbnailUrl: '/supp-thumb.jpg',
              previewUrl: '/supp-preview.jpg',
              urlExpiresAt: null,
              accessReason: null,
              changeType: null,
              previewStatus: 'READY',
            },
          ],
        },
      ],
    })
    vi.spyOn(deliveryApi, 'managerSaveChecklistDraft').mockResolvedValue({
      ...draft,
      caseId: 'case',
      baseReviewRoundId: 'round-1',
    })

    render(<ManagerDeliveryPanel orderId="o" />)
    fireEvent.click(await screen.findByText('Roof'))
    expect(await screen.findByText('supp-roof.jpg')).toBeInTheDocument()
  })

  it('refreshes expired manager media URLs through manager APIs and deduplicates concurrent refreshes', async () => {
    const expiredChecklist: ManagerChecklistDelivery = {
      ...checklists,
      deliveryStatus: 'REVISION_REQUESTED',
      currentReviewRoundId: 'round-1',
      currentReviewRoundVersion: 1,
      checklists: [
        {
          ...checklists.checklists[0],
          currentBundle: [
            {
              roundEvidenceId: 're-1',
              mediaAssetId: 'asset-1',
              type: 'IMAGE',
              fileName: 'photo-1.jpg',
              size: 1024,
              capturedAt: null,
              missionId: 'm1',
              missionCode: 'MS-1',
              url: '/expired-1.jpg',
              thumbnailUrl: '/expired-1.jpg',
              previewUrl: '/expired-1.jpg',
              urlExpiresAt: null,
              accessReason: null,
              changeType: 'INITIAL',
              previewStatus: 'READY',
            },
            {
              roundEvidenceId: 're-2',
              mediaAssetId: 'asset-2',
              type: 'IMAGE',
              fileName: 'photo-2.jpg',
              size: 1024,
              capturedAt: null,
              missionId: 'm1',
              missionCode: 'MS-1',
              url: '/expired-2.jpg',
              thumbnailUrl: '/expired-2.jpg',
              previewUrl: '/expired-2.jpg',
              urlExpiresAt: null,
              accessReason: null,
              changeType: 'INITIAL',
              previewStatus: 'READY',
            },
          ],
          eligibleMedia: [],
        },
      ],
    }
    const refreshedChecklist: ManagerChecklistDelivery = {
      ...expiredChecklist,
      checklists: [
        {
          ...expiredChecklist.checklists[0],
          currentBundle: [
            {
              ...expiredChecklist.checklists[0].currentBundle[0],
              url: '/fresh-1.jpg',
              thumbnailUrl: '/fresh-1-thumb.jpg',
              previewUrl: '/fresh-1-preview.jpg',
            },
            {
              ...expiredChecklist.checklists[0].currentBundle[1],
              url: null,
              thumbnailUrl: null,
              previewUrl: null,
              accessReason: 'MEDIA_UNAVAILABLE',
            },
          ],
        },
      ],
    }

    vi.mocked(deliveryApi.managerGet).mockResolvedValue({
      ...delivery,
      deliveryStatus: 'REVISION_REQUESTED',
    })
    const getChecklistsSpy = vi
      .mocked(deliveryApi.managerGetChecklists)
      .mockResolvedValueOnce(expiredChecklist)
      .mockResolvedValue(refreshedChecklist)

    render(<ManagerDeliveryPanel orderId="o" />)
    fireEvent.click(await screen.findByText('Roof'))
    const img1 = await screen.findByRole('img', { name: 'photo-1.jpg' })
    const img2 = await screen.findByRole('img', { name: 'photo-2.jpg' })

    // Trigger concurrent load errors on both images
    fireEvent.error(img1)
    fireEvent.error(img2)

    expect(
      await screen.findByRole('img', { name: 'photo-1.jpg' }),
    ).toHaveAttribute('src', '/fresh-1-thumb.jpg')
    // Only 1 initial load + 1 shared refresh call
    expect(getChecklistsSpy).toHaveBeenCalledTimes(2)
  })

  it('recovers the second expired image even when the first preview that started the shared refresh is closed mid-flight', async () => {
    const expiredChecklist: ManagerChecklistDelivery = {
      ...checklists,
      deliveryStatus: 'REVISION_REQUESTED',
      currentReviewRoundId: 'round-1',
      currentReviewRoundVersion: 1,
      checklists: [
        {
          ...checklists.checklists[0],
          currentBundle: [
            {
              roundEvidenceId: 're-video-1',
              mediaAssetId: 'video-1',
              type: 'VIDEO',
              fileName: 'clip-1.mp4',
              size: 1024,
              capturedAt: null,
              missionId: 'm1',
              missionCode: 'MS-1',
              url: '/expired-clip-1.mp4',
              thumbnailUrl: '/poster-1.jpg',
              previewUrl: '/expired-clip-1.mp4',
              urlExpiresAt: null,
              accessReason: null,
              changeType: 'INITIAL',
              previewStatus: 'READY',
            },
            {
              roundEvidenceId: 're-img-2',
              mediaAssetId: 'img-2',
              type: 'IMAGE',
              fileName: 'photo-2.jpg',
              size: 1024,
              capturedAt: null,
              missionId: 'm1',
              missionCode: 'MS-1',
              url: '/expired-2.jpg',
              thumbnailUrl: '/expired-2.jpg',
              previewUrl: '/expired-2.jpg',
              urlExpiresAt: null,
              accessReason: null,
              changeType: 'INITIAL',
              previewStatus: 'READY',
            },
          ],
          eligibleMedia: [],
        },
      ],
    }
    const refreshedChecklist: ManagerChecklistDelivery = {
      ...expiredChecklist,
      checklists: [
        {
          ...expiredChecklist.checklists[0],
          currentBundle: [
            {
              ...expiredChecklist.checklists[0].currentBundle[0],
              url: '/fresh-clip-1.mp4',
              previewUrl: '/fresh-clip-1.mp4',
            },
            {
              ...expiredChecklist.checklists[0].currentBundle[1],
              url: '/fresh-2.jpg',
              thumbnailUrl: '/fresh-2-thumb.jpg',
              previewUrl: '/fresh-2-preview.jpg',
            },
          ],
        },
      ],
    }

    let resolveRefresh!: (value: ManagerChecklistDelivery) => void
    let refreshSignal!: AbortSignal
    vi.mocked(deliveryApi.managerGet).mockResolvedValue({
      ...delivery,
      deliveryStatus: 'REVISION_REQUESTED',
    })
    const getChecklistsSpy = vi
      .mocked(deliveryApi.managerGetChecklists)
      .mockResolvedValueOnce(expiredChecklist)
      .mockImplementation(
        (_orderId, signal) =>
          new Promise<ManagerChecklistDelivery>((resolve, reject) => {
            if (signal) {
              refreshSignal = signal
              signal.addEventListener(
                'abort',
                () => reject(new DOMException('Aborted', 'AbortError')),
                { once: true },
              )
            }
            resolveRefresh = resolve
          }),
      )

    render(<ManagerDeliveryPanel orderId="o" />)
    fireEvent.click(await screen.findByText('Roof'))

    // 1. Open the first item's video preview modal and trigger its error FIRST (starting the shared refresh)
    fireEvent.click(
      await screen.findByRole('button', { name: 'View video clip-1.mp4' }),
    )
    const dialog = await screen.findByRole('dialog')
    const videoEl = dialog.querySelector('video')!
    fireEvent.error(videoEl)

    // 2. While the shared refresh is in flight, the second item's image thumbnail also fails (joining the shared refresh)
    const img2 = screen.getByRole('img', { name: 'photo-2.jpg' })
    fireEvent.error(img2)

    expect(getChecklistsSpy).toHaveBeenCalledTimes(2)

    // 3. Close the first preview modal mid-flight (unmounting ResilientMedia and aborting the first caller's AbortController)
    fireEvent.click(within(dialog).getByRole('button', { name: /Close/i }))
    expect(refreshSignal.aborted).toBe(false)

    // 4. Resolve the shared refresh and verify the second image still recovers its new URL
    resolveRefresh(refreshedChecklist)
    expect(
      await screen.findByRole('img', { name: 'photo-2.jpg' }),
    ).toHaveAttribute('src', '/fresh-2-thumb.jpg')
  })

  it('expands and moves keyboard focus to the reserve media checklist editor and coalesces window focus refresh only when clean', async () => {
    const revision = reviewCase([flagged])
    revision.items[0] = {
      ...revision.items[0],
      scopeDecision: 'IN_SCOPE',
      strategy: 'RESERVE_MEDIA',
      status: 'IN_PROGRESS',
      scopeReason: 'Use reserve image',
    }
    vi.mocked(deliveryApi.managerGet).mockResolvedValue({
      ...delivery,
      deliveryStatus: 'REVISION_REQUESTED',
    })
    vi.mocked(deliveryApi.managerGetRevisionCase).mockResolvedValue(revision)
    const getChecklistsSpy = vi
      .mocked(deliveryApi.managerGetChecklists)
      .mockResolvedValue({
        ...checklists,
        deliveryStatus: 'REVISION_REQUESTED',
        currentReviewRoundId: 'round-1',
        currentReviewRoundVersion: 1,
        checklists: [
          {
            ...checklists.checklists[0],
            eligibleMedia: [
              {
                roundEvidenceId: null,
                mediaAssetId: 'reserve-1',
                type: 'IMAGE',
                fileName: 'reserve-photo.jpg',
                size: 1024,
                capturedAt: null,
                missionId: 'm1',
                missionCode: 'MS-1',
                url: '/reserve.jpg',
                thumbnailUrl: '/reserve-thumb.jpg',
                previewUrl: '/reserve-preview.jpg',
                urlExpiresAt: null,
                accessReason: null,
                changeType: null,
                previewStatus: 'READY',
              },
            ],
          },
        ],
      })

    render(<ManagerDeliveryPanel orderId="o" />)
    fireEvent.click(await screen.findByText('Reported checklist'))
    const jumpBtn = await screen.findByRole('button', {
      name: 'Select reserve media for this item',
    })
    fireEvent.click(jumpBtn)

    await screen.findByText('reserve-photo.jpg')
    await vi.waitFor(() => {
      const editor = document.getElementById('delivery-checklist-editor-c')
      expect(editor).not.toBeNull()
      expect(editor?.contains(document.activeElement)).toBe(true)
    })

    // Coalesced focus + visibilitychange triggers at most 1 refresh when draft is clean
    const callsBeforeFocus = getChecklistsSpy.mock.calls.length
    fireEvent(window, new Event('focus'))
    fireEvent(document, new Event('visibilitychange'))
    await vi.waitFor(() =>
      expect(getChecklistsSpy.mock.calls.length).toBe(callsBeforeFocus + 1),
    )
  })
})
