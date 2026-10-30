import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { authSession } from '../../auth/api/authSession'
import { operatorMediaApi } from '../../media/api/operatorMediaApi'
import { checklistExecutionApi } from '../api/checklistExecutionApi'
import { checklistEvidenceApi } from '../api/checklistEvidenceApi'
import {
  useMissionEvidenceQueue,
  type EvidenceTransfer,
} from './useMissionEvidenceQueue'
import type {
  EvidenceCandidate,
  MissionChecklistExecution,
} from '../types/checklistExecution'

beforeEach(() => {
  vi.spyOn(authSession, 'getUser').mockReturnValue({
    id: 'pilot',
    role: 'STAFF',
  } as never)
  vi.spyOn(authSession, 'isLoggedOut').mockReturnValue(false)
})
afterEach(() => vi.restoreAllMocks())
const candidate = (id: string) =>
  ({
    mediaId: `local:${id}`,
    fileName: `${id}.jpg`,
    contentType: 'image/jpeg',
    previewUrl: null,
  }) as EvidenceCandidate
describe('legacy evidence queue', () => {
  it('serializes two selected files against one execution and advances only its own versions', async () => {
    vi.spyOn(
      checklistExecutionApi,
      'getMissionChecklistExecutions',
    ).mockResolvedValue({ executions: [{ id: 'e', evidence: [] }] } as never)
    const attach = vi.spyOn(checklistEvidenceApi, 'batch').mockResolvedValue([])
    const transfer = vi.fn<EvidenceTransfer>(async (file, prepared) => {
      await prepared(file.mediaId.replace('local:', 'backend:'))
    })
    const missionId = crypto.randomUUID()
    const { result } = renderHook(() =>
      useMissionEvidenceQueue(missionId, transfer),
    )
    await act(async () =>
      result.current.add({ id: 'e', version: 1 } as MissionChecklistExecution, [
        candidate('a'),
        candidate('b'),
      ]),
    )
    await waitFor(() =>
      expect(result.current.jobs.every((job) => job.stage === 'DONE')).toBe(
        true,
      ),
    )
    expect(attach.mock.calls.map((call) => call[2][0].expectedVersion)).toEqual(
      [1, 2],
    )
    expect(transfer).toHaveBeenCalledTimes(2)
  })
  it('recovers a lost transfer response without uploading or attaching again', async () => {
    const missionId = crypto.randomUUID()
    let linked = false
    vi.spyOn(
      checklistExecutionApi,
      'getMissionChecklistExecutions',
    ).mockImplementation(
      async () =>
        ({
          executions: [
            { id: 'e', evidence: linked ? [{ mediaId: 'backend' }] : [] },
          ],
        }) as never,
    )
    const attach = vi
      .spyOn(checklistEvidenceApi, 'batch')
      .mockImplementation(async () => {
        linked = true
        return []
      })
    vi.spyOn(operatorMediaApi, 'status').mockResolvedValue({
      status: 'VALIDATING',
    } as never)
    const transfer = vi.fn<EvidenceTransfer>(async (_file, prepared) => {
      await prepared('backend')
      throw new Error('ack lost')
    })
    const { result } = renderHook(() =>
      useMissionEvidenceQueue(missionId, transfer),
    )
    await act(async () =>
      result.current.add({ id: 'e', version: 1 } as MissionChecklistExecution, [
        candidate('a'),
      ]),
    )
    await waitFor(() => expect(result.current.jobs[0]?.stage).toBe('FAILED'))
    await act(async () => result.current.retry(result.current.jobs[0].id))
    await waitFor(() => expect(result.current.jobs[0]?.stage).toBe('DONE'))
    expect(transfer).toHaveBeenCalledOnce()
    expect(attach).toHaveBeenCalledOnce()
  })
})
