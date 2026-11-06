import { describe, expect, it } from 'vitest'

import { resolveOfficeArea } from './officeBusiness'

describe('resolveOfficeArea', () => {
  it('places managers in the manager area', () => {
    expect(resolveOfficeArea(true, ['PILOT'])).toBe('planning')
  })

  it.each(['PILOT', 'OPERATOR'])('places %s in flight dispatch', (role) => {
    expect(resolveOfficeArea(false, [role])).toBe('dispatch')
  })

  it('places maintenance and inspection roles in their work areas', () => {
    expect(resolveOfficeArea(false, ['MAINTAINER'])).toBe('technical')
    expect(resolveOfficeArea(false, ['INSPECTOR'])).toBe('inspection')
  })

  it('keeps staff without a verified operational role in shared workspace', () => {
    expect(resolveOfficeArea(false, ['STAFF'])).toBe('shared')
    expect(resolveOfficeArea(false, [])).toBe('shared')
  })

  it('uses flight operations first when an assignment has more than one role', () => {
    expect(resolveOfficeArea(false, ['INSPECTOR', 'OPERATOR'])).toBe('dispatch')
  })
})
