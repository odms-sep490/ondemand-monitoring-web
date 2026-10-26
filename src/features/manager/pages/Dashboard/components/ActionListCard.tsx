import { ThunderboltOutlined } from '@ant-design/icons'
import { Badge, Button, Empty, Tag } from 'antd'
import { useState } from 'react'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { managerHref } from '../../../routes'
import type { ActionItem } from '../../../types/dashboard'
import { dashboardPageMessages } from '../DashboardPage.messages'
import { actionItemRoute, formatAge, groupActionItems, statusLabel } from '../dashboardHelpers'
import { MANAGER_COLORS } from '../../../theme/managerTheme'

const PRIORITY_COLOR = {
  HIGH: MANAGER_COLORS.danger,
  MEDIUM: MANAGER_COLORS.warning,
  LOW: '#94A3B8',
} as const

export function ActionListCard({ items, generatedAt }: { items: ActionItem[]; generatedAt: string }) {
  const { t, locale } = useI18n(dashboardPageMessages)
  const a = t.actions
  const [filter, setFilter] = useState<string>('ALL')
  const groups = groupActionItems(items)
  const active = groups.find((g) => g.type === filter)
  const visible = active ? [active] : groups
  const typeLabel = (type: string) => a.types[type] ?? statusLabel(type)

  return (
    <CardComponent
      title={a.title}
      icon={<ThunderboltOutlined />}
      tone="amber"
      extra={items.length > 0 ? <Badge count={items.length} color={MANAGER_COLORS.primary} /> : undefined}
    >
      {items.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={a.empty} />
      ) : (
        <>
          {groups.length > 1 ? (
            <div className="mgr-filter-row" role="group" aria-label={a.filterLabel}>
              <Button size="small" type={filter === 'ALL' ? 'primary' : 'default'}
                aria-pressed={filter === 'ALL'} onClick={() => setFilter('ALL')}>
                {a.all} <span>{items.length}</span>
              </Button>
              {groups.map((g) => (
                <Button key={g.type} size="small" type={filter === g.type ? 'primary' : 'default'}
                  aria-pressed={filter === g.type} onClick={() => setFilter(g.type)}>
                  {typeLabel(g.type)} <span>{g.items.length}</span>
                </Button>
              ))}
            </div>
          ) : null}
          {visible.map((g) => (
            <section key={g.type}>
              {groups.length > 1 && !active ? (
                <h4 className="mgr-group-title">
                  {typeLabel(g.type)} <Tag bordered={false}>{g.items.length}</Tag>
                </h4>
              ) : null}
              <ul className="m-0 list-none p-0">
                {g.items.map((item) => (
                  <li key={item.id} className="mgr-dash-row">
                    <span className="mgr-prio" style={{ background: PRIORITY_COLOR[item.priority ?? 'MEDIUM'], color: PRIORITY_COLOR[item.priority ?? 'MEDIUM'] }} aria-hidden="true" />
                    <div className="mgr-dash-row-main">
                      <div className="mgr-dash-row-title">{item.title}</div>
                      <div className="mgr-dash-row-meta">
                        {[item.orderCode ?? item.code, formatAge(item.createdAt, generatedAt, locale, t.age.now)].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <Button size="small" type="primary" href={managerHref(actionItemRoute(item))}>
                      {item.actionType ? a[item.actionType] : a.view}
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </CardComponent>
  )
}
