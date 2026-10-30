import { useState } from 'react'
import { Alert, Button, Checkbox, Empty, Input, Modal, Tag } from 'antd'
import { LinkOutlined, SearchOutlined } from '@ant-design/icons'
import { useI18n } from '../../../../../shared/i18n'
import type { MissionChecklistExecution } from '../../../../mission/types/checklistExecution'
import { mediaChecklistAttachmentMessages } from './MediaChecklistAttachment.messages'
import './MediaChecklistAttachment.css'

export function MediaChecklistAttachment({
  fileName,
  mediaId,
  executions,
  selectedIds,
  disabled,
  onSave,
  autoUpload = false,
  onDetach,
  mediaType,
}: {
  fileName: string
  mediaId?: string | null
  executions: MissionChecklistExecution[]
  selectedIds: string[]
  disabled: boolean
  onSave: (ids: string[]) => Promise<boolean | void>
  autoUpload?: boolean
  onDetach?: (executionId: string) => Promise<void>
  mediaType?: string
}) {
  const { t } = useI18n(mediaChecklistAttachmentMessages)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const [notice, setNotice] = useState('')
  const attachedIds = new Set(
    executions
      .filter(
        (row) => mediaId && row.evidence?.some((e) => e.mediaId === mediaId),
      )
      .map((row) => row.id),
  )
  const compatible = (row: MissionChecklistExecution) =>
    !mediaType ||
    (!(row.requiredEvidenceType === 'IMAGE' && mediaType !== 'IMAGE') &&
      !(row.requiredEvidenceType === 'VIDEO' && mediaType !== 'VIDEO'))
  const selected = new Set(
    draft.filter(
      (id) =>
        !attachedIds.has(id) &&
        executions.some((row) => row.id === id && compatible(row)),
    ),
  )
  const summary = executions.filter(
    (row) => attachedIds.has(row.id) || selectedIds.includes(row.id),
  )
  const visible = executions.filter((row) =>
    `${row.content} ${row.description ?? ''}`
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  )

  async function save() {
    setSaving(true)
    setFailed(false)
    try {
      if ((await onSave([...selected])) === false) {
        setFailed(true)
        return
      }
      setOpen(false)
      setNotice(autoUpload ? t.queued : mediaId ? t.attachedSuccess : t.saved)
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="media-checklist-attachment">
      <Button
        block
        icon={<LinkOutlined aria-hidden="true" />}
        disabled={disabled || executions.length === 0}
        onClick={() => {
          setDraft(selectedIds.filter((id) => !attachedIds.has(id)))
          setSearch('')
          setFailed(false)
          setNotice('')
          setOpen(true)
        }}
      >
        {summary.length ? t.edit : t.attach}
      </Button>
      {summary.length > 0 && (
        <div className="media-checklist-attachment__summary">
          <b>
            {attachedIds.size
              ? t.attached(attachedIds.size)
              : t.selected(summary.length)}
          </b>
          {summary
            .filter((row) => !onDetach || !attachedIds.has(row.id))
            .slice(0, 2)
            .map((row) => (
              <span key={row.id}>{row.content}</span>
            ))}
          {summary.length > 2 && <span>{t.more(summary.length - 2)}</span>}
        </div>
      )}
      <span className="media-checklist-attachment__notice" role="status">
        {notice}
      </span>
      {onDetach &&
        executions
          .filter((row) => attachedIds.has(row.id))
          .map((row) => (
            <div className="media-checklist-attachment__remove" key={row.id}>
              <span>{row.content}</span>
              <Button
                size="small"
                disabled={disabled || saving}
                onClick={async () => {
                  if (!window.confirm(t.removeConfirm)) return
                  setSaving(true)
                  try {
                    await onDetach(row.id)
                    setNotice(t.removed)
                  } catch {
                    setNotice(t.failed)
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                {t.remove}
              </Button>
            </div>
          ))}
      <Modal
        open={open}
        title={t.title}
        width={720}
        onCancel={() => setOpen(false)}
        closable={!saving}
        maskClosable={!saving}
        keyboard={!saving}
        footer={
          <div className="media-checklist-picker__footer">
            <span aria-live="polite">{t.selected(selected.size)}</span>
            <div>
              <Button disabled={saving} onClick={() => setOpen(false)}>
                {t.cancel}
              </Button>
              <Button
                type="primary"
                loading={saving}
                disabled={
                  disabled ||
                  (mediaId
                    ? selected.size === 0
                    : selected.size === 0 && selectedIds.length === 0)
                }
                onClick={() => void save()}
              >
                {autoUpload || mediaId ? t.confirm(selected.size) : t.save}
              </Button>
            </div>
          </div>
        }
      >
        <div className="media-checklist-picker">
          <p>{t.description}</p>
          <div className="media-checklist-picker__file">
            <LinkOutlined aria-hidden="true" />
            <span title={fileName}>{fileName}</span>
          </div>
          <Input
            allowClear
            prefix={<SearchOutlined aria-hidden="true" />}
            aria-label={t.search}
            placeholder={t.search}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="media-checklist-picker__tools">
            <Button
              type="link"
              disabled={
                saving ||
                disabled ||
                !visible.some(
                  (row) => !attachedIds.has(row.id) && compatible(row),
                )
              }
              onClick={() =>
                setDraft([
                  ...new Set([
                    ...draft,
                    ...visible
                      .filter(
                        (row) => !attachedIds.has(row.id) && compatible(row),
                      )
                      .map((row) => row.id),
                  ]),
                ])
              }
            >
              {t.selectVisible}
            </Button>
            <Button
              type="text"
              disabled={saving || selected.size === 0}
              onClick={() => setDraft([])}
            >
              {t.clear}
            </Button>
          </div>
          <div
            className="media-checklist-picker__list"
            role="group"
            aria-label={t.title}
          >
            {visible.length === 0 && (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={executions.length ? t.noResults : t.empty}
              />
            )}
            {visible.map((row) => {
              const attached = attachedIds.has(row.id)
              return (
                <Checkbox
                  className={`media-checklist-picker__item${selected.has(row.id) ? ' is-selected' : ''}`}
                  key={row.id}
                  checked={attached || selected.has(row.id)}
                  disabled={saving || disabled || attached || !compatible(row)}
                  onChange={(event) =>
                    setDraft((previous) =>
                      event.target.checked
                        ? [...new Set([...previous, row.id])]
                        : previous.filter((id) => id !== row.id),
                    )
                  }
                >
                  <span className="media-checklist-picker__heading">
                    <strong>{row.content}</strong>
                    {!compatible(row) ? (
                      <Tag color="orange">{t.wrongType}</Tag>
                    ) : attached ? (
                      <Tag color="green">{t.alreadyAttached}</Tag>
                    ) : selected.has(row.id) ? (
                      <Tag color="blue">{t.choosing}</Tag>
                    ) : null}
                  </span>
                  {row.description && (
                    <span className="media-checklist-picker__description">
                      {row.description}
                    </span>
                  )}
                  <span className="media-checklist-picker__progress">
                    {row.evidencePolicyVersion === 3
                      ? `${t.images(row.eligibleImageCount ?? 0, row.minimumImageCount ?? 0)} · ${t.videos(row.eligibleVideoCount ?? 0, row.minimumVideoCount ?? 0)}`
                      : t.evidence(
                          row.eligibleEvidenceCount ?? 0,
                          row.minimumEvidenceCount ?? 0,
                        )}
                  </span>
                </Checkbox>
              )
            })}
          </div>
          <Alert
            type="info"
            showIcon
            message={
              autoUpload ? t.autoPending : mediaId ? t.existing : t.pending
            }
          />
          {failed && <Alert type="error" showIcon message={t.failed} />}
        </div>
      </Modal>
    </div>
  )
}
