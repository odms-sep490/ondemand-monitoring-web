import { useEffect, useState } from 'react'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { planningApi } from '../../../api/planningApi'
import { planningError } from '../../../lib/planningErrors'
import type { OrderChecklistSnapshot } from '../../../types/orders'
import { OrderIcon } from '../../../components/common/OrderIcon'

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
      setMessage('Đã lưu phân công checklist.')
    } catch (error) {
      setMessage(planningError(error))
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
          ? `${selected.length}/${items.length} mục được chọn`
          : `${query.data?.assignments.filter((a) => a.active).length ?? '…'} mục`}
      </summary>
      {query.loading && <p role="status">Đang tải phân công…</p>}
      {query.error ? (
        <p role="alert">
          {planningError(query.error)}{' '}
          <button type="button" onClick={query.reload}>
            Tải lại
          </button>
        </p>
      ) : null}
      {!editable && !query.loading && !query.error && (
        <ul
          className="odm-mission-checklist"
          aria-label={`Checklist ${missionId}`}
        >
          {query.data?.assignments
            .filter((a) => a.active)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((item) => (
              <li key={item.assignmentId}>
                <span className="odm-mission-check" aria-label="Đã phân công">
                  <OrderIcon name="check" size={15} />
                </span>
                {item.content}
              </li>
            ))}
          {!query.data?.assignments.some((a) => a.active) && (
            <li className="odm-mission-meta">
              Chưa có checklist được phân công.
            </li>
          )}
        </ul>
      )}
      {editable && (
        <>
          {items.length > 1 && (
            <div className="odm-planning-bulk">
              <button
                type="button"
                className="odm-btn"
                disabled={
                  busy || query.loading || selected.length === items.length
                }
                onClick={() => {
                  setDirty(true)
                  setSelected(items.map((item) => item.id))
                }}
              >
                Chọn tất cả
              </button>
              <button
                type="button"
                className="odm-btn"
                disabled={busy || query.loading || selected.length === 0}
                onClick={() => {
                  setDirty(true)
                  setSelected([])
                }}
              >
                Bỏ chọn
              </button>
            </div>
          )}
          <fieldset
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
                        ? 'Mẫu dịch vụ'
                        : 'Khách hàng bổ sung'}
                    </small>
                  </span>
                </label>
              ))}
            {items.length === 0 && <p>Chưa có yêu cầu checklist.</p>}
          </fieldset>
        </>
      )}
      {message && <p role="status">{message}</p>}
      {editable && (
        <button
          className="odm-btn odm-btn-p"
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
          {busy ? 'Đang lưu…' : 'Lưu phân công'}
        </button>
      )}
    </details>
  )
}
