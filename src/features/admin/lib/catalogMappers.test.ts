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
    const s = mapService({
      id: '1',
      name: 'A',
      basePrice: 2_000_000,
      isActive: false,
    })
    expect(s).toEqual({
      id: '1',
      name: 'A',
      description: '',
      basePrice: 2_000_000,
      imageUrl: null,
      isActive: false,
      createdAt: null,
      updatedAt: null,
    })
  })

  it('builds a trimmed service request from the form', () => {
    expect(
      toServiceRequest({
        name: { vi: ' X ', en: ' Xe ' },
        description: { vi: ' d ', en: ' de ' },
        basePrice: 2_000_000,
        isActive: true,
      }),
    ).toEqual({
      name: '{"vi":"X","en":"Xe"}',
      description: '{"vi":"d","en":"de"}',
      basePrice: 2_000_000,
      isActive: true,
    })
    expect(
      toServiceRequest({
        name: { vi: 'A', en: 'B' },
        description: { vi: ' ', en: '' },
        basePrice: 1,
        isActive: true,
      }).description,
    ).toBe('')
    expect(emptyServiceForm().isActive).toBe(true)
    expect(
      serviceToForm(
        mapService({
          id: '1',
          name: 'A',
          description: 'd',
          basePrice: 2_000_000,
          isActive: true,
        }),
      ),
    ).toEqual({
      name: { vi: 'A', en: 'A' },
      description: { vi: 'd', en: 'd' },
      basePrice: 2_000_000,
      isActive: true,
    })
    expect(
      serviceToForm(
        mapService({
          id: '1',
          name: '{"vi":"Mái nhà","en":"Roof"}',
          basePrice: 1,
          isActive: true,
        }),
      ).name,
    ).toEqual({ vi: 'Mái nhà', en: 'Roof' })
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
      name: '{"vi":"Đêm","en":"Đêm"}',
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
