import { RocketOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { DeviceResponse } from '../../../types/drones'
import { MANUAL_TRANSITIONS } from '../droneHelpers'
import { dronesPageMessages } from '../DronesPage.messages'
import { DroneStatusTag } from './DroneStatusTag'

type Props = {
  drone: DeviceResponse
  onChangeStatus: (drone: DeviceResponse) => void
}

export function DroneCard({ drone, onChangeStatus }: Props) {
  const { t, locale } = useI18n(dronesPageMessages)
  const canChange = (MANUAL_TRANSITIONS[drone.status]?.length ?? 0) > 0
  const model = drone.deviceModel
  return (
    <CardComponent className="mgr-drone-card">
      <div className="mgr-drone-card-top">
        <span className="mgr-tile mgr-tone-blue" aria-hidden="true">
          <RocketOutlined />
        </span>
        <div className="mgr-cell-stack mgr-drone-card-id">
          <span className="mgr-code" title={drone.serialNumber}>
            {drone.serialNumber}
          </span>
          {drone.name ? <span className="mgr-cell-sub">{drone.name}</span> : null}
        </div>
      </div>
      <div className="mgr-drone-card-status">
        <DroneStatusTag status={drone.status} />
      </div>
      {model || drone.updatedAt ? (
        <dl className="mgr-drone-facts">
          {model ? (
            <div>
              <dt>{t.columns.model}</dt>
              <dd>
                {model.modelName ?? model.code}
                {model.manufacturer ? <span className="mgr-cell-sub"> · {model.manufacturer}</span> : null}
              </dd>
            </div>
          ) : null}
          {drone.updatedAt ? (
            <div>
              <dt>{t.columns.updated}</dt>
              <dd>{new Date(drone.updatedAt).toLocaleString(locale)}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      {canChange ? (
        <Button block className="mgr-drone-card-action" onClick={() => onChangeStatus(drone)}>
          {t.changeStatus}
        </Button>
      ) : null}
    </CardComponent>
  )
}
