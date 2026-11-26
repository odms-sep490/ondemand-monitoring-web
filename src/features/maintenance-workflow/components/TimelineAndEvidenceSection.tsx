import { useState } from 'react'
import {
  CameraOutlined,
  HistoryOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { Alert, Button, Input, Select } from 'antd'

import { useI18n } from '../../../shared/i18n'
import { maintenanceWorkflowApi } from '../api/maintenanceWorkflowApi'
import { maintenanceWorkflowMessages } from '../messages'
import type {
  MaintenanceEvidenceStage,
  MaintenanceWorkflowDetail,
} from '../types'

const EVIDENCE_STAGES: MaintenanceEvidenceStage[] = [
  'INBOUND_HANDOVER',
  'TECHNICAL_RECEIPT',
  'WORK_ITEM',
  'PART_REPLACEMENT',
  'REPORT_BEFORE',
  'REPORT_AFTER',
  'POST_CHECK',
  'RETURN_HANDOVER',
  'MANAGER_ACCEPTANCE',
]

export function TimelineAndEvidenceSection({
  detail,
  onReload,
}: {
  detail: MaintenanceWorkflowDetail
  onReload: () => void
}) {
  const { t } = useI18n(maintenanceWorkflowMessages)
  const [stage, setStage] = useState<MaintenanceEvidenceStage>('WORK_ITEM')
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(file: File | undefined) {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      await maintenanceWorkflowApi.uploadEvidence(
        detail.ticketId,
        stage,
        file,
        caption.trim() || undefined,
      )
      setCaption('')
      onReload()
    } catch (e) {
      setError(e instanceof Error ? e.message : t.loadError)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mw-stack">
      {error && <Alert type="error" showIcon message={error} />}

      <section className="mw-sheet">
        <div className="mw-sheet-header">
          <h3 className="mw-sheet-title">
            <CameraOutlined />
            <span>{t.evidence.uploadTitle}</span>
          </h3>
          <span className="mw-sheet-count">{detail.evidences.length}</span>
        </div>
        <div className="mw-sheet-body">
          <div className="mw-form-grid">
            <div className="mw-field">
              <Select
                style={{ width: '100%' }}
                value={stage}
                onChange={setStage}
                options={EVIDENCE_STAGES.map((s) => ({
                  value: s,
                  label: t.evidenceStage[s] ?? s,
                }))}
              />
            </div>
            <div className="mw-field">
              <Input
                placeholder={t.evidence.caption}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>
          </div>

          <div className="mw-action-row">
            <Button
              type="primary"
              icon={<UploadOutlined />}
              loading={uploading}
              onClick={() =>
                document
                  .getElementById(`maint-ev-input-${detail.ticketId}`)
                  ?.click()
              }
            >
              {t.evidence.uploadBtn}
            </Button>
            <input
              id={`maint-ev-input-${detail.ticketId}`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => void handleFileChange(e.target.files?.[0])}
            />
          </div>

          {detail.evidences.length > 0 && (
            <div className="mw-evidence-grid">
              {detail.evidences.map((ev) => (
                <div key={ev.id} className="mw-evidence-card">
                  {ev.downloadUrl ? (
                    <img
                      src={ev.downloadUrl}
                      alt={ev.caption ?? ev.fileName}
                      className="mw-evidence-thumb"
                    />
                  ) : (
                    <div
                      className="mw-evidence-thumb"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--mw-ink-muted)',
                      }}
                    >
                      <CameraOutlined />
                    </div>
                  )}
                  <div className="mw-evidence-meta">
                    <div>
                      <span className="mw-chip">
                        {t.evidenceStage[ev.stage] ?? ev.stage}
                      </span>
                    </div>
                    {ev.downloadUrl ? (
                      <a
                        className="mw-evidence-name"
                        href={ev.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={ev.fileName}
                      >
                        {ev.fileName}
                      </a>
                    ) : (
                      <span className="mw-evidence-name" title={ev.fileName}>
                        {ev.fileName}
                      </span>
                    )}
                    {ev.caption && (
                      <span
                        className="mw-timeline-meta"
                        style={{ marginTop: 0 }}
                      >
                        {ev.caption}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mw-sheet">
        <div className="mw-sheet-header">
          <h3 className="mw-sheet-title">
            <HistoryOutlined />
            <span>{t.evidence.timelineTitle}</span>
          </h3>
          <span className="mw-sheet-count">{detail.timeline.length}</span>
        </div>
        <div className="mw-sheet-body">
          {detail.timeline.length === 0 ? (
            <div className="mw-empty-state">{t.evidence.empty}</div>
          ) : (
            <div className="mw-timeline">
              {detail.timeline.map((ev) => (
                <div key={ev.id} className="mw-timeline-item">
                  <span className="mw-timeline-dot" />
                  <div className="mw-timeline-head">
                    <span className="mw-timeline-action">
                      {t.timelineAction[ev.action] ?? ev.action}
                    </span>
                    <span className="mw-chip mw-chip--mono">
                      {t.roundShort(ev.roundNumber)}
                    </span>
                    {ev.toStage && (
                      <span className="mw-chip mw-chip--cobalt">
                        {t.stages[ev.toStage] ?? ev.toStage}
                      </span>
                    )}
                  </div>
                  <div className="mw-timeline-meta">
                    {ev.actor?.fullName ?? '—'} —{' '}
                    {new Date(ev.occurredAt).toLocaleString()}
                  </div>
                  {ev.reason && (
                    <div className="mw-note-text" style={{ marginTop: 4 }}>
                      {ev.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
