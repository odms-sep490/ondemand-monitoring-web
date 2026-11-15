import { describe, expect, it } from 'vitest'

import {
  emptyServiceForm,
  mapService,
  mapTimeslot,
  readApiError,
  serviceToForm,
  timeslotToForm,
  toHourMinute,
  toServiceRequest,
  toTimeslotRequest,
} from './catalogMappers'

describe('catalogMappers', () => {
  it('maps a service dto and fills optional fields', () => {
    const s = mapService({ id: '1', name: 'A', defaultPrice: 2_000_000, priceSource: 'CHECKLISTS', isActive: false })
    expect(s).toEqual({
      id: '1',
      name: 'A',
      description: '',
      defaultPrice: 2_000_000,
      priceSource: 'CHECKLISTS',
      imageUrl: null,
      isActive: false,
      createdAt: null,
      updatedAt: null,
    })
  })

  it('builds a trimmed service request from the form', () => {
    expect(
      toServiceRequest({ name: ' X ', description: ' d ', isActive: true }),
    ).toEqual({ name: 'X', description: 'd', isActive: true })
    expect(emptyServiceForm().isActive).toBe(true)
    expect(
      serviceToForm(
        mapService({ id: '1', name: 'A', description: 'd', defaultPrice: 2_000_000, isActive: true }),
      ),
    ).toEqual({ name: 'A', description: 'd', isActive: true })
  })

  it('trims seconds from times', () => {
    expect(toHourMinute('06:30:00')).toBe('06:30')
    expect(toHourMinute(undefined)).toBe('')
  })

  it('maps a timeslot and round-trips through the form', () => {
    const t = mapTimeslot({
      id: 't',
      code: 'NIGHT',
      name: ' Đêm',
      startTime: '22:00:00',
      endTime: '05:00:00',
    })
    expect(t.startTime).toBe('22:00')
    expect(toTimeslotRequest(timeslotToForm(t))).toEqual({
      code: 'NIGHT',
      name: 'Đêm',
      startTime: '22:00',
      endTime: '05:00',
    })
  })

  it('reads message and field errors from an api error', () => {
    const err = Object.assign(new Error('Invalid'), { errors: { name: 'req' } })
    expect(readApiError(err, 'x')).toEqual({
      message: 'Invalid',
      fields: { name: 'req' },
    })
    expect(readApiError('boom', 'fallback')).toEqual({
      message: 'fallback',
      fields: {},
    })
  })
})
