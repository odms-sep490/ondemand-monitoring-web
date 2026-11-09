import { useLanguage } from '../../../../shared/i18n'
import { getMissionStatusLabel, missionStatusTone } from '../../../../shared/lib/statusTone'
import type { MissionStatus } from '../../../../shared/types/domain'
import { StatusTag } from './StatusTag'

export function MissionStatusTag({ mission }: { mission: { status: MissionStatus } }) {
  const { lang } = useLanguage()
  return (
    <StatusTag tone={missionStatusTone[mission.status]}>
      {getMissionStatusLabel(mission.status, lang)}
    </StatusTag>
  )
}
