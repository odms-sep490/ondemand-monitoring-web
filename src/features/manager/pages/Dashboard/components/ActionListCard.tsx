import { formatVnd } from '../../../../../shared/lib/formatVnd'
import { managerHref } from '../../../routes'
import type { ActionItem } from '../../../types/dashboard'
import { actionItemRoute, formatDashboardDate } from '../dashboardHelpers'

const actionLabel: Record<NonNullable<ActionItem['actionType']>, string> = {
  REVIEW_PRICING: 'Xem & duyệt giá',
  VIEW_ORDER: 'Xem yêu cầu',
  VIEW_QUOTE: 'Xem báo giá',
  VIEW_MISSION: 'Xem Mission',
}

export function ActionListCard({ items }: { items: ActionItem[] }) {
  return (
    <section className="odm-card odm-mgr-section">
      <div className="odm-card-header">Cần bạn xử lý</div>
      {items.length === 0 ? (
        <div className="odm-mgr-empty-list">
          <div className="odm-mgr-empty-list-title">Hiện tại không có công việc nào cần xử lý.</div>
        </div>
      ) : (
        <ul className="odm-mgr-action-list">
          {items.map((item) => (
            <li key={item.id} className="odm-mgr-action-row">
              <span className={`odm-mgr-priority is-${(item.priority ?? 'MEDIUM').toLowerCase()}`}>{item.priority ?? 'MEDIUM'}</span>
              <div className="odm-mgr-action-text">
                <div className="odm-mgr-action-title">{item.title}</div>
                <div className="odm-mgr-action-subtitle">
                  {[item.orderCode ?? item.code, item.description ?? item.subtitle].filter(Boolean).join(' · ')}
                </div>
                {item.systemCalculatedAmount != null ? (
                  <div className="odm-mgr-action-price">Giá hệ thống: {formatVnd(item.systemCalculatedAmount)}</div>
                ) : null}
              </div>
              <time className="odm-mgr-action-age" dateTime={item.createdAt}>{item.createdAt ? formatDashboardDate(item.createdAt) : ''}</time>
              <a className="odm-btn odm-btn-sm" href={managerHref(actionItemRoute(item))}>{item.actionType ? actionLabel[item.actionType] : 'Xem'}</a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
