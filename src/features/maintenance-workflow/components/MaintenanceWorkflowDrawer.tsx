import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CloseOutlined,
  FilePdfOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { Alert, Button, Modal, Skeleton } from 'antd'

import { useI18n } from '../../../shared/i18n'
import { maintenanceWorkflowApi } from '../api/maintenanceWorkflowApi'
import { maintenanceWorkflowMessages } from '../messages'
import type {
  ActorSummary,
  MaintenanceWorkflowDetail,
  MaintenanceWorkflowStage,
  QualifiedTechnicalOption,
} from '../types'
import { HandoverSection } from './HandoverSection'
import { ReportAndAcceptanceSection } from './ReportAndAcceptanceSection'
import { TimelineAndEvidenceSection } from './TimelineAndEvidenceSection'
import { WorkAndPartsSection } from './WorkAndPartsSection'
import './maintenance-workflow.css'

type TabKey = 'handover' | 'work' | 'report' | 'timeline'

function getStageTone(
  stage: MaintenanceWorkflowStage,
): 'cobalt' | 'amber' | 'emerald' | 'crimson' {
  switch (stage) {
    case 'COMPLETED':
      return 'emerald'
    case 'RECEIPT_REJECTED':
    case 'CANCELLED':
      return 'crimson'
    case 'AWAITING_TECHNICAL_RECEIPT':
    case 'WAITING_PARTS':
    case 'REWORK_REQUIRED':
    case 'AWAITING_MANAGER_ACCEPTANCE':
      return 'amber'
    default:
      return 'cobalt'
  }
}

function getDefaultTab(stage: MaintenanceWorkflowStage): TabKey {
  if (stage === 'AWAITING_MANAGER_ACCEPTANCE' || stage === 'COMPLETED') {
    return 'report'
  }
  if (
    stage === 'IN_MAINTENANCE' ||
    stage === 'WAITING_PARTS' ||
    stage === 'REWORK_REQUIRED'
  ) {
    return 'work'
  }
  return 'handover'
}

type StepState = 'pending' | 'current' | 'done' | 'alert' | 'danger'

function computeStepStates(stage: MaintenanceWorkflowStage): StepState[] {
  switch (stage) {
    case 'DRAFT_HANDOVER':
      return ['current', 'pending', 'pending', 'pending', 'pending']
    case 'AWAITING_TECHNICAL_RECEIPT':
      return ['done', 'alert', 'pending', 'pending', 'pending']
    case 'RECEIPT_REJECTED':
      return ['done', 'danger', 'pending', 'pending', 'pending']
    case 'RECEIVED':
      return ['done', 'done', 'current', 'pending', 'pending']
    case 'IN_MAINTENANCE':
      return ['done', 'done', 'current', 'pending', 'pending']
    case 'WAITING_PARTS':
    case 'REWORK_REQUIRED':
      return ['done', 'done', 'alert', 'pending', 'pending']
    case 'AWAITING_MANAGER_ACCEPTANCE':
      return ['done', 'done', 'done', 'alert', 'pending']
    case 'COMPLETED':
      return ['done', 'done', 'done', 'done', 'done']
    case 'CANCELLED':
      return ['danger', 'pending', 'pending', 'pending', 'pending']
    default:
      return ['current', 'pending', 'pending', 'pending', 'pending']
  }
}

export function MaintenanceWorkflowDrawer({
  ticketId,
  open,
  onClose,
  onWorkflowChanged,
}: {
  ticketId: string | null
  open: boolean
  onClose: () => void
  onWorkflowChanged?: () => void
}) {
  const { t } = useI18n(maintenanceWorkflowMessages)
  const [detail, setDetail] = useState<MaintenanceWorkflowDetail | null>(null)
  const [technicals, setTechnicals] = useState<QualifiedTechnicalOption[]>([])
  const [managers, setManagers] = useState<ActorSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('handover')

  async function handleExportPdf(revision?: number) {
    if (!detail) return
    setExportingPdf(true)
    setError(null)
    try {
      const targetRev = revision ?? detail.reportVersions[0]?.revision
      const blob = await maintenanceWorkflowApi.downloadReportPdf(
        detail.ticketId,
        targetRev,
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bao-cao-bao-tri-${detail.ticketCode}${
        targetRev != null ? `-ban-${targetRev}` : ''
      }.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch (e) {
      setError(e instanceof Error ? e.message : t.loadError)
    } finally {
      setExportingPdf(false)
    }
  }

  const loadAll = useCallback(async () => {
    if (!ticketId) return
    setLoading(true)
    setError(null)
    try {
      const [wf, techs, mgrs] = await Promise.all([
        maintenanceWorkflowApi.getWorkflow(ticketId),
        maintenanceWorkflowApi.listQualifiedTechnicals().catch(() => []),
        maintenanceWorkflowApi.listReceivingManagers().catch(() => []),
      ])
      setDetail(wf)
      setActiveTab(getDefaultTab(wf.stage))
      setTechnicals(techs)
      setManagers(mgrs)
    } catch (e) {
      setError(e instanceof Error ? e.message : t.loadError)
    } finally {
      setLoading(false)
    }
  }, [ticketId, t.loadError])

  useEffect(() => {
    if (open && ticketId) {
      void loadAll()
    }
  }, [open, ticketId, loadAll])

  function handleUpdated(next: MaintenanceWorkflowDetail) {
    setDetail(next)
    onWorkflowChanged?.()
  }

  const stepStates = useMemo(
    () => (detail ? computeStepStates(detail.stage) : []),
    [detail],
  )

  const stepLabels = useMemo(
    () => [
      t.handover.directionInbound,
      t.queues.techAwaitingReceipt,
      t.tabs.workParts,
      t.tabs.reportAccept,
      t.stages.COMPLETED,
    ],
    [t],
  )

  const tabs = useMemo(
    () =>
      detail
        ? [
            {
              key: 'handover' as const,
              label: t.tabs.handover,
              count: detail.handovers.length,
            },
            {
              key: 'work' as const,
              label: t.tabs.workParts,
              count: detail.workItems.length + detail.partReplacements.length,
            },
            {
              key: 'report' as const,
              label: t.tabs.reportAccept,
              count: detail.reportVersions.length,
            },
            {
              key: 'timeline' as const,
              label: t.tabs.timeline,
              count: detail.evidences.length + detail.timeline.length,
            },
          ]
        : [],
    [detail, t],
  )

  const stageTone = detail ? getStageTone(detail.stage) : 'cobalt'

  return (
    <Modal
      rootClassName="mw-modal"
      open={open}
      onCancel={onClose}
      centered
      footer={null}
      closable={false}
      destroyOnHidden
      width="min(920px, calc(100vw - 32px))"
    >
      <div className="mw-drawer-shell">
        {/* Aviation Dossier Masthead */}
        <header className="mw-masthead">
          <div className="mw-masthead-top">
            <div className="mw-masthead-title-group">
              {detail && (
                <div className="mw-ticket-code-row">
                  <span className="mw-mono-code">{detail.ticketCode}</span>
                  <span className={`mw-stage-pill mw-stage-pill--${stageTone}`}>
                    {t.stages[detail.stage] ?? detail.stage}
                  </span>
                  <span className="mw-round-chip">
                    {t.roundBadge(detail.currentRound)}
                  </span>
                </div>
              )}
              <h2 className="mw-masthead-heading">{t.drawerTitle}</h2>
            </div>

            <div className="mw-masthead-actions">
              {detail && detail.reportVersions.length > 0 && (
                <button
                  type="button"
                  className="mw-icon-btn"
                  disabled={exportingPdf}
                  onClick={() =>
                    void handleExportPdf(detail.reportVersions[0].revision)
                  }
                >
                  <FilePdfOutlined />
                  <span>{t.exportPdf}</span>
                </button>
              )}
              {detail && (
                <button
                  type="button"
                  className="mw-icon-btn"
                  onClick={() => void loadAll()}
                >
                  <ReloadOutlined spin={loading} />
                  <span>{t.reload}</span>
                </button>
              )}
              <button
                type="button"
                className="mw-icon-btn mw-icon-btn--square"
                aria-label={t.close}
                onClick={onClose}
              >
                <CloseOutlined />
              </button>
            </div>
          </div>

          {detail && (
            <>
              <div className="mw-airframe-bar">
                <div className="mw-airframe-cell">
                  <div className="mw-airframe-label">{t.meta.device}</div>
                  <div className="mw-airframe-value">
                    {detail.device?.name ?? '—'}
                  </div>
                  {detail.device?.serialNumber && (
                    <div className="mw-airframe-sub">
                      {detail.device.serialNumber}
                    </div>
                  )}
                </div>

                <div className="mw-airframe-cell">
                  <div className="mw-airframe-label">
                    {t.meta.statusSeverity}
                  </div>
                  <div className="mw-airframe-value">
                    {(detail.device?.status &&
                      t.deviceStatus[detail.device.status]) ||
                      detail.device?.status ||
                      detail.legacyStatus}
                  </div>
                  <div className="mw-airframe-sub">
                    {t.severity[detail.severity] ?? detail.severity}
                  </div>
                </div>

                <div className="mw-airframe-cell">
                  <div className="mw-airframe-label">{t.meta.assignee}</div>
                  <div className="mw-airframe-value">
                    {detail.assignedTechnical?.fullName ?? t.meta.unassigned}
                  </div>
                  <div className="mw-airframe-sub">
                    {detail.handedOverBy?.fullName
                      ? `${t.meta.handedOverBy}: ${detail.handedOverBy.fullName}`
                      : '—'}
                  </div>
                </div>
              </div>

              <div className="mw-stepper" aria-label={t.drawerTitle}>
                {stepLabels.map((label, idx) => (
                  <div
                    key={label}
                    className={`mw-step mw-step--${stepStates[idx] ?? 'pending'}`}
                  >
                    <div className="mw-step-bar" />
                    <span className="mw-step-label" title={label}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </header>

        {/* Segmented Navigation Bar */}
        {detail && (
          <nav className="mw-nav-strip" role="tablist">
            <div className="mw-segmented">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`mw-seg-btn${isActive ? ' mw-seg-btn--active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <span>{tab.label}</span>
                    <span className="mw-seg-count">{tab.count}</span>
                  </button>
                )
              })}
            </div>
          </nav>
        )}

        {/* Scrollable Content Workspace */}
        <div className="mw-body-scroll">
          {loading && !detail ? (
            <div className="mw-sheet">
              <div className="mw-sheet-body">
                <Skeleton active paragraph={{ rows: 6 }} />
              </div>
            </div>
          ) : error && !detail ? (
            <Alert
              type="error"
              showIcon
              message={error}
              action={<Button onClick={() => void loadAll()}>{t.reload}</Button>}
            />
          ) : detail ? (
            <>
              {activeTab === 'handover' && (
                <HandoverSection
                  detail={detail}
                  technicals={technicals}
                  onUpdated={handleUpdated}
                  onNextTab={() => setActiveTab('work')}
                />
              )}
              {activeTab === 'work' && (
                <WorkAndPartsSection
                  detail={detail}
                  onUpdated={handleUpdated}
                  onNextTab={() => setActiveTab('report')}
                />
              )}
              {activeTab === 'report' && (
                <ReportAndAcceptanceSection
                  detail={detail}
                  managers={managers}
                  onUpdated={handleUpdated}
                  onExportPdf={(rev) => void handleExportPdf(rev)}
                  exportingPdf={exportingPdf}
                />
              )}
              {activeTab === 'timeline' && (
                <TimelineAndEvidenceSection
                  detail={detail}
                  onReload={() => void loadAll()}
                />
              )}
            </>
          ) : null}
        </div>
      </div>
    </Modal>
  )
}
