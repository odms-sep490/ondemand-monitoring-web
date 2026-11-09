import type {
  OrderReadiness,
  ReadinessCriterion,
} from '../../../types/readiness'
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { FailureAction, SupplementRequest } from '../readinessTypes'
import { Button, useConfirm } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { managerFeedbackMessages } from '../../../feedback.messages'
import { readinessBlockingNoticeMessages } from './ReadinessBlockingNotice.messages'

type BlockingT = (typeof readinessBlockingNoticeMessages)['vi']

function buildSupplementOptions(
  t: BlockingT,
): Record<string, Array<Omit<SupplementRequest, 'id'>>> {
  return {
    SERVICE_AREA: [{ label: t.serviceArea, scope: 'LOCATION' }],
    SITE_ACCESS: [{ label: t.siteAccess, scope: 'ADDITIONAL_INFORMATION' }],
    REQUESTED_SCOPE_FEASIBLE: [{ label: t.requestedScope, scope: 'LOCATION' }],
    PURPOSE: [{ label: t.purpose, scope: 'ADDITIONAL_INFORMATION' }],
  }
}

export function ReadinessBlockingNotice({
  readiness,
  failedRequired,
  editable,
  savingCode,
  submitFailedDecision,
  actionsHost,
}: {
  readiness: OrderReadiness
  failedRequired: ReadinessCriterion[]
  editable: boolean
  savingCode: string | null
  submitFailedDecision: (
    decision: FailureAction,
    supplements?: SupplementRequest[],
  ) => Promise<void>
  /** Sidebar element that hosts the decision buttons; inline when absent. */
  actionsHost?: HTMLElement | null
}) {
  const { t: fb } = useI18n(managerFeedbackMessages)
  const { t } = useI18n(readinessBlockingNoticeMessages)
  const confirm = useConfirm()
  const [showSupplementForm, setShowSupplementForm] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const availableOptions = useMemo(() => {
    const supplementOptions = buildSupplementOptions(t)
    return failedRequired
      .filter((criterion) => criterion.code !== 'CAPABILITY')
      .flatMap((criterion) => {
        const options = supplementOptions[criterion.code] ?? [
          {
            label: t.clarify(criterion.title),
            scope: 'ADDITIONAL_INFORMATION' as const,
          },
        ]
        return options.map((option, index) => ({
          ...option,
          id: `${criterion.code}-${index}`,
        }))
      })
  }, [failedRequired, t])
  const selectedRequests = availableOptions.filter((option) =>
    selected.includes(option.id),
  )

  const actions =
    failedRequired.length > 0 && editable ? (
        <div className="odm-or-readiness-blocking-actions mgr-decision-actions">
          {availableOptions.length > 0 ? (
            <Button
              type="button"
              variant="primary"
              disabled={savingCode === 'decision'}
              onClick={() => setShowSupplementForm(true)}
            >
              {t.requestSupplement}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="danger"
            disabled={savingCode === 'decision'}
            onClick={async () => {
              const ok = await confirm({
                title: fb.rejectOrderTitle,
                description: fb.rejectOrderBody,
                confirmLabel: fb.rejectOrderAction,
                tone: 'danger',
              })
              if (ok) void submitFailedDecision('REJECTED')
            }}
          >
            {t.rejectOrder}
          </Button>
        </div>
      ) : null

  return (
    <div className="odm-or-readiness-blocking" aria-label={t.cannotApprove}>
      <ul>
        {readiness.blockingReasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      {actionsHost === undefined || actionsHost === null
        ? actions
        : createPortal(actions, actionsHost)}
      {showSupplementForm && availableOptions.length > 0 ? (
        <div className="odm-or-supplement-form">
          <fieldset>
            <legend>{t.chooseContent}</legend>
            <p>{t.customerWillSee}</p>
            <div className="odm-or-supplement-options">
              {availableOptions.map((option) => (
                <label key={option.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(option.id)}
                    onChange={(event) =>
                      setSelected((current) =>
                        event.target.checked
                          ? [...current, option.id]
                          : current.filter((id) => id !== option.id),
                      )
                    }
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="odm-or-supplement-actions">
            <Button
              type="button"
              disabled={savingCode === 'decision'}
              onClick={() => {
                setShowSupplementForm(false)
                setSelected([])
              }}
            >
              {t.cancel}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={
                selectedRequests.length === 0 || savingCode === 'decision'
              }
              onClick={() =>
                void submitFailedDecision('NEED_INFO', selectedRequests)
              }
            >
              {savingCode === 'decision' ? t.sending : t.sendRequest}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
