import type { Mission } from '../../../mission/types/mission'
import { managerHref } from '../../routes'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import { useI18n } from '../../../../shared/i18n'
import type { OrderDispatchContext } from './liveDispatchTypes'

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
  return (
    <div className="odm-or-pagehead odm-or-pagehead-row">
      <div>
        <h1 className="odm-or-title">{t.createMissionTitle}</h1>
        <p className="odm-or-subtitle">{t.createMissionSubtitle}</p>
        {orderContext && (
          <span className="odm-or-pill odm-or-pill-blue">
            {current.missionCode}
          </span>
        )}
      </div>
      {orderContext ? (
        <button
          className="odm-or-btn-outline"
          disabled={busy}
          onClick={() => orderContext.onReturn()}
        >
          {orderContext.missionScoped
            ? orderContext.returnLabel
            : 'Chọn nhiệm vụ khác'}
        </button>
      ) : (
        <a
          className="odm-or-btn-outline"
          href={managerHref({ screen: 'orderQueue' })}
        >
          {t.backToOrders}
        </a>
      )}
    </div>
  )
}
