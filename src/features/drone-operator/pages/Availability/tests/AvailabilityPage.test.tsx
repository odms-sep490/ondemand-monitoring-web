import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { ApiError } from '../../../../../shared/api/httpClient'
import { setLanguage } from '../../../../../shared/i18n'
import { busyScheduleApi } from '../../../../busy-schedule/api/busyScheduleApi'
import type {
  BusySchedule,
  WeeklyBusySchedule,
} from '../../../../busy-schedule/types'
import { AvailabilityPage } from '../AvailabilityPage'

// Monday 2026-09-21 08:00 in Vietnam: the morning session has started.
const NOW = new Date('2026-09-21T01:00:00Z')

const busyTuesday: BusySchedule = {
  id: 'b1',
  staffId: 'me',
  staffName: 'Me',
  date: '2026-09-22',
  dayOfWeek: 'TUESDAY',
  session: 'MORNING',
  startTime: '2026-09-21T23:00:00Z',
  endTime: '2026-09-22T05:00:00Z',
  notes: null,
}

function week(items: BusySchedule[]): WeeklyBusySchedule {
  return {
    weekStart: '2026-09-21',
    weekEnd: '2026-09-27',
    maxSessionsPerWeek: 4,
    usedSessions: items.length,
    remainingSessions: 4 - items.length,
    items,
  }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW })
  setLanguage('vi')
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('AvailabilityPage', () => {
  it('loads the busy week and renders busy and free cells', async () => {
    const get = vi.spyOn(busyScheduleApi, 'getMyWeek').mockResolvedValue(week([busyTuesday]))
    render(<AvailabilityPage />)
    const busy = await screen.findByTestId('cell-2026-09-22|MORNING')
    expect(busy.textContent).toBe('Bận')
    expect(busy.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByTestId('cell-2026-09-22|EVENING').textContent).toBe('Rảnh')
    expect(screen.getByText('Đã dùng 1/4 buổi bận tuần này')).toBeTruthy()
    expect(get.mock.calls[0][0]).toBe('2026-09-21')
  })

  it('shows the empty banner and disables sessions that already started', async () => {
    vi.spyOn(busyScheduleApi, 'getMyWeek').mockResolvedValue(week([]))
    render(<AvailabilityPage />)
    expect(await screen.findByText(/rảnh cả tuần/)).toBeTruthy()
    expect(
      (screen.getByTestId('cell-2026-09-21|MORNING') as HTMLButtonElement).disabled,
    ).toBe(true)
  })

  it('creates a busy session and reloads', async () => {
    const get = vi
      .spyOn(busyScheduleApi, 'getMyWeek')
      .mockResolvedValueOnce(week([]))
      .mockResolvedValue(week([busyTuesday]))
    const create = vi.spyOn(busyScheduleApi, 'create').mockResolvedValue(busyTuesday)
    render(<AvailabilityPage />)
    fireEvent.click(await screen.findByTestId('cell-2026-09-22|MORNING'))
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({ date: '2026-09-22', session: 'MORNING' }),
    )
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2))
    await waitFor(() =>
      expect(screen.getByTestId('cell-2026-09-22|MORNING').textContent).toBe('Bận'),
    )
  })

  it('cancels an existing busy session', async () => {
    vi.spyOn(busyScheduleApi, 'getMyWeek')
      .mockResolvedValueOnce(week([busyTuesday]))
      .mockResolvedValue(week([]))
    const remove = vi.spyOn(busyScheduleApi, 'remove').mockResolvedValue(null)
    render(<AvailabilityPage />)
    fireEvent.click(await screen.findByTestId('cell-2026-09-22|MORNING'))
    await waitFor(() => expect(remove).toHaveBeenCalledWith('b1'))
    await waitFor(() =>
      expect(screen.getByTestId('cell-2026-09-22|MORNING').textContent).toBe('Rảnh'),
    )
  })

  it('shows the localized BE error when creating fails', async () => {
    vi.spyOn(busyScheduleApi, 'getMyWeek').mockResolvedValue(week([]))
    vi.spyOn(busyScheduleApi, 'create').mockRejectedValue(
      new ApiError('Buổi này trùng với nhiệm vụ đã được phân công', {
        status: 409,
        code: 'BUSY_SCHEDULE_MISSION_CONFLICT',
        method: 'POST',
        path: '/api/busy-schedules',
      }),
    )
    render(<AvailabilityPage />)
    fireEvent.click(await screen.findByTestId('cell-2026-09-23|AFTERNOON'))
    expect((await screen.findByRole('alert')).textContent).toMatch(
      /trùng với nhiệm vụ đã được phân công cho bạn/,
    )
  })

  it('blocks adding more once the weekly limit is reached', async () => {
    const four = ['MORNING', 'AFTERNOON', 'EVENING'].map((session, i) => ({
      ...busyTuesday,
      id: `b${i}`,
      session: session as BusySchedule['session'],
    }))
    vi.spyOn(busyScheduleApi, 'getMyWeek').mockResolvedValue(
      week([...four, { ...busyTuesday, id: 'b9', date: '2026-09-23' }]),
    )
    render(<AvailabilityPage />)
    const cell = await screen.findByTestId('cell-2026-09-24|MORNING')
    expect((cell as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText(/Đã đạt giới hạn/)).toBeTruthy()
  })

  it('shows a retry state when loading fails', async () => {
    const get = vi
      .spyOn(busyScheduleApi, 'getMyWeek')
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue(week([]))
    render(<AvailabilityPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Thử lại' }))
    await screen.findByTestId('cell-2026-09-22|MORNING')
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('renders english text when language is switched', async () => {
    vi.spyOn(busyScheduleApi, 'getMyWeek').mockResolvedValue(week([busyTuesday]))
    render(<AvailabilityPage />)
    await screen.findByTestId('cell-2026-09-22|MORNING')
    act(() => setLanguage('en'))
    expect(await screen.findByText('Availability')).toBeTruthy()
    expect(screen.getByTestId('cell-2026-09-22|MORNING').textContent).toBe('Busy')
  })

  it('lists this week busy sessions in the summary and cancels from there', async () => {
    vi.spyOn(busyScheduleApi, 'getMyWeek')
      .mockResolvedValueOnce(week([busyTuesday]))
      .mockResolvedValue(week([]))
    const remove = vi.spyOn(busyScheduleApi, 'remove').mockResolvedValue(null)
    render(<AvailabilityPage />)
    await screen.findByTestId('cell-2026-09-22|MORNING')
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1')
    fireEvent.click(screen.getByRole('button', { name: 'Hủy bận 22/09 Sáng' }))
    await waitFor(() => expect(remove).toHaveBeenCalledWith('b1'))
    expect(await screen.findByText(/rảnh cả tuần/)).toBeTruthy()
  })

  it('marks today in the grid and labels cells for assistive tech', async () => {
    vi.spyOn(busyScheduleApi, 'getMyWeek').mockResolvedValue(week([busyTuesday]))
    render(<AvailabilityPage />)
    const cell = await screen.findByTestId('cell-2026-09-22|MORNING')
    expect(cell.getAttribute('aria-label')).toBe('T3 22/09, Sáng: Bận')
    expect(document.querySelector('th[aria-current="date"]')?.textContent).toContain('21/09')
    expect(screen.getByTestId('cell-2026-09-21|MORNING').getAttribute('aria-label')).toBe(
      'T2 21/09, Sáng: Đã qua',
    )
  })

  it('renders a per-day list instead of the table on phone widths', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    try {
      vi.spyOn(busyScheduleApi, 'getMyWeek').mockResolvedValue(week([busyTuesday]))
      const create = vi.spyOn(busyScheduleApi, 'create').mockResolvedValue(busyTuesday)
      render(<AvailabilityPage />)
      await screen.findByTestId('cell-2026-09-22|MORNING')
      expect(document.querySelector('table')).toBeNull()
      expect(document.querySelectorAll('.odm-busy-day')).toHaveLength(7)
      fireEvent.click(screen.getByTestId('cell-2026-09-23|EVENING'))
      await waitFor(() =>
        expect(create).toHaveBeenCalledWith({ date: '2026-09-23', session: 'EVENING' }),
      )
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
