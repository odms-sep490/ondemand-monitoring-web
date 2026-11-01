import { describe, expect, it } from 'vitest'

import { searchOrders } from '../orders/filterOrders'
import type { OrderRow } from '../orders/types'
import { localizeServiceName } from './serviceNames'
import { localizeTimeslot } from './timeslots'

const SERVICE = '{"vi":"Kiểm tra mái nhà","en":"Roof inspection"}'

describe('customer display of admin-entered bilingual content', () => {
  it('decodes a bilingual service name for the active language', () => {
    expect(localizeServiceName('svc-1', 'vi', SERVICE)).toBe('Kiểm tra mái nhà')
    expect(localizeServiceName('svc-1', 'en', SERVICE)).toBe('Roof inspection')
  })

  it('keeps legacy plain service names working', () => {
    expect(localizeServiceName('x', 'vi', 'Giám sát rừng')).toBe(
      'Giám sát rừng',
    )
    expect(localizeServiceName('x', 'en', 'Giám sát rừng')).toBe(
      'Forest monitoring',
    )
    expect(localizeServiceName('x', 'en', 'Dịch vụ lạ')).toBe('Dịch vụ lạ')
  })

  it('decodes a bilingual time slot and appends the time range', () => {
    const slot = {
      id: 't',
      code: 'MORNING',
      name: '{"vi":"Sáng sớm","en":"Early morning"}',
      startTime: '06:00:00',
      endTime: '09:00:00',
    }
    expect(localizeTimeslot(slot, 'vi')).toBe('Sáng sớm 06:00–09:00')
    expect(localizeTimeslot(slot, 'en')).toBe('Early morning 06:00–09:00')
  })

  it('keeps the built-in labels for legacy time slot names', () => {
    const slot = {
      code: 'MORNING',
      name: 'Buổi sáng',
      startTime: '06:00',
      endTime: '12:00',
    }
    expect(localizeTimeslot(slot, 'en')).toBe('Morning 06:00–12:00')
  })

  it('searches orders by either language of the service name', () => {
    const rows = [
      { id: 'o1', title: 'a', address: 'b', code: 'c', serviceName: SERVICE },
    ] as OrderRow[]
    expect(searchOrders(rows, 'roof')).toHaveLength(1)
    expect(searchOrders(rows, 'mái nhà')).toHaveLength(1)
    expect(searchOrders(rows, 'forest')).toHaveLength(0)
  })
})
