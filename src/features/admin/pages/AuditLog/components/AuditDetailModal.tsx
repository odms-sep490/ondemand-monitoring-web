import { Button, Descriptions, Modal, Tag } from 'antd'

import { mgrPopupContainer } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { fmtDateTime } from '../../../lib/accountStatus'
import type { AuditEntry } from '../../../types/auditLog'
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
      <Tag bordered={false} color={tone === 'before' ? 'error' : 'success'} className="adm-json-label">
        {label}
      </Tag>
      <pre className="adm-json">{value ? JSON.stringify(value, null, 2) : empty}</pre>
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
  return (
    <Modal
      open
      centered
      getContainer={mgrPopupContainer}
      width={640}
      title={t.title}
      onCancel={onClose}
      footer={<Button onClick={onClose}>{t.close}</Button>}
    >
      <p className="mgr-modal-sub">{`${entry.entityType} / ${entry.entityId}`}</p>
      <Descriptions
        colon={false}
        size="small"
        column={{ xs: 1, sm: 3 }}
        layout="vertical"
        items={[
          { key: 'time', label: t.time, children: fmtDateTime(entry.createdAt, lang) },
          { key: 'actor', label: t.actor, children: entry.actorName },
          { key: 'ip', label: t.ip, children: <span className="mgr-code">{entry.ip}</span> },
        ]}
      />
      <JsonBlock label={t.before} tone="before" value={entry.before} empty={t.none} />
      <JsonBlock label={t.after} tone="after" value={entry.after} empty={t.none} />
    </Modal>
  )
}
