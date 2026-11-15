import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  within,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { customerMediaApi } from '../../../api/customerMediaApi'
import { MediaLibraryPage } from '../MediaLibraryPage'

beforeEach(() => resetMockDb())
afterEach(() => {
  resetMockDb()
  vi.restoreAllMocks()
})

const cards = () => screen.getAllByRole('button', { name: /^Xem / })

describe('MediaLibraryPage', () => {
  it('renders the Vietnamese title', async () => {
    render(<MediaLibraryPage />)
    expect(await screen.findByText('Thư viện kết quả')).toBeInTheDocument()
  })

  it('renders the English title when language is switched', async () => {
    render(<MediaLibraryPage />)
    await screen.findByText('Thư viện kết quả')
    act(() => setLanguage('en'))
    expect(await screen.findByText('Result library')).toBeInTheDocument()
  })

  it('lists published media and mission codes without per-image notification notices', async () => {
    const list = vi.spyOn(customerMediaApi, 'listAvailable')
    render(<MediaLibraryPage />)
    await screen.findByText('Thư viện kết quả')
    await waitFor(() => expect(cards()).toHaveLength(12))
    expect(list).toHaveBeenCalled()
    const sidebar = screen
      .getByText('Lần bay', { selector: '.mgr-card-title' })
      .closest('section, .ant-card') as HTMLElement
    expect(
      await within(sidebar).findByText('Tất cả lần bay'),
    ).toBeInTheDocument()
    expect(
      await within(sidebar).findByText('MSN-2609-0131-1'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/thông báo kết quả mới sẵn sàng/),
    ).not.toBeInTheDocument()
  })

  it('filters by mission, type and file name, with an empty state and clear', async () => {
    render(<MediaLibraryPage />)
    await waitFor(() => expect(cards()).toHaveLength(12))
    fireEvent.click(screen.getByRole('button', { name: /^MSN-2609-0131-1/ }))
    await waitFor(() => expect(cards()).toHaveLength(12))
    fireEvent.click(screen.getByRole('button', { name: /^Video/ }))
    await waitFor(() =>
      expect(
        screen.queryAllByRole('button', { name: /^Xem .*\.jpg$/ }),
      ).toHaveLength(0),
    )
    fireEvent.change(screen.getByLabelText('Tìm theo tên tệp'), {
      target: { value: 'khong-co-tep' },
    })
    expect(
      await screen.findByText('Không có tệp nào khớp bộ lọc hiện tại.'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Xoá bộ lọc' }))
    await waitFor(() => expect(cards()).toHaveLength(12))
  })

  it('opens a prominent preview modal that fetches a fresh URL and can page through files', async () => {
    const fresh = vi.spyOn(customerMediaApi, 'getMissionMedia')
    render(<MediaLibraryPage />)
    await waitFor(() => expect(cards()).toHaveLength(12))
    fireEvent.click(cards()[0])
    await screen.findByRole('dialog')
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Tải xuống' }),
      ).toBeInTheDocument(),
    )
    expect(fresh).toHaveBeenCalledTimes(1)
    expect(
      screen
        .getByRole('link', { name: 'Xem chi tiết' })
        .getAttribute('href'),
    ).toMatch(/#portal\/customer\/media\//)
    expect(
      screen.getByRole('button', { name: '← Trước' }),
    ).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Sau →' }))
    await waitFor(() => expect(fresh).toHaveBeenCalledTimes(2))
    fireEvent.keyDown(await screen.findByRole('dialog'), {
      key: 'Escape',
      keyCode: 27,
    })
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('shows an empty state when there is no media', async () => {
    vi.spyOn(customerMediaApi, 'listAvailable').mockResolvedValue([])
    render(<MediaLibraryPage />)
    expect(await screen.findByText('Chưa có kết quả')).toBeInTheDocument()
  })

  it('shows an error with retry and recovers', async () => {
    vi.spyOn(customerMediaApi, 'listAvailable').mockRejectedValueOnce(
      new Error('boom'),
    )
    render(<MediaLibraryPage />)
    expect(
      await screen.findByText('Không tải được thư viện kết quả'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => expect(cards().length).toBeGreaterThan(0))
  })
})
