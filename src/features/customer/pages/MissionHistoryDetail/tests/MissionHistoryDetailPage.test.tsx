import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { customerMediaApi } from '../../../api/customerMediaApi'
import { customerMissionHistoryApi } from '../../../api/customerMissionHistoryApi'
import { MissionHistoryDetailPage } from '../MissionHistoryDetailPage'

beforeEach(() => resetMockDb())
afterEach(() => {
  resetMockDb()
  vi.restoreAllMocks()
})

const cards = () => screen.getAllByRole('button', { name: /^Xem / })

describe('MissionHistoryDetailPage', () => {
  it('renders the mission and its results in Vietnamese and English', async () => {
    render(<MissionHistoryDetailPage missionId="msn-006-1" />)
    expect(await screen.findByText('Thông tin lần bay')).toBeInTheDocument()
    expect(screen.getByText('Kiểm tra tiến độ nhà xưởng KCN Hiệp Phước')).toBeInTheDocument()
    expect(screen.getByText('Hoàn thành', { selector: '.mgr-status-tag' })).toBeInTheDocument()
    act(() => setLanguage('en'))
    expect(await screen.findByText('Mission information')).toBeInTheDocument()
  })

  it('shows the media counts and the first page of files, 12 per page', async () => {
    const list = vi.spyOn(customerMediaApi, 'listMissionMedia')
    render(<MissionHistoryDetailPage missionId="msn-006-1" />)
    await waitFor(() => expect(cards()).toHaveLength(12))
    expect(list).toHaveBeenCalledWith('msn-006-1', 0, 12, expect.any(AbortSignal))
    const stat = screen.getByText('Sẵn sàng', { selector: '.mgr-stat-label' }).closest('.mgr-stat') as HTMLElement
    expect(within(stat).getByText('15')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }))
    await waitFor(() => expect(cards()).toHaveLength(3))
  })

  it('does not claim every file is available while some are still processing', async () => {
    render(<MissionHistoryDetailPage missionId="msn-004-1" />)
    expect(await screen.findByText(/Kết quả đang được xử lý: 1 tệp/)).toBeInTheDocument()
    expect(screen.getByText(/1 tệp chưa đạt xác thực/)).toBeInTheDocument()
  })

  it('opens a preview modal for a file', async () => {
    render(<MissionHistoryDetailPage missionId="msn-006-1" />)
    await waitFor(() => expect(cards()).toHaveLength(12))
    fireEvent.click(cards()[0])
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getAllByText('MSN-2609-0131-1').length).toBeGreaterThan(0)
  })

  it('shows an empty results state for a mission without files', async () => {
    render(<MissionHistoryDetailPage missionId="msn-009-1" />)
    expect(await screen.findByText('Chưa có tệp nào')).toBeInTheDocument()
  })

  it('does not request or render media when the mission is not accessible', async () => {
    const files = vi.spyOn(customerMediaApi, 'listMissionMedia')
    render(<MissionHistoryDetailPage missionId="other" />)
    expect(await screen.findByText('Không thể xem lần bay này')).toBeInTheDocument()
    expect(screen.queryByText('Kết quả của lần bay')).not.toBeInTheDocument()
    expect(files).not.toHaveBeenCalled()
  })

  it('retries a failed mission request', async () => {
    vi.spyOn(customerMissionHistoryApi, 'get').mockRejectedValueOnce(new Error('Forbidden'))
    render(<MissionHistoryDetailPage missionId="msn-006-1" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByText('Thông tin lần bay')).toBeInTheDocument()
  })

  it('keeps the mission visible when only the file list fails, with its own retry', async () => {
    vi.spyOn(customerMediaApi, 'listMissionMedia').mockRejectedValueOnce(new Error('boom'))
    render(<MissionHistoryDetailPage missionId="msn-006-1" />)
    expect(await screen.findByText('Không tải được danh sách tệp.')).toBeInTheDocument()
    expect(screen.getByText('Thông tin lần bay')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => expect(cards()).toHaveLength(12))
  })
})
