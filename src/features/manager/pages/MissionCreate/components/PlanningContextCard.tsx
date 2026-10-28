import { PlanningHeader } from '../../../components/common/PlanningHeader'
import { managerHref } from '../../../routes'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { planningError } from '../../../lib/planningErrors'
import { Button } from '../../../../../shared/components/Button'
import { planningPresentationMessages } from '../../../components/common/planningPresentation.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { ExecutionPlan } from '../../../types/planning'
import type { Dispatch, SetStateAction } from 'react'
import type { SubmitState } from '../createMissionTypes'

export function PlanningContextCard({
  onCreated,
  planQuery,
  planRevision,
  orderId,
  scopeLabel,
  setScopeLabel,
  submit,
}: {
  onCreated: ((missionId: string) => void) | undefined
  planQuery: UseApiQueryState<ExecutionPlan>
  planRevision: number
  orderId: string
  scopeLabel: string
  setScopeLabel: Dispatch<SetStateAction<string>>
  submit: SubmitState
}) {
  const { t: planningT } = useI18n(planningPresentationMessages)
  return (
    <section
      className="odm-or-card odm-plan-create"
      aria-label="Mission planning context"
    >
      {!onCreated && (
        <PlanningHeader
          status={planQuery.data?.planStatus}
          revision={planRevision}
          loading={planQuery.loading}
        />
      )}
      <div className="odm-plan-create-body">
        {!onCreated && (
          <a
            className="odm-plan-back"
            href={managerHref({ screen: 'orderReview', orderId })}
          >
            <OrderIcon name="chevron-right" size={16} />
            {planningT.back}
          </a>
        )}
        {planQuery.error ? (
          <div role="alert" className="odm-or-error odm-plan-error">
            {planningError(planQuery.error)}{' '}
            <Button
              type="button"
              variant="secondary"
              onClick={planQuery.reload}
            >
              {planningT.retry}
            </Button>
          </div>
        ) : null}
        {planQuery.data?.planStatus === 'FINALIZED' && (
          <p className="odm-planning-notice">{planningT.finalized}</p>
        )}
        <div className="odm-plan-create-grid">
          <div className="odm-plan-form">
            <h3>{planningT.createTitle}</h3>
            <p className="odm-plan-description">
              {planningT.createDescription}
            </p>
            <label className="odm-or-field" htmlFor="mission-work-scope">
              <span className="odm-or-field-label">
                {planningT.scopeLabel} <span aria-hidden="true">*</span>
              </span>
            </label>
            <input
              id="mission-work-scope"
              className="odm-or-input"
              maxLength={255}
              required
              placeholder={planningT.scopePlaceholder}
              value={
                scopeLabel === 'Whole Order scope'
                  ? planningT.scopeDefault
                  : scopeLabel
              }
              onChange={(event) => setScopeLabel(event.target.value)}
              aria-describedby={`mission-scope-help${submit.kind === 'validationFailed' && !scopeLabel.trim() ? ' mission-scope-error' : ''}`}
              aria-invalid={
                submit.kind === 'validationFailed' && !scopeLabel.trim()
                  ? true
                  : undefined
              }
            />
            <p id="mission-scope-help" className="odm-plan-field-help">
              {planningT.scopeHint}
            </p>
            {submit.kind === 'validationFailed' && !scopeLabel.trim() && (
              <p
                id="mission-scope-error"
                role="alert"
                className="odm-plan-field-error"
              >
                {submit.message}
              </p>
            )}
          </div>
          <aside
            className="odm-plan-geography"
            aria-labelledby="mission-geography-title"
          >
            <h3 id="mission-geography-title">
              <OrderIcon name="info" size={18} />
              {planningT.geography}
            </h3>
            <ul>
              <li>{planningT.geographyOrder}</li>
              <li>{planningT.geographyCustom}</li>
              <li>{planningT.geographyChecklist}</li>
            </ul>
          </aside>
        </div>
      </div>
    </section>
  )
}
