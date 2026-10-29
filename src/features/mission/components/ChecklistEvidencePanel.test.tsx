import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
  act,
} from '@testing-library/react'
import { ChecklistEvidencePanel } from './ChecklistEvidencePanel'
import { MonitoringChecklistSection } from './MonitoringChecklistSection'
import { checklistEvidenceApi } from '../api/checklistEvidenceApi'
import type {
  EvidenceCandidate,
  MissionChecklistEvidence,
  MissionChecklistExecution,
} from '../types/checklistExecution'
const link: MissionChecklistEvidence = {
  evidenceId: 'link',
  mediaId: 'backend-media',
  executionId: 'e',
  attachedBy: 'inspector',
  attachedAt: '2026-10-05T00:00:00Z',
  note: null,
  version: 0,
  mediaType: 'IMAGE',
  contentType: 'image/jpeg',
  fileName: 'capture.jpg',
  mediaStatus: 'PENDING_MANAGER_APPROVAL',
  sourceType: 'DRONE_CAMERA',
  capturedAt: '2026-10-05T00:00:00Z',
  sourceCapturedAt: null,
  validatedAt: '2026-10-05T00:00:00Z',
  eligibleForOperationalReadiness: true,
  eligibleForFinalApproval: false,
  ineligibilityReason: null,
  previewUrl: 'https://example.test/image',
  urlExpiresAt: '2026-10-05T00:15:00Z',
}
const item: MissionChecklistExecution = {
  id: 'e',
  orderChecklistItemId: 'snapshot',
  content: 'Historical fence',
  displayOrder: 0,
  sourceType: 'CUSTOMER_CUSTOM',
  executionStatus: 'COMPLETED',
  assessmentStatus: 'NOT_ASSESSED',
  observation: null,
  unableToVerifyReason: null,
  startedAt: null,
  completedAt: null,
  lastModifiedBy: null,
  createdAt: '2026-10-05T00:00:00Z',
  updatedAt: null,
  version: 4,
  evidencePolicyVersion: 1,
  minimumEvidenceCount: 1,
  eligibleEvidenceCount: 1,
  evidenceReady: true,
  evidence: [link],
}
const candidate: EvidenceCandidate = {
  mediaId: 'backend-media',
  fileName: 'capture.jpg',
  mediaType: 'IMAGE',
  contentType: 'image/jpeg',
  status: 'PENDING_MANAGER_APPROVAL',
  sourceType: 'DRONE_CAMERA',
  capturedAt: link.capturedAt,
  validatedAt: link.validatedAt,
  attachable: true,
  eligibleForOperationalReadiness: true,
  eligibleForFinalApproval: false,
  ineligibilityReason: null,
  previewUrl: link.previewUrl,
  urlExpiresAt: link.urlExpiresAt,
  alreadyAttachedExecutionIds: [],
}
const props = {
  missionId: 'm',
  item,
  canAttach: true,
  canDetach: true,
  refresh: vi.fn(),
}
afterEach(() => vi.restoreAllMocks())
describe('Checklist evidence', () => {
  it('shows per-item preview, source, status and backend readiness', () => {
    render(<ChecklistEvidencePanel {...props} />)
    expect(screen.getByAltText('capture.jpg')).toBeInTheDocument()
    expect(screen.getByText(/Camera drone/)).toBeInTheDocument()
    expect(screen.getByText(/Bằng chứng hợp lệ: 1 \/ 1/)).toBeInTheDocument()
    expect(screen.getByText('Chờ quản lý duyệt')).toBeInTheDocument()
    expect(screen.queryByText(/Duyệt media bắt buộc/)).toBeNull()
  })
  it('attaches stable backend media id with expected execution version', async () => {
    vi.spyOn(checklistEvidenceApi, 'candidates').mockResolvedValue([candidate])
    const attach = vi
      .spyOn(checklistEvidenceApi, 'attach')
      .mockResolvedValue([link])
    render(
      <ChecklistEvidencePanel {...props} item={{ ...item, evidence: [] }} />,
    )
    fireEvent.click(screen.getByText('Thêm bằng chứng từ media của nhiệm vụ'))
    fireEvent.click(await screen.findByText('Gắn media'))
    await waitFor(() =>
      expect(attach).toHaveBeenCalledWith('m', 'e', 'backend-media', 4),
    )
  })
  it('soft-detach command uses association id and execution version', async () => {
    const detach = vi
      .spyOn(checklistEvidenceApi, 'detach')
      .mockResolvedValue(undefined)
    render(<ChecklistEvidencePanel {...props} />)
    fireEvent.click(screen.getByText('Gỡ bằng chứng'))
    await waitFor(() =>
      expect(detach).toHaveBeenCalledWith('m', 'e', 'link', 4),
    )
  })
  it('excludes sources backend marks non-attachable from selectable candidates', async () => {
    vi.spyOn(checklistEvidenceApi, 'candidates').mockResolvedValue([
      {
        ...candidate,
        sourceType: 'MANUAL_UPLOAD',
        attachable: false,
        ineligibilityReason: 'EVIDENCE_SOURCE_NOT_ELIGIBLE',
      },
    ])
    render(<ChecklistEvidencePanel {...props} />)
    fireEvent.click(screen.getByText('Thêm bằng chứng từ media của nhiệm vụ'))
    const dialog = within(await screen.findByRole('dialog'))
    expect(
      await dialog.findByText(/Nguồn media không hợp lệ/),
    ).toBeInTheDocument()
    expect(
      dialog.getByRole('button', { name: /Gắn media|Đã gắn/ }),
    ).toBeDisabled()
  })
  it('explains an empty Mission and links to the upload screen', async () => {
    vi.spyOn(checklistEvidenceApi, 'candidates').mockResolvedValue([])
    render(<ChecklistEvidencePanel {...props} />)
    fireEvent.click(screen.getByText('Thêm bằng chứng từ media của nhiệm vụ'))
    const dialog = within(await screen.findByRole('dialog'))
    expect(
      await dialog.findByText(/chưa có media nào được tải lên/),
    ).toBeInTheDocument()
    expect(
      dialog.getByRole('link', { name: 'mở media nghiệm thu' }),
    ).toHaveAttribute('href', expect.stringContaining('upload'))
  })
  it('shows backend eligible count, type, and remaining count; UNABLE_TO_VERIFY remains exempt', () => {
    render(
      <ChecklistEvidencePanel
        {...props}
        item={{
          ...item,
          evidence: [],
          eligibleEvidenceCount: 1,
          minimumEvidenceCount: 3,
          requiredEvidenceType: 'VIDEO',
          blockingReasons: [
            'EVIDENCE_TYPE_NOT_ELIGIBLE',
            'INSUFFICIENT_EVIDENCE',
          ],
        }}
      />,
    )
    expect(
      screen.getByText(/Bằng chứng hợp lệ: 1 \/ 3 · Chỉ video/),
    ).toBeInTheDocument()
    expect(
      within(screen.getByLabelText('Bằng chứng: Historical fence')).getByText(
        'Còn thiếu 2 bằng chứng hợp lệ',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Loại media không phù hợp yêu cầu/),
    ).toBeInTheDocument()
    expect(screen.getByText('Chưa đủ bằng chứng hợp lệ.')).toBeInTheDocument()
    const unableView = render(
      <ChecklistEvidencePanel
        {...props}
        item={{
          ...item,
          executionStatus: 'UNABLE_TO_VERIFY',
          unableToVerifyReason: 'Mưa lớn cản trở',
          evidence: [],
          eligibleEvidenceCount: 0,
          minimumEvidenceCount: 3,
          requiredEvidenceType: 'VIDEO',
        }}
      />,
    )
    expect(
      within(unableView.container).getByText(
        /Bằng chứng hợp lệ: 0 \/ 3 · Chỉ video/,
      ),
    ).toBeInTheDocument()
    expect(
      within(unableView.container).getByText(
        /Quy trình ngoại lệ: Miễn nộp bằng chứng do không thể xác minh/,
      ),
    ).toBeInTheDocument()
    expect(
      within(unableView.container).getByLabelText(
        'Bằng chứng: Historical fence',
      ),
    ).not.toHaveTextContent('Còn thiếu')
    unableView.unmount()
  })
  it('only offers candidates matching this checklist item evidence type', async () => {
    vi.spyOn(checklistEvidenceApi, 'candidates').mockResolvedValue([
      candidate,
      {
        ...candidate,
        mediaId: 'video',
        mediaType: 'VIDEO',
        fileName: 'capture.mp4',
      },
    ])
    render(
      <ChecklistEvidencePanel
        {...props}
        item={{ ...item, evidence: [], requiredEvidenceType: 'VIDEO' }}
      />,
    )
    fireEvent.click(screen.getByText('Thêm bằng chứng từ media của nhiệm vụ'))
    expect(await screen.findByText('capture.mp4')).toBeInTheDocument()
    const wrongTypeRow = within(screen.getByRole('dialog'))
      .getAllByRole('button', { name: 'Gắn media' })
      .find((button) =>
        button.closest('li')?.textContent?.includes('capture.jpg'),
      )
    expect(wrongTypeRow).toBeDisabled()
    expect(wrongTypeRow?.closest('li')).toHaveTextContent(
      'Loại media không phù hợp yêu cầu',
    )
  })
  it('retains rejected evidence with blocker and supports video', () => {
    render(
      <ChecklistEvidencePanel
        {...props}
        item={{
          ...item,
          evidence: [
            {
              ...link,
              mediaType: 'VIDEO',
              mediaStatus: 'REJECTED',
              eligibleForOperationalReadiness: false,
              ineligibilityReason: 'MEDIA_REJECTED',
            },
          ],
          eligibleEvidenceCount: 0,
          evidenceReady: false,
        }}
      />,
    )
    expect(screen.getByText(/Bằng chứng hợp lệ: 0 \/ 1/)).toBeInTheDocument()
    expect(screen.getByText('Media đã bị từ chối.')).toBeInTheDocument()
    expect(document.querySelector('video')).not.toBeNull()
  })
  it('Inspector may attach while execution editing remains read-only', () => {
    render(
      <MonitoringChecklistSection
        missionId="m"
        loading={false}
        canExecute={false}
        canAttach
        canDetach
        resultStatus="DRAFT"
        refresh={vi.fn()}
        data={{
          missionId: 'm',
          legacySnapshot: false,
          readyForSubmission: true,
          executions: [item],
        }}
      />,
    )
    expect(screen.queryByText('Cập nhật mục')).toBeNull()
    expect(screen.getByText('Thêm bằng chứng từ media của nhiệm vụ')).toBeEnabled()
  })
  it.each(['PENDING_MANAGER_APPROVAL', 'APPROVED'] as const)(
    'locks evidence controls for result %s',
    (status) => {
      render(
        <MonitoringChecklistSection
          missionId="m"
          loading={false}
          canAttach
          canDetach
          resultStatus={status}
          refresh={vi.fn()}
          data={{
            missionId: 'm',
            legacySnapshot: false,
            readyForSubmission: true,
            executions: [item],
          }}
        />,
      )
      expect(screen.queryByText('Gỡ bằng chứng')).toBeNull()
      expect(screen.queryByText('Thêm bằng chứng từ media của nhiệm vụ')).toBeNull()
    },
  )
  it('does not expose per-media manager approval', () => {
    render(
      <ChecklistEvidencePanel {...props} canAttach={false} canDetach={false} />,
    )
    expect(screen.queryByText('Duyệt media')).toBeNull()
    expect(screen.queryByText('Từ chối media')).toBeNull()
    expect(screen.queryByText('Duyệt kết quả')).toBeNull()
  })
})

describe('Evidence picker Mission-scoped loading', () => {
  const emptyItem = { ...item, evidence: [] }
  function open() {
    fireEvent.click(screen.getByText('Thêm bằng chứng từ media của nhiệm vụ'))
  }
  it.each(['DRONE_CAMERA', 'SATELLITE_SNAPSHOT'])(
    'shows pending approval %s media with a thumbnail, regardless of final approval readiness',
    async (sourceType) => {
      vi.spyOn(checklistEvidenceApi, 'candidates').mockResolvedValue([
        { ...candidate, sourceType },
      ])
      render(<ChecklistEvidencePanel {...props} item={emptyItem} />)
      open()
      expect(
        await screen.findByAltText('Xem trước capture.jpg'),
      ).toHaveAttribute('src', candidate.previewUrl)
      expect(
        within(screen.getByRole('dialog')).getByText('Gắn media'),
      ).toBeEnabled()
      expect(screen.getByText('Chờ quản lý duyệt')).toBeInTheDocument()
      expect(screen.queryByText('Trang sau')).not.toBeInTheDocument()
    },
  )
  it('shows attached state from authoritative candidate associations, not misleading empty copy', async () => {
    vi.spyOn(checklistEvidenceApi, 'candidates').mockResolvedValue([
      { ...candidate, alreadyAttachedExecutionIds: ['e'] },
    ])
    render(<ChecklistEvidencePanel {...props} item={emptyItem} />)
    open()
    expect(await screen.findByText('Đã gắn')).toBeDisabled()
    expect(
      screen.getByText('Tất cả media phù hợp đã được gắn vào checklist này.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Không có media nào để gắn.'),
    ).not.toBeInTheDocument()
  })
  it('does not mistake attachment to another execution for attachment to this item', async () => {
    vi.spyOn(checklistEvidenceApi, 'candidates').mockResolvedValue([
      { ...candidate, alreadyAttachedExecutionIds: ['sibling-execution'] },
    ])
    render(<ChecklistEvidencePanel {...props} item={emptyItem} />)
    open()
    expect(await screen.findByText('Gắn media')).toBeEnabled()
  })
  it('opens loading immediately without showing an empty result', async () => {
    let resolve!: (value: EvidenceCandidate[]) => void
    vi.spyOn(checklistEvidenceApi, 'candidates').mockReturnValue(
      new Promise((r) => {
        resolve = r
      }),
    )
    render(<ChecklistEvidencePanel {...props} item={emptyItem} />)
    open()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Đang tải media...')
    expect(
      screen.queryByText(
        'Mission này chưa có media phù hợp để làm bằng chứng.',
      ),
    ).not.toBeInTheDocument()
    await act(async () => resolve([candidate]))
    expect(screen.getByText('Gắn media')).toBeEnabled()
  })
  it('shows localized API failure inside the modal, retries, and never presents it as empty', async () => {
    const fetch = vi
      .spyOn(checklistEvidenceApi, 'candidates')
      .mockRejectedValueOnce(new Error('INTERNAL_SERVER_ERROR'))
      .mockResolvedValue([candidate])
    render(<ChecklistEvidencePanel {...props} item={emptyItem} />)
    open()
    expect(
      await screen.findByText('Không thể tải media của nhiệm vụ.'),
    ).toBeInTheDocument()
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByRole('alert')).toHaveTextContent(
      'Không thể tải media của nhiệm vụ.',
    )
    expect(screen.queryByText('INTERNAL_SERVER_ERROR')).not.toBeInTheDocument()
    expect(
      screen.queryByText(
        'Mission này chưa có media phù hợp để làm bằng chứng.',
      ),
    ).not.toBeInTheDocument()
    fireEvent.click(dialog.getByText('Thử lại'))
    await screen.findByText('Gắn media')
    expect(fetch).toHaveBeenCalledTimes(2)
  })
  it('rejects malformed response contracts instead of producing a false empty', async () => {
    vi.spyOn(checklistEvidenceApi, 'candidates').mockResolvedValue(
      null as unknown as EvidenceCandidate[],
    )
    render(<ChecklistEvidencePanel {...props} item={emptyItem} />)
    open()
    expect(
      await screen.findByText('Không thể tải media của nhiệm vụ.'),
    ).toBeInTheDocument()
  })
  it('distinguishes no eligible media from filename search returning no matches', async () => {
    vi.spyOn(checklistEvidenceApi, 'candidates').mockResolvedValue([candidate])
    render(<ChecklistEvidencePanel {...props} item={emptyItem} />)
    open()
    await screen.findByText('Gắn media')
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'not-present' },
    })
    expect(
      screen.getByText('Không tìm thấy media phù hợp.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(
        'Mission này chưa có media phù hợp để làm bằng chứng.',
      ),
    ).not.toBeInTheDocument()
  })
  it('preserves backend pre-validation attachment eligibility without claiming readiness', async () => {
    vi.spyOn(checklistEvidenceApi, 'candidates').mockResolvedValue([
      {
        ...candidate,
        status: 'UPLOAD_PENDING',
        validatedAt: null,
        eligibleForOperationalReadiness: false,
        ineligibilityReason: 'MEDIA_NOT_VALIDATED',
      },
    ])
    render(<ChecklistEvidencePanel {...props} item={emptyItem} />)
    open()
    expect(await screen.findByText('Gắn media')).toBeEnabled()
    expect(
      screen.getByText('Media chưa xác thực thành công.'),
    ).toBeInTheDocument()
  })
  it('excludes rejected media only when backend denies attachment', async () => {
    vi.spyOn(checklistEvidenceApi, 'candidates').mockResolvedValue([
      {
        ...candidate,
        status: 'REJECTED',
        attachable: false,
        ineligibilityReason: 'MEDIA_REJECTED',
      },
    ])
    render(<ChecklistEvidencePanel {...props} item={emptyItem} />)
    open()
    const dialog = within(await screen.findByRole('dialog'))
    expect(await dialog.findByText('Media đã bị từ chối.')).toBeInTheDocument()
    expect(dialog.getByRole('button', { name: 'Gắn media' })).toBeDisabled()
  })
  it('resets on Mission changes, aborts M1 and cannot display a late M1 response in M2', async () => {
    let resolve!: (value: EvidenceCandidate[]) => void
    const fetch = vi
      .spyOn(checklistEvidenceApi, 'candidates')
      .mockImplementation((id) =>
        id === 'm1'
          ? new Promise((r) => {
              resolve = r
            })
          : Promise.resolve([
              { ...candidate, mediaId: 'm2-asset', fileName: 'm2.jpg' },
            ]),
      )
    const view = render(
      <ChecklistEvidencePanel {...props} missionId="m1" item={emptyItem} />,
    )
    open()
    const firstSignal = fetch.mock.calls[0][2]!
    view.rerender(
      <ChecklistEvidencePanel
        {...props}
        missionId="m2"
        item={{ ...emptyItem, id: 'e2' }}
      />,
    )
    expect(firstSignal.aborted).toBe(true)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    open()
    await screen.findByText('m2.jpg')
    await act(async () => resolve([candidate]))
    expect(screen.queryByText('capture.jpg')).not.toBeInTheDocument()
    expect(fetch).toHaveBeenLastCalledWith('m2', 0, expect.any(AbortSignal))
  })
  it('close/reopen refreshes media and attachment state, dropping old pending responses', async () => {
    let resolve!: (value: EvidenceCandidate[]) => void
    const fetch = vi
      .spyOn(checklistEvidenceApi, 'candidates')
      .mockReturnValueOnce(
        new Promise((r) => {
          resolve = r
        }),
      )
      .mockResolvedValue([{ ...candidate, alreadyAttachedExecutionIds: ['e'] }])
    render(<ChecklistEvidencePanel {...props} item={emptyItem} />)
    open()
    fireEvent.click(screen.getByRole('button', { name: /^Đóng$/ }))
    open()
    await screen.findByText('Đã gắn')
    await act(async () => resolve([candidate]))
    expect(screen.getByText('Đã gắn')).toBeDisabled()
    expect(fetch).toHaveBeenCalledTimes(2)
  })
  it('renders video preview when available', async () => {
    vi.spyOn(checklistEvidenceApi, 'candidates').mockResolvedValue([
      { ...candidate, mediaType: 'VIDEO', contentType: 'video/mp4' },
    ])
    render(<ChecklistEvidencePanel {...props} item={emptyItem} />)
    open()
    expect(
      await screen.findByLabelText('Xem video capture.jpg'),
    ).toHaveAttribute('src', candidate.previewUrl)
  })
})
