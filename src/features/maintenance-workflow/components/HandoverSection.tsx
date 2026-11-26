import { useState } from 'react'
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  LockOutlined,
  SwapOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { Alert, Button, Input, Modal, Select } from 'antd'

import { useI18n } from '../../../shared/i18n'
import {
  maintenanceWorkflowApi,
  type HandoverAccessoryInput,
} from '../api/maintenanceWorkflowApi'
import { maintenanceWorkflowMessages } from '../messages'
import type {
  MaintenanceWorkflowDetail,
  QualifiedTechnicalOption,
} from '../types'

const { TextArea } = Input

function parseAccessories(raw: string): HandoverAccessoryInput[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, qtyRaw, condition] = line.split('|').map((s) => s.trim())
      const qty = Math.max(1, Number.parseInt(qtyRaw || '1', 10) || 1)
      return {
        itemName: name || line,
        expectedQuantity: qty,
        conditionNote: condition || undefined,
      }
    })
}

export function HandoverSection({
  detail,
  technicals,
  onUpdated,
  onNextTab,
}: {
  detail: MaintenanceWorkflowDetail
  technicals: QualifiedTechnicalOption[]
  onUpdated: (next: MaintenanceWorkflowDetail) => void
  onNextTab?: () => void
}) {
  const { t } = useI18n(maintenanceWorkflowMessages)
  const latestInbound = detail.handovers.find((h) => h.direction === 'INBOUND')
  const canEditInbound = detail.availableActions.includes('SAVE_INBOUND_DRAFT')
  const canSubmitInbound = detail.availableActions.includes(
    'SUBMIT_INBOUND_HANDOVER',
  )
  const canReceive = detail.availableActions.includes('CONFIRM_RECEIPT')
  const canClaim = detail.availableActions.includes('CLAIM_TICKET')
  const canRelease = detail.availableActions.includes('RELEASE_TICKET')
  const canProceedToWork =
    detail.availableActions.includes('START_WORK') ||
    detail.availableActions.includes('EDIT_WORK_AND_PARTS')
  const [releaseReason, setReleaseReason] = useState('')

  const [technicalUserId, setTechnicalUserId] = useState(
    detail.assignedTechnical?.id ?? latestInbound?.toUser?.id ?? '',
  )
  const [reason, setReason] = useState(
    latestInbound?.maintenanceReason ?? detail.description ?? '',
  )
  const [condition, setCondition] = useState(
    latestInbound?.overallCondition ?? '',
  )
  const [damageNotes, setDamageNotes] = useState(
    latestInbound?.existingDamageNotes ?? '',
  )
  const [accessoriesText, setAccessoriesText] = useState(
    latestInbound?.items
      .map(
        (i) =>
          `${i.itemName} | ${i.expectedQuantity} | ${i.conditionNote ?? ''}`,
      )
      .join('\n') ?? 'Pin bay | 2 | Nguyên vẹn\nBộ điều khiển | 1 | Bình thường',
  )
  const [discrepancyNotes, setDiscrepancyNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSaveDraft() {
    if (!reason.trim() || !condition.trim()) {
      setError(`${t.handover.reason} / ${t.handover.condition}`)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const updated = await maintenanceWorkflowApi.saveInboundDraft(
        detail.ticketId,
        {
          expectedVersion: detail.version,
          technicalUserId: technicalUserId || undefined,
          maintenanceReason: reason.trim(),
          overallCondition: condition.trim(),
          existingDamageNotes: damageNotes.trim() || undefined,
          accessories: parseAccessories(accessoriesText),
        },
      )
      onUpdated(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : t.loadError)
    } finally {
      setBusy(false)
    }
  }

  function handleSubmitInbound() {
    Modal.confirm({
      title: t.handover.submitInbound,
      content: t.handover.submitInboundConfirm,
      onOk: async () => {
        setBusy(true)
        setError(null)
        try {
          const updated = await maintenanceWorkflowApi.submitInboundHandover(
            detail.ticketId,
            {
              expectedVersion: detail.version,
              idempotencyKey: `inbound-${detail.ticketId}-v${detail.version}`,
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

  async function runAction(action: () => Promise<MaintenanceWorkflowDetail>) {
    setBusy(true)
    setError(null)
    try {
      onUpdated(await action())
    } catch (e) {
      setError(e instanceof Error ? e.message : t.loadError)
    } finally {
      setBusy(false)
    }
  }

  function handleClaim() {
    void runAction(() =>
      maintenanceWorkflowApi.claimTicket(detail.ticketId, {
        expectedVersion: detail.version,
      }),
    )
  }

  function handleRelease() {
    if (!releaseReason.trim()) {
      setError(t.handover.releaseReason)
      return
    }
    void runAction(() =>
      maintenanceWorkflowApi.releaseTicket(detail.ticketId, {
        expectedVersion: detail.version,
        reason: releaseReason.trim(),
      }),
    )
  }

  async function handleReceipt(accepted: boolean, hasDiscrepancy: boolean) {
    if (accepted && hasDiscrepancy && !discrepancyNotes.trim()) {
      setError(t.handover.discrepancyNotes)
      return
    }
    if (!accepted && !rejectionReason.trim()) {
      setError(t.handover.rejectionReason)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const updated = await maintenanceWorkflowApi.receiveHandover(
        detail.ticketId,
        {
          expectedVersion: detail.version,
          accepted,
          hasDiscrepancy,
          discrepancyNotes: hasDiscrepancy ? discrepancyNotes.trim() : undefined,
          rejectionReason: !accepted ? rejectionReason.trim() : undefined,
          idempotencyKey: `receipt-${detail.ticketId}-v${detail.version}-${accepted}-${hasDiscrepancy}`,
        },
      )
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

      {canClaim && (
        <section className="mw-spotlight mw-spotlight--amber">
          <div className="mw-spotlight-header">
            <h3 className="mw-spotlight-title">
              <ThunderboltOutlined />
              <span>{t.handover.poolTitle}</span>
            </h3>
            <span className="mw-chip mw-chip--amber">
              {t.severity[detail.severity] ?? detail.severity}
            </span>
          </div>
          <div className="mw-spotlight-body">
            <div className="mw-pool-banner">
              <div className="mw-pool-copy">
                <p className="mw-pool-hint">{t.handover.poolHint}</p>
              </div>
              <Button
                type="primary"
                size="large"
                loading={busy}
                onClick={handleClaim}
              >
                {t.handover.claim}
              </Button>
            </div>
          </div>
        </section>
      )}

      {canEditInbound && (
        <section className="mw-spotlight">
          <div className="mw-spotlight-header">
            <h3 className="mw-spotlight-title">
              <SwapOutlined />
              <span>{t.handover.inboundTitle}</span>
            </h3>
          </div>
          <div className="mw-spotlight-body">
            <div className="mw-form-grid">
              <div className="mw-field mw-field--full">
                <label className="mw-field-label">
                  {t.handover.selectTechnical}
                </label>
                <Select
                  style={{ width: '100%' }}
                  placeholder={t.handover.selectTechnical}
                  value={technicalUserId || undefined}
                  onChange={(value) => setTechnicalUserId(value ?? '')}
                  allowClear
                  options={technicals.map((tech) => ({
                    value: tech.id,
                    label: `${tech.fullName} (${tech.email}) — ${tech.qualificationSource}`,
                  }))}
                />
              </div>

              <div className="mw-field">
                <label className="mw-field-label">{t.handover.reason}</label>
                <Input
                  placeholder={t.handover.reason}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="mw-field">
                <label className="mw-field-label">{t.handover.condition}</label>
                <Input
                  placeholder={t.handover.condition}
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                />
              </div>

              <div className="mw-field mw-field--full">
                <label className="mw-field-label">
                  {t.handover.damageNotes}
                </label>
                <TextArea
                  rows={2}
                  placeholder={t.handover.damageNotes}
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                />
              </div>

              <div className="mw-field mw-field--full">
                <label className="mw-field-label">
                  {t.handover.accessories}
                </label>
                <TextArea
                  rows={3}
                  placeholder={t.handover.accessories}
                  value={accessoriesText}
                  onChange={(e) => setAccessoriesText(e.target.value)}
                />
              </div>
            </div>

            <div className="mw-action-row">
              <Button loading={busy} onClick={handleSaveDraft}>
                {t.handover.saveDraft}
              </Button>
              {canSubmitInbound && (
                <Button
                  type="primary"
                  loading={busy}
                  disabled={!latestInbound || latestInbound.locked}
                  onClick={handleSubmitInbound}
                >
                  {t.handover.submitInbound}
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {canReceive && (
        <section className="mw-spotlight mw-spotlight--emerald">
          <div className="mw-spotlight-header">
            <h3 className="mw-spotlight-title">
              <CheckCircleOutlined />
              <span>{t.handover.receiptTitle}</span>
            </h3>
          </div>
          <div className="mw-spotlight-body">
            <div className="mw-form-grid">
              <div className="mw-field">
                <label className="mw-field-label">
                  {t.handover.discrepancyNotes}
                </label>
                <TextArea
                  rows={2}
                  placeholder={t.handover.discrepancyNotes}
                  value={discrepancyNotes}
                  onChange={(e) => setDiscrepancyNotes(e.target.value)}
                />
              </div>
              <div className="mw-field">
                <label className="mw-field-label">
                  {t.handover.rejectionReason}
                </label>
                <TextArea
                  rows={2}
                  placeholder={t.handover.rejectionReason}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>

            <div className="mw-action-row">
              <Button
                type="primary"
                loading={busy}
                onClick={() => handleReceipt(true, false)}
              >
                {t.handover.confirmFull}
              </Button>
              <Button loading={busy} onClick={() => handleReceipt(true, true)}>
                {t.handover.confirmDiscrepancy}
              </Button>
              <Button
                danger
                loading={busy}
                onClick={() => handleReceipt(false, false)}
              >
                {t.handover.rejectReceipt}
              </Button>
            </div>

            {canRelease && (
              <div
                style={{
                  marginTop: 8,
                  paddingTop: 12,
                  borderTop: '1px dashed var(--mw-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <label className="mw-field-label">
                  {t.handover.releaseReason}
                </label>
                <TextArea
                  rows={2}
                  placeholder={t.handover.releaseReason}
                  value={releaseReason}
                  onChange={(e) => setReleaseReason(e.target.value)}
                />
                <div className="mw-action-row">
                  <Button loading={busy} onClick={handleRelease}>
                    {t.handover.release}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {canProceedToWork && onNextTab && (
        <section className="mw-spotlight mw-spotlight--emerald">
          <div className="mw-spotlight-body">
            <div className="mw-pool-banner">
              <div className="mw-pool-copy">
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                  {t.meta.nextToWorkTitle}
                </div>
                <p className="mw-pool-hint">{t.meta.nextToWorkHint}</p>
              </div>
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                iconPosition="end"
                onClick={onNextTab}
              >
                {t.meta.nextToWorkBtn}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Handover Ledger */}
      <section className="mw-sheet">
        <div className="mw-sheet-header">
          <h3 className="mw-sheet-title">{t.handover.compareTitle}</h3>
          <span className="mw-sheet-count">{detail.handovers.length}</span>
        </div>
        <div className="mw-sheet-body">
          {detail.handovers.length === 0 ? (
            <div className="mw-empty-state">{t.evidence.empty}</div>
          ) : (
            <div className="mw-ledger-list">
              {detail.handovers.map((h) => (
                <article key={h.id} className="mw-ledger-item">
                  <div className="mw-ledger-top">
                    <div className="mw-ledger-badges">
                      <span
                        className={`mw-chip ${
                          h.direction === 'INBOUND'
                            ? 'mw-chip--cobalt'
                            : 'mw-chip--violet'
                        }`}
                      >
                        {h.direction === 'INBOUND'
                          ? t.handover.directionInbound
                          : t.handover.directionReturn}
                      </span>
                      <span className="mw-chip">
                        {t.handoverStatus[h.status] ?? h.status}
                      </span>
                      <span className="mw-chip mw-chip--mono">
                        {t.roundShort(h.roundNumber)} · {t.revShort(h.revision)}
                      </span>
                    </div>
                    {h.locked && (
                      <span className="mw-chip">
                        <LockOutlined />
                        <span>{t.locked}</span>
                      </span>
                    )}
                  </div>

                  <div className="mw-route-strip">
                    <span className="mw-route-actor">
                      {h.fromUser?.fullName ?? '—'}
                    </span>
                    <span className="mw-route-arrow">──▶</span>
                    <span className="mw-route-actor">
                      {h.toUser?.fullName ?? t.meta.waitingAssignee}
                    </span>
                  </div>

                  {h.maintenanceReason && (
                    <div className="mw-note-text">{h.maintenanceReason}</div>
                  )}
                  {h.overallCondition &&
                    h.overallCondition !== h.maintenanceReason && (
                      <div className="mw-note-text">{h.overallCondition}</div>
                    )}

                  {h.discrepancyNotes && (
                    <Alert
                      type="warning"
                      showIcon
                      message={h.discrepancyNotes}
                    />
                  )}
                  {h.rejectionReason && (
                    <Alert
                      type="error"
                      showIcon
                      message={h.rejectionReason}
                    />
                  )}

                  {h.items.length > 0 && (
                    <div className="mw-accessories-list">
                      {h.items.map((item) => (
                        <div key={item.id} className="mw-accessory-row">
                          <span>
                            {item.itemName}
                            {item.conditionNote
                              ? ` — ${item.conditionNote}`
                              : ''}
                          </span>
                          <span className="mw-accessory-qty">
                            ×{item.expectedQuantity}
                            {item.receivedQuantity != null
                              ? ` (nhận: ${item.receivedQuantity})`
                              : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
