import { useEffect, useState } from 'react'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { planningApi } from '../../../api/planningApi'
import { planningError } from '../../../lib/planningErrors'
import type { OrderChecklistSnapshot } from '../../../types/orders'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { Button, useToast } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { managerFeedbackMessages } from '../../../feedback.messages'
import { missionChecklistAssignmentEditorMessages } from './MissionChecklistAssignmentEditor.messages'

export function MissionChecklistAssignmentEditor({
  missionId,
  revision,
  editable,
  items,
  onChanged,
  onDraftState,
}: {
  missionId: string
  revision: number
  editable: boolean
  items: OrderChecklistSnapshot[]
  onChanged: () => void
  onDraftState?: (missionId: string, dirty: boolean, busy: boolean) => void
}) {
  const query = useApiQuery(
    (signal) => planningApi.getAssignments(missionId, signal),
    [missionId, revision],
  )
  const { t: fb } = useI18n(managerFeedbackMessages)
  const { t } = useI18n(missionChecklistAssignmentEditorMessages)
  const toast = useToast()
  const [selected, setSelected] = useState<string[]>([])
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    onDraftState?.(missionId, dirty, busy)
  }, [missionId, dirty, busy, onDraftState])
  useEffect(() => {
    if (query.data && !dirty)
      setSelected(
        query.data.assignments
          .filter((a) => a.active)
          .map((a) => a.orderChecklistItemId),
      )
  }, [query.data, dirty])
  async function save() {
    if (
      busy ||
      !editable ||
      query.loading ||
      query.error ||
      query.data?.revision !== revision
    )
      return
    setBusy(true)
    setMessage('')
    try {
      await planningApi.updateMissionChecklistAssignments(
        missionId,
        revision,
        items.filter((i) => selected.includes(i.id)).map((i) => i.id),
      )
      setDirty(false)
      query.reload()
      onChanged()
      setMessage(t.saved)
      toast.success(fb.checklistAssignmentSaved)
    } catch (error) {
      setMessage(planningError(error))
      toast.error(planningError(error))
      query.reload()
      onChanged()
    } finally {
      setBusy(false)
    }
  }
  return (
    <details
      className="odm-planning-editor"
      open={!editable || dirty || Boolean(message) || undefined}
    >
      <summary>
        Checklist ·{' '}
        {editable
          ? t.selectedCount(selected.length, items.length)
          : t.itemCount(
              query.data?.assignments.filter((a) => a.active).length ?? '…',
            )}
      </summary>
      {query.loading && <p role="status">{t.loading}</p>}
      {query.error ? (
        <p role="alert">
          {planningError(query.error)}{' '}
          <Button type="button" size="sm" onClick={query.reload}>
            {t.reload}
          </Button>
        </p>
      ) : null}
      {!editable && !query.loading && !query.error && (
        <ul
          className="odm-mission-checklist mgr-scroll-list"
          aria-label={`Checklist ${missionId}`}
        >
          {query.data?.assignments
            .filter((a) => a.active)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((item) => (
              <li key={item.assignmentId}>
                <span className="odm-mission-check" aria-label={t.assigned}>
                  <OrderIcon name="check" size={15} />
                </span>
                {item.content}
              </li>
            ))}
          {!query.data?.assignments.some((a) => a.active) && (
            <li className="odm-mission-meta">{t.noneAssigned}</li>
          )}
        </ul>
      )}
      {editable && (
        <>
          {items.length > 1 && (
            <div className="odm-planning-bulk">
              <Button
                type="button"
                disabled={
                  busy || query.loading || selected.length === items.length
                }
                onClick={() => {
                  setDirty(true)
                  setSelected(items.map((item) => item.id))
                }}
              >
                {t.selectAll}
              </Button>
              <Button
                type="button"
                disabled={busy || query.loading || selected.length === 0}
                onClick={() => {
                  setDirty(true)
                  setSelected([])
                }}
              >
                {t.deselect}
              </Button>
            </div>
          )}
          <fieldset
            className="mgr-scroll-list"
            disabled={
              !editable || busy || query.loading || Boolean(query.error)
            }
            aria-label={`Checklist ${missionId}`}
          >
            {[...items]
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((item) => (
                <label key={item.id} className="odm-planning-item">
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={(event) => {
                      setDirty(true)
                      setSelected((current) =>
                        event.target.checked
                          ? [...current, item.id]
                          : current.filter((id) => id !== item.id),
                      )
                    }}
                  />
                  <span>
                    {item.content}
                    <small
                      className={
                        item.sourceType === 'SERVICE_TEMPLATE'
                          ? 'odm-planning-tag'
                          : 'odm-planning-tag is-customer'
                      }
                    >
                      {item.sourceType === 'SERVICE_TEMPLATE'
                        ? t.serviceTemplate
                        : t.customerAdded}
                    </small>
                  </span>
                </label>
              ))}
            {items.length === 0 && <p>{t.noRequests}</p>}
          </fieldset>
        </>
      )}
      {message && <p role="status">{message}</p>}
      {editable && (
        <Button
          variant="primary"
          type="button"
          disabled={
            !dirty ||
            busy ||
            query.loading ||
            Boolean(query.error) ||
            query.data?.revision !== revision
          }
          onClick={() => void save()}
        >
          {busy ? t.saving : t.save}
        </Button>
      )}
    </details>
  )
}
