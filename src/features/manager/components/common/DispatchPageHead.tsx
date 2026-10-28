import type { Mission } from '../../../mission/types/mission'
import { managerHref } from '../../routes'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import { commonMiscMessages } from './commonMisc.messages'
import { missionStatusLabel } from './liveDispatchHelpers'
import { useI18n } from '../../../../shared/i18n'
import type { OrderDispatchContext } from './liveDispatchTypes'
import { Button } from 'antd'
import { PageHeader } from './PageHeader'
import { StatusTag } from './StatusTag'

export function DispatchPageHead({
  orderContext,
  current,
  busy,
}: {
  orderContext: OrderDispatchContext | undefined
  current: Mission
  busy: boolean
}) {
  const { t } = useI18n(liveDispatchPageMessages)
  const { t: m } = useI18n(commonMiscMessages)
  return (
    <PageHeader
      title={t.createMissionTitle}
      description={
        orderContext ? (
          <span className="mgr-badge-row">
            <span>{current.missionCode}</span>
            <StatusTag tone="info">
              {missionStatusLabel(current.status, t.missionStatuses)}
            </StatusTag>
          </span>
        ) : (
          t.createMissionSubtitle
        )
      }
      actions={
        orderContext ? (
          <Button disabled={busy} onClick={() => orderContext.onReturn()}>
            {orderContext.missionScoped
              ? orderContext.returnLabel
              : m.chooseOtherMission}
          </Button>
        ) : (
          <Button href={managerHref({ screen: 'orderQueue' })}>
            {t.backToOrders}
          </Button>
        )
      }
    />
  )
}
