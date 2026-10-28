import { useLanguage } from '../../../../shared/i18n'
import { getMissionStatusLabel, missionStatusTone } from '../../../../shared/lib/statusTone'
import type { MissionStatus } from '../../../../shared/types/domain'
import { missionStopLabel } from '../../../mission/lib/missionOperationalState'
import { StatusTag } from './StatusTag'

type StopSource = Parameters<typeof missionStopLabel>[0]

/** Mission status pill; a safe-stop in progress takes over the label. */
export function MissionStatusTag({ mission }: { mission: StopSource & { status: MissionStatus } }) {
  const { lang } = useLanguage()
  const stop = missionStopLabel(mission)
  if (stop) return <StatusTag tone="yellow">{stop}</StatusTag>
  return (
    <StatusTag tone={missionStatusTone[mission.status]}>
      {getMissionStatusLabel(mission.status, lang)}
    </StatusTag>
  )
}
