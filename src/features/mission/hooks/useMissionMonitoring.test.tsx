import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useMissionMonitoring } from './useMissionMonitoring'
import { missionApi } from '../api/missionApi'
import { checklistExecutionApi } from '../api/checklistExecutionApi'

afterEach(() => vi.restoreAllMocks())
describe('Mission monitoring package scope', () => {
  it.each([null, undefined])(
    'rejects absent capabilities without publishing unsafe data: %s',
    async (permissions) => {
      vi.spyOn(
        checklistExecutionApi,
        'getMissionChecklistExecutions',
      ).mockResolvedValue({
        missionId: 'm1',
        readyForSubmission: true,
        legacySnapshot: false,
        executions: [],
      })
      vi.spyOn(missionApi, 'getMissionResult').mockResolvedValue(null)
      vi.spyOn(missionApi, 'getPermissions').mockResolvedValue(
        permissions as never,
      )
      const { result } = renderHook(() =>
        useMissionMonitoring('m1', undefined, { autoRefresh: false }),
      )
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toMatchObject({
        code: 'MISSION_PERMISSIONS_UNAVAILABLE',
      })
    },
  )
  it.each(['checklist', 'result'])(
    'rejects sibling %s instead of authorizing from mixed state',
    async (part) => {
      vi.spyOn(
        checklistExecutionApi,
        'getMissionChecklistExecutions',
      ).mockResolvedValue({
        missionId: part === 'checklist' ? 'm2' : 'm1',
        readyForSubmission: true,
        legacySnapshot: false,
        executions: [],
      })
      vi.spyOn(missionApi, 'getMissionResult').mockResolvedValue(
        part === 'result'
          ? ({
              id: 'r2',
              missionId: 'm2',
              status: 'COMPLETED',
              approvalStatus: 'DRAFT',
            } as never)
          : null,
      )
      vi.spyOn(missionApi, 'getPermissions').mockResolvedValue({
        canSubmitMissionResult: true,
      } as never)
      const { result } = renderHook(() =>
        useMissionMonitoring('m1', undefined, { autoRefresh: false }),
      )
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toMatchObject({
        code: 'CHECKLIST_EXECUTION_PARENT_MISMATCH',
      })
    },
  )
})
