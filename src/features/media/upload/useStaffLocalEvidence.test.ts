import { afterEach, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { operatorMediaApi, type LocalMedia } from '../api/operatorMediaApi'
import type { MissionChecklistResponse } from '../../mission/types/checklistExecution'
import { useStaffLocalEvidence } from './useStaffLocalEvidence'

const checklist = (missionId: string) =>
  ({
    missionId,
    executions: [
      {
        id: 'e',
        evidence: [
          { mediaId: 'asset', mediaType: 'IMAGE', previewUrl: '/remote.jpg' },
        ],
      },
    ],
  }) as MissionChecklistResponse
const local = {
  missionId: 'm',
  backendMediaId: 'asset',
  localPreviewUrl: '/local.jpg',
  mediaType: 'IMAGE',
  uploadChannel: 'FLIGHT_CONTROLLER',
  localAvailable: true,
} as LocalMedia
const aliases: string[] = []
afterEach(() => vi.restoreAllMocks())
it('waits for the local lookup rather than mounting remote thumbnails first', async () => {
  let finish!: (value: LocalMedia[]) => void
  const api = vi.spyOn(operatorMediaApi, 'list').mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const data = checklist('m')
  const { result } = renderHook(() => useStaffLocalEvidence('m', aliases, data))
  expect(result.current.loading).toBe(true)
  expect(result.current.data).toBeUndefined()
  await act(async () => finish([local]))
  expect(result.current.data!.executions[0].evidence![0].localPreviewUrl).toBe(
    '/local.jpg',
  )
  expect(api).toHaveBeenCalledTimes(1)
})
it('falls back to backend presentation if the controller is unavailable without requesting originals', async () => {
  vi.spyOn(operatorMediaApi, 'list').mockRejectedValue(new Error('offline'))
  const data = checklist('m')
  const { result } = renderHook(() => useStaffLocalEvidence('m', aliases, data))
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.data!.executions[0].evidence![0].previewUrl).toBe(
    '/remote.jpg',
  )
  expect(
    result.current.data!.executions[0].evidence![0].localPreviewUrl,
  ).toBeUndefined()
})
it('ignores a delayed local response from the previous Mission', async () => {
  let finish!: (value: LocalMedia[]) => void
  vi.spyOn(operatorMediaApi, 'list').mockImplementation((id) =>
    id === 'm'
      ? new Promise((resolve) => {
          finish = resolve
        })
      : Promise.resolve([]),
  )
  const first = checklist('m'),
    second = checklist('sibling')
  const { result, rerender } = renderHook(
    ({ id, data }) => useStaffLocalEvidence(id, aliases, data),
    { initialProps: { id: 'm', data: first } },
  )
  rerender({ id: 'sibling', data: second })
  await waitFor(() => expect(result.current.loading).toBe(false))
  await act(async () => finish([local]))
  expect(result.current.data!.missionId).toBe('sibling')
  expect(
    result.current.data!.executions[0].evidence![0].localPreviewUrl,
  ).toBeUndefined()
})
