import { useI18n } from '../../../../../shared/i18n'
import { Modal } from '../../../../../shared/components/ui'
import { fmtDateTime } from '../../../lib/accountStatus'
import type { AuditEntry } from '../../../types/auditLog'
import { auditActionMessages } from '../auditActions'
import { auditDetailMessages } from './AuditDetailModal.messages'

function JsonBlock({
  label,
  tone,
  value,
  empty,
}: {
  label: string
  tone: 'before' | 'after'
  value: Record<string, unknown> | null
  empty: string
}) {
  return (
    <div className="adm-json-block">
      <p className={`adm-json-label is-${tone}`}>{label}</p>
      <pre className="adm-json">
        {value ? JSON.stringify(value, null, 2) : empty}
      </pre>
    </div>
  )
}

export function AuditDetailModal({
  entry,
  onClose,
}: {
  entry: AuditEntry
  onClose: () => void
}) {
  const { t, lang } = useI18n(auditDetailMessages)
  const { t: actions } = useI18n(auditActionMessages)
  const operation =
    typeof entry.before?.operation === 'string'
      ? entry.before.operation
      : typeof entry.after?.operation === 'string'
        ? entry.after.operation
        : null
  const hasOperationSnapshot = operation !== null

  return (
    <Modal
      width={640}
      icon="clipboard"
      title={t.title}
      subtitle={`${entry.entityType} / ${entry.entityId}`}
      onClose={onClose}
      footer={
        <button type="button" className="odm-btn odm-btn-gh" onClick={onClose}>
          {t.close}
        </button>
      }
    >
      <dl className="adm-detail-meta">
        <dt>{t.action}</dt>
        <dd>{actions[entry.action]}</dd>
        <dt>{t.operation}</dt>
        <dd className="adm-wrap">{operation ?? t.none}</dd>
        <dt>{t.time}</dt>
        <dd>{fmtDateTime(entry.createdAt, lang)}</dd>
        <dt>{t.actor}</dt>
        <dd>{entry.actorName}</dd>
        <dt>{t.actorId}</dt>
        <dd className="adm-cell-mono adm-wrap">{entry.actorId}</dd>
        <dt>{t.ip}</dt>
        <dd>{entry.ip || t.none}</dd>
        <dt>{t.userAgent}</dt>
        <dd className="adm-wrap">{entry.userAgent || t.none}</dd>
      </dl>
      <JsonBlock
        label={hasOperationSnapshot ? t.request : t.before}
        tone="before"
        value={entry.before}
        empty={t.none}
      />
      <JsonBlock
        label={hasOperationSnapshot ? t.result : t.after}
        tone="after"
        value={entry.after}
        empty={t.none}
      />
    </Modal>
  )
}
