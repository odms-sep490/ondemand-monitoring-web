import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { missionApi } from '../api/missionApi'
import { checklistExecutionApi } from '../api/checklistExecutionApi'
import { useMissionMonitoring } from './useMissionMonitoring'
import type { WorkspaceComponent } from '../realtime/missionWorkspaceUpdates'

const state = vi.hoisted(() => ({
  change: undefined as
    undefined | ((parts: readonly WorkspaceComponent[]) => void),
}))
vi.mock('../realtime/useMissionWorkspaceUpdates', () => ({
  useMissionWorkspaceUpdates: (
    _id: string,
    _parts: unknown,
    callback: typeof state.change,
  ) => {
    state.change = callback
  },
}))
const checklist = {
  missionId: 'm',
  executions: [],
  readyForSubmission: false,
  legacySnapshot: false,
}
beforeEach(() => {
  vi.spyOn(
    checklistExecutionApi,
    'getMissionChecklistExecutions',
  ).mockResolvedValue(checklist)
  vi.spyOn(missionApi, 'getMissionResult').mockResolvedValue(null)
  vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
    canAssessMonitoringChecklist: true,
  } as never)
})
afterEach(() => vi.restoreAllMocks())

it('refreshes only the changed checklist while preserving result and permission data', async () => {
  const { result } = renderHook(() => useMissionMonitoring('m'))
  await waitFor(() => expect(result.current.loading).toBe(false))
  const permissions = result.current.data!.permissions
  vi.mocked(
    checklistExecutionApi.getMissionChecklistExecutions,
  ).mockResolvedValue({ ...checklist, readyForSubmission: true })
  act(() => state.change!(['checklist']))
  await waitFor(() =>
    expect(result.current.data?.checklist.readyForSubmission).toBe(true),
  )
  expect(result.current.data!.permissions).toBe(permissions)
  expect(missionApi.getPermissions).toHaveBeenCalledTimes(1)
  expect(missionApi.getMissionResult).toHaveBeenCalledTimes(1)
  expect(
    checklistExecutionApi.getMissionChecklistExecutions,
  ).toHaveBeenCalledTimes(2)
})

it('revalidates revoked permissions without clearing the visible checklist', async () => {
  const { result } = renderHook(() => useMissionMonitoring('m'))
  await waitFor(() => expect(result.current.loading).toBe(false))
  const previous = result.current.data!.checklist
  vi.mocked(missionApi.getPermissions).mockResolvedValue({
    canAssessMonitoringChecklist: false,
  } as never)
  act(() => state.change!(['permissions']))
  await waitFor(() =>
    expect(result.current.data?.permissions.canAssessMonitoringChecklist).toBe(
      false,
    ),
  )
  expect(result.current.data!.checklist).toBe(previous)
  expect(
    checklistExecutionApi.getMissionChecklistExecutions,
  ).toHaveBeenCalledTimes(1)
  expect(missionApi.getMissionResult).toHaveBeenCalledTimes(1)
})

it('keeps loaded data on a background error and revalidates all sections on explicit retry', async () => {
  const { result } = renderHook(() => useMissionMonitoring('m'))
  await waitFor(() => expect(result.current.loading).toBe(false))
  vi.mocked(missionApi.getPermissions).mockRejectedValueOnce(
    new Error('offline'),
  )
  act(() => state.change!(['permissions']))
  await waitFor(() => expect(result.current.error).toBeTruthy())
  expect(result.current.data!.checklist).toBe(checklist)
  act(() => result.current.reload())
  await waitFor(() => expect(result.current.error).toBeUndefined())
  expect(result.current.data?.permissions.canAssessMonitoringChecklist).toBe(
    true,
  )
  expect(
    checklistExecutionApi.getMissionChecklistExecutions,
  ).toHaveBeenCalledTimes(2)
})
