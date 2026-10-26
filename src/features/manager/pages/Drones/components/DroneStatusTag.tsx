import { useI18n } from '../../../../../shared/i18n'
import { droneStatusTone, getDroneStatusLabel } from '../../../../../shared/lib/statusTone'
import type { DroneStatus } from '../../../../../shared/types/domain'
import { StatusTag } from '../../../components/common/StatusTag'
import { dronesPageMessages } from '../DronesPage.messages'

export function DroneStatusTag({ status }: { status: DroneStatus }) {
  const { lang } = useI18n(dronesPageMessages)
  return <StatusTag tone={droneStatusTone[status]}>{getDroneStatusLabel(status, lang)}</StatusTag>
}
