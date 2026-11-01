import { describe, expect, it } from 'vitest'

import {
  droneStatusLabel,
  droneStatusTone,
  getDroneStatusLabel,
  getMediaStatusLabel,
  getMissionStatusLabel,
  getOrderStatusLabel,
  mediaStatusLabel,
  mediaStatusTone,
  missionStatusLabel,
  missionStatusTone,
  orderStatusLabel,
  orderStatusLabelEn,
  orderStatusTone,
  ticketSeverityLabel,
  ticketSeverityTone,
} from './statusTone'
import type {
  DroneStatus,
  MediaStatus,
  MissionStatus,
  OrderStatus,
  StatusTone,
  TicketSeverity,
} from '../types/domain'

const VALID_TONES: StatusTone[] = [
  'gray',
  'yellow',
  'blue',
  'green',
  'orange',
  'red',
]

// The exact enum member lists, copied from the backend / brief (see
// src/shared/types/domain.ts for sources) so this test fails loudly if a
// new backend value is ever added without a tone/label mapping.
const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]

const MISSION_STATUSES: MissionStatus[] = [
  'CREATED',
  'RESOURCE_ASSIGNING',
  'WAITING_OPERATOR_ACCEPTANCE',
  'SCHEDULED',
  'CONNECTED',
  'PREFLIGHT_CHECKING',
  'READY_TO_FLY',
  'FAILED_PREFLIGHT',
  'PENDING_APPROVAL',
  'IN_FLIGHT',
  'IN_PROGRESS',
  'RETURNING',
  'POSTFLIGHT_CHECKING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]

const DRONE_STATUSES: DroneStatus[] = [
  'AVAILABLE',
  'RESERVED',
  'PREFLIGHT',
  'IN_MISSION',
  'ACTIVE_MISSION',
  'RETURNING',
  'CHARGING',
  'IDLE_CHARGING',
  'MAINTENANCE',
  'OUT_OF_SERVICE',
  'OFFLINE',
]

const TICKET_SEVERITIES: TicketSeverity[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]
const MEDIA_STATUSES: MediaStatus[] = [
  'PENDING_UPLOAD',
  'UPLOADING',
  'UPLOADED',
  'VALIDATING',
  'VALIDATED',
  'VALIDATION_FAILED',
  'AVAILABLE',
  'MANUAL_REQUIRED',
]

describe('statusTone maps', () => {
  it.each(ORDER_STATUSES)(
    'maps OrderStatus.%s to a valid tone + label',
    (status) => {
      expect(VALID_TONES).toContain(orderStatusTone[status])
      expect(orderStatusLabel[status]).toBeTruthy()
    },
  )

  it.each(MISSION_STATUSES)(
    'maps MissionStatus.%s to a valid tone + label',
    (status) => {
      expect(VALID_TONES).toContain(missionStatusTone[status])
      expect(missionStatusLabel[status]).toBeTruthy()
    },
  )

  it.each(DRONE_STATUSES)(
    'maps DroneStatus.%s to a valid tone + label',
    (status) => {
      expect(VALID_TONES).toContain(droneStatusTone[status])
      expect(droneStatusLabel[status]).toBeTruthy()
    },
  )

  it.each(TICKET_SEVERITIES)(
    'maps TicketSeverity.%s to a valid tone + label',
    (severity) => {
      expect(VALID_TONES).toContain(ticketSeverityTone[severity])
      expect(ticketSeverityLabel[severity]).toBeTruthy()
    },
  )

  it.each(MEDIA_STATUSES)(
    'maps MediaStatus.%s to a valid tone + label',
    (status) => {
      expect(VALID_TONES).toContain(mediaStatusTone[status])
      expect(mediaStatusLabel[status]).toBeTruthy()
    },
  )

  it('follows the brief colour convention for the values it names explicitly', () => {
    expect(orderStatusTone.PENDING).toBe('gray')
    expect(orderStatusTone.APPROVED).toBe('green')
    expect(orderStatusTone.REJECTED).toBe('red')
    expect(orderStatusTone.IN_PROGRESS).toBe('blue')
    expect(orderStatusTone.COMPLETED).toBe('green')

    expect(missionStatusTone.CREATED).toBe('gray')
    expect(missionStatusTone.IN_FLIGHT).toBe('blue')
    expect(missionStatusTone.COMPLETED).toBe('green')
    expect(missionStatusTone.FAILED).toBe('red')

    expect(droneStatusTone.AVAILABLE).toBe('green')
    expect(droneStatusTone.MAINTENANCE).toBe('orange')

    expect(mediaStatusTone.MANUAL_REQUIRED).toBe('orange')
    expect(mediaStatusTone.VALIDATION_FAILED).toBe('red')
    expect(mediaStatusTone.UPLOADING).toBe('blue')
    expect(mediaStatusTone.AVAILABLE).toBe('green')
  })
})

describe('bilingual label accessors', () => {
  it.each(ORDER_STATUSES)(
    'getOrderStatusLabel(%s) matches vi/en records by language',
    (status) => {
      expect(getOrderStatusLabel(status, 'vi')).toBe(orderStatusLabel[status])
      expect(getOrderStatusLabel(status, 'en')).toBe(orderStatusLabelEn[status])
    },
  )

  it.each(MISSION_STATUSES)(
    'getMissionStatusLabel(%s) returns a non-empty vi/en label',
    (status) => {
      expect(getMissionStatusLabel(status, 'vi')).toBe(
        missionStatusLabel[status],
      )
      expect(getMissionStatusLabel(status, 'en')).toBeTruthy()
    },
  )

  it.each(DRONE_STATUSES)(
    'getDroneStatusLabel(%s) returns a non-empty vi/en label',
    (status) => {
      expect(getDroneStatusLabel(status, 'vi')).toBe(droneStatusLabel[status])
      expect(getDroneStatusLabel(status, 'en')).toBeTruthy()
    },
  )

  it.each(MEDIA_STATUSES)(
    'getMediaStatusLabel(%s) returns a non-empty vi/en label',
    (status) => {
      expect(getMediaStatusLabel(status, 'vi')).toBe(mediaStatusLabel[status])
      expect(getMediaStatusLabel(status, 'en')).toBeTruthy()
    },
  )

  it('English labels differ from Vietnamese ones', () => {
    expect(getOrderStatusLabel('APPROVED', 'en')).toBe('Approved')
    expect(getOrderStatusLabel('APPROVED', 'vi')).toBe('Đã duyệt')
  })
})
