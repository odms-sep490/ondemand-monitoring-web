import { describe, expect, it } from 'vitest'

import { formatDeadline } from './formatDeadline'
import type { OperatorMission } from '../types/mission'

const base: OperatorMission = {
  id: 'MSN-1',
  status: 'COMPLETED',
  title: 'x',
  location: 'x',
  date: '',
  startTime: '',
  endTime: '',
  serviceLabel: 'x',
  droneCode: 'DRN-01',
  droneName: 'x',
}

describe('formatDeadline', () => {
  it('defaults to Vietnamese when no lang is passed', () => {
    expect(formatDeadline(base, new Date())).toBe('Hoàn thành')
  })

  it('vi: not-scheduled mission', () => {
    const mission: OperatorMission = { ...base, status: 'PENDING' }
    expect(formatDeadline(mission, new Date(), 'vi')).toBe('Chưa đặt lịch')
  })

  it('en: not-scheduled mission', () => {
    const mission: OperatorMission = { ...base, status: 'PENDING' }
    expect(formatDeadline(mission, new Date(), 'en')).toBe('Not scheduled')
  })

  it('vi/en: in-flight countdown', () => {
    const now = new Date('2026-09-24T13:10:00+07:00')
    const mission: OperatorMission = {
      ...base,
      status: 'IN_FLIGHT',
      date: '2026-09-24',
      startTime: '13:00',
      flightStartedAt: '2026-09-24T13:00:00+07:00',
    }
    expect(formatDeadline(mission, now, 'vi')).toBe('Đang bay 10 phút')
    expect(formatDeadline(mission, now, 'en')).toBe('In flight 10 min')
  })

  it('vi/en: completed with timestamp', () => {
    const mission: OperatorMission = {
      ...base,
      status: 'COMPLETED',
      date: '2026-09-11',
      startTime: '08:00',
      completedAt: '2026-09-11T09:32:00+07:00',
    }
    expect(formatDeadline(mission, new Date(), 'vi')).toBe('Hoàn thành 09:32')
    expect(formatDeadline(mission, new Date(), 'en')).toBe('Completed 09:32')
  })

  it('vi/en: rejected without reason', () => {
    const mission: OperatorMission = {
      ...base,
      status: 'REJECTED',
      date: '2026-09-24',
      startTime: '13:00',
    }
    expect(formatDeadline(mission, new Date(), 'vi')).toBe('Bị từ chối')
    expect(formatDeadline(mission, new Date(), 'en')).toBe('Rejected')
  })

  it('vi/en: failed vs cancelled', () => {
    const failed: OperatorMission = {
      ...base,
      status: 'FAILED',
      date: '2026-09-24',
      startTime: '13:00',
    }
    const cancelled: OperatorMission = {
      ...failed,
      backendStatus: 'CANCELLED',
    }
    expect(formatDeadline(failed, new Date(), 'vi')).toBe('Không hoàn thành')
    expect(formatDeadline(failed, new Date(), 'en')).toBe('Not completed')
    expect(formatDeadline(cancelled, new Date(), 'vi')).toBe('Đã huỷ')
    expect(formatDeadline(cancelled, new Date(), 'en')).toBe('Cancelled')
  })

  it('vi/en: pending countdown in days', () => {
    const now = new Date('2026-09-20T10:00:00+07:00')
    const mission: OperatorMission = {
      ...base,
      status: 'PENDING',
      date: '2026-09-22',
      startTime: '12:00',
    }
    expect(formatDeadline(mission, now, 'vi')).toBe('Còn 2 ngày 2 giờ')
    expect(formatDeadline(mission, now, 'en')).toBe('2d 2h left')
  })
})


it('stops the flight timer after postflight even while business status stays IN_PROGRESS', () => {
  const mission = { ...base, status: 'IN_FLIGHT', backendStatus: 'IN_PROGRESS', flightStartedAt: '2026-11-16T10:00:00Z', actualEndAt: '2026-11-16T10:20:00Z' } as OperatorMission
  expect(formatDeadline(mission, new Date('2026-11-16T12:15:00Z'), 'vi')).toBe('Đã kết thúc bay')
  expect(formatDeadline(mission, new Date('2026-11-17T12:15:00Z'), 'vi')).toBe('Đã kết thúc bay')
  expect(formatDeadline(mission, new Date('2026-11-17T12:15:00Z'), 'en')).toBe('Flight ended')
})
