import type { OrderChecklistSnapshot } from '../../../types/orders'
import type { ExecutionPlan } from '../../../types/planning'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { useI18n } from '../../../../../shared/i18n'
import { missionChecklistSelectionMessages } from './MissionChecklistSelectionCard.messages'

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
  const { t } = useI18n(missionChecklistSelectionMessages)
  const uncoveredItemIds = plan?.coverage.uncoveredItemIds ?? []
  const hasUncovered = items.some((item) => uncoveredItemIds.includes(item.id))
  const showRepeatHint = Boolean(
    plan && items.length > 0 && !hasUncovered && selectedIds.length === 0,
  )

  return (
    <section className="odm-or-card odm-mission-checklist-selection-card">
      <header className="odm-or-card-head odm-checklist-selection-head">
        <div className="odm-checklist-title-wrap">
          <span className="odm-or-card-title">
            <OrderIcon name="check" size={18} />
            {t.title}
          </span>
          <span className="odm-checklist-count-badge">
            {t.selectedCount(selectedIds.length, items.length)}
          </span>
        </div>
        <div className="odm-checklist-quick-actions">
          <button
            type="button"
            className="odm-btn odm-btn-sm"
            onClick={onSelectAll}
            title={t.selectAllTitle}
          >
            {t.selectAll}
          </button>
          {hasUncovered && (
            <button
              type="button"
              className="odm-btn odm-btn-sm odm-btn-highlight"
              onClick={onSelectUncovered}
              title={t.selectUncoveredTitle}
            >
              {t.selectUncovered}
            </button>
          )}
          {selectedIds.length > 0 && (
            <button
              type="button"
              className="odm-btn odm-btn-sm"
              onClick={onDeselectAll}
              title={t.deselectTitle}
            >
              {t.deselect}
            </button>
          )}
        </div>
      </header>

      <div className="odm-or-card-body odm-checklist-selection-body">
        {showRepeatHint && (
          <p className="odm-checklist-repeat-hint" role="note">
            {t.allAssignedHint}
          </p>
        )}
        {items.length === 0 ? (
          <div className="odm-checklist-empty-note">
            <p>{t.empty}</p>
          </div>
        ) : (
          <div className="odm-checklist-items-grid mgr-scroll-list">
            {items.map((item) => {
              const isChecked = selectedIds.includes(item.id)
              const isUncovered = !plan || uncoveredItemIds.includes(item.id)
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
                            {t.uncovered}
                          </span>
                        ) : (
                          <span className="odm-badge odm-badge-assigned">
                            {t.assigned(
                              assignedMission?.scopeLabel || t.otherMission,
                            )}
                          </span>
                        )}
                        <span className="odm-badge odm-badge-source">
                          {item.sourceType === 'SERVICE_TEMPLATE'
                            ? t.sourceTemplate
                            : t.sourceCustom}
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
                          {t.evidenceType}{' '}
                          <strong>
                            {t.evidenceTypes[item.requiredEvidenceType] ??
                              item.requiredEvidenceType}
                          </strong>
                        </span>
                      )}
                      {item.minimumEvidenceCount !== undefined &&
                        item.minimumEvidenceCount > 0 && (
                          <span>
                            · {t.minEvidence(item.minimumEvidenceCount)}
                          </span>
                        )}
                      {(item.minimumImageCount ?? 0) > 0 && (
                        <span>· {t.images(item.minimumImageCount ?? 0)}</span>
                      )}
                      {(item.minimumVideoCount ?? 0) > 0 && (
                        <span>· {t.videos(item.minimumVideoCount ?? 0)}</span>
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
