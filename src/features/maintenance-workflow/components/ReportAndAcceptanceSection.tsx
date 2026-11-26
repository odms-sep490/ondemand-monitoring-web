import { useState } from 'react'
import {
  AuditOutlined,
  FileTextOutlined,
  LockOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { Alert, Button, Checkbox, Input, Modal, Select } from 'antd'

import { useI18n } from '../../../shared/i18n'
import {
  maintenanceWorkflowApi,
  type PostCheckInput,
} from '../api/maintenanceWorkflowApi'
import { maintenanceWorkflowMessages } from '../messages'
import type {
  ActorSummary,
  MaintenanceWorkflowDetail,
  PostCheckResult,
} from '../types'

const { TextArea } = Input

const DEFAULT_CHECKS: PostCheckInput[] = [
  {
    checkName: 'Kiểm tra khung vỏ, cánh quạt & ốc siết',
    checkMethod: 'Kiểm tra vật lý trực tiếp tại xưởng',
    result: 'PASS',
    required: true,
    evidenceRequired: false,
  },
  {
    checkName: 'Kiểm tra nguồn, cảm biến & gimbal trên bàn thử',
    checkMethod: 'Cấp nguồn & hiệu chỉnh thực tế (không yêu cầu mô phỏng)',
    result: 'PASS',
    required: true,
    evidenceRequired: false,
  },
]

export function ReportAndAcceptanceSection({
  detail,
  managers,
  onUpdated,
}: {
  detail: MaintenanceWorkflowDetail
  managers: ActorSummary[]
  onUpdated: (next: MaintenanceWorkflowDetail) => void
}) {
  const { t } = useI18n(maintenanceWorkflowMessages)
  const latestReport = detail.reportVersions[0]
  const canSaveReport = detail.availableActions.includes('SAVE_REPORT_DRAFT')
  const canSubmitReturn = detail.availableActions.includes('SUBMIT_RETURN')
  const canAccept = detail.availableActions.includes('ACCEPT_RETURN')
  const canRework = detail.availableActions.includes('REQUEST_REWORK')

  const [receivedCondition, setReceivedCondition] = useState(
    latestReport?.receivedConditionSummary ?? '',
  )
  const [faultDiagnosis, setFaultDiagnosis] = useState(
    latestReport?.faultDiagnosisSummary ?? '',
  )
  const [workSummary, setWorkSummary] = useState(
    latestReport?.workSummary ?? '',
  )
  const [partsSummary, setPartsSummary] = useState(
    latestReport?.partsSummary ?? '',
  )
  const [remainingIssues, setRemainingIssues] = useState(
    latestReport?.remainingIssues ?? '',
  )
  const [usageLimitations, setUsageLimitations] = useState(
    latestReport?.usageLimitations ?? '',
  )
  const [recommendations, setRecommendations] = useState(
    latestReport?.followUpRecommendations ?? '',
  )
  const [postChecks, setPostChecks] = useState<PostCheckInput[]>(
    latestReport?.postChecks.length
      ? latestReport.postChecks.map((c) => ({
          checkName: c.checkName,
          checkMethod: c.checkMethod,
          result: c.result,
          notes: c.notes ?? undefined,
          notApplicableReason: c.notApplicableReason ?? undefined,
          required: c.required,
          evidenceRequired: c.evidenceRequired,
          evidenceIds: c.evidenceIds,
        }))
      : DEFAULT_CHECKS,
  )

  const [managerUserId, setManagerUserId] = useState(
    detail.receivingManager?.id ?? managers[0]?.id ?? '',
  )
  const [postCondition, setPostCondition] = useState(
    'Đã hoàn tất bảo trì, sẵn sàng kiểm tra nghiệm thu',
  )
  const [unfinishedNotes, setUnfinishedNotes] = useState('')

  const [deviceMatch, setDeviceMatch] = useState(false)
  const [accessoriesMatch, setAccessoriesMatch] = useState(false)
  const [verificationNotes, setVerificationNotes] = useState('')
  const [reworkReason, setReworkReason] = useState('')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSaveReport() {
    setBusy(true)
    setError(null)
    try {
      const updated = await maintenanceWorkflowApi.saveReportDraft(
        detail.ticketId,
        {
          expectedVersion: detail.version,
          receivedConditionSummary: receivedCondition.trim(),
          faultDiagnosisSummary: faultDiagnosis.trim(),
          workSummary: workSummary.trim(),
          partsSummary: partsSummary.trim() || undefined,
          remainingIssues: remainingIssues.trim() || undefined,
          usageLimitations: usageLimitations.trim() || undefined,
          followUpRecommendations: recommendations.trim() || undefined,
          postChecks,
        },
      )
      onUpdated(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : t.loadError)
    } finally {
      setBusy(false)
    }
  }

  function handleSubmitReturn() {
    if (!managerUserId || !postCondition.trim()) {
      setError(`${t.report.selectManager} & ${t.report.postCondition}`)
      return
    }
    Modal.confirm({
      title: t.report.submitReturnBtn,
      content: t.report.submitReturnConfirm,
      onOk: async () => {
        setBusy(true)
        setError(null)
        try {
          const updated = await maintenanceWorkflowApi.submitReturn(
            detail.ticketId,
            {
              expectedVersion: detail.version,
              managerUserId,
              postMaintenanceCondition: postCondition.trim(),
              unfinishedWorkNotes: unfinishedNotes.trim() || undefined,
              idempotencyKey: `return-${detail.ticketId}-r${detail.currentRound}-v${detail.version}`,
            },
          )
          onUpdated(updated)
        } catch (e) {
          setError(e instanceof Error ? e.message : t.loadError)
        } finally {
          setBusy(false)
        }
      },
    })
  }

  function handleAcceptReturn() {
    if (!latestReport) return
    if (!deviceMatch || !accessoriesMatch) {
      setError(`${t.acceptance.deviceMatch} & ${t.acceptance.accessoriesMatch}`)
      return
    }
    Modal.confirm({
      title: t.acceptance.acceptBtn,
      content: t.acceptance.acceptConfirm,
      onOk: async () => {
        setBusy(true)
        setError(null)
        try {
          const updated = await maintenanceWorkflowApi.acceptReturn(
            detail.ticketId,
            {
              expectedVersion: detail.version,
              reportRevision: latestReport.revision,
              deviceMatchConfirmed: deviceMatch,
              accessoriesMatchConfirmed: accessoriesMatch,
              verificationNotes: verificationNotes.trim() || undefined,
              idempotencyKey: `accept-${detail.ticketId}-rev${latestReport.revision}-v${detail.version}`,
            },
          )
          onUpdated(updated)
        } catch (e) {
          setError(e instanceof Error ? e.message : t.loadError)
        } finally {
          setBusy(false)
        }
      },
    })
  }

  function handleRequestRework() {
    if (!latestReport) return
    if (!reworkReason.trim()) {
      setError(t.acceptance.reworkReason)
      return
    }
    Modal.confirm({
      title: t.acceptance.reworkBtn,
      content: t.acceptance.reworkConfirm,
      onOk: async () => {
        setBusy(true)
        setError(null)
        try {
          const updated = await maintenanceWorkflowApi.requestRework(
            detail.ticketId,
            {
              expectedVersion: detail.version,
              reportRevision: latestReport.revision,
              reason: reworkReason.trim(),
              idempotencyKey: `rework-${detail.ticketId}-rev${latestReport.revision}-v${detail.version}`,
            },
          )
          onUpdated(updated)
        } catch (e) {
          setError(e instanceof Error ? e.message : t.loadError)
        } finally {
          setBusy(false)
        }
      },
    })
  }

  return (
    <div className="mw-stack">
      {error && <Alert type="error" showIcon message={error} />}

      {detail.validationBlockers.length > 0 && canSubmitReturn && (
        <Alert
          type="warning"
          showIcon
          message={t.report.blockersTitle}
          description={
            <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
              {detail.validationBlockers.map((code) => (
                <li key={code}>{t.formatBlocker(code)}</li>
              ))}
            </ul>
          }
        />
      )}

      {(canAccept || canRework) && latestReport && (
        <section className="mw-spotlight mw-spotlight--emerald">
          <div className="mw-spotlight-header">
            <h3 className="mw-spotlight-title">
              <AuditOutlined />
              <span>
                {t.acceptance.title} (Rev {latestReport.revision})
              </span>
            </h3>
          </div>
          <div className="mw-spotlight-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Checkbox
                checked={deviceMatch}
                onChange={(e) => setDeviceMatch(e.target.checked)}
              >
                {t.acceptance.deviceMatch}
              </Checkbox>
              <Checkbox
                checked={accessoriesMatch}
                onChange={(e) => setAccessoriesMatch(e.target.checked)}
              >
                {t.acceptance.accessoriesMatch}
              </Checkbox>
            </div>

            <div className="mw-form-grid">
              <div className="mw-field">
                <label className="mw-field-label">
                  {t.acceptance.verificationNotes}
                </label>
                <TextArea
                  rows={2}
                  placeholder={t.acceptance.verificationNotes}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                />
              </div>
              <div className="mw-field">
                <label className="mw-field-label">
                  {t.acceptance.reworkReason}
                </label>
                <TextArea
                  rows={2}
                  placeholder={t.acceptance.reworkReason}
                  value={reworkReason}
                  onChange={(e) => setReworkReason(e.target.value)}
                />
              </div>
            </div>

            <div className="mw-action-row">
              {canAccept && (
                <Button
                  type="primary"
                  loading={busy}
                  onClick={handleAcceptReturn}
                >
                  {t.acceptance.acceptBtn}
                </Button>
              )}
              {canRework && (
                <Button danger loading={busy} onClick={handleRequestRework}>
                  {t.acceptance.reworkBtn}
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {canSaveReport && (
        <section className="mw-sheet">
          <div className="mw-sheet-header">
            <h3 className="mw-sheet-title">
              <FileTextOutlined />
              <span>{t.report.title}</span>
            </h3>
          </div>
          <div className="mw-sheet-body">
            <div className="mw-form-grid">
              <div className="mw-field">
                <label className="mw-field-label">
                  {t.report.receivedCondition}
                </label>
                <TextArea
                  rows={2}
                  placeholder={t.report.receivedCondition}
                  value={receivedCondition}
                  onChange={(e) => setReceivedCondition(e.target.value)}
                />
              </div>

              <div className="mw-field">
                <label className="mw-field-label">
                  {t.report.faultDiagnosis}
                </label>
                <TextArea
                  rows={2}
                  placeholder={t.report.faultDiagnosis}
                  value={faultDiagnosis}
                  onChange={(e) => setFaultDiagnosis(e.target.value)}
                />
              </div>

              <div className="mw-field mw-field--full">
                <label className="mw-field-label">{t.report.workSummary}</label>
                <TextArea
                  rows={2}
                  placeholder={t.report.workSummary}
                  value={workSummary}
                  onChange={(e) => setWorkSummary(e.target.value)}
                />
              </div>

              <div className="mw-field">
                <label className="mw-field-label">
                  {t.report.partsSummary}
                </label>
                <Input
                  placeholder={t.report.partsSummary}
                  value={partsSummary}
                  onChange={(e) => setPartsSummary(e.target.value)}
                />
              </div>

              <div className="mw-field">
                <label className="mw-field-label">
                  {t.report.remainingIssues}
                </label>
                <Input
                  placeholder={t.report.remainingIssues}
                  value={remainingIssues}
                  onChange={(e) => setRemainingIssues(e.target.value)}
                />
              </div>

              <div className="mw-field">
                <label className="mw-field-label">
                  {t.report.usageLimitations}
                </label>
                <Input
                  placeholder={t.report.usageLimitations}
                  value={usageLimitations}
                  onChange={(e) => setUsageLimitations(e.target.value)}
                />
              </div>

              <div className="mw-field">
                <label className="mw-field-label">
                  {t.report.recommendations}
                </label>
                <Input
                  placeholder={t.report.recommendations}
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: 4 }}>
              <div
                className="mw-field-label"
                style={{ fontWeight: 600, marginBottom: 8 }}
              >
                {t.report.postChecksTitle}
              </div>
              <div className="mw-ledger-list">
                {postChecks.map((check, idx) => (
                  <div key={idx} className="mw-check-card">
                    <div className="mw-form-grid">
                      <div className="mw-field mw-field--full">
                        <Input
                          placeholder={t.report.checkName}
                          value={check.checkName}
                          onChange={(e) => {
                            const next = [...postChecks]
                            next[idx] = { ...check, checkName: e.target.value }
                            setPostChecks(next)
                          }}
                        />
                      </div>
                      <div className="mw-field">
                        <Input
                          placeholder={t.report.checkMethod}
                          value={check.checkMethod}
                          onChange={(e) => {
                            const next = [...postChecks]
                            next[idx] = {
                              ...check,
                              checkMethod: e.target.value,
                            }
                            setPostChecks(next)
                          }}
                        />
                      </div>
                      <div className="mw-field">
                        <Select<PostCheckResult>
                          style={{ width: '100%' }}
                          value={check.result}
                          onChange={(val) => {
                            const next = [...postChecks]
                            next[idx] = { ...check, result: val }
                            setPostChecks(next)
                          }}
                          options={[
                            { value: 'PASS', label: t.postCheckResult.PASS },
                            { value: 'FAIL', label: t.postCheckResult.FAIL },
                            {
                              value: 'NOT_APPLICABLE',
                              label: t.postCheckResult.NOT_APPLICABLE,
                            },
                          ]}
                        />
                      </div>
                      {check.result === 'NOT_APPLICABLE' && (
                        <div className="mw-field mw-field--full">
                          <Input
                            placeholder={t.report.naReason}
                            value={check.notApplicableReason ?? ''}
                            onChange={(e) => {
                              const next = [...postChecks]
                              next[idx] = {
                                ...check,
                                notApplicableReason: e.target.value,
                              }
                              setPostChecks(next)
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mw-action-row">
              <Button
                onClick={() =>
                  setPostChecks([
                    ...postChecks,
                    {
                      checkName: '',
                      checkMethod: '',
                      result: 'PASS',
                      required: true,
                      evidenceRequired: false,
                    },
                  ])
                }
              >
                {t.report.addCheck}
              </Button>
              <Button type="primary" loading={busy} onClick={handleSaveReport}>
                {t.report.saveReportDraft}
              </Button>
            </div>
          </div>
        </section>
      )}

      {canSubmitReturn && (
        <section className="mw-spotlight">
          <div className="mw-spotlight-header">
            <h3 className="mw-spotlight-title">
              <SendOutlined />
              <span>{t.report.submitReturnTitle}</span>
            </h3>
          </div>
          <div className="mw-spotlight-body">
            <div className="mw-form-grid">
              <div className="mw-field mw-field--full">
                <label className="mw-field-label">
                  {t.report.selectManager}
                </label>
                <Select
                  style={{ width: '100%' }}
                  placeholder={t.report.selectManager}
                  value={managerUserId || undefined}
                  onChange={setManagerUserId}
                  options={managers.map((m) => ({
                    value: m.id,
                    label: `${m.fullName} (${m.email})`,
                  }))}
                />
              </div>
              <div className="mw-field">
                <label className="mw-field-label">
                  {t.report.postCondition}
                </label>
                <Input
                  placeholder={t.report.postCondition}
                  value={postCondition}
                  onChange={(e) => setPostCondition(e.target.value)}
                />
              </div>
              <div className="mw-field">
                <label className="mw-field-label">
                  {t.report.unfinishedNotes}
                </label>
                <Input
                  placeholder={t.report.unfinishedNotes}
                  value={unfinishedNotes}
                  onChange={(e) => setUnfinishedNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="mw-action-row">
              <Button
                type="primary"
                loading={busy}
                disabled={detail.validationBlockers.length > 0}
                onClick={handleSubmitReturn}
              >
                {t.report.submitReturnBtn}
              </Button>
            </div>
          </div>
        </section>
      )}

      {detail.reportVersions.length > 0 && (
        <section className="mw-sheet">
          <div className="mw-sheet-header">
            <h3 className="mw-sheet-title">{t.report.title}</h3>
            <span className="mw-sheet-count">
              {detail.reportVersions.length}
            </span>
          </div>
          <div className="mw-sheet-body">
            <div className="mw-ledger-list">
              {detail.reportVersions.map((rev) => (
                <article key={rev.id} className="mw-ledger-item">
                  <div className="mw-ledger-top">
                    <div className="mw-ledger-badges">
                      <span className="mw-chip mw-chip--cobalt mw-chip--mono">
                        {t.revShort(rev.revision)}
                      </span>
                      <span className="mw-chip mw-chip--mono">
                        {t.roundShort(rev.roundNumber)}
                      </span>
                      <span
                        className={`mw-chip ${
                          rev.status === 'ACCEPTED'
                            ? 'mw-chip--emerald'
                            : rev.status === 'REWORK_REQUIRED'
                              ? 'mw-chip--crimson'
                              : 'mw-chip--amber'
                        }`}
                      >
                        {t.reportStatus[rev.status] ?? rev.status}
                      </span>
                    </div>
                    {rev.locked && (
                      <span className="mw-chip">
                        <LockOutlined />
                        <span>{t.locked}</span>
                      </span>
                    )}
                  </div>

                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                    {rev.workSummary ?? '—'}
                  </div>

                  {rev.postChecks.length > 0 && (
                    <div className="mw-accessories-list">
                      {rev.postChecks.map((c) => (
                        <div key={c.id} className="mw-accessory-row">
                          <span>
                            {c.checkName}
                            {c.checkMethod ? ` — ${c.checkMethod}` : ''}
                            {c.notApplicableReason
                              ? ` (${c.notApplicableReason})`
                              : ''}
                          </span>
                          <span
                            className={`mw-chip ${
                              c.result === 'PASS'
                                ? 'mw-chip--emerald'
                                : c.result === 'FAIL'
                                  ? 'mw-chip--crimson'
                                  : ''
                            }`}
                          >
                            {t.postCheckResult[c.result] ?? c.result}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {detail.acceptanceDecisions.length > 0 && (
        <section className="mw-sheet">
          <div className="mw-sheet-header">
            <h3 className="mw-sheet-title">{t.acceptance.decisionsHistory}</h3>
            <span className="mw-sheet-count">
              {detail.acceptanceDecisions.length}
            </span>
          </div>
          <div className="mw-sheet-body">
            <div className="mw-ledger-list">
              {detail.acceptanceDecisions.map((d) => (
                <article key={d.id} className="mw-ledger-item">
                  <div className="mw-ledger-top">
                    <div className="mw-ledger-badges">
                      <span
                        className={`mw-chip ${
                          d.decision === 'ACCEPTED'
                            ? 'mw-chip--emerald'
                            : 'mw-chip--crimson'
                        }`}
                      >
                        {t.acceptanceDecision[d.decision] ?? d.decision}
                      </span>
                      <span className="mw-chip mw-chip--mono">
                        {t.roundShort(d.roundNumber)} ·{' '}
                        {t.revShort(d.reportRevision)}
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>
                        {d.decidedBy?.fullName ?? '—'}
                      </span>
                    </div>
                  </div>
                  {d.verificationNotes && (
                    <div className="mw-note-text">{d.verificationNotes}</div>
                  )}
                  {d.reworkReason && (
                    <Alert type="error" showIcon message={d.reworkReason} />
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
