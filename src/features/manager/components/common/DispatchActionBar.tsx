import { OrderIcon } from './OrderIcon'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import { commonMiscMessages } from './commonMisc.messages'
import { useI18n } from '../../../../shared/i18n'
import type { DispatchStep, OrderDispatchContext } from './liveDispatchTypes'
import type { AvailableDrone } from '../../../staff/api/droneApi'
import { Button, Card } from '../../../../shared/components/ui'

/** Step actions, rendered as the confirm card of the sticky sidebar. */
export function DispatchActionBar({
  stepHint,
  activeStep,
  missingRoleNames,
  activeStepIndex,
  goPrevious,
  missingRoles,
  selectedDrones,
  goNext,
  busy,
  droneIds,
  hasAllRoles,
  orderContext,
  assign,
}: {
  stepHint: Record<DispatchStep, string>
  activeStep: DispatchStep
  missingRoleNames: string[]
  activeStepIndex: number
  goPrevious: () => void
  missingRoles: number
  selectedDrones: AvailableDrone[]
  goNext: () => void
  busy: boolean
  droneIds: string[]
  hasAllRoles: boolean
  orderContext: OrderDispatchContext | undefined
  assign: () => Promise<void>
}) {
  const { t } = useI18n(liveDispatchPageMessages)
  const { t: m } = useI18n(commonMiscMessages)
  return (
    <Card title={t.sideActions}>
      <div className="mgr-dispatch-hint">
        <OrderIcon name="info" size={16} />
        <span>{stepHint[activeStep]}</span>
      </div>
      {activeStep === 'staff' && missingRoleNames.length > 0 && (
        <strong className="mgr-dispatch-missing">
          {m.missingPrefix} {missingRoleNames.join(', ')}
        </strong>
      )}
      <div className="mgr-actions">
        {activeStep !== 'confirm' ? (
          <Button
            type="button"
            variant="primary"
            className={
              (activeStep === 'staff' && missingRoles > 0) ||
              (activeStep === 'device' && selectedDrones.length === 0)
                ? 'is-blocked'
                : undefined
            }
            onClick={goNext}
          >
            {t.next}
            <OrderIcon name="chevron-right" size={16} />
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            disabled={
              busy ||
              droneIds.length === 0 ||
              !hasAllRoles ||
              (orderContext && !orderContext.canAssign)
            }
            onClick={() => void assign()}
          >
            {busy ? t.assigning : t.assign}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          disabled={activeStepIndex === 0}
          onClick={goPrevious}
        >
          {t.previous}
        </Button>
      </div>
    </Card>
  )
}
