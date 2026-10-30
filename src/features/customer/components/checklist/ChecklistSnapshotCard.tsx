import { UnorderedListOutlined } from '@ant-design/icons'
import { Alert, Button, Modal } from 'antd'
import { useState, type ReactNode } from 'react'

import { ChecklistGuidance } from '../../../../shared/components/ChecklistGuidance'
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
import './Checklist.css'
import { ChecklistEditor } from './ChecklistEditor'

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

  function resolveLockBanner(): string {
    if (canEdit) return t.editableHint
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
        <div
          className="checklist-edit-actions"
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 12,
          }}
        >
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
        className="checklist-card"
        title={title ?? t.title}
        actions={
          canEdit && order ? (
            <Button size="small" onClick={handleStartEdit}>
              {t.editChecklist}
            </Button>
          ) : undefined
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
        <p className={canEdit ? 'checklist-hint' : 'checklist-lock'}>
          {resolveLockBanner()}
        </p>
        <p className="checklist-hint">{t.history}</p>
        {items.length ? (
          <ol className="checklist-snapshot">
            {[...items]
              .sort(
                (a, b) =>
                  a.displayOrder - b.displayOrder || a.id.localeCompare(b.id),
              )
              .map((item) => (
                <li key={item.id}>
                  <span className="checklist-snapshot-content">
                    {item.content}
                    {item.required ? (
                      <span
                        className="checklist-custom-tag is-mandatory"
                        style={{ marginLeft: 8 }}
                        title={t.mandatoryHint}
                      >
                        {t.mandatory}
                      </span>
                    ) : null}
                  </span>
                  <ChecklistGuidance
                    guidance={item}
                    showEmpty={item.sourceType === 'CUSTOMER_CUSTOM'}
                  />
                  {item.evidencePolicyVersion === 3 && (
                    <span className="checklist-snapshot-evidence">
                      {t.requestedImages}: {item.requestedImageCount ?? 0} ·{' '}
                      {t.requestedVideos}: {item.requestedVideoCount ?? 0} ·{' '}
                      {t.includedMedia(
                        item.includedImageCountSnapshot ?? 0,
                        item.includedVideoCountSnapshot ?? 0,
                      )}
                    </span>
                  )}
                  {item.evidencePolicyVersion !== 3 &&
                    (item.minimumEvidenceCount !== undefined ||
                      item.requiredEvidenceType !== undefined) && (
                      <span className="checklist-snapshot-evidence">
                        {item.minimumEvidenceCount ?? 1} ·{' '}
                        {item.requiredEvidenceType === 'IMAGE'
                          ? t.image
                          : item.requiredEvidenceType === 'VIDEO'
                            ? t.video
                            : item.requiredEvidenceType === 'IMAGE_AND_VIDEO'
                              ? t.imageAndVideo
                              : t.imageOrVideo}
                      </span>
                    )}
                  {item.sourceType !== 'SERVICE_TEMPLATE' && (
                    <span className="checklist-snapshot-evidence">
                      {item.priceAvailable ? (
                        item.pricingStatus === 'DUPLICATE' ? (
                          t.priceDuplicate
                        ) : item.pricingStatus === 'REJECTED' ? (
                          t.priceRejected
                        ) : (
                          <>
                            {t.priceAdditional}{' '}
                            {formatVnd(item.approvedPrice ?? 0)}
                          </>
                        )
                      ) : (
                        t.pricePending
                      )}
                    </span>
                  )}
                </li>
              ))}
          </ol>
        ) : (
          <p>{snapshotAt ? t.emptySnapshot : t.legacy}</p>
        )}
      </Card>
    </div>
  )
}
