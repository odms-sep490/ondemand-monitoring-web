import { expect, it } from 'vitest'
import { missionPlanningReturnHref } from './missionPlanningReturn'
it.each(['customer-rework', 'internal-correction'])(
  'returns %s to exact Mission planning, rather than the original Order',
  (id) => {
    expect(
      missionPlanningReturnHref({ id, purpose: 'REWORK' }, id, 'order'),
    ).toBe(`#portal/manager/missions/${id}/dispatch`)
  },
)
it('preserves the original Order planning return', () =>
  expect(
    missionPlanningReturnHref(
      { id: 'mission', purpose: 'ORIGINAL' },
      'mission',
      'order',
    ),
  ).toBe('#portal/manager/orders/order'))
it('preserves the normal mission return without an Order context', () =>
  expect(missionPlanningReturnHref({ id: 'mission' }, 'mission')).toBe(
    '#portal/manager/missions/mission/detail',
  ))
