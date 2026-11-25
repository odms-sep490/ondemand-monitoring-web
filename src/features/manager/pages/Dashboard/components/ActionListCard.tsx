import {
  AuditOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  FileProtectOutlined,
  ScheduleOutlined,
} from '@ant-design/icons'
import { Badge, Button, Tag } from 'antd'
import { useState, type ReactNode } from 'react'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { managerHref } from '../../../routes'
import { MANAGER_COLORS } from '../../../theme/managerTheme'
import type { ActionItem } from '../../../types/dashboard'
import { dashboardPageMessages } from '../DashboardPage.messages'
import {
  actionItemRoute,
  formatAge,
  groupActionItems,
  statusLabel,
} from '../dashboardHelpers'
import { DashboardEmptyState } from './DashboardEmptyState'

const MAX_VISIBLE_ACTION_ITEMS = 6

const PRIORITY_COLOR = {
  HIGH: MANAGER_COLORS.danger,
  MEDIUM: MANAGER_COLORS.warning,
  LOW: '#94A3B8',
} as const

function taskTypeIcon(type: string): ReactNode {
  switch (type) {
    case 'ADDITIONAL_CHECKLIST_PRICING':
    case 'QUOTE_READY':
      return <DollarOutlined />
    case 'CONTRACT_REVIEW':
      return <FileProtectOutlined />
    case 'RESULT_REVIEW':
      return <AuditOutlined />
    case 'RESOURCE_MISSING':
      return <ExclamationCircleOutlined />
    default:
      return <ScheduleOutlined />
  }
}

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
        <Badge
          count={items.length}
          showZero
          color={items.length > 0 ? MANAGER_COLORS.primary : '#94A3B8'}
        />
      }
    >
      {!itemsAvailable ? (
        <DashboardEmptyState variant="NO_DATA" title={a.unavailable} />
      ) : items.length === 0 ? (
        <DashboardEmptyState
          variant="ALL_CAUGHT_UP"
          title={a.empty}
          description={a.emptyDescription}
        />
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
                  {g.items.map((item) => {
                    const prio = item.priority ?? 'MEDIUM'
                    const prioColor = PRIORITY_COLOR[prio]
                    const code = item.orderCode ?? item.code
                    const age = formatAge(
                      item.createdAt,
                      generatedAt,
                      locale,
                      t.age.now,
                    )
                    return (
                      <li key={item.id} className="mgr-dash-row mgr-task-row">
                        <span
                          className="mgr-task-icon"
                          style={{
                            color: prioColor,
                            background: `${prioColor}14`,
                          }}
                          aria-hidden="true"
                        >
                          {taskTypeIcon(item.type)}
                        </span>
                        <div className="mgr-dash-row-main">
                          <div className="mgr-dash-row-title">{item.title}</div>
                          {item.description ? (
                            <div className="mgr-dash-row-description">
                              {item.description}
                            </div>
                          ) : null}
                          <div className="mgr-dash-row-meta">
                            {code ? (
                              <span className="mgr-task-code">{code}</span>
                            ) : null}
                            {age ? <span>{age}</span> : null}
                          </div>
                        </div>
                        <Button
                          size="small"
                          type={prio === 'HIGH' ? 'primary' : 'default'}
                          href={managerHref(actionItemRoute(item))}
                        >
                          {[
                            'ORDER_PLANNING',
                            'MISSION_PLANNING',
                            'CONTRACT_REVIEW',
                            'RESULT_REVIEW',
                            'RESOURCE_MISSING',
                          ].includes(item.type)
                            ? typeLabel(item.type)
                            : item.actionType
                              ? a[item.actionType]
                              : a.view}
                        </Button>
                      </li>
                    )
                  })}
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
