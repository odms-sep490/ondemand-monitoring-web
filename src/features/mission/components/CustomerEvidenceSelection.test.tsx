import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ApiError } from '../../../shared/api/httpClient'
import { setLanguage } from '../../../shared/i18n'
import { checklistEvidenceApi } from '../api/checklistEvidenceApi'
import { ChecklistEvidencePanel } from './ChecklistEvidencePanel'
import { CustomerEvidenceSelection } from './CustomerEvidenceSelection'
import type {
  MissionChecklistEvidence,
  MissionChecklistExecution,
} from '../types/checklistExecution'

const evidence = (id: string, eligible = true): MissionChecklistEvidence => ({
  evidenceId: id,
  mediaId: `media-${id}`,
  executionId: 'e',
  attachedBy: 'staff',
  attachedAt: '',
  note: null,
  version: 0,
  mediaType: 'IMAGE',
  contentType: 'image/jpeg',
  fileName: `${id}.jpg`,
  mediaStatus: 'AVAILABLE',
  sourceType: 'DRONE_CAMERA',
  capturedAt: '',
  sourceCapturedAt: null,
  validatedAt: '',
  eligibleForOperationalReadiness: true,
  eligibleForFinalApproval: eligible,
  ineligibilityReason: null,
  previewUrl: null,
  urlExpiresAt: null,
  selectedForCustomer: false,
})
const item: MissionChecklistExecution = {
  id: 'e',
  orderChecklistItemId: 'c',
  content: 'Roof',
  displayOrder: 1,
  sourceType: 'SERVICE_TEMPLATE',
  executionStatus: 'COMPLETED',
  assessmentStatus: 'COMPLIANT',
  observation: 'Staff observation',
  unableToVerifyReason: null,
  startedAt: null,
  completedAt: null,
  lastModifiedBy: null,
  createdAt: '',
  updatedAt: null,
  version: 7,
  evidencePolicyVersion: 3,
  minimumImageCount: 1,
  minimumVideoCount: 0,
  evidence: [evidence('one'), evidence('two'), evidence('pending', false)],
}
afterEach(() => {
  vi.restoreAllMocks()
  setLanguage('vi')
})

describe('inspector customer selection', () => {
  it('renders the video poster in its row and preview without changing selection', async () => {
    render(
      <CustomerEvidenceSelection
        missionId="m"
        item={{
          ...item,
          evidence: [
            {
              ...evidence('clip'),
              mediaType: 'VIDEO',
              fileName: 'clip.mp4',
              thumbnailUrl: '/poster.jpg',
              previewUrl: '/clip.mp4',
            },
          ],
        }}
        refresh={vi.fn()}
      />,
    )
    const open = screen.getByRole('button', { name: 'Xem clip.mp4' })
    expect(open.querySelector('img')).toHaveAttribute('src', '/poster.jpg')
    expect(document.querySelector('video')).toBeNull()
    fireEvent.click(open)
    const dialog = await screen.findByRole('dialog')
    expect(dialog.querySelector('video')).toHaveAttribute(
      'poster',
      '/poster.jpg',
    )
    expect(dialog.querySelector('video')).toHaveAttribute(
      'controlslist',
      'nodownload',
    )
    expect(screen.getByRole('checkbox', { name: /clip.mp4/ })).not.toBeChecked()
  })
  it('falls back to the video icon on a broken poster and accepts a refreshed poster URL', () => {
    const clip = {
      ...evidence('clip'),
      mediaType: 'VIDEO',
      fileName: 'clip.mp4',
      thumbnailUrl: '/broken.jpg',
      previewUrl: '/clip.mp4',
    }
    const { rerender } = render(
      <CustomerEvidenceSelection
        missionId="m"
        item={{ ...item, evidence: [clip] }}
        refresh={vi.fn()}
      />,
    )
    const open = screen.getByRole('button', { name: 'Xem clip.mp4' })
    fireEvent.error(open.querySelector('img')!)
    expect(open.querySelector('img')).toBeNull()
    expect(open).toBeEnabled()
    rerender(
      <CustomerEvidenceSelection
        missionId="m"
        item={{ ...item, evidence: [{ ...clip, thumbnailUrl: '/fresh.jpg' }] }}
        refresh={vi.fn()}
      />,
    )
    expect(open.querySelector('img')).toHaveAttribute('src', '/fresh.jpg')
  })
  it('requires the explicit selection capability in both evidence layouts', () => {
    const props = {
      missionId: 'm',
      item,
      canAttach: false,
      canDetach: false,
      refresh: vi.fn(),
    }
    const view = render(<ChecklistEvidencePanel {...props} />)
    expect(screen.queryByRole('checkbox')).toBeNull()
    view.rerender(
      <ChecklistEvidencePanel {...props} compact canSelectForCustomer />,
    )
    expect(screen.getAllByRole('checkbox')).toHaveLength(3)
    view.rerender(<ChecklistEvidencePanel {...props} canSelectForCustomer />)
    expect(screen.getAllByRole('checkbox')).toHaveLength(3)
  })
  it.each([false, true])(
    'renders each attachment only once in the inspector layout (compact=%s)',
    (compact) => {
      render(
        <ChecklistEvidencePanel
          missionId="m"
          item={item}
          canAttach
          canDetach
          canSelectForCustomer
          compact={compact}
          refresh={vi.fn()}
        />,
      )
      expect(
        screen.getByRole('heading', { name: 'Media của checklist' }),
      ).toBeInTheDocument()
      expect(screen.getAllByText('one.jpg')).toHaveLength(1)
      expect(screen.getAllByText('two.jpg')).toHaveLength(1)
      expect(
        screen.getByRole('button', { name: 'Gỡ bằng chứng one.jpg' }),
      ).toBeEnabled()
      expect(
        screen.getByRole('button', {
          name: compact ? /Thêm media/ : /Thêm bằng chứng/,
        }),
      ).toBeEnabled()
      expect(document.querySelector('.ce-list')).toBeNull()
      expect(document.querySelector('.checklist-evidence-grid')).toBeNull()
    },
  )
  it('keeps selection and removal disabled during an attachment mutation', () => {
    const detach = vi.fn()
    render(
      <CustomerEvidenceSelection
        missionId="m"
        item={item}
        refresh={vi.fn()}
        mutationBusy
        onDetach={detach}
      />,
    )
    expect(screen.getByRole('checkbox', { name: /one.jpg/ })).toBeDisabled()
    const remove = screen.getByRole('button', { name: 'Gỡ bằng chứng one.jpg' })
    expect(remove).toBeDisabled()
    fireEvent.click(remove)
    expect(detach).not.toHaveBeenCalled()
  })
  it('keeps noneligible media disabled and enforces the minimum before saving', async () => {
    const save = vi
      .spyOn(checklistEvidenceApi, 'selectForCustomer')
      .mockResolvedValue([])
    const refresh = vi.fn()
    render(
      <CustomerEvidenceSelection missionId="m" item={item} refresh={refresh} />,
    )
    expect(screen.getByRole('checkbox', { name: /pending.jpg/ })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: /Lưu lựa chọn gửi khách hàng/ }),
    ).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox', { name: /one.jpg/ }))
    fireEvent.click(
      screen.getByRole('button', { name: /Lưu lựa chọn gửi khách hàng/ }),
    )
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith('m', 'e', {
        expectedVersion: 7,
        evidenceIds: ['one'],
        confirmSurplus: false,
      }),
    )
    expect(refresh).toHaveBeenCalledOnce()
  })
  it('requires surplus confirmation and persists only after confirmation', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const save = vi
      .spyOn(checklistEvidenceApi, 'selectForCustomer')
      .mockResolvedValue([])
    render(
      <CustomerEvidenceSelection missionId="m" item={item} refresh={vi.fn()} />,
    )
    fireEvent.click(screen.getByRole('checkbox', { name: /one.jpg/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: /two.jpg/ }))
    fireEvent.click(
      screen.getByRole('button', { name: /Lưu lựa chọn gửi khách hàng/ }),
    )
    expect(confirm).toHaveBeenCalledOnce()
    expect(save).not.toHaveBeenCalled()
    confirm.mockReturnValue(true)
    fireEvent.click(
      screen.getByRole('button', { name: /Lưu lựa chọn gửi khách hàng/ }),
    )
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith('m', 'e', {
        expectedVersion: 7,
        evidenceIds: ['one', 'two'],
        confirmSurplus: true,
      }),
    )
  })
  it('loads persisted selection and reports a version conflict without retrying', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const save = vi
      .spyOn(checklistEvidenceApi, 'selectForCustomer')
      .mockRejectedValue(
        new ApiError('internal', { status: 409, method: 'PUT', path: '/' }),
      )
    const refresh = vi.fn()
    const selected = {
      ...item,
      evidence: [
        { ...evidence('one'), selectedForCustomer: true },
        evidence('two'),
      ],
    }
    const view = render(
      <ChecklistEvidencePanel
        missionId="m"
        item={selected}
        canAttach={false}
        canDetach={false}
        canSelectForCustomer
        refresh={refresh}
      />,
    )
    expect(screen.getByRole('checkbox', { name: /one.jpg/ })).toBeChecked()
    fireEvent.click(screen.getByRole('checkbox', { name: /two.jpg/ }))
    fireEvent.click(
      screen.getByRole('button', { name: /Lưu lựa chọn gửi khách hàng/ }),
    )
    await screen.findByText(/Không thể lưu lựa chọn/)
    expect(save).toHaveBeenCalledOnce()
    expect(refresh).toHaveBeenCalledOnce()
    expect(
      screen.getByRole('button', { name: /Lưu lựa chọn gửi khách hàng/ }),
    ).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Tải lại checklist' }))
    view.rerender(
      <ChecklistEvidencePanel
        missionId="m"
        item={{ ...selected, version: 8 }}
        canAttach={false}
        canDetach={false}
        canSelectForCustomer
        refresh={refresh}
      />,
    )
    save.mockResolvedValue([])
    fireEvent.click(screen.getByRole('checkbox', { name: /two.jpg/ }))
    fireEvent.click(
      screen.getByRole('button', { name: /Lưu lựa chọn gửi khách hàng/ }),
    )
    await waitFor(() =>
      expect(save).toHaveBeenLastCalledWith(
        'm',
        'e',
        expect.objectContaining({ expectedVersion: 8 }),
      ),
    )
  })
  it('disables unchanged selections without locking subsequent edits or making a no-op request', () => {
    const save = vi
      .spyOn(checklistEvidenceApi, 'selectForCustomer')
      .mockResolvedValue([])
    const selected = {
      ...item,
      evidence: [
        { ...evidence('one'), selectedForCustomer: true },
        evidence('two'),
      ],
    }
    const view = render(
      <ChecklistEvidencePanel
        missionId="m"
        item={selected}
        canAttach={false}
        canDetach={false}
        canSelectForCustomer
        refresh={vi.fn()}
      />,
    )
    const saveButton = () =>
      screen.getByRole('button', { name: /Lưu lựa chọn gửi khách hàng/ })
    expect(saveButton()).toBeDisabled()
    fireEvent.click(saveButton())
    expect(save).not.toHaveBeenCalled()
    view.rerender(
      <ChecklistEvidencePanel
        missionId="m"
        item={{ ...selected }}
        canAttach={false}
        canDetach={false}
        canSelectForCustomer
        refresh={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('checkbox', { name: /two.jpg/ }))
    expect(saveButton()).toBeEnabled()
    fireEvent.click(screen.getByRole('checkbox', { name: /two.jpg/ }))
    expect(saveButton()).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: /two.jpg/ })).toBeEnabled()
    expect(save).not.toHaveBeenCalled()
  })
  it('opens an image preview without changing the customer selection', async () => {
    const save = vi.spyOn(checklistEvidenceApi, 'selectForCustomer')
    render(
      <CustomerEvidenceSelection
        missionId="m"
        item={{
          ...item,
          evidence: [{ ...evidence('one'), previewUrl: '/one.jpg' }],
        }}
        refresh={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Xem one.jpg' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'one.jpg' })).toHaveAttribute(
      'src',
      '/one.jpg',
    )
    expect(screen.getByRole('checkbox', { name: /one.jpg/ })).not.toBeChecked()
    expect(save).not.toHaveBeenCalled()
  })
  it('previews video on demand without preloading all attached videos', async () => {
    render(
      <CustomerEvidenceSelection
        missionId="m"
        item={{
          ...item,
          evidence: [
            {
              ...evidence('clip'),
              fileName: 'clip.mp4',
              mediaType: 'VIDEO',
              previewUrl: '/clip.mp4',
            },
          ],
        }}
        refresh={vi.fn()}
      />,
    )
    expect(document.querySelector('video')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Xem clip.mp4' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog.querySelector('video')).toHaveAttribute('src', '/clip.mp4')
    expect(dialog.querySelector('video')).toHaveAttribute('controls')
  })
  it('labels customer and reserve choices in English', () => {
    setLanguage('en')
    render(
      <CustomerEvidenceSelection missionId="m" item={item} refresh={vi.fn()} />,
    )
    expect(
      screen.getByRole('button', { name: 'Save customer selection' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('checkbox', { name: 'one.jpg · Reserve' }),
    ).toBeEnabled()
  })
})
