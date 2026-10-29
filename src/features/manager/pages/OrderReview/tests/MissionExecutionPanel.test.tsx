import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { MissionExecutionPanel } from '../components/MissionExecutionPanel'
import { missionsApi } from '../../../api/missionsApi'
import { checklistExecutionApi } from '../../../../mission/api/checklistExecutionApi'
import type { MissionResponse, MediaResponse } from '../../../types/missions'
import type { MissionChecklistResponse } from '../../../../mission/types/checklistExecution'

afterEach(() => vi.restoreAllMocks())
const mission = (id: string) =>
  ({
    id,
    missionCode: id.toUpperCase(),
    status: 'RESOURCE_ASSIGNING',
  }) as MissionResponse
const checklist = (id: string): MissionChecklistResponse => ({
  missionId: id,
  legacySnapshot: false,
  readyForSubmission: false,
  executions: [
    {
      id: id + '-execution',
      orderChecklistItemId: id + '-snapshot',
      displayOrder: 0,
      sourceType: 'CUSTOMER_CUSTOM',
      observation: null,
      unableToVerifyReason: null,
      startedAt: null,
      completedAt: null,
      lastModifiedBy: null,
      createdAt: '2026-10-12T00:00:00Z',
      updatedAt: null,
      version: 0,
      content: `Checklist riêng ${id}`,
      executionStatus: 'PENDING',
      assessmentStatus: 'NOT_ASSESSED',
      evidence: [],
    },
  ],
})
it('drops late M1 checklist and media after switching to M2', async () => {
  let resolveM1!: (data: MissionChecklistResponse) => void
  vi.spyOn(
    checklistExecutionApi,
    'getMissionChecklistExecutions',
  ).mockImplementation(async (id) =>
    id === 'm1'
      ? new Promise((resolve) => {
          resolveM1 = resolve
        })
      : checklist(id),
  )
  vi.spyOn(missionsApi, 'getMissionResult').mockResolvedValue(null)
  vi.spyOn(missionsApi, 'getMissionMedia').mockResolvedValue([])
  const view = render(
    <MissionExecutionPanel key="m1" mission={mission('m1')} />,
  )
  await waitFor(() => expect(resolveM1).toBeTypeOf('function'))
  view.rerender(<MissionExecutionPanel key="m2" mission={mission('m2')} />)
  await screen.findByText('Checklist riêng m2')
  await act(async () => resolveM1(checklist('m1')))
  expect(screen.queryByText('Checklist riêng m1')).not.toBeInTheDocument()
  expect(screen.getByText('Checklist riêng m2')).toBeInTheDocument()
  expect(await screen.findByText('Chưa có ảnh/video')).toBeInTheDocument()
  expect(
    screen.getByText(
      'Media sẽ xuất hiện sau khi nhiệm vụ được thực hiện và dữ liệu được tải lên.',
    ),
  ).toBeInTheDocument()
})
it('localizes media failures and never exposes a JS exception', async () => {
  vi.spyOn(
    checklistExecutionApi,
    'getMissionChecklistExecutions',
  ).mockResolvedValue(checklist('m1'))
  vi.spyOn(missionsApi, 'getMissionResult').mockResolvedValue(null)
  vi.spyOn(missionsApi, 'getMissionMedia').mockRejectedValue(
    new Error("Cannot read properties of undefined (reading 'mediaFiles')"),
  )
  render(<MissionExecutionPanel mission={mission('m1')} />)
  await screen.findByText('Không thể tải ảnh/video của nhiệm vụ này.')
  expect(screen.queryByText(/Cannot read properties/)).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
})

it('late M1 gallery response cannot replace the selected M2 gallery', async () => {
  let resolveMedia!: (data: MediaResponse[]) => void
  const media = (id: string) =>
    [
      {
        id: id + '-photo',
        missionId: id,
        contentType: 'image/png',
        fileSize: 100,
        url: '/fixture.png',
      },
    ] as MediaResponse[]
  vi.spyOn(
    checklistExecutionApi,
    'getMissionChecklistExecutions',
  ).mockImplementation(async (id) => checklist(id))
  vi.spyOn(missionsApi, 'getMissionResult').mockResolvedValue(null)
  vi.spyOn(missionsApi, 'getMissionMedia').mockImplementation(async (id) =>
    id === 'm1'
      ? new Promise((resolve) => {
          resolveMedia = resolve
        })
      : media(id),
  )
  const view = render(
    <MissionExecutionPanel key="m1" mission={mission('m1')} />,
  )
  await waitFor(() => expect(resolveMedia).toBeTypeOf('function'))
  view.rerender(<MissionExecutionPanel key="m2" mission={mission('m2')} />)
  await screen.findByText('image-m2-photo.png')
  await act(async () => resolveMedia(media('m1')))
  expect(screen.queryByText('image-m1-photo.png')).not.toBeInTheDocument()
  expect(screen.getByText('image-m2-photo.png')).toBeInTheDocument()
})
