import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { ApiError } from '../../../shared/api/httpClient'
import { setLanguage } from '../../../shared/i18n'
import { checklistEvidenceApi } from '../api/checklistEvidenceApi'
import { ChecklistEvidencePanel } from './ChecklistEvidencePanel'
import { CustomerEvidenceSelection } from './CustomerEvidenceSelection'
import type {
  ContentAssessment,
  DeliverySuggestion,
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

describe('inspector delivery suggestions', () => {
  const result: DeliverySuggestion = {
    executionVersion: item.version,
    policyVersion: 'test-policy',
    requiredImageCount: 2,
    suggestedImageCount: 1,
    suggestedImageEvidenceIds: ['two'],
    warnings: ['INSUFFICIENT_RECOMMENDABLE_IMAGES'],
    candidates: [
      {
        evidenceId: 'two',
        recommendation: 'SUGGESTED',
        reasonCodes: ['HUMAN_QUALITY_PASS'],
      },
      {
        evidenceId: 'one',
        recommendation: 'RESERVE',
        reasonCodes: ['SIMILAR_TO_SUGGESTED_IMAGE'],
      },
      {
        evidenceId: 'pending',
        recommendation: 'REVIEW',
        reasonCodes: ['QUALITY_NOT_CHECKED'],
      },
    ],
  }
  const requestName = 'Get AI image suggestions'
  const applyName = 'Apply suggested images to draft'
  const assessment: ContentAssessment = {
    executionVersion: item.version,
    evidenceId: 'pending',
    verdict: 'UNCERTAIN',
    criteria: [
      {
        code: 'ANGLE',
        label: 'Viewing angle',
        verdict: 'MISMATCH',
        observation: '<strong>Roof detail</strong>',
      },
    ],
  }

  function pendingAssessment() {
    let resolve!: (value: ContentAssessment) => void
    const promise = new Promise<ContentAssessment>((complete) => {
      resolve = complete
    })
    return { promise, resolve }
  }

  it.each([undefined, false])(
    'hides assessment when availability is %s',
    async (available) => {
      setLanguage('en')
      vi.spyOn(checklistEvidenceApi, 'getDeliverySuggestion').mockResolvedValue(
        {
          ...result,
          contentAssessmentAvailable: available,
        },
      )
      render(
        <CustomerEvidenceSelection
          missionId="m"
          item={item}
          refresh={vi.fn()}
        />,
      )
      fireEvent.click(screen.getByRole('button', { name: requestName }))
      await screen.findByRole('button', { name: applyName })
      expect(
        screen.queryByRole('button', { name: 'Assess image content' }),
      ).toBeNull()
    },
  )

  it('discloses preview sharing and assesses only the chosen candidate without changing the draft', async () => {
    setLanguage('en')
    vi.spyOn(checklistEvidenceApi, 'getDeliverySuggestion').mockResolvedValue({
      ...result,
      contentAssessmentAvailable: true,
    })
    const assess = vi.spyOn(checklistEvidenceApi, 'assessImageContent')
    const pending = pendingAssessment()
    assess.mockReturnValue(pending.promise)
    const save = vi.spyOn(checklistEvidenceApi, 'selectForCustomer')
    const refresh = vi.fn()
    render(
      <CustomerEvidenceSelection
        missionId="m"
        item={{
          ...item,
          evidence: [
            evidence('one'),
            { ...evidence('two'), previewUrl: '/two-preview.jpg' },
            { ...evidence('pending', false), thumbnailUrl: '/pending-thumb.jpg' },
            evidence('unlisted'),
            { ...evidence('clip'), mediaType: 'VIDEO', fileName: 'clip.mp4' },
          ],
        }}
        refresh={refresh}
      />,
    )
    const assessName = 'Assess image content'
    expect(screen.queryByRole('button', { name: assessName })).toBeNull()
    const image = screen.getByRole('checkbox', { name: /one.jpg/ })
    const video = screen.getByRole('checkbox', { name: /clip.mp4/ })
    fireEvent.click(image)
    fireEvent.click(video)
    fireEvent.click(screen.getByRole('button', { name: requestName }))
    const select = await screen.findByRole('combobox', {
      name: 'Image to assess',
    })
    const button = screen.getByRole('button', { name: assessName })
    expect(button).toHaveAccessibleDescription(
      /sent to the configured AI provider.*advisory/,
    )
    expect(button).toBeDisabled()
    expect(
      within(select)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Choose an image', 'one.jpg', 'two.jpg', 'pending.jpg'])
    expect(assess).not.toHaveBeenCalled()
    fireEvent.change(select, { target: { value: 'pending' } })
    expect(
      screen.getByRole('img', { name: 'Selected image preview for pending.jpg' }),
    ).toHaveAttribute('src', '/pending-thumb.jpg')
    fireEvent.click(button)
    fireEvent.click(button)
    expect(select).toBeDisabled()
    expect(button).toBeDisabled()
    expect(assess).toHaveBeenCalledExactlyOnceWith(
      'm',
      'e',
      'pending',
      { expectedVersion: 7, language: 'en' },
      expect.any(AbortSignal),
    )
    pending.resolve(assessment)
    expect(
      await screen.findByText('Content assessment · Uncertain'),
    ).toBeVisible()
    expect(screen.getByText('Viewing angle · Mismatch')).toBeVisible()
    expect(
      screen.getByText(assessment.criteria[0].observation).querySelector('strong'),
    ).toBeNull()
    expect(image).toBeChecked()
    expect(video).toBeChecked()
    expect(save).not.toHaveBeenCalled()
    expect(refresh).not.toHaveBeenCalled()
    fireEvent.change(select, { target: { value: 'two' } })
    expect(
      screen.getByRole('img', { name: 'Selected image preview for two.jpg' }),
    ).toHaveAttribute('src', '/two-preview.jpg')
    expect(screen.queryByText('Content assessment · Uncertain')).toBeNull()
  })

  it.each([
    [
      'MEDIA_DERIVATIVE_UNAVAILABLE',
      409,
      /Bản xem trước của ảnh này chưa sẵn sàng/,
      false,
    ],
    ['CONCURRENT_UPDATE', 409, /Hãy lấy gợi ý ảnh mới/, true],
    ['OTHER_CONFLICT', 409, /Bạn vẫn có thể tự chọn bằng chứng/, false],
    ['RATE_LIMITED', 429, /Có quá nhiều yêu cầu đánh giá. Hãy thử lại sau/, false],
    ['AI_PROVIDER_UNAVAILABLE', 502, /AI đánh giá ảnh hiện không khả dụng/, false],
  ] as const)(
    'handles a Vietnamese assessment error with code %s',
    async (code, status, message, stale) => {
      setLanguage('vi')
      vi.spyOn(checklistEvidenceApi, 'getDeliverySuggestion').mockResolvedValue(
        {
          ...result,
          contentAssessmentAvailable: true,
        },
      )
      const assess = vi
        .spyOn(checklistEvidenceApi, 'assessImageContent')
        .mockRejectedValue(
          new ApiError('Internal details', {
            status,
            code,
            method: 'POST',
            path: 'content-assessment',
          }),
        )
      render(
        <CustomerEvidenceSelection
          missionId="m"
          item={item}
          refresh={vi.fn()}
        />,
      )
      fireEvent.click(
        screen.getByRole('button', { name: 'Lấy gợi ý ảnh từ AI' }),
      )
      const select = await screen.findByRole('combobox', {
        name: 'Ảnh cần đánh giá',
      })
      const button = screen.getByRole('button', {
        name: 'Đánh giá nội dung ảnh',
      })
      expect(button).toHaveAccessibleDescription(
        /gửi đến nhà cung cấp AI.*chỉ để tham khảo/,
      )
      fireEvent.change(select, { target: { value: 'pending' } })
      fireEvent.click(button)
      expect(await screen.findByText(message)).toBeVisible()
      expect(screen.queryByText('Internal details')).toBeNull()
      expect(assess).toHaveBeenCalledWith(
        'm',
        'e',
        'pending',
        { expectedVersion: 7, language: 'vi' },
        expect.any(AbortSignal),
      )
      if (stale) expect(button).toBeDisabled()
      else expect(button).toBeEnabled()
      expect(screen.getByRole('checkbox', { name: /one.jpg/ })).toBeEnabled()
    },
  )

  it('discards a late assessment after getting new suggestions and waits before allowing another POST', async () => {
    setLanguage('en')
    vi.spyOn(checklistEvidenceApi, 'getDeliverySuggestion').mockResolvedValue({
      ...result,
      contentAssessmentAvailable: true,
    })
    const pending = pendingAssessment()
    const assess = vi
      .spyOn(checklistEvidenceApi, 'assessImageContent')
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce({ ...assessment, evidenceId: 'wrong' })
    render(
      <CustomerEvidenceSelection missionId="m" item={item} refresh={vi.fn()} />,
    )
    const suggest = screen.getByRole('button', { name: requestName })
    const selectName = 'Image to assess'
    const assessName = 'Assess image content'
    fireEvent.click(suggest)
    fireEvent.change(
      await screen.findByRole('combobox', { name: selectName }),
      { target: { value: 'pending' } },
    )
    fireEvent.click(screen.getByRole('button', { name: assessName }))
    fireEvent.click(suggest)
    const newSelect = await screen.findByRole('combobox', { name: selectName })
    const newButton = screen.getByRole('button', { name: assessName })
    expect(newSelect).toHaveValue('')
    expect(newSelect).toBeDisabled()
    expect(newButton).toBeDisabled()
    expect(assess).toHaveBeenCalledOnce()
    await act(async () => pending.resolve(assessment))
    expect(screen.queryByText(/Viewing angle/)).toBeNull()
    fireEvent.change(newSelect, { target: { value: 'pending' } })
    fireEvent.click(newButton)
    expect(
      await screen.findByText(/assessment no longer matches/),
    ).toBeVisible()
    expect(screen.queryByText(/Viewing angle/)).toBeNull()
  })

  it('shows partial results and only updates the image draft after explicit apply', async () => {
    setLanguage('en')
    const request = vi
      .spyOn(checklistEvidenceApi, 'getDeliverySuggestion')
      .mockResolvedValue(result)
    const save = vi
      .spyOn(checklistEvidenceApi, 'selectForCustomer')
      .mockResolvedValue([])
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const refresh = vi.fn()
    render(
      <CustomerEvidenceSelection
        missionId="m"
        item={{
          ...item,
          minimumImageCount: 2,
          evidence: [
            { ...evidence('one'), selectedForCustomer: true },
            evidence('two'),
            evidence('pending', false),
            { ...evidence('clip'), mediaType: 'VIDEO', fileName: 'clip.mp4' },
          ],
        }}
        refresh={refresh}
      />,
    )
    const firstImage = screen.getByRole('checkbox', { name: /one.jpg/ })
    const secondImage = screen.getByRole('checkbox', { name: /two.jpg/ })
    const video = screen.getByRole('checkbox', { name: /clip.mp4/ })
    expect(request).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: requestName }))
    const apply = await screen.findByRole('button', { name: applyName })
    expect(request).toHaveBeenCalledWith('m', 'e')
    expect(screen.getByText('1 of 2 required images suggested')).toBeVisible()
    expect(
      screen.getByText(
        /replaces the images in your draft and keeps the selected videos/,
      ),
    ).toBeVisible()
    expect(
      screen.getByText('Too few images qualify for a suggestion.'),
    ).toBeVisible()
    expect(
      screen.getByText(/image quality check in Mission Media/),
    ).toBeVisible()
    expect(screen.getByText('Passed human quality review')).toBeVisible()
    expect(screen.getByText('Similar to a suggested image')).toBeVisible()
    expect(screen.getByText('Quality not checked')).toBeVisible()
    expect(firstImage).toBeChecked()
    expect(secondImage).not.toBeChecked()
    fireEvent.click(video)
    fireEvent.click(apply)
    expect(firstImage).not.toBeChecked()
    expect(secondImage).toBeChecked()
    expect(video).toBeChecked()
    expect(save).not.toHaveBeenCalled()
    expect(refresh).not.toHaveBeenCalled()

    const saveButton = screen.getByRole('button', {
      name: 'Save customer selection',
    })
    expect(saveButton).toBeDisabled()
    fireEvent.click(firstImage)
    fireEvent.click(saveButton)
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce())
    expect(confirm).toHaveBeenCalledOnce()
    expect(save).toHaveBeenCalledWith('m', 'e', {
      expectedVersion: item.version,
      evidenceIds: ['two', 'clip', 'one'],
      confirmSurplus: true,
    })
    expect(screen.getByRole('button', { name: requestName })).toBeDisabled()
  })

  it.each(['response version', 'refreshed evidence'])(
    'rejects a suggestion after a change to the %s',
    async (changed) => {
      setLanguage('en')
      vi.spyOn(checklistEvidenceApi, 'getDeliverySuggestion').mockResolvedValue(
        {
          ...result,
          executionVersion:
            changed === 'response version' ? item.version + 1 : item.version,
        },
      )
      const refresh = vi.fn()
      const { rerender } = render(
        <CustomerEvidenceSelection
          missionId="m"
          item={item}
          refresh={refresh}
        />,
      )
      fireEvent.click(screen.getByRole('button', { name: requestName }))
      if (changed === 'refreshed evidence') {
        await screen.findByRole('button', { name: applyName })
        rerender(
          <CustomerEvidenceSelection
            missionId="m"
            item={{
              ...item,
              evidence: [evidence('one'), evidence('two'), evidence('pending')],
            }}
            refresh={refresh}
          />,
        )
      }
      expect(
        await screen.findByText(/suggestion no longer matches/),
      ).toBeVisible()
      expect(screen.queryByRole('button', { name: applyName })).toBeNull()
      expect(
        screen.getByRole('checkbox', { name: /two.jpg/ }),
      ).not.toBeChecked()
    },
  )

  it.each([
    { evidencePolicyVersion: 2, requiredEvidenceType: 'VIDEO' },
    { evidencePolicyVersion: 3, minimumImageCount: 0 },
  ] satisfies Partial<MissionChecklistExecution>[])(
    'hides suggestions when the checklist requires no images (%j)',
    (policy) => {
      setLanguage('en')
      render(
        <CustomerEvidenceSelection
          missionId="m"
          item={{ ...item, ...policy }}
          refresh={vi.fn()}
        />,
      )
      expect(screen.queryByRole('button', { name: requestName })).toBeNull()
    },
  )

  it('leaves manual selection available after the GET fails', async () => {
    setLanguage('en')
    const request = vi
      .spyOn(checklistEvidenceApi, 'getDeliverySuggestion')
      .mockRejectedValue(new Error('offline'))
    const refresh = vi.fn()
    const { rerender } = render(
      <CustomerEvidenceSelection
        missionId="m"
        item={item}
        refresh={refresh}
        readOnly
      />,
    )
    expect(screen.queryByRole('button', { name: requestName })).toBeNull()
    rerender(
      <CustomerEvidenceSelection
        missionId="m"
        item={item}
        refresh={refresh}
        mutationBusy
      />,
    )
    expect(screen.getByRole('button', { name: requestName })).toBeDisabled()
    expect(request).not.toHaveBeenCalled()
    rerender(
      <CustomerEvidenceSelection missionId="m" item={item} refresh={refresh} />,
    )
    fireEvent.click(screen.getByRole('button', { name: requestName }))
    expect(
      await screen.findByText(/Could not load image suggestions/),
    ).toBeVisible()
    fireEvent.click(screen.getByRole('checkbox', { name: /one.jpg/ }))
    expect(
      screen.getByRole('button', { name: 'Save customer selection' }),
    ).toBeEnabled()
    expect(refresh).not.toHaveBeenCalled()
  })
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
        screen.getByRole('heading', { name: 'Chọn ảnh/video gửi khách hàng' }),
      ).toBeInTheDocument()
      expect(screen.getAllByText('one.jpg')).toHaveLength(1)
      expect(screen.getAllByText('two.jpg')).toHaveLength(1)
      expect(
        screen.getByRole('button', { name: 'Gỡ bằng chứng one.jpg' }),
      ).toBeEnabled()
      expect(
        screen.getByRole('button', {
          name: compact ? /Thêm ảnh\/video/ : /Thêm bằng chứng/,
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
  it('stays locked while refresh is unconfirmed and unlocks subsequent edits once refreshed data confirms the saved selection even with the same version', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const save = vi
      .spyOn(checklistEvidenceApi, 'selectForCustomer')
      .mockResolvedValue([])
    const refresh = vi.fn()
    const view = render(
      <CustomerEvidenceSelection missionId="m" item={item} refresh={refresh} />,
    )
    fireEvent.click(screen.getByRole('checkbox', { name: /one.jpg/ }))
    fireEvent.click(
      screen.getByRole('button', { name: /Lưu lựa chọn gửi khách hàng/ }),
    )
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1))
    expect(refresh).toHaveBeenCalledTimes(1)

    // While refresh has not updated item.evidence (or if refresh failed), checkboxes remain locked to prevent duplicate stale-version submits
    expect(screen.getByRole('checkbox', { name: /one.jpg/ })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Tải lại checklist' }),
    ).toBeInTheDocument()

    // Once refreshed data arrives confirming the selection (even with the same item.version = 7), checkboxes unlock for further edits
    view.rerender(
      <CustomerEvidenceSelection
        missionId="m"
        item={{
          ...item,
          version: 7,
          evidence: [
            { ...evidence('one'), selectedForCustomer: true },
            evidence('two'),
            {
              ...evidence('pending'),
              mediaStatus: 'VALIDATING',
              eligibleForFinalApproval: false,
            },
          ],
        }}
        refresh={refresh}
      />,
    )
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: /two.jpg/ })).toBeEnabled(),
    )
    expect(
      screen.getByRole('button', { name: /Lưu lựa chọn gửi khách hàng/ }),
    ).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox', { name: /two.jpg/ }))
    expect(
      screen.getByRole('button', { name: /Lưu lựa chọn gửi khách hàng/ }),
    ).toBeEnabled()
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

it('uses the same inspection gallery for failed checklists without delivery controls and keeps video preview', async () => {
  const select = vi.spyOn(checklistEvidenceApi, 'selectForCustomer')
  render(
    <ChecklistEvidencePanel
      missionId="m"
      item={{
        ...item,
        assessmentStatus: 'NON_COMPLIANT',
        evidence: [
          {
            ...evidence('clip'),
            mediaType: 'VIDEO',
            fileName: 'clip.mp4',
            thumbnailUrl: '/poster.jpg',
            previewUrl: '/clip.mp4',
            selectedForCustomer: true,
          },
        ],
      }}
      canAttach={false}
      canDetach={false}
      canSelectForCustomer={false}
      inspectionView
      refresh={vi.fn()}
      compact
    />,
  )
  expect(
    screen.getByRole('heading', { name: 'Ảnh/video bằng chứng' }),
  ).toBeInTheDocument()
  expect(
    document.querySelector('.customer-evidence-selection__list'),
  ).toBeInTheDocument()
  expect(document.querySelector('.ce-list')).toBeNull()
  expect(document.querySelector('.is-selected')).toBeNull()
  expect(screen.queryByRole('checkbox')).toBeNull()
  expect(
    screen.queryByRole('button', { name: 'Lưu lựa chọn gửi khách hàng' }),
  ).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Xem clip.mp4' }))
  expect(
    (await screen.findByRole('dialog')).querySelector('video'),
  ).toBeInTheDocument()
  expect(select).not.toHaveBeenCalled()
})
it('localizes the read-only gallery in English without delivery controls', () => {
  setLanguage('en')
  render(
    <CustomerEvidenceSelection
      missionId="m"
      item={{ ...item, assessmentStatus: 'NON_COMPLIANT' }}
      refresh={vi.fn()}
      readOnly
    />,
  )
  expect(
    screen.getByRole('heading', { name: 'Evidence images and videos' }),
  ).toBeInTheDocument()
  expect(screen.getByText('View only')).toBeInTheDocument()
  expect(screen.queryByRole('checkbox')).toBeNull()
  expect(
    screen.queryByRole('button', { name: 'Save customer selection' }),
  ).toBeNull()
})
