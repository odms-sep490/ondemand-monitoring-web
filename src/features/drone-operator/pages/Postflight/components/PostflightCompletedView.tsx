import { Button, Result } from 'antd'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { FlightStepHeader } from '../../../components/common/FlightStepper'
import { operatorHref } from '../../../routes'
import type { PostflightItemKey } from '../../../types/mission'
import { postflightPageMessages } from '../PostflightPage.messages'
import { Row } from './PostflightRow'

export function PostflightCompletedView({
  missionLabel,
  completed,
  deviceLabel,
  failItems,
}: {
  missionLabel: string
  completed: { overallOk: boolean; ticketCreated: boolean; droneStatus: string }
  deviceLabel: string
  failItems: PostflightItemKey[]
}) {
  const { t } = useI18n(postflightPageMessages)
  return (
    <CardComponent styles={{ body: { padding: 0 } }}>
      <FlightStepHeader
        title={t.completedStepTitle}
        missionId={missionLabel}
        active={6}
      />
      <div className="stf-pad stf-narrow">
        <Result
          status={completed.overallOk ? 'success' : 'warning'}
          title={completed.overallOk ? t.successTitle : t.ticketCreatedTitle}
          subTitle={
            <span className="stf-mono">
              {t.missionCodeLabel} <b>{missionLabel}</b> · {t.deviceLabel}{' '}
              <b>{deviceLabel}</b>
            </span>
          }
          extra={
            <Button
              type="primary"
              size="large"
              href={operatorHref({ screen: 'missions' })}
            >
              {t.backToMissionList}
            </Button>
          }
        />
        <CardComponent>
          <div className="stf-stack-sm">
            <Row label={t.missionStatusLabel} value={t.missionStatusValue} />
            <Row
              label={t.physicalCheckLabel}
              value={
                completed.overallOk
                  ? t.physicalCheckAllPass
                  : t.physicalCheckSomeFail(failItems.length)
              }
            />
            <Row
              label={t.droneStatusLabel(deviceLabel)}
              value={
                completed.overallOk
                  ? t.droneStatusAvailable
                  : t.droneStatusMaintenance
              }
            />
            {completed.ticketCreated && (
              <Row
                label={t.maintenanceTicketLabel}
                value={t.maintenanceTicketValue}
              />
            )}
          </div>
        </CardComponent>
      </div>
    </CardComponent>
  )
}
