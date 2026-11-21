import { render, screen, fireEvent } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { MissionQualityPanel } from './MissionQualityPanel'
import { apiRequest } from '../../../shared/api/httpClient'
vi.mock('../../../shared/api/httpClient', () => ({ apiRequest: vi.fn() }))
vi.mock('../../mission/api/missionApi', () => ({
  missionApi: {
    getMissionResult: vi.fn().mockResolvedValue(null),
    getMissionMedia: vi.fn().mockResolvedValue([]),
  },
}))
vi.mock('./ImageQualityPanel', () => ({ ImageQualityPanel: ({ mediaId }: { mediaId: string }) => <div>Chi tiết {mediaId}</div> }))
beforeEach(() => vi.resetAllMocks())
it('shows actual batch counts and opens existing image quality detail', async () => {
  vi.mocked(apiRequest).mockResolvedValue([
    { media_id: 'one', file_name: 'Ảnh nét', status: 'COMPLETED', decision: 'PASS' },
    { media_id: 'two', file_name: 'Ảnh chờ' },
  ])
  render(<MissionQualityPanel missionId="mission" />)
  fireEvent.click(screen.getByRole('button', { name: 'Mở kiểm tra chất lượng AI' }))
  expect(await screen.findByText(/Tổng ảnh: 2/)).toBeInTheDocument()
  fireEvent.click(screen.getAllByRole('button', { name: 'Kiểm tra / Xác nhận' })[0])
  expect(screen.getByText('Chi tiết one')).toBeInTheDocument()
})
it('shows authorization error without inventing gallery statuses', async () => {
  vi.mocked(apiRequest).mockRejectedValue(new Error('Forbidden'))
  render(<MissionQualityPanel missionId="mission" />)
  fireEvent.click(screen.getByRole('button', { name: 'Mở kiểm tra chất lượng AI' }))
  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Kiểm tra / Xác nhận' })).not.toBeInTheDocument()
})
