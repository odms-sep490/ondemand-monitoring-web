import {
  Alert,
  Button,
  Card,
  Collapse,
  Image,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'
import { RetweetOutlined } from '@ant-design/icons'
import { useId } from 'react'
import { ChecklistGuidance } from '../../../../../shared/components/ChecklistGuidance'
import './ReworkMissionContextPanel.css'
import { useI18n } from '../../../../../shared/i18n'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { missionApi } from '../../../../mission/api/missionApi'
import type { MissionReworkContext } from '../../../../mission/types/mission'
import { reworkMissionContextMessages } from './ReworkMissionContextPanel.messages'

function feedbackReason(
  t: typeof reworkMissionContextMessages.vi,
  code: string,
) {
  return t.reasons[code as keyof typeof t.reasons] ?? code
}

function EvidencePreview({
  evidence,
  t,
}: {
  evidence: MissionReworkContext['checklists'][number]['customerFeedback'][number]['evidence'][number]
  t: typeof reworkMissionContextMessages.vi
}) {
  return (
    <div className="rework-context-evidence" key={evidence.roundEvidenceId}>
      {evidence.url && evidence.mediaType.toUpperCase().includes('VIDEO') ? (
        <video controls preload="metadata" src={evidence.url} />
      ) : evidence.url ? (
        <Image
          src={evidence.url}
          alt={evidence.fileName}
          preview={{ mask: t.viewEvidence }}
        />
      ) : (
        <div className="rework-context-evidence__unavailable">
          {evidence.unavailableReason === 'RETENTION_EXPIRED'
            ? t.evidenceExpired
            : t.evidenceUnavailable}
        </div>
      )}
      <Typography.Text ellipsis={{ tooltip: evidence.fileName }}>
        {evidence.fileName}
      </Typography.Text>
    </div>
  )
}

export function ReworkMissionContextPanel({
  missionId,
}: {
  missionId: string
}) {
  const { t, locale } = useI18n(reworkMissionContextMessages)
  const headingId = useId()
  const query = useApiQuery(
    () => missionApi.getReworkContext(missionId),
    [missionId],
  )

  if (query.loading && !query.data) {
    return (
      <Card className="rework-context-panel">
        <Spin size="small" /> {t.loading}
      </Card>
    )
  }
  if (query.error || !query.data) {
    return (
      <Alert
        className="rework-context-panel"
        type="error"
        showIcon
        message={t.loadFailed}
        action={
          <Button size="small" onClick={query.reload}>
            {t.retry}
          </Button>
        }
      />
    )
  }

  return (
    <section className="rework-context-panel" aria-labelledby={headingId}>
      <Card
        size="small"
        title={
          <Space>
            <RetweetOutlined aria-hidden="true" />
            <span id={headingId}>{t.title(query.data.missionCode)}</span>
          </Space>
        }
      >
        <p className="rework-context-intro">{t.description}</p>
        <Image.PreviewGroup>
          <Collapse
            key={missionId}
            className="rework-context-checklists"
            defaultActiveKey={query.data.checklists
              .slice(0, 1)
              .map((item) => item.caseItemId)}
            items={query.data.checklists.map((checklist, index) => ({
              key: checklist.caseItemId,
              label: (
                <span className="rework-context-checklist-title">
                  <span className="rework-context-index">{index + 1}</span>
                  {checklist.title}
                </span>
              ),
              extra: (
                <Tag>{t.feedbackCount(checklist.customerFeedback.length)}</Tag>
              ),
              children: (
                <div className="rework-context-content">
                  {checklist.managerInstructions && (
                    <div className="rework-context-instructions">
                      <strong>{t.managerInstructions}</strong>
                      <p>{checklist.managerInstructions}</p>
                    </div>
                  )}
                  {checklist.customerFeedback.length > 0 && (
                    <section
                      className="rework-context-feedback-list"
                      aria-label={t.customerFeedback}
                    >
                      <h3>{t.customerFeedback}</h3>
                      {checklist.customerFeedback.map((feedback) => (
                        <article
                          className="rework-context-feedback"
                          key={`${feedback.roundNumber}-${feedback.submittedAt}`}
                        >
                          <div className="rework-context-feedback-main">
                            <div className="rework-context-feedback-meta">
                              <Tag color="orange">
                                {feedbackReason(t, feedback.reasonCode)}
                              </Tag>
                              <span>{t.round(feedback.roundNumber)}</span>
                              <time dateTime={feedback.submittedAt}>
                                {new Date(feedback.submittedAt).toLocaleString(
                                  locale,
                                  { dateStyle: 'short', timeStyle: 'short' },
                                )}
                              </time>
                            </div>
                            {feedback.customerNote && (
                              <p className="rework-context-customer-note">
                                {feedback.customerNote}
                              </p>
                            )}
                          </div>
                          {feedback.evidence.length > 0 && (
                            <div className="rework-context-evidence-list">
                              {feedback.evidence.map((evidence) => (
                                <EvidencePreview
                                  key={evidence.roundEvidenceId}
                                  evidence={evidence}
                                  t={t}
                                />
                              ))}
                            </div>
                          )}
                        </article>
                      ))}
                    </section>
                  )}
                  <ChecklistGuidance
                    guidance={checklist.guidance}
                    summaryLabel={t.originalGuidance}
                  />
                </div>
              ),
            }))}
          />
        </Image.PreviewGroup>
      </Card>
    </section>
  )
}
