import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  MissionResultActions,
  missionResultActions,
  staffResultError,
} from '../MissionResultActions'
import type { useMissionMonitoring } from '../../../../mission/hooks/useMissionMonitoring'
import { ApiError } from '../../../../../shared/api/httpClient'

const query = (
  complete = false,
  submit = false,
): ReturnType<typeof useMissionMonitoring> => ({
  loading: false,
  error: null,
  reload: vi.fn(),
  data: {
    checklist: {
      missionId: 'm1',
      legacySnapshot: false,
      readyForSubmission: true,
      readyForMissionCompletion: true,
      executions: [],
    },
    result: null,
    permissions: {
      canRespond: false,
      canControlFlight: false,
      canOperatePayload: false,
      canInspectDevice: false,
      canMaintainDevice: false,
      canUploadMedia: false,
      canCompleteMission: complete,
      canSubmitMissionResult: submit,
    },
  },
})

describe('Exact Mission result actions', () => {
  it.each([
    ['Pilot with usable Operator', false, false],
    ['Pilot fallback', false, true],
    ['Operator', false, true],
    ['Maintainer', false, false],
    ['Inspector', true, false],
    ['multi-role', true, true],
  ])(
    '%s follows distinct capabilities rather than generic STAFF',
    (_, complete, submit) => {
      const onComplete = vi.fn(),
        onSubmit = vi.fn()
      render(
        <MissionResultActions
          missionId="m1"
          status="PENDING_REVIEW"
          monitoring={query(Boolean(complete), Boolean(submit))}
          busy={false}
          onComplete={onComplete}
          onSubmit={onSubmit}
        />,
      )
      expect(
        Boolean(screen.queryByRole('button', { name: 'Xác nhận hoàn thành Mission' })),
      ).toBe(Boolean(complete))
      expect(
        Boolean(
          screen.queryByRole('button', { name: 'Gửi kết quả cho Manager' }),
        ),
      ).toBe(Boolean(submit))
      if (submit) {
        const button = screen.getByRole('button', {
          name: 'Gửi kết quả cho Manager',
        })
        if (complete) expect(button).toBeEnabled()
        else expect(button).toBeDisabled()
        fireEvent.click(button)
        expect(onSubmit).toHaveBeenCalledTimes(complete ? 1 : 0)
      }
      if (complete) {
        fireEvent.click(
          screen.getByRole('button', { name: 'Xác nhận hoàn thành Mission' }),
        )
        expect(onComplete).toHaveBeenCalledOnce()
        expect(onSubmit).toHaveBeenCalledTimes(submit ? 1 : 0)
      }
    },
  )
  it('uses submission readiness, not final media approval, including empty checklist', () => {
    const monitoring = query(false, true)
    monitoring.data!.checklist.readyForFinalApproval = false
    expect(
      missionResultActions('m1', 'COMPLETED', monitoring).submitReady,
    ).toBe(true)
  })
  it('fails closed for loading, errors and sibling result/checklist packages', () => {
    const monitoring = query(true, true)
    expect(
      missionResultActions('m2', 'COMPLETED', monitoring).submitReady,
    ).toBe(false)
    expect(
      missionResultActions('m1', 'COMPLETED', { ...monitoring, loading: true })
        .submitReady,
    ).toBe(false)
    expect(
      missionResultActions('m1', 'COMPLETED', {
        ...monitoring,
        error: new Error('failed'),
      }).submitReady,
    ).toBe(false)
    monitoring.data!.result = {
      id: 'r2',
      missionId: 'm2',
      status: 'COMPLETED',
      approvalStatus: 'DRAFT',
    } as never
    expect(
      missionResultActions('m1', 'COMPLETED', monitoring).submitReady,
    ).toBe(false)
  })
  it('blocks both actions during a mutation and hides stale capabilities after submission', () => {
    const monitoring = query(true, true),
      onComplete = vi.fn(),
      onSubmit = vi.fn()
    const view = render(
      <MissionResultActions
        missionId="m1"
        status="PENDING_REVIEW"
        monitoring={monitoring}
        busy
        onComplete={onComplete}
        onSubmit={onSubmit}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Xác nhận hoàn thành Mission' }),
    ).toBeDisabled()
    monitoring.data!.result = {
      id: 'r1',
      missionId: 'm1',
      status: 'COMPLETED',
      approvalStatus: 'PENDING_MANAGER_APPROVAL',
    } as never
    view.rerender(
      <MissionResultActions
        missionId="m1"
        status="COMPLETED"
        monitoring={monitoring}
        busy={false}
        onComplete={onComplete}
        onSubmit={onSubmit}
      />,
    )
    expect(
      screen.queryByRole('button', { name: 'Xác nhận hoàn thành Mission' }),
    ).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Gửi kết quả cho Manager' }),
    ).toBeNull()
    expect(screen.getByText('Chờ duyệt')).toBeInTheDocument()
  })
  it('explains wrong evidence type and insufficient evidence from backend blockers', () => {
    expect(
      staffResultError(
        new ApiError(
          'Checklist item requires at least 3 VIDEO evidence asset(s); current eligible count is 1. Blockers: EVIDENCE_TYPE_NOT_ELIGIBLE, INSUFFICIENT_EVIDENCE',
          {
            code: 'CHECKLIST_NOT_READY',
            status: 409,
            method: 'POST',
            path: '/result',
          },
        ),
      ),
    ).toContain('media sai loại')
    expect(
      staffResultError(
        new ApiError(
          'Blockers: INSUFFICIENT_EVIDENCE; requires 4, current eligible count is 2',
          {
            code: 'CHECKLIST_NOT_READY',
            status: 409,
            method: 'POST',
            path: '/result',
          },
        ),
      ),
    ).toContain('bổ sung phần còn thiếu')
  })

  it('never renders raw exception text or codes', () => {
    expect(staffResultError(new Error('SECRET_BACKEND_ENUM'))).not.toContain(
      'SECRET',
    )
    expect(
      staffResultError(
        new ApiError('RAW', {
          code: 'MISSION_STATUS_INVALID',
          status: 409,
          method: 'POST',
          path: '/complete',
        }),
      ),
    ).toContain('Dữ liệu mới đang được cập nhật')
  })
})
