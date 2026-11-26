import { useState } from 'react'
import {
  ArrowRightOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import { Alert, Button, Input, InputNumber, Select } from 'antd'

import { useI18n } from '../../../shared/i18n'
import { maintenanceWorkflowApi } from '../api/maintenanceWorkflowApi'
import { maintenanceWorkflowMessages } from '../messages'
import type {
  MaintenanceWorkActionType,
  MaintenanceWorkStatus,
  MaintenanceWorkflowDetail,
} from '../types'

const { TextArea } = Input

const ACTION_TYPES: MaintenanceWorkActionType[] = [
  'INSPECT',
  'CLEAN',
  'CALIBRATE',
  'REPAIR',
  'REPLACE',
  'FIRMWARE_UPDATE',
]

const WORK_STATUSES: MaintenanceWorkStatus[] = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'BLOCKED',
]

export function WorkAndPartsSection({
  detail,
  onUpdated,
  onNextTab,
}: {
  detail: MaintenanceWorkflowDetail
  onUpdated: (next: MaintenanceWorkflowDetail) => void
  onNextTab?: () => void
}) {
  const { t } = useI18n(maintenanceWorkflowMessages)
  const canStart = detail.availableActions.includes('START_WORK')
  const canWait = detail.availableActions.includes('WAIT_PARTS')
  const canResume = detail.availableActions.includes('RESUME_WORK')
  const canEdit = detail.availableActions.includes('EDIT_WORK_AND_PARTS')
  const canProceedToReport =
    detail.availableActions.includes('SAVE_REPORT_DRAFT') ||
    detail.availableActions.includes('SUBMIT_RETURN')

  const [waitingReason, setWaitingReason] = useState('')
  const [waitingParts, setWaitingParts] = useState('')

  const [componentArea, setComponentArea] = useState('')
  const [symptom, setSymptom] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [actionType, setActionType] =
    useState<MaintenanceWorkActionType>('INSPECT')
  const [workPerformed, setWorkPerformed] = useState('')
  const [workStatus, setWorkStatus] =
    useState<MaintenanceWorkStatus>('COMPLETED')

  const [partName, setPartName] = useState('')
  const [partNumber, setPartNumber] = useState('')
  const [oldSerial, setOldSerial] = useState('')
  const [newSerial, setNewSerial] = useState('')
  const [quantity, setQuantity] = useState<number>(1)
  const [unit, setUnit] = useState('pcs')
  const [replacementReason, setReplacementReason] = useState('')
  const [removedCondition, setRemovedCondition] = useState('')
  const [costAmount, setCostAmount] = useState<number | null>(null)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runAction(fn: () => Promise<MaintenanceWorkflowDetail>) {
    setBusy(true)
    setError(null)
    try {
      const updated = await fn()
      onUpdated(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : t.loadError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mw-stack">
      {error && <Alert type="error" showIcon message={error} />}

      {detail.waitingReason && (
        <Alert
          type="warning"
          showIcon
          message={`${t.work.waitingReason}: ${detail.waitingReason}`}
          description={`${t.work.waitingParts}: ${detail.waitingPartsNeeded ?? '-'}`}
        />
      )}

      {(canStart || canResume || canWait) && (
        <section
          className={`mw-spotlight ${canResume ? 'mw-spotlight--amber' : ''}`}
        >
          <div className="mw-spotlight-header">
            <h3 className="mw-spotlight-title">
              {canResume ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              <span>{t.tabs.workParts}</span>
            </h3>
          </div>
          <div className="mw-spotlight-body">
            {(canStart || canResume) && (
              <div className="mw-action-row">
                {canStart && (
                  <Button
                    type="primary"
                    loading={busy}
                    onClick={() =>
                      runAction(() =>
                        maintenanceWorkflowApi.startWork(detail.ticketId, {
                          expectedVersion: detail.version,
                        }),
                      )
                    }
                  >
                    {t.work.startWork}
                  </Button>
                )}
                {canResume && (
                  <Button
                    type="primary"
                    loading={busy}
                    onClick={() =>
                      runAction(() =>
                        maintenanceWorkflowApi.resumeWork(detail.ticketId, {
                          expectedVersion: detail.version,
                        }),
                      )
                    }
                  >
                    {t.work.resumeWork}
                  </Button>
                )}
              </div>
            )}

            {canWait && (
              <div className="mw-form-grid">
                <div className="mw-field">
                  <label className="mw-field-label">
                    {t.work.waitingReason}
                  </label>
                  <Input
                    placeholder={t.work.waitingReason}
                    value={waitingReason}
                    onChange={(e) => setWaitingReason(e.target.value)}
                  />
                </div>
                <div className="mw-field">
                  <label className="mw-field-label">
                    {t.work.waitingParts}
                  </label>
                  <Input
                    placeholder={t.work.waitingParts}
                    value={waitingParts}
                    onChange={(e) => setWaitingParts(e.target.value)}
                  />
                </div>
                <div className="mw-field mw-field--full">
                  <div className="mw-action-row">
                    <Button
                      loading={busy}
                      onClick={() => {
                        if (!waitingReason.trim() || !waitingParts.trim()) {
                          setError(
                            `${t.work.waitingReason} & ${t.work.waitingParts}`,
                          )
                          return
                        }
                        void runAction(() =>
                          maintenanceWorkflowApi.waitParts(detail.ticketId, {
                            expectedVersion: detail.version,
                            reason: waitingReason.trim(),
                            partsNeeded: waitingParts.trim(),
                          }),
                        )
                      }}
                    >
                      {t.work.pauseWaitingParts}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {canEdit && (
        <section className="mw-sheet">
          <div className="mw-sheet-header">
            <h3 className="mw-sheet-title">
              <ToolOutlined />
              <span>{t.work.addWorkItem}</span>
            </h3>
          </div>
          <div className="mw-sheet-body">
            <div className="mw-form-grid">
              <div className="mw-field mw-field--full">
                <label className="mw-field-label">
                  {t.work.componentArea}
                </label>
                <Input
                  placeholder={t.work.componentArea}
                  value={componentArea}
                  onChange={(e) => setComponentArea(e.target.value)}
                />
              </div>

              <div className="mw-field">
                <label className="mw-field-label">{t.work.actionType}</label>
                <Select
                  style={{ width: '100%' }}
                  value={actionType}
                  onChange={setActionType}
                  options={ACTION_TYPES.map((a) => ({
                    value: a,
                    label: t.workAction[a] ?? a,
                  }))}
                />
              </div>

              <div className="mw-field">
                <label className="mw-field-label">{t.work.status}</label>
                <Select
                  style={{ width: '100%' }}
                  value={workStatus}
                  onChange={setWorkStatus}
                  options={WORK_STATUSES.map((s) => ({
                    value: s,
                    label: t.workStatus[s] ?? s,
                  }))}
                />
              </div>

              <div className="mw-field">
                <label className="mw-field-label">{t.work.symptom}</label>
                <Input
                  placeholder={t.work.symptom}
                  value={symptom}
                  onChange={(e) => setSymptom(e.target.value)}
                />
              </div>

              <div className="mw-field">
                <label className="mw-field-label">{t.work.diagnosis}</label>
                <Input
                  placeholder={t.work.diagnosis}
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
              </div>

              <div className="mw-field mw-field--full">
                <label className="mw-field-label">
                  {t.work.workPerformed}
                </label>
                <TextArea
                  rows={2}
                  placeholder={t.work.workPerformed}
                  value={workPerformed}
                  onChange={(e) => setWorkPerformed(e.target.value)}
                />
              </div>
            </div>

            <div className="mw-action-row">
              <Button
                type="primary"
                loading={busy}
                onClick={() => {
                  if (!componentArea.trim()) {
                    setError(t.work.componentArea)
                    return
                  }
                  void runAction(async () => {
                    const res = await maintenanceWorkflowApi.addWorkItem(
                      detail.ticketId,
                      {
                        expectedVersion: detail.version,
                        componentArea: componentArea.trim(),
                        symptom: symptom.trim() || undefined,
                        diagnosis: diagnosis.trim() || undefined,
                        actionType,
                        workPerformed: workPerformed.trim() || undefined,
                        status: workStatus,
                      },
                    )
                    setComponentArea('')
                    setSymptom('')
                    setDiagnosis('')
                    setWorkPerformed('')
                    return res
                  })
                }}
              >
                {t.work.addWorkItem}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Recorded Work Items */}
      <section className="mw-sheet">
        <div className="mw-sheet-header">
          <h3 className="mw-sheet-title">{t.tabs.workParts}</h3>
          <span className="mw-sheet-count">{detail.workItems.length}</span>
        </div>
        <div className="mw-sheet-body">
          {detail.workItems.length === 0 ? (
            <div className="mw-empty-state">{t.evidence.empty}</div>
          ) : (
            <div className="mw-ledger-list">
              {detail.workItems.map((item) => (
                <article key={item.id} className="mw-ledger-item">
                  <div className="mw-ledger-top">
                    <div className="mw-ledger-badges">
                      <span className="mw-chip mw-chip--mono">
                        {t.roundShort(item.roundNumber)}
                      </span>
                      <span className="mw-chip mw-chip--cobalt">
                        {t.workAction[item.actionType] ?? item.actionType}
                      </span>
                      <span
                        className={`mw-chip ${
                          item.status === 'COMPLETED'
                            ? 'mw-chip--emerald'
                            : item.status === 'BLOCKED'
                              ? 'mw-chip--crimson'
                              : 'mw-chip--amber'
                        }`}
                      >
                        {t.workStatus[item.status] ?? item.status}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                    {item.componentArea}
                  </div>
                  {item.diagnosis && (
                    <div className="mw-note-text">
                      {t.work.diagnosis}: {item.diagnosis}
                    </div>
                  )}
                  {item.workPerformed && (
                    <div className="mw-note-text">{item.workPerformed}</div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {canEdit && (
        <section className="mw-sheet">
          <div className="mw-sheet-header">
            <h3 className="mw-sheet-title">{t.work.addPart}</h3>
          </div>
          <div className="mw-sheet-body">
            <div className="mw-form-grid">
              <div className="mw-field">
                <label className="mw-field-label">{t.work.partName}</label>
                <Input
                  placeholder={t.work.partName}
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                />
              </div>

              <div className="mw-field">
                <label className="mw-field-label">{t.work.partNumber}</label>
                <Input
                  placeholder={t.work.partNumber}
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                />
              </div>

              <div className="mw-field">
                <label className="mw-field-label">{t.work.quantity}</label>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0.001}
                  value={quantity}
                  onChange={(v) => setQuantity(Number(v) || 1)}
                />
              </div>

              <div className="mw-field">
                <label className="mw-field-label">{t.work.unit}</label>
                <Input
                  placeholder={t.work.unit}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>

              <div className="mw-field">
                <label className="mw-field-label">{t.work.oldSerial}</label>
                <Input
                  placeholder={t.work.oldSerial}
                  value={oldSerial}
                  onChange={(e) => setOldSerial(e.target.value)}
                />
              </div>

              <div className="mw-field">
                <label className="mw-field-label">{t.work.newSerial}</label>
                <Input
                  placeholder={t.work.newSerial}
                  value={newSerial}
                  onChange={(e) => setNewSerial(e.target.value)}
                />
              </div>

              <div className="mw-field">
                <label className="mw-field-label">
                  {t.work.replacementReason}
                </label>
                <Input
                  placeholder={t.work.replacementReason}
                  value={replacementReason}
                  onChange={(e) => setReplacementReason(e.target.value)}
                />
              </div>

              <div className="mw-field">
                <label className="mw-field-label">{t.work.costAmount}</label>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder={t.work.costAmount}
                  value={costAmount}
                  onChange={(v) => setCostAmount(v == null ? null : Number(v))}
                />
              </div>

              <div className="mw-field mw-field--full">
                <label className="mw-field-label">
                  {t.work.removedCondition}
                </label>
                <Input
                  placeholder={t.work.removedCondition}
                  value={removedCondition}
                  onChange={(e) => setRemovedCondition(e.target.value)}
                />
              </div>
            </div>

            <div className="mw-action-row">
              <Button
                loading={busy}
                onClick={() => {
                  if (!partName.trim() || !replacementReason.trim()) {
                    setError(`${t.work.partName} & ${t.work.replacementReason}`)
                    return
                  }
                  void runAction(async () => {
                    const res = await maintenanceWorkflowApi.addPartReplacement(
                      detail.ticketId,
                      {
                        expectedVersion: detail.version,
                        partName: partName.trim(),
                        partNumber: partNumber.trim() || undefined,
                        oldSerial: oldSerial.trim() || undefined,
                        newSerial: newSerial.trim() || undefined,
                        quantity,
                        unit: unit.trim() || 'pcs',
                        replacementReason: replacementReason.trim(),
                        removedPartCondition:
                          removedCondition.trim() || undefined,
                        costAmount: costAmount ?? undefined,
                      },
                    )
                    setPartName('')
                    setPartNumber('')
                    setOldSerial('')
                    setNewSerial('')
                    setReplacementReason('')
                    setRemovedCondition('')
                    setCostAmount(null)
                    return res
                  })
                }}
              >
                {t.work.addPart}
              </Button>
            </div>
          </div>
        </section>
      )}

      {detail.partReplacements.length > 0 && (
        <section className="mw-sheet">
          <div className="mw-sheet-header">
            <h3 className="mw-sheet-title">{t.work.addPart}</h3>
            <span className="mw-sheet-count">
              {detail.partReplacements.length}
            </span>
          </div>
          <div className="mw-sheet-body">
            <div className="mw-ledger-list">
              {detail.partReplacements.map((part) => (
                <article key={part.id} className="mw-ledger-item">
                  <div className="mw-ledger-top">
                    <div className="mw-ledger-badges">
                      <span className="mw-chip mw-chip--mono">
                        {t.roundShort(part.roundNumber)}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 13.5 }}>
                        {part.partName}
                      </span>
                    </div>
                    <span className="mw-accessory-qty">
                      ×{part.quantity} {part.unit}
                    </span>
                  </div>
                  <div className="mw-note-text">{part.replacementReason}</div>
                  {(part.oldSerial || part.newSerial) && (
                    <div className="mw-route-strip">
                      <span className="mw-chip mw-chip--mono">
                        {part.oldSerial ?? '—'}
                      </span>
                      <span className="mw-route-arrow">──▶</span>
                      <span className="mw-chip mw-chip--mono">
                        {part.newSerial ?? '—'}
                      </span>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
      {canProceedToReport && onNextTab && (
        <section className="mw-spotlight">
          <div className="mw-spotlight-body">
            <div className="mw-pool-banner">
              <div className="mw-pool-copy">
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                  {t.meta.nextToReportTitle}
                </div>
                <p className="mw-pool-hint">{t.meta.nextToReportHint}</p>
              </div>
              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                iconPosition="end"
                onClick={onNextTab}
              >
                {t.meta.nextToReportBtn}
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
