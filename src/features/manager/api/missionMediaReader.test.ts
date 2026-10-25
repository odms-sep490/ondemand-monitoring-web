import { afterEach, expect, it, vi } from 'vitest'
import { staffMissionMediaReader } from './missionMediaReader'
import { missionsApi } from './missionsApi'
import type { MediaResponse, MissionResultResponse } from '../types/missions'
afterEach(() => vi.restoreAllMocks())
it.each([null, undefined])(
  'missing pre-execution result %s falls back to Mission media',
  async (result) => {
    vi.spyOn(missionsApi, 'getMissionResult').mockResolvedValue(result as null)
    vi.spyOn(missionsApi, 'getMissionMedia').mockResolvedValue([])
    const data = await staffMissionMediaReader.list('m2', 0)
    expect(data.items).toEqual([])
    expect(missionsApi.getMissionMedia).toHaveBeenCalledWith('m2', undefined)
  },
)
it('filters sibling media and uses exact identity for preview', async () => {
  vi.spyOn(missionsApi, 'getMissionResult').mockResolvedValue({
    missionId: 'm2',
    mediaFiles: [
      { id: 'photo2', missionId: 'm2' },
      { id: 'photo1', missionId: 'm1' },
    ],
  } as MissionResultResponse)
  expect(
    (await staffMissionMediaReader.list('m2', 0)).items.map(
      (item) => item.mediaId,
    ),
  ).toEqual(['photo2'])
  await expect(staffMissionMediaReader.get('m2', 'photo1')).rejects.toThrow()
})
it('real API failure is not disguised as empty media', async () => {
  vi.spyOn(missionsApi, 'getMissionResult').mockResolvedValue(null)
  vi.spyOn(missionsApi, 'getMissionMedia').mockRejectedValue(
    new Error('private diagnostic'),
  )
  await expect(staffMissionMediaReader.list('m1', 0)).rejects.toThrow(
    'private diagnostic',
  )
})
it('null mediaFiles is valid', async () => {
  vi.spyOn(missionsApi, 'getMissionResult').mockResolvedValue({
    missionId: 'm1',
    mediaFiles: null,
  } as MissionResultResponse)
  vi.spyOn(missionsApi, 'getMissionMedia').mockResolvedValue(
    [] as MediaResponse[],
  )
  expect((await staffMissionMediaReader.list('m1', 0)).totalItems).toBe(0)
})
