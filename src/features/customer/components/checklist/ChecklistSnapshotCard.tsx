import {
  DownOutlined,
  PaperClipOutlined,
  PictureOutlined,
  UnorderedListOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { Alert, Button, Modal } from 'antd'
import { useState, type ReactNode } from 'react'

import {
  ChecklistGuidance,
  hasChecklistGuidance,
} from '../../../../shared/components/ChecklistGuidance'
import { useI18n } from '../../../../shared/i18n'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import { customerApi } from '../../api/customerApi'
import {
  checklistError,
  isEditLockedError,
  isRevisionConflict,
  isStaleChecklist,
} from '../../lib/checklist/errors'
import { checklistMessages } from '../../lib/checklist/messages'
import type { ChecklistSnapshot } from '../../lib/checklist/types'
import { useOrderChecklistEdit } from '../../lib/checklist/useOrderChecklistEdit'
import type { OrderDetailView } from '../../lib/orders/types'
import { Card } from '../common/ui'
import { ChecklistEditor } from './ChecklistEditor'
import './Checklist.css'

export function ChecklistSnapshotCard({
  items = [],
  snapshotAt,
  title,
  order,
  canEdit = false,
  blockedReason = null,
  onUpdated,
}: {
  items?: ChecklistSnapshot[]
  snapshotAt?: string | null
  /** Optional heading node (e.g. with an icon chip); defaults to the plain title. */
  title?: ReactNode
  order?: OrderDetailView
  canEdit?: boolean
  blockedReason?: string | null
  onUpdated?: () => void
}) {
  const { t } = useI18n(checklistMessages)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [conflictError, setConflictError] = useState(false)
  const [confirmApprovedOpen, setConfirmApprovedOpen] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const editor = useOrderChecklistEdit(order, editing)
  const sortedItems = [...items].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id),
  )

  function resolveLockBanner(): string {
    if (
      blockedReason === 'QUOTE_ACCEPTED' ||
      blockedReason === 'INVOICE_ISSUED'
    )
      return t.blockedQuoteAccepted
    if (blockedReason === 'NEEDS_INFO_SCOPE_RESTRICTED') {
      return order?.requestedUpdateScope === 'LOCATION'
        ? t.blockedNeedsLocation
        : t.blockedNeedsInfo
    }
    if (blockedReason === 'EXECUTION_STARTED') return t.blockedExecutionStarted
    return t.locked
  }

  const lockMessage = !canEdit
    ? blockedReason
      ? resolveLockBanner()
      : snapshotAt
        ? t.locked
        : order?.canEditChecklist === false
          ? t.editLocked
          : null
    : null

  function handleStartEdit() {
    setSaveError(null)
    setConflictError(false)
    setSavedMessage(null)
    editor.reset()
    setEditing(true)
  }

  function handleCancel() {
    setSaveError(null)
    setConflictError(false)
    setConfirmApprovedOpen(false)
    editor.reset()
    setEditing(false)
  }

  async function performSave() {
    if (!order || !editor.valid) return
    setSaving(true)
    setSaveError(null)
    setConflictError(false)
    try {
      await customerApi.updateOrderChecklist(order.id, editor.serializeUpdate())
      setConfirmApprovedOpen(false)
      setEditing(false)
      setSavedMessage(t.editSaved)
      onUpdated?.()
    } catch (cause) {
      setConfirmApprovedOpen(false)
      if (isStaleChecklist(cause)) {
        editor.markStale()
        setSaveError(checklistError(cause))
      } else if (isRevisionConflict(cause) || isEditLockedError(cause)) {
        setConflictError(true)
        setSaveError(checklistError(cause))
      } else {
        setSaveError(checklistError(cause))
      }
    } finally {
      setSaving(false)
    }
  }

  function handleSaveClick() {
    if (!order || !editor.valid || !editor.isDirty) return
    if (order.status === 'APPROVED') {
      setConfirmApprovedOpen(true)
      return
    }
    void performSave()
  }

  function handleReloadLatest() {
    setSaveError(null)
    setConflictError(false)
    setEditing(false)
    onUpdated?.()
  }

  const evidenceSummary = (item: ChecklistSnapshot) => {
    const images =
      item.evidencePolicyVersion === 3
        ? (item.requestedImageCount ?? 0)
        : (item.minimumImageCount ?? 0)
    const videos =
      item.evidencePolicyVersion === 3
        ? (item.requestedVideoCount ?? 0)
        : (item.minimumVideoCount ?? 0)

    if (images > 0 || videos > 0) {
      return (
        <span
          className="checklist-snapshot-media"
          role="group"
          aria-label={t.requiredMedia(images, videos)}
        >
          {images > 0 && (
            <span>
              <PictureOutlined aria-hidden="true" />
              {t.requiredImages(images)}
            </span>
          )}
          {videos > 0 && (
            <span>
              <VideoCameraOutlined aria-hidden="true" />
              {t.requiredVideos(videos)}
            </span>
          )}
        </span>
      )
    }

    if (item.evidencePolicyVersion === 3) return null

    const count = item.minimumEvidenceCount ?? 1
    const type = item.requiredEvidenceType
    if (type === 'IMAGE') {
      return (
        <span
          className="checklist-snapshot-media"
          role="group"
          aria-label={t.requiredMedia(count, 0)}
        >
          <span>
            <PictureOutlined aria-hidden="true" />
            {t.requiredImages(count)}
          </span>
        </span>
      )
    }
    if (type === 'VIDEO') {
      return (
        <span
          className="checklist-snapshot-media"
          role="group"
          aria-label={t.requiredMedia(0, count)}
        >
          <span>
            <VideoCameraOutlined aria-hidden="true" />
            {t.requiredVideos(count)}
          </span>
        </span>
      )
    }
    if (type === 'IMAGE_AND_VIDEO') {
      return (
        <span
          className="checklist-snapshot-media"
          role="group"
          aria-label={t.requiredEvidence(count, t.imageAndVideo)}
        >
          <span>
            <PictureOutlined aria-hidden="true" />
            <VideoCameraOutlined aria-hidden="true" />
            {t.requiredEvidence(count, t.imageAndVideo)}
          </span>
        </span>
      )
    }
    if (type === 'IMAGE_OR_VIDEO') {
      return (
        <span
          className="checklist-snapshot-media"
          role="group"
          aria-label={t.requiredEvidence(count, t.imageOrVideo)}
        >
          <span>
            <PaperClipOutlined aria-hidden="true" />
            {t.requiredEvidence(count, t.imageOrVideo)}
          </span>
        </span>
      )
    }
    return null
  }

  const priceSummary = (item: ChecklistSnapshot) => {
    if (item.sourceType === 'SERVICE_TEMPLATE') return null
    if (!item.priceAvailable) return t.pricePending
    if (item.pricingStatus === 'DUPLICATE') return t.priceDuplicate
    if (item.pricingStatus === 'REJECTED') return t.priceRejected
    return (
      <>
        {t.priceAdditional} {formatVnd(item.approvedPrice ?? 0)}
      </>
    )
  }

  if (editing && order) {
    return (
      <div className="checklist-edit-wrapper">
        <ChecklistEditor
          checklist={editor}
          disabled={saving}
          variant="compact"
          quote
          onReload={() => {
            setSaveError(null)
            setConflictError(false)
          }}
        />
        {saveError ? (
          <div role="alert" className="co-notice is-danger">
            <p>{saveError}</p>
            {conflictError ? (
              <Button onClick={handleReloadLatest} disabled={saving}>
                {t.reloadLatest}
              </Button>
            ) : null}
          </div>
        ) : null}
        <div className="checklist-edit-actions">
          <Button onClick={handleCancel} disabled={saving}>
            {t.cancelChecklist}
          </Button>
          <Button
            type="primary"
            loading={saving}
            disabled={saving || !editor.valid || !editor.isDirty}
            onClick={handleSaveClick}
          >
            {saving ? t.savingChecklist : t.saveChecklist}
          </Button>
        </div>
        <Modal
          open={confirmApprovedOpen}
          title={t.approvedEditWarningTitle}
          okText={t.approvedEditConfirm}
          cancelText={t.cancelChecklist}
          confirmLoading={saving}
          onOk={() => void performSave()}
          onCancel={() => setConfirmApprovedOpen(false)}
        >
          <p>{t.approvedEditWarningBody}</p>
        </Modal>
      </div>
    )
  }

  return (
    <div role="region" aria-label={t.title}>
      <Card
        icon={<UnorderedListOutlined />}
        className="checklist-card checklist-card-snapshot"
        title={title ?? t.title}
        actions={
          <div className="checklist-snapshot-actions">
            <span className="checklist-snapshot-count">
              {t.itemCount(items.length)}
            </span>
            {lockMessage ? (
              <span className="checklist-lock">{lockMessage}</span>
            ) : null}
            {canEdit && order ? (
              <Button size="small" onClick={handleStartEdit}>
                {t.editChecklist}
              </Button>
            ) : null}
          </div>
        }
      >
        {savedMessage ? (
          <Alert
            type="success"
            showIcon
            closable
            message={savedMessage}
            onClose={() => setSavedMessage(null)}
            style={{ marginBottom: 12 }}
          />
        ) : null}
        {sortedItems.length ? (
          <ol className="checklist-snapshot" aria-label={t.title}>
            {sortedItems.map((item, index) => {
              const guidanceAvailable = hasChecklistGuidance(item)
              const detailsAvailable =
                guidanceAvailable || item.evidencePolicyVersion === 3
              const evidence = evidenceSummary(item)
              const price = priceSummary(item)
              const meta =
                evidence || price ? (
                  <span className="checklist-snapshot-row-meta">
                    {evidence}
                    {price ? (
                      <span className="checklist-snapshot-price">{price}</span>
                    ) : null}
                  </span>
                ) : null
              const row = (
                <span className="checklist-snapshot-header">
                  <span className="checklist-snapshot-index" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="checklist-snapshot-content">
                    {item.content}
                    {item.required ? (
                      <span
                        className="checklist-custom-tag is-mandatory"
                        title={t.mandatoryHint}
                      >
                        {t.mandatory}
                      </span>
                    ) : null}
                  </span>
                  {meta}
                  {detailsAvailable ? (
                    <DownOutlined
                      className="checklist-snapshot-chevron"
                      aria-hidden="true"
                    />
                  ) : null}
                </span>
              )

              return (
                <li key={item.id} className="checklist-snapshot-item">
                  {detailsAvailable ? (
                    <details>
                      <summary>{row}</summary>
                      <div className="checklist-snapshot-detail">
                        <ChecklistGuidance
                          guidance={item}
                          collapsible={false}
                        />
                        {item.evidencePolicyVersion === 3 &&
                        ((item.includedImageCountSnapshot ?? 0) > 0 ||
                          (item.includedVideoCountSnapshot ?? 0) > 0) ? (
                          <p className="checklist-snapshot-included">
                            {t.includedMedia(
                              item.includedImageCountSnapshot ?? 0,
                              item.includedVideoCountSnapshot ?? 0,
                            )}
                          </p>
                        ) : null}
                      </div>
                    </details>
                  ) : (
                    <div className="checklist-snapshot-static">{row}</div>
                  )}
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="checklist-snapshot-empty">
            {snapshotAt ? t.emptySnapshot : t.legacy}
          </p>
        )}
      </Card>
    </div>
  )
}
