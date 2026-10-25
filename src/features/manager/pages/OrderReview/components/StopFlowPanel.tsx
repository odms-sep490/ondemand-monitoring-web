import { Icon } from '../../../../../shared/components/Icon'
import {
  SafeStopRefresh,
  SafeStopSummary,
} from '../../../../mission/components/SafeStopSummary'
import { safeStopError } from '../../../../mission/lib/safeStopPresentation'
import type { RefObject, Dispatch, SetStateAction } from 'react'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { SafeStop } from '../../../types/planning'

export function StopFlowPanel({
  flowRef,
  missionCode,
  busy,
  query,
  ready,
  stop,
  requested,
  refresh,
  setIntent,
  missionId,
  intent,
  triggerRef,
  reason,
  nextAction,
  setReason,
  actionReason,
  draft,
  allowed,
  command,
  message,
}: {
  flowRef: RefObject<HTMLElement | null>
  missionCode: string
  busy: boolean
  query: UseApiQueryState<SafeStop>
  ready: boolean
  stop: SafeStop
  requested: boolean
  refresh: () => void
  setIntent: Dispatch<SetStateAction<'cancel' | 'replace' | null>>
  missionId: string
  intent: 'cancel' | 'replace'
  triggerRef: RefObject<HTMLButtonElement | null>
  reason: string
  nextAction: 'cancel' | 'request' | 'cleanup' | null
  setReason: Dispatch<SetStateAction<string>>
  actionReason: string
  draft: boolean
  allowed: boolean
  command: (action: 'cancel' | 'request' | 'cleanup') => Promise<void>
  message: string
}) {
  return (
    <section
      className="odm-manager-stop-flow mission-stop"
      ref={flowRef}
      tabIndex={-1}
      aria-label={`Dừng Mission ${missionCode}`}
      aria-busy={busy || query.loading}
    >
      <div className="mission-stop__header">
        <h4>
          <Icon name="shield" width={18} height={18} />
          {ready && stop?.canCancelMission === true && !requested
            ? 'Xác nhận hủy Mission'
            : 'Dừng Mission an toàn'}
        </h4>
        <div className="mission-stop__header-actions">
          <SafeStopRefresh disabled={busy || query.loading} onClick={refresh} />
          <button
            className="odm-btn"
            disabled={busy}
            onClick={() => {
              setIntent(null)
              window.requestAnimationFrame(() => {
                const button = document.querySelector<HTMLButtonElement>(
                  `[data-stop-trigger="${missionId}:${intent}"]`,
                )
                ;(button ?? triggerRef.current)?.focus()
              })
            }}
          >
            Đóng bảng thao tác
          </button>
        </div>
      </div>
      {query.loading && <p role="status">Đang kiểm tra trạng thái…</p>}
      {query.error ? (
        <p role="alert" className="mission-stop__warning">
          {safeStopError(query.error)}
        </p>
      ) : null}
      {ready && (
        <>
          {stop.canCancelMission === true && !requested ? (
            <p className="mission-stop__description">
              Mission có thể được hủy. Lịch sử đã ghi nhận sẽ được giữ lại.
            </p>
          ) : (
            <>
              <SafeStopSummary stop={stop} actor="manager" />
              {!requested && (
                <p className="mission-stop__guidance">
                  Đội bay chịu trách nhiệm đưa Mission về trạng thái an toàn
                  trước khi tiếp tục hủy.
                </p>
              )}
            </>
          )}
          {intent === 'replace' && (
            <p className="mission-stop__guidance">
              Sau khi hủy, bạn có thể tạo Mission thay thế.
            </p>
          )}
          {requested ? (
            <dl className="mission-stop__reason">
              <dt>Lý do dừng / hủy Mission</dt>
              <dd>{stop.reason || reason || 'Chưa có thông tin lý do.'}</dd>
            </dl>
          ) : (
            (nextAction === 'request' || nextAction === 'cancel') && (
              <div className="mission-stop__form">
                <label className="mission-stop__field">
                  Lý do dừng / hủy Mission
                  <textarea
                    maxLength={1000}
                    value={reason}
                    disabled={busy}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
              </div>
            )
          )}
          {requested && nextAction === 'cancel' && !actionReason && (
            <p className="mission-stop__warning">
              Chưa tải được lý do dừng. Làm mới trạng thái trước khi hủy
              Mission.
            </p>
          )}
          {stop.cleanedAt && stop.canCancelMission !== true && (
            <p className="mission-stop__guidance">
              {draft
                ? 'Chưa thể hủy Mission lúc này. Làm mới trạng thái để kiểm tra lại.'
                : 'Mở điều chỉnh kế hoạch trước khi tiếp tục hủy Mission.'}
            </p>
          )}
          {stop.confirmedAt && !stop.cleanedAt && nextAction === null && (
            <p className="mission-stop__guidance">
              Chưa đủ điều kiện giải phóng tài nguyên. Kiểm tra với đội bay và
              làm mới trạng thái.
            </p>
          )}
          {nextAction && (
            <div className="mission-stop__actions">
              <button
                className={`odm-btn ${nextAction === 'cancel' ? 'odm-btn-rd' : 'odm-btn-p'}`}
                disabled={
                  !allowed || (nextAction !== 'cleanup' && !actionReason)
                }
                onClick={() => void command(nextAction)}
              >
                {busy
                  ? 'Đang xử lý…'
                  : {
                      request: 'Yêu cầu dừng an toàn',
                      cleanup: 'Giải phóng tài nguyên',
                      cancel: 'Hủy Mission',
                    }[nextAction]}
              </button>
            </div>
          )}
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  )
}
