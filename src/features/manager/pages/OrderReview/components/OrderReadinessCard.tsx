import { useEffect, useState } from 'react'

import { ApiError } from '../../../../../shared/api/httpClient'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import { readinessApi } from '../../../api/readinessApi'
import { ordersApi } from '../../../api/ordersApi'
import type {
  OrderReadiness,
  ReadinessCriterion,
} from '../../../types/readiness'
import { OrderIcon } from '../../../components/common/OrderIcon'
import './OrderReadinessCard.css'
import {
  type Answer,
  type FailureAction,
  type SupplementRequest,
} from '../readinessTypes'
import {
  recommendationText,
  riskLevelOptions,
  answerOptions,
} from '../readinessHelpers'
import { ReadinessSummary } from './ReadinessSummary'
import { ReadinessCriterionRow } from './ReadinessCriterionRow'
import { ReadinessBlockingNotice } from './ReadinessBlockingNotice'
import { useToast } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { managerFeedbackMessages } from '../../../feedback.messages'
import { orderReadinessCardMessages } from './OrderReadinessCard.messages'

/**
 * Approval criteria for an order. Left: what the system checked on its own.
 * Right: what only the manager can judge. The backend enforces the same rules
 * when the quote is approved; this card makes them visible.
 */
export function OrderReadinessCard({
  orderId,
  query,
  editable,
  onDecisionDone,
  onLocalBlockChange,
  actionsHost,
}: {
  orderId: string
  query: UseApiQueryState<OrderReadiness>
  editable: boolean
  onDecisionDone?: () => void
  onLocalBlockChange?: (blocked: boolean) => void
  actionsHost?: HTMLElement | null
}) {
  const { t: fb } = useI18n(managerFeedbackMessages)
  const { t } = useI18n(orderReadinessCardMessages)
  const toast = useToast()
  const [drafts, setDrafts] = useState<
    Record<string, { result: Answer; note: string }>
  >({})
  const [savingCode, setSavingCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedResults, setSelectedResults] = useState<
    Record<string, Answer>
  >({})

  const readiness = query.data
  const hasUnsavedRequiredFailure = Object.entries(drafts).some(
    ([code, draft]) =>
      draft.result === 'FAIL' &&
      readiness?.criteria.some(
        (criterion) => criterion.code === code && criterion.required,
      ),
  )

  useEffect(() => {
    onLocalBlockChange?.(hasUnsavedRequiredFailure)
    return () => onLocalBlockChange?.(false)
  }, [hasUnsavedRequiredFailure, onLocalBlockChange])

  if (!readiness) {
    return (
      <section
        className="odm-or-card odm-or-readiness"
        aria-label={t.approvalCriteria}
      >
        <header className="odm-or-card-head">
          <span className="odm-or-card-title">
            <OrderIcon name="check" size={18} />
            {t.approvalCriteria}
          </span>
        </header>
        <div className="odm-or-card-body odm-or-empty">
          {query.loading ? t.checking : t.loadFailed}
        </div>
      </section>
    )
  }

  const auto = readiness.criteria.filter(
    (c) =>
      c.type === 'AUTO' &&
      c.code !== 'CHECKLIST_REVIEWED' &&
      c.code !== 'SCHEDULE_DATE',
  )
  const manual = readiness.criteria.filter(
    (c) =>
      c.type === 'MANUAL' &&
      c.code !== 'SURVEY_NEEDED' &&
      c.code !== 'AIRSPACE_PERMIT',
  )
  const pendingRequired = manual.filter(
    (c) => c.required && c.result === 'PENDING',
  ).length
  const autoPassed = auto.filter((c) => c.result === 'PASS').length
  const manualAnswered = manual.filter((c) => c.result !== 'PENDING').length
  const canContinue = readiness.canApprove && !hasUnsavedRequiredFailure

  async function save(code: string, result: Answer, note: string) {
    const previousResult = selectedResults[code]
    setSelectedResults((state) => ({ ...state, [code]: result }))
    setSavingCode(code)
    setError(null)
    try {
      await readinessApi.answer(orderId, code, {
        result,
        note: note.trim() || null,
      })
      setDrafts((state) => {
        const next = { ...state }
        delete next[code]
        return next
      })
      toast.success(fb.readinessSaved)
      query.reload()
    } catch (cause) {
      setSelectedResults((state) => {
        const next = { ...state }
        if (previousResult) next[code] = previousResult
        else delete next[code]
        return next
      })
      const failure =
        cause instanceof ApiError || cause instanceof Error
          ? cause.message
          : t.saveFailed
      setError(failure)
      toast.error(failure)
    } finally {
      setSavingCode(null)
    }
  }

  const failedRequired = readiness.criteria.filter((criterion) => {
    const effectiveResult =
      drafts[criterion.code]?.result ??
      selectedResults[criterion.code] ??
      criterion.result
    return effectiveResult === 'FAIL'
  })
  const failedReasonsComplete = failedRequired.every((criterion) =>
    Boolean(
      drafts[criterion.code]?.note.trim() ||
      criterion.note?.trim() ||
      criterion.reason?.trim(),
    ),
  )

  async function submitFailedDecision(
    decision: FailureAction,
    supplements: SupplementRequest[] = [],
  ) {
    if (!failedReasonsComplete) {
      setError(t.reasonRequired)
      return
    }
    const reason = failedRequired
      .map((criterion) => {
        const note =
          drafts[criterion.code]?.note.trim() ||
          criterion.note?.trim() ||
          criterion.reason?.trim()
        return note ? `${criterion.title}: ${note}` : criterion.title
      })
      .join('; ')
    if (!reason) return
    if (decision === 'NEED_INFO' && supplements.length === 0) {
      setError(t.chooseSupplement)
      return
    }
    const supplementReason = supplements.length
      ? t.customerSupplement(supplements.map((item) => item.label).join('; '))
      : ''
    const requestedUpdateScope = supplements.some(
      (item) => item.scope === 'LOCATION',
    )
      ? 'LOCATION'
      : 'ADDITIONAL_INFORMATION'
    setSavingCode('decision')
    setError(null)
    try {
      await Promise.all(
        failedRequired
          .filter((criterion) => drafts[criterion.code]?.result === 'FAIL')
          .map((criterion) =>
            readinessApi.answer(orderId, criterion.code, {
              result: 'FAIL',
              note: drafts[criterion.code].note.trim(),
            }),
          ),
      )
      await ordersApi.submitApproval(orderId, {
        decision,
        reason: [reason, supplementReason].filter(Boolean).join('. '),
        ...(decision === 'NEED_INFO' ? { requestedUpdateScope } : {}),
      })
      toast.success(
        decision === 'REJECTED' ? fb.orderRejected : fb.infoRequested,
      )
      onDecisionDone?.()
    } catch (cause) {
      const failure = cause instanceof Error ? cause.message : t.submitFailed
      setError(failure)
      toast.error(failure)
      setSavingCode(null)
    }
  }

  function choose(criterion: ReadinessCriterion, result: Answer) {
    const note = drafts[criterion.code]?.note ?? criterion.note ?? ''
    if (result === 'FAIL') {
      // A failing answer needs a reason first.
      setDrafts((state) => ({ ...state, [criterion.code]: { result, note } }))
      return
    }
    void save(criterion.code, result, note)
  }

  return (
    <section
      className="odm-or-card odm-or-readiness"
      aria-label={t.approvalCriteria}
    >
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="check" size={18} />
          {t.approvalCriteria}
        </span>
        <div className="odm-or-readiness-head-actions">
          <span
            className={`odm-or-readiness-verdict is-${canContinue ? 'ok' : 'blocked'}`}
            role="status"
          >
            {hasUnsavedRequiredFailure
              ? t.requiredFailed
              : readiness.canApprove
                ? recommendationText[readiness.recommendation]
                : pendingRequired > 0
                  ? t.pendingManager(pendingRequired)
                  : recommendationText[readiness.recommendation]}
          </span>
        </div>
      </header>
      <div className="odm-or-readiness-body">
        <ReadinessSummary autoPassed={autoPassed} auto={auto} />
        <div className="odm-or-readiness-col">
          <h3>
            {t.managerConfirm}
            <span className="odm-or-readiness-count">
              {manualAnswered}/{manual.length} {t.confirmedCount}
            </span>
          </h3>
          <ul className="odm-or-readiness-list">
            {manual.map((c) => {
              const options =
                c.code === 'RISK_LEVEL' ? riskLevelOptions : answerOptions
              const draft = drafts[c.code]
              const current =
                draft?.result ??
                selectedResults[c.code] ??
                (c.result === 'PENDING' ? null : c.result)
              const note = draft?.note ?? c.note ?? ''
              const needsNote = draft?.result === 'FAIL'
              return (
                <ReadinessCriterionRow
                  key={c.code}
                  current={current}
                  c={c}
                  draft={draft}
                  needsNote={needsNote}
                  note={note}
                  editable={editable}
                  setDrafts={setDrafts}
                  savingCode={savingCode}
                  save={save}
                  options={options}
                  choose={choose}
                />
              )
            })}
          </ul>
        </div>
      </div>
      {error ? (
        <p className="odm-or-readiness-error" role="alert">
          {error}
        </p>
      ) : null}
      {failedRequired.length > 0 ||
      (!canContinue && readiness.blockingReasons.length > 0) ? (
        <ReadinessBlockingNotice
          readiness={readiness}
          failedRequired={failedRequired}
          editable={editable}
          savingCode={savingCode}
          submitFailedDecision={submitFailedDecision}
          actionsHost={actionsHost}
        />
      ) : null}
    </section>
  )
}
