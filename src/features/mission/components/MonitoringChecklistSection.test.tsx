import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fireEvent,
  render as renderView,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { ApiError } from '../../../shared/api/httpClient'
import { checklistExecutionApi } from '../api/checklistExecutionApi'
import {
  MonitoringChecklistSection,
  allowedExecutionStatuses,
  monitoringErrorMessage,
} from './MonitoringChecklistSection'
import type {
  MissionChecklistExecution,
  MissionChecklistResponse,
} from '../types/checklistExecution'

const render: typeof renderView = ((...args: Parameters<typeof renderView>) => {
  const view = renderView(...args)
  const first = view.container.querySelector<HTMLButtonElement>(
    '.mc-row[aria-expanded="false"]',
  )
  if (first) fireEvent.click(first)
  return view
}) as typeof renderView

const item: MissionChecklistExecution = {
  id: 'e',
  orderChecklistItemId: 'historical',
  content: 'Yêu cầu lịch sử',
  displayOrder: 1,
  sourceType: 'SERVICE_TEMPLATE',
  executionStatus: 'PENDING',
  assessmentStatus: 'NOT_ASSESSED',
  observation: null,
  unableToVerifyReason: null,
  startedAt: null,
  completedAt: null,
  lastModifiedBy: null,
  createdAt: '2026-10-05T00:00:00Z',
  updatedAt: null,
  version: 7,
}
const data: MissionChecklistResponse = {
  missionId: 'm',
  legacySnapshot: false,
  readyForSubmission: false,
  executions: [item],
}
const props = {
  missionId: 'm',
  data,
  loading: false,
  canExecute: true,
  resultStatus: 'DRAFT' as const,
  refresh: vi.fn(),
}
afterEach(() => vi.restoreAllMocks())

describe('MonitoringChecklistSection', () => {
  it('renders all accepted guidance sections from the mission response without edit controls', () => {
    render(
      <MonitoringChecklistSection
        {...props}
        canExecute={false}
        data={{
          ...data,
          executions: [
            {
              ...item,
              sourceType: 'CUSTOMER_CUSTOM',
              guidanceVersion: 4,
              description: 'Accepted scope',
              executionSteps: ['Accepted steps'],
              inputRequirements: ['Accepted inputs'],
              expectedOutputs: ['Accepted outputs'],
            },
          ],
        }}
      />,
    )
    for (const text of [
      'Accepted scope',
      'Accepted steps',
      'Accepted inputs',
      'Accepted outputs',
    ])
      expect(screen.getByText(text)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Soạn hướng dẫn' })).toBeNull()
  })

  it.each([401, 403, 404, 409, 500])(
    'localizes API failure %s without showing diagnostics',
    (status) => {
      const error = new ApiError('INTERNAL_DIAGNOSTIC', {
        status,
        code: 'INTERNAL_DIAGNOSTIC',
        method: 'GET',
        path: '/fixture',
      })
      const message = monitoringErrorMessage(error)
      expect(message).not.toContain('INTERNAL_DIAGNOSTIC')
      expect(message).toMatch(/quyền|Vui lòng/)
    },
  )
  it('keeps missing-capability and network errors user-facing', () => {
    expect(
      monitoringErrorMessage(
        new ApiError('Mission permissions unavailable', {
          status: 503,
          code: 'MISSION_PERMISSIONS_UNAVAILABLE',
          method: 'GET',
          path: '/fixture',
        }),
      ),
    ).toContain('Chưa xác minh được quyền')
    expect(
      monitoringErrorMessage(new TypeError('Failed to fetch')),
    ).not.toContain('Failed to fetch')
  })
  it('uses the refreshed version on the next edit', async () => {
    const updated = {
      ...item,
      version: 8,
      executionStatus: 'IN_PROGRESS' as const,
    }
    const save = vi
      .spyOn(checklistExecutionApi, 'updateMissionChecklistExecution')
      .mockResolvedValue(updated)
    const { rerender } = render(<MonitoringChecklistSection {...props} />)
    fireEvent.click(screen.getByText('Cập nhật mục'))
    fireEvent.change(screen.getByLabelText('Trạng thái thực hiện'), {
      target: { value: 'IN_PROGRESS' },
    })
    fireEvent.click(screen.getByText('Lưu mục'))
    await screen.findByText('Cập nhật mục')
    rerender(
      <MonitoringChecklistSection
        {...props}
        data={{ ...data, executions: [updated] }}
      />,
    )
    fireEvent.click(screen.getByText('Cập nhật mục'))
    fireEvent.click(screen.getByText('Lưu mục'))
    await waitFor(() =>
      expect(save).toHaveBeenLastCalledWith(
        'm',
        'e',
        expect.objectContaining({ expectedVersion: 8 }),
      ),
    )
  })
  it('reopens rejected terminal items and omits a stale unable reason', async () => {
    const save = vi
      .spyOn(checklistExecutionApi, 'updateMissionChecklistExecution')
      .mockResolvedValue({ ...item, version: 8 })
    render(
      <MonitoringChecklistSection
        {...props}
        resultStatus="REJECTED"
        data={{
          ...data,
          executions: [
            {
              ...item,
              executionStatus: 'UNABLE_TO_VERIFY',
              unableToVerifyReason: 'Lý do cũ',
            },
          ],
        }}
      />,
    )
    fireEvent.click(screen.getByText('Cập nhật mục'))
    fireEvent.change(screen.getByLabelText('Trạng thái thực hiện'), {
      target: { value: 'PENDING' },
    })
    expect(screen.queryByLabelText('Lý do không thể xác minh')).toBeNull()
    fireEvent.click(screen.getByText('Lưu mục'))
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        'm',
        'e',
        expect.objectContaining({
          executionStatus: 'PENDING',
          unableToVerifyReason: null,
        }),
      ),
    )
  })
  it('shows per-item evidence type, eligible count, remaining count, and wrong-type blockers', async () => {
    render(
      <MonitoringChecklistSection
        {...props}
        compact
        data={{
          ...data,
          executions: [
            {
              ...item,
              executionStatus: 'COMPLETED',
              eligibleEvidenceCount: 1,
              minimumEvidenceCount: 3,
              requiredEvidenceType: 'VIDEO',
              blockingReasons: ['EVIDENCE_TYPE_NOT_ELIGIBLE'],
            },
          ],
        }}
      />,
    )
    expect(
      screen.getByText(/Còn thiếu 2 bằng chứng hợp lệ/),
    ).toBeInTheDocument()
    expect(
      within(screen.getByLabelText('Bằng chứng: Yêu cầu lịch sử')).getByText(
        /Chỉ video/,
      ),
    ).toBeInTheDocument()
  })
  it.each([false, true])(
    'does not expose selection to operators or implicit viewers, compact=%s',
    (compact) => {
      const view = render(
        <MonitoringChecklistSection
          {...props}
          compact={compact}
          canAssess={false}
          canSelectForCustomer
        />,
      )
      expect(
        screen.queryByRole('button', { name: 'Lưu lựa chọn gửi khách hàng' }),
      ).toBeNull()
      view.rerender(
        <MonitoringChecklistSection {...props} compact={compact} canAssess />,
      )
      expect(
        screen.queryByRole('button', { name: 'Lưu lựa chọn gửi khách hàng' }),
      ).toBeNull()
    },
  )
  describe.each([false, true])(
    'customer selection capability, compact=%s',
    (compact) => {
      const selectionButton = () =>
        screen.queryByRole('button', { name: 'Lưu lựa chọn gửi khách hàng' })
      it('allows reserve correction on an approved unpublished result without unlocking assessment or staff fields', () => {
        render(
          <MonitoringChecklistSection
            {...props}
            compact={compact}
            resultStatus="APPROVED"
            canAssess
            canSelectForCustomer
            canAttach
            canDetach
            data={{
              ...data,
              executions: [
                {
                  ...item,
                  customerSelectionEditable: true,
                  evidencePolicyVersion: 3,
                  minimumImageCount: 1,
                  minimumVideoCount: 0,
                },
              ],
            }}
          />,
        )
        expect(selectionButton()).toBeInTheDocument()
        expect(selectionButton()).toBeDisabled()
        expect(
          screen.queryByRole('button', { name: 'Cập nhật mục' }),
        ).toBeNull()
        expect(screen.queryByRole('button', { name: 'Chỉnh sửa' })).toBeNull()
        expect(screen.queryByRole('button', { name: 'Đánh giá' })).toBeNull()
        expect(
          screen.queryByRole('button', {
            name: /Thêm ảnh\/video|Thêm bằng chứng từ ảnh\/video Nhiệm vụ/,
          }),
        ).toBeNull()
        expect(screen.queryByLabelText('Đánh giá nghiệm thu')).toBeNull()
        expect(screen.queryByLabelText('Trạng thái thực hiện')).toBeNull()
      })
      it('trusts the assigned-inspector item capability even when result-level editing permissions are locked', () => {
        render(
          <MonitoringChecklistSection
            {...props}
            compact={compact}
            resultStatus="APPROVED"
            canAssess={false}
            canSelectForCustomer={false}
            data={{
              ...data,
              executions: [{ ...item, customerSelectionEditable: true }],
            }}
          />,
        )
        expect(selectionButton()).toBeInTheDocument()
        expect(screen.queryByLabelText('Đánh giá nghiệm thu')).toBeNull()
      })
      it.each(['DRAFT', 'APPROVED'] as const)(
        'hides explicit false capability for %s, including published results',
        (resultStatus) => {
          render(
            <MonitoringChecklistSection
              {...props}
              compact={compact}
              resultStatus={resultStatus}
              canAssess
              canSelectForCustomer
              data={{
                ...data,
                executions: [{ ...item, customerSelectionEditable: false }],
              }}
            />,
          )
          expect(selectionButton()).toBeNull()
        },
      )
      it('uses the normal unlocked inspector fallback only when the item capability is absent', () => {
        const view = render(
          <MonitoringChecklistSection
            {...props}
            compact={compact}
            canAssess
            canSelectForCustomer
          />,
        )
        expect(selectionButton()).toBeInTheDocument()
        view.rerender(
          <MonitoringChecklistSection
            {...props}
            compact={compact}
            resultStatus="APPROVED"
            canAssess
            canSelectForCustomer
          />,
        )
        expect(selectionButton()).toBeNull()
      })
      it.each([
        { resultKnown: false },
        { loading: true },
        { error: new Error('reload failed') },
      ])(
        'does not expose stale capability during unknown/error/loading state %j',
        (state) => {
          render(
            <MonitoringChecklistSection
              {...props}
              {...state}
              compact={compact}
              resultStatus="APPROVED"
              canAssess
              canSelectForCustomer
              data={{
                ...data,
                executions: [{ ...item, customerSelectionEditable: true }],
              }}
            />,
          )
          expect(selectionButton()).toBeNull()
        },
      )
    },
  )
  it.each([false, true])(
    'preserves staff observation fields and completes the item when assessing, compact=%s',
    async (compact) => {
      const staffItem = {
        ...item,
        executionStatus: 'IN_PROGRESS' as const,
        observation: 'Staff observation',
        unableToVerifyReason: 'Staff reason',
      }
      const save = vi
        .spyOn(checklistExecutionApi, 'updateMissionChecklistExecution')
        .mockResolvedValue({ ...staffItem, version: 8 })
      render(
        <MonitoringChecklistSection
          {...props}
          compact={compact}
          assessmentOnly
          canAssess
          canSelectForCustomer
          canExecute={false}
          data={{ ...data, executions: [staffItem] }}
        />,
      )
      fireEvent.click(
        screen.getByRole('button', {
          name: compact ? 'Đánh giá' : 'Cập nhật mục',
        }),
      )
      fireEvent.change(screen.getByLabelText('Đánh giá nghiệm thu'), {
        target: { value: 'COMPLIANT' },
      })
      fireEvent.change(screen.getByLabelText('Ghi chú nghiệm thu'), {
        target: { value: '  Accepted work  ' },
      })
      fireEvent.click(
        screen.getByRole('button', { name: compact ? 'Lưu' : 'Lưu mục' }),
      )
      await waitFor(() =>
        expect(save).toHaveBeenCalledWith(
          'm',
          'e',
          expect.objectContaining({
            // assessing from the acceptance view completes the execution
            executionStatus: 'COMPLETED',
            observation: 'Staff observation',
            unableToVerifyReason: 'Staff reason',
            assessmentNote: 'Accepted work',
            assessmentStatus: 'COMPLIANT',
            expectedVersion: 7,
          }),
        ),
      )
      expect(
        screen.getByRole('button', { name: 'Lưu lựa chọn gửi khách hàng' }),
      ).toBeInTheDocument()
    },
  )
  it('renders historical content in displayOrder including assessment, notes and reason', () => {
    render(
      <MonitoringChecklistSection
        {...props}
        data={{
          ...data,
          executions: [
            {
              ...item,
              id: '3',
              displayOrder: 3,
              content: 'Thứ ba',
              executionStatus: 'UNABLE_TO_VERIFY',
              unableToVerifyReason: 'Bị che khuất',
            },
            {
              ...item,
              id: '2',
              displayOrder: 2,
              content: 'Thứ hai',
              assessmentStatus: 'NON_COMPLIANT',
              observation: 'Vết nứt',
            },
            item,
          ],
        }}
      />,
    )
    expect(
      Array.from(document.querySelectorAll('.mc-title')).map(
        (node) => node.textContent,
      ),
    ).toEqual(['Yêu cầu lịch sử', 'Thứ hai', 'Thứ ba'])
    fireEvent.click(screen.getByRole('button', { name: /Thứ hai/ }))
    expect(screen.getAllByText('Không đạt yêu cầu').length).toBeGreaterThan(0)
    expect(screen.getByText(/Vết nứt/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Thứ ba/ }))
    expect(screen.getAllByText(/Bị che khuất/).length).toBeGreaterThan(0)
    expect(screen.getByText('Chưa sẵn sàng nghiệm thu')).toBeInTheDocument()
  })
  it.each(['IN_PROGRESS', 'COMPLETED'] as const)(
    'saves PENDING → %s with expectedVersion and optional assessment',
    async (executionStatus) => {
      const save = vi
        .spyOn(checklistExecutionApi, 'updateMissionChecklistExecution')
        .mockResolvedValue({ ...item, executionStatus, version: 8 })
      render(<MonitoringChecklistSection {...props} />)
      fireEvent.click(screen.getByText('Cập nhật mục'))
      fireEvent.change(screen.getByLabelText('Trạng thái thực hiện'), {
        target: { value: executionStatus },
      })
      fireEvent.click(screen.getByText('Lưu mục'))
      await waitFor(() =>
        expect(save).toHaveBeenCalledWith('m', 'e', {
          expectedVersion: 7,
          executionStatus,
          assessmentStatus: 'NOT_ASSESSED',
          observation: '',
          unableToVerifyReason: null,
        }),
      )
      expect(props.refresh).toHaveBeenCalled()
    },
  )
  it('allows a dual-role staff member to finish reporting outside assessment-only mode', async () => {
    const save = vi
      .spyOn(checklistExecutionApi, 'updateMissionChecklistExecution')
      .mockResolvedValue({ ...item, version: 8 })
    render(<MonitoringChecklistSection {...props} canAssess />)
    fireEvent.click(screen.getByText('Cập nhật mục'))
    fireEvent.change(screen.getByLabelText('Trạng thái thực hiện'), {
      target: { value: 'COMPLETED' },
    })
    fireEvent.change(screen.getByLabelText('Ghi nhận thực hiện'), {
      target: { value: 'Reported by assigned operator' },
    })
    fireEvent.click(screen.getByText('Lưu mục'))
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        'm',
        'e',
        expect.objectContaining({
          executionStatus: 'COMPLETED',
          observation: 'Reported by assigned operator',
        }),
      ),
    )
  })
  it('uses explicit blank strings to clear owned notes instead of preserving old server values', async () => {
    const save = vi
      .spyOn(checklistExecutionApi, 'updateMissionChecklistExecution')
      .mockResolvedValue({ ...item, version: 8 })
    render(
      <MonitoringChecklistSection
        {...props}
        canAssess
        data={{
          ...data,
          executions: [
            {
              ...item,
              observation: 'Old staff note',
              assessmentNote: 'Old inspection note',
            },
          ],
        }}
      />,
    )
    fireEvent.click(screen.getByText('Cập nhật mục'))
    fireEvent.change(screen.getByLabelText('Ghi nhận thực hiện'), {
      target: { value: '' },
    })
    fireEvent.change(screen.getByLabelText('Ghi chú nghiệm thu'), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByText('Lưu mục'))
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        'm',
        'e',
        expect.objectContaining({ observation: '', assessmentNote: '' }),
      ),
    )
  })
  it('keeps staff fields read-only in the inspector assessment view even with execution permission', async () => {
    const save = vi
      .spyOn(checklistExecutionApi, 'updateMissionChecklistExecution')
      .mockResolvedValue({ ...item, version: 8 })
    render(
      <MonitoringChecklistSection
        {...props}
        canAssess
        assessmentOnly
        data={{
          ...data,
          executions: [
            {
              ...item,
              executionStatus: 'IN_PROGRESS',
              observation: 'Staff observation',
            },
          ],
        }}
      />,
    )
    fireEvent.click(screen.getByText('Cập nhật mục'))
    expect(screen.queryByLabelText('Trạng thái thực hiện')).toBeNull()
    expect(screen.queryByLabelText('Ghi nhận thực hiện')).toBeNull()
    fireEvent.change(screen.getByLabelText('Đánh giá nghiệm thu'), {
      target: { value: 'NON_COMPLIANT' },
    })
    fireEvent.click(screen.getByText('Lưu mục'))
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        'm',
        'e',
        expect.objectContaining({
          executionStatus: 'COMPLETED',
          assessmentStatus: 'NON_COMPLIANT',
          observation: 'Staff observation',
        }),
      ),
    )
  })
  it('requires nonblank reason for UNABLE_TO_VERIFY and clears it on another status', async () => {
    const save = vi
      .spyOn(checklistExecutionApi, 'updateMissionChecklistExecution')
      .mockResolvedValue({ ...item, version: 8 })
    render(<MonitoringChecklistSection {...props} />)
    fireEvent.click(screen.getByText('Cập nhật mục'))
    fireEvent.change(screen.getByLabelText('Trạng thái thực hiện'), {
      target: { value: 'UNABLE_TO_VERIFY' },
    })
    fireEvent.change(screen.getByLabelText('Lý do không thể xác minh'), {
      target: { value: '   ' },
    })
    fireEvent.click(screen.getByText('Lưu mục'))
    expect(screen.getByRole('alert')).toHaveTextContent('Vui lòng nhập lý do')
    expect(save).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Lý do không thể xác minh'), {
      target: { value: '  che khuất  ' },
    })
    fireEvent.click(screen.getByText('Lưu mục'))
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        'm',
        'e',
        expect.objectContaining({ unableToVerifyReason: 'che khuất' }),
      ),
    )
  })
  it('preserves unsaved edits on conflict; requires explicit latest-data adoption and never retries', async () => {
    const save = vi
      .spyOn(checklistExecutionApi, 'updateMissionChecklistExecution')
      .mockRejectedValue(
        new ApiError('stale', {
          status: 409,
          code: 'CONCURRENT_UPDATE',
          method: 'PATCH',
          path: '/',
        }),
      )
    const refresh = vi.fn()
    const { rerender } = render(
      <MonitoringChecklistSection {...props} refresh={refresh} />,
    )
    fireEvent.click(screen.getByText('Cập nhật mục'))
    fireEvent.change(screen.getByLabelText('Ghi nhận thực hiện'), {
      target: { value: 'Chưa lưu' },
    })
    fireEvent.click(screen.getByText('Lưu mục'))
    await screen.findByText(/Chỉnh sửa của bạn chưa được lưu/)
    rerender(
      <MonitoringChecklistSection
        {...props}
        refresh={refresh}
        data={{
          ...data,
          executions: [{ ...item, version: 8, observation: 'Mới từ server' }],
        }}
      />,
    )
    expect(screen.getByLabelText('Ghi nhận thực hiện')).toHaveValue('Chưa lưu')
    expect(screen.getByText('Lưu mục')).toBeDisabled()
    expect(save).toHaveBeenCalledTimes(1)
    expect(refresh).toHaveBeenCalledOnce()
    fireEvent.click(
      screen.getByText('Dùng dữ liệu mới (bỏ chỉnh sửa chưa lưu)'),
    )
    expect(screen.getByLabelText('Ghi nhận thực hiện')).toHaveValue(
      'Mới từ server',
    )
  })
  it.each(['DRAFT', 'REJECTED'] as const)(
    '%s allows capability-driven editing',
    (resultStatus) => {
      render(
        <MonitoringChecklistSection {...props} resultStatus={resultStatus} />,
      )
      expect(screen.getByText('Cập nhật mục')).toBeInTheDocument()
    },
  )
  it.each(['PENDING_MANAGER_APPROVAL', 'APPROVED'] as const)(
    '%s locks editing',
    (resultStatus) => {
      render(
        <MonitoringChecklistSection {...props} resultStatus={resultStatus} />,
      )
      expect(screen.queryByText('Cập nhật mục')).toBeNull()
    },
  )
  it('is read-only without capability or when result state is unavailable', () => {
    const { rerender } = render(
      <MonitoringChecklistSection {...props} canExecute={false} />,
    )
    expect(screen.queryByText('Cập nhật mục')).toBeNull()
    rerender(<MonitoringChecklistSection {...props} resultKnown={false} />)
    expect(screen.queryByText('Cập nhật mục')).toBeNull()
  })
  it.each([false, true])(
    'keeps empty/legacy=%s unready without authoritative final readiness',
    (legacySnapshot) => {
      render(
        <MonitoringChecklistSection
          {...props}
          data={{
            ...data,
            legacySnapshot,
            readyForSubmission: true,
            executions: [],
          }}
        />,
      )
      expect(
        screen.getByText('Không có mục danh sách kiểm tra giám sát.'),
      ).toBeInTheDocument()
      expect(screen.getByText('Chưa sẵn sàng nghiệm thu')).toBeInTheDocument()
    },
  )
  it('restricts reverse transitions except rejected terminal items', () => {
    expect(allowedExecutionStatuses('IN_PROGRESS', false)).not.toContain(
      'PENDING',
    )
    expect(allowedExecutionStatuses('COMPLETED', false)).toEqual(['COMPLETED'])
    expect(allowedExecutionStatuses('COMPLETED', true)).toContain('PENDING')
  })
  it('shows permission failure and offers retry', () => {
    const refresh = vi.fn()
    render(
      <MonitoringChecklistSection
        {...props}
        error={
          new ApiError('denied', { status: 403, method: 'GET', path: '/' })
        }
        refresh={refresh}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('không có quyền')
    fireEvent.click(screen.getByText('Thử lại danh sách kiểm tra'))
    expect(refresh).toHaveBeenCalledOnce()
  })
})
