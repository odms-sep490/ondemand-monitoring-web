import type { OrderChecklistSnapshot } from '../../../types/orders'
import type { ExecutionPlan } from '../../../types/planning'
import { OrderIcon } from '../../../components/common/OrderIcon'

interface MissionChecklistSelectionCardProps {
  items: OrderChecklistSnapshot[]
  plan: ExecutionPlan | null
  selectedIds: string[]
  onToggle: (id: string) => void
  onSelectAll: () => void
  onSelectUncovered: () => void
  onDeselectAll: () => void
  error?: string
}

export function MissionChecklistSelectionCard({
  items,
  plan,
  selectedIds,
  onToggle,
  onSelectAll,
  onSelectUncovered,
  onDeselectAll,
  error,
}: MissionChecklistSelectionCardProps) {
  const uncoveredItemIds = plan?.coverage.uncoveredItemIds ?? []
  const hasUncovered = items.some((item) =>
    uncoveredItemIds.includes(item.id),
  )

  return (
    <section className="odm-or-card odm-mission-checklist-selection-card">
      <header className="odm-or-card-head odm-checklist-selection-head">
        <div className="odm-checklist-title-wrap">
          <span className="odm-or-card-title">
            <OrderIcon name="check" size={18} />
            Hạng mục kiểm tra của nhiệm vụ *
          </span>
          <span className="odm-checklist-count-badge">
            Đã chọn {selectedIds.length}/{items.length} mục
          </span>
        </div>
        <div className="odm-checklist-quick-actions">
          <button
            type="button"
            className="odm-btn odm-btn-sm"
            onClick={onSelectAll}
            title="Chọn tất cả các mục"
          >
            Chọn tất cả
          </button>
          {hasUncovered && (
            <button
              type="button"
              className="odm-btn odm-btn-sm odm-btn-highlight"
              onClick={onSelectUncovered}
              title="Chỉ chọn các mục chưa gán cho nhiệm vụ nào"
            >
              Chọn các mục chưa gán
            </button>
          )}
          {selectedIds.length > 0 && (
            <button
              type="button"
              className="odm-btn odm-btn-sm"
              onClick={onDeselectAll}
              title="Bỏ chọn toàn bộ"
            >
              Bỏ chọn
            </button>
          )}
        </div>
      </header>

      <div className="odm-or-card-body odm-checklist-selection-body">
        {items.length === 0 ? (
          <div className="odm-checklist-empty-note">
            <p>Đơn hàng này chưa có danh mục kiểm tra nào từ hệ thống.</p>
          </div>
        ) : (
          <div className="odm-checklist-items-grid">
            {items.map((item) => {
              const isChecked = selectedIds.includes(item.id)
              const isUncovered =
                !plan || uncoveredItemIds.includes(item.id)
              const assignedMission = plan?.missions.find((m) =>
                m.checklistItemIds?.includes(item.id),
              )

              return (
                <label
                  key={item.id}
                  className={`odm-checklist-select-item ${
                    isChecked ? 'is-selected' : ''
                  } ${isUncovered ? 'is-uncovered' : 'is-assigned'}`}
                >
                  <input
                    type="checkbox"
                    className="odm-checklist-checkbox"
                    checked={isChecked}
                    onChange={() => onToggle(item.id)}
                  />
                  <div className="odm-checklist-item-content">
                    <div className="odm-checklist-item-header">
                      <strong className="odm-checklist-item-title">
                        {item.content}
                      </strong>
                      <div className="odm-checklist-badges">
                        {isUncovered ? (
                          <span className="odm-badge odm-badge-uncovered">
                            Chưa gán
                          </span>
                        ) : (
                          <span className="odm-badge odm-badge-assigned">
                            Đã gán: {assignedMission?.scopeLabel || 'Mission khác'}
                          </span>
                        )}
                        <span className="odm-badge odm-badge-source">
                          {item.sourceType === 'SERVICE_TEMPLATE'
                            ? 'Mặc định gói'
                            : 'Khách yêu cầu thêm'}
                        </span>
                      </div>
                    </div>

                    {item.description && (
                      <p className="odm-checklist-item-desc">
                        {item.description}
                      </p>
                    )}

                    <div className="odm-checklist-item-meta">
                      {item.requiredEvidenceType && (
                        <span>
                          Loại tư liệu:{' '}
                          <strong>{item.requiredEvidenceType}</strong>
                        </span>
                      )}
                      {item.minimumEvidenceCount !== undefined &&
                        item.minimumEvidenceCount > 0 && (
                          <span>
                            · Tối thiểu {item.minimumEvidenceCount} tư liệu
                          </span>
                        )}
                      {(item.minimumImageCount ?? 0) > 0 && (
                        <span>· {item.minimumImageCount} ảnh</span>
                      )}
                      {(item.minimumVideoCount ?? 0) > 0 && (
                        <span>· {item.minimumVideoCount} video</span>
                      )}
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        )}

        {error && (
          <p className="odm-checklist-error-msg" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  )
}
