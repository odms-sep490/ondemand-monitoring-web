import { Badge, Button, Tag } from 'antd'
import { useState } from 'react'

import {
  CardComponent,
  EmptyState,
} from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { managerHref } from '../../../routes'
import type { ActionItem } from '../../../types/dashboard'
import { dashboardPageMessages } from '../DashboardPage.messages'
import {
  actionItemRoute,
  formatAge,
  groupActionItems,
  statusLabel,
} from '../dashboardHelpers'
import { MANAGER_COLORS } from '../../../theme/managerTheme'

const MAX_VISIBLE_ACTION_ITEMS = 6

const PRIORITY_COLOR = {
  HIGH: MANAGER_COLORS.danger,
  MEDIUM: MANAGER_COLORS.warning,
  LOW: '#94A3B8',
} as const

export function ActionListCard({
  items,
  itemsAvailable,
  generatedAt,
}: {
  items: ActionItem[]
  itemsAvailable: boolean
  generatedAt: string
}) {
  const { t, locale } = useI18n(dashboardPageMessages)
  const a = t.actions
  const [filter, setFilter] = useState<string>('ALL')
  const [isExpanded, setIsExpanded] = useState(false)
  const groups = groupActionItems(items)
  const active = groups.find((g) => g.type === filter)
  const selectedGroups = active ? [active] : groups
  const selectedItems = selectedGroups.flatMap((group) => group.items)
  const visibleItems = isExpanded
    ? selectedItems
    : selectedItems.slice(0, MAX_VISIBLE_ACTION_ITEMS)
  const visibleIds = new Set(visibleItems.map((item) => item.id))
  const visible = selectedGroups
    .map((group) => ({
      ...group,
      totalCount: group.items.length,
      items: group.items.filter((item) => visibleIds.has(item.id)),
    }))
    .filter((group) => group.items.length > 0)
  const hiddenCount = selectedItems.length - visibleItems.length
  const typeLabel = (type: string) => a.types[type] ?? statusLabel(type)

  return (
    <CardComponent
      title={a.title}
      className="mgr-action-card"
      extra={
        <Badge count={items.length} showZero color={MANAGER_COLORS.primary} />
      }
    >
      {!itemsAvailable ? (
        <div className="mgr-empty-fill">
          <EmptyState title={a.unavailable} />
        </div>
      ) : items.length === 0 ? (
        <div className="mgr-empty-fill">
          <EmptyState
            title={a.empty}
            description={a.emptyDescription}
          />
        </div>
      ) : (
        <>
          {groups.length > 1 ? (
            <div
              className="mgr-filter-row"
              role="group"
              aria-label={a.filterLabel}
            >
              <Button
                size="small"
                type={filter === 'ALL' ? 'primary' : 'default'}
                aria-pressed={filter === 'ALL'}
                onClick={() => {
                  setFilter('ALL')
                  setIsExpanded(false)
                }}
              >
                {a.all} <span>{items.length}</span>
              </Button>
              {groups.map((g) => (
                <Button
                  key={g.type}
                  size="small"
                  type={filter === g.type ? 'primary' : 'default'}
                  aria-pressed={filter === g.type}
                  onClick={() => {
                    setFilter(g.type)
                    setIsExpanded(false)
                  }}
                >
                  {typeLabel(g.type)} <span>{g.items.length}</span>
                </Button>
              ))}
            </div>
          ) : null}
          <div className="mgr-scroll-list">
            {visible.map((g) => (
              <section key={g.type}>
                {groups.length > 1 && !active ? (
                  <h4 className="mgr-group-title">
                    {typeLabel(g.type)}{' '}
                    <Tag bordered={false}>{g.totalCount}</Tag>
                  </h4>
                ) : null}
                <ul className="m-0 list-none p-0">
                  {g.items.map((item) => (
                    <li key={item.id} className="mgr-dash-row">
                      <span
                        className="mgr-prio"
                        style={{
                          background: PRIORITY_COLOR[item.priority ?? 'MEDIUM'],
                          color: PRIORITY_COLOR[item.priority ?? 'MEDIUM'],
                        }}
                        aria-hidden="true"
                      />
                      <div className="mgr-dash-row-main">
                        <div className="mgr-dash-row-title">{item.title}</div>
                        {item.description ? (
                          <div className="mgr-dash-row-description">
                            {item.description}
                          </div>
                        ) : null}
                        <div className="mgr-dash-row-meta">
                          {[
                            item.orderCode ?? item.code,
                            formatAge(
                              item.createdAt,
                              generatedAt,
                              locale,
                              t.age.now,
                            ),
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      </div>
                      <Button
                        size="small"
                        href={managerHref(actionItemRoute(item))}
                      >
                        {item.actionType ? a[item.actionType] : a.view}
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          {selectedItems.length > MAX_VISIBLE_ACTION_ITEMS ? (
            <Button
              type="link"
              size="small"
              className="mgr-action-more"
              aria-expanded={isExpanded}
              onClick={() => setIsExpanded((expanded) => !expanded)}
            >
              {isExpanded ? a.showLess : a.showMore(hiddenCount)}
            </Button>
          ) : null}
        </>
      )}
    </CardComponent>
  )
}
