import { missionCreatePageMessages } from './MissionCreatePage.messages'
import type { OrderIconName } from '../../components/common/OrderIcon'
import type { ReactNode } from 'react'
import type { OrderMissionBrief } from '../../types/orders'
import type { SubmitState } from './createMissionTypes'

export function deriveCreateMissionSummary({
  scheduledStart,
  scheduledEnd,
  t,
  submit,
  brief,
}: {
  scheduledStart: string
  scheduledEnd: string
  t: (typeof missionCreatePageMessages)['vi']
  submit: SubmitState
  brief: OrderMissionBrief
}) {
  const durationMinutes =
    scheduledStart && scheduledEnd
      ? Math.round(
          (new Date(scheduledEnd).getTime() -
            new Date(scheduledStart).getTime()) /
            60000,
        )
      : null
  const durationText =
    durationMinutes != null && durationMinutes > 0
      ? t.durationHours(Math.floor(durationMinutes / 60), durationMinutes % 60)
      : null
  const submitting = submit.kind === 'submitting'

  const summaryRows: Array<{
    icon: OrderIconName
    label: string
    value: ReactNode
  }> = [
    { icon: 'service', label: t.serviceLabel, value: brief.serviceName },
    { icon: 'user', label: t.customerLabel, value: brief.customerFullName },
    { icon: 'pin', label: t.locationLabel, value: brief.addressText ?? '—' },
    {
      icon: 'radius',
      label: t.radiusLabel,
      value: brief.radiusM != null ? `${brief.radiusM} m` : '—',
    },
  ]
  if (brief.nearestBase) {
    summaryRows.push({
      icon: 'drone',
      label: t.nearestBaseLabel,
      value: brief.nearestBase,
    })
  }
  return { durationText, submitting, summaryRows }
}
