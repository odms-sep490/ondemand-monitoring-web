import { usePagedGrid } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { DeviceResponse } from '../../../types/drones'
import { dronesPageMessages } from '../DronesPage.messages'
import { DroneCard } from './DroneCard'

type Props = {
  visible: DeviceResponse[]
  total: number
  onChangeStatus: (drone: DeviceResponse) => void
}

export function DroneGrid({ visible, total, onChangeStatus }: Props) {
  const { t } = useI18n(dronesPageMessages)
  const { pageItems, pager } = usePagedGrid(visible, visible.map((d) => d.id).join('|'))
  return (
    <>
      <div className="mgr-drone-grid">
        {pageItems.map((drone) => (
          <DroneCard key={drone.id} drone={drone} onChangeStatus={onChangeStatus} />
        ))}
      </div>
      {pager}
      <div className="mgr-drone-count">{t.resultCount(visible.length, total)}</div>
    </>
  )
}
