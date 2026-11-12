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
      readyForFinalApproval: true,
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
      canAssessMonitoringChecklist: submit,
    },
  },
})

describe('Exact Mission result actions', () => {
  it.each([
    ['Pilot fallback', false, false],
    ['Operator', false, false],
    ['Inspector', true, true],
    ['multi-role', true, true],
  ])('%s follows inspector capabilities', (_, complete, submit) => {
    const onComplete = vi.fn(),
      onSubmit = vi.fn()
    render(
      <MissionResultActions
        missionId="m1"
        status="IN_PROGRESS"
        monitoring={query(complete, submit)}
        busy={false}
        onComplete={onComplete}
        onSubmit={onSubmit}
      />,
    )
    expect(
      Boolean(
        screen.queryByRole('button', { name: 'Xác nhận hoàn thành Mission' }),
      ),
    ).toBe(complete)
    expect(
      Boolean(screen.queryByRole('button', { name: 'Xác nhận nghiệm thu' })),
    ).toBe(submit)
    if (submit) {
      fireEvent.click(
        screen.getByRole('button', { name: 'Xác nhận nghiệm thu' }),
      )
      expect(onSubmit).toHaveBeenCalledOnce()
    }
  })
  it('does not give an operator stale submit permission inspector controls', () => {
    const monitoring = query(false, true)
    monitoring.data!.permissions.canAssessMonitoringChecklist = false
    expect(missionResultActions('m1', 'COMPLETED', monitoring).canSubmit).toBe(
      false,
    )
  })
  it('uses final approval readiness even when submission readiness is true', () => {
    const monitoring = query(false, true)
    monitoring.data!.checklist.readyForFinalApproval = false
    expect(
      missionResultActions('m1', 'COMPLETED', monitoring).submitReady,
    ).toBe(false)
    monitoring.data!.checklist.readyForFinalApproval = true
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
        status="IN_PROGRESS"
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
      screen.queryByRole('button', { name: 'Xác nhận nghiệm thu' }),
    ).toBeNull()
    expect(screen.getByText('Chờ nghiệm thu')).toBeInTheDocument()
  })
  it('reports a localized incomplete-checklist count and blocks submit', () => {
    const monitoring = query(false, true)
    monitoring.data!.checklist.executions = [
      { id: 'e', executionStatus: 'PENDING' } as never,
    ]
    monitoring.data!.checklist.readyForSubmission = false
    monitoring.data!.checklist.readyForFinalApproval = false
    const state = missionResultActions('m1', 'COMPLETED', monitoring)
    expect(state.submitReady).toBe(false)
    expect(state.readinessReason).toBe('Còn 1 mục checklist chưa hoàn tất.')
  })
  it('localizes a stale generic checklist-not-ready submit error', () => {
    expect(
      staffResultError(
        new ApiError('Monitoring checklist is not ready for result submission', {
          code: 'CHECKLIST_NOT_READY',
          status: 409,
          method: 'POST',
          path: '/result',
        }),
      ),
    ).toBe('Checklist chưa hoàn tất hoặc chưa đủ bằng chứng hợp lệ.')
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
