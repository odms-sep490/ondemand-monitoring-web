import {
  AppstoreOutlined,
  CheckSquareOutlined,
  LockOutlined,
  RobotOutlined,
  TeamOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import { Skeleton } from 'antd'
import type { ReactNode } from 'react'

import { StatisticComponent } from '../../../../../shared/components/antd'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import type { AccountStats } from '../../../lib/accountStats'
import { adminHref, type AdminRoute } from '../../../routes'
import { adminDashboardPageMessages } from '../AdminDashboardPage.messages'
import type {
  CatalogSummary,
  ChecklistSummary,
  DeviceSummary,
  RecentAccounts,
} from '../dashboardData'
import { countCreatedSince } from '../dashboardStats'

type Props = {
  stats: UseApiQueryState<AccountStats>
  recent: UseApiQueryState<RecentAccounts>
  devices: UseApiQueryState<DeviceSummary>
  catalog: UseApiQueryState<CatalogSummary>
  checklists: UseApiQueryState<ChecklistSummary>
  now: Date
}

const SKELETON = () => <Skeleton.Button active size="small" aria-busy="true" />
const UNAVAILABLE = () => <span aria-hidden="true">–</span>

function Kpi({ route, children }: { route: AdminRoute; children: ReactNode }) {
  return (
    <a className="mgr-dash-kpi" href={adminHref(route)}>
      {children}
    </a>
  )
}

/** Six coloured KPI cards; each reads only its own source and degrades alone. */
export function DashboardKpis({
  stats,
  recent,
  devices,
  catalog,
  checklists,
  now,
}: Props) {
  const { t } = useI18n(adminDashboardPageMessages)
  const k = t.kpi
  const s = stats.data
  const g = devices.data?.groups
  const c = catalog.data
  const cl = checklists.data

  // Every card: value (or skeleton / dash), tone and hint derived from one source.
  const state = (q: UseApiQueryState<unknown>, value: number | undefined) =>
    ({
      value,
      formatter:
        value !== undefined ? undefined : q.error ? UNAVAILABLE : SKELETON,
    }) as const
  const newIn30 = recent.data
    ? countCreatedSince(recent.data.items, 30, now)
    : undefined

  return (
    <div className="mgr-kpi-grid">
      <Kpi route={{ screen: 'accounts' }}>
        <StatisticComponent
          index={0}
          tone="blue"
          icon={<TeamOutlined aria-hidden="true" aria-label={undefined} />}
          title={k.accounts}
          {...state(stats, s?.total)}
          hint={newIn30 !== undefined ? k.accountsHint(newIn30) : undefined}
        />
      </Kpi>
      <Kpi route={{ screen: 'accounts' }}>
        <StatisticComponent
          index={1}
          tone={s && s.locked > 0 ? 'amber' : 'green'}
          icon={<LockOutlined aria-hidden="true" aria-label={undefined} />}
          title={k.locked}
          {...state(stats, s?.locked)}
          hint={s ? k.lockedHint(s.unverified) : undefined}
        />
      </Kpi>
      <Kpi route={{ screen: 'devices' }}>
        <StatisticComponent
          index={2}
          tone="green"
          icon={<RobotOutlined aria-hidden="true" aria-label={undefined} />}
          title={k.devicesReady}
          {...state(devices, g?.ready)}
          suffix={g ? k.devicesTotal(g.total) : undefined}
          hint={g ? k.devicesHint(g.active) : undefined}
        />
      </Kpi>
      <Kpi route={{ screen: 'devices' }}>
        <StatisticComponent
          index={3}
          tone={g && g.maintenance + g.offline > 0 ? 'red' : 'violet'}
          icon={<ToolOutlined aria-hidden="true" aria-label={undefined} />}
          title={k.devicesAttention}
          {...state(devices, g ? g.maintenance + g.offline : undefined)}
          hint={
            g ? k.devicesAttentionHint(g.maintenance, g.offline) : undefined
          }
        />
      </Kpi>
      <Kpi route={{ screen: 'catalog' }}>
        <StatisticComponent
          index={4}
          tone="violet"
          icon={<AppstoreOutlined aria-hidden="true" aria-label={undefined} />}
          title={k.services}
          {...state(catalog, c?.active)}
          hint={c ? k.servicesHint(c.inactive) : undefined}
        />
      </Kpi>
      <Kpi route={{ screen: 'checklists' }}>
        <StatisticComponent
          index={5}
          tone="blue"
          icon={
            <CheckSquareOutlined aria-hidden="true" aria-label={undefined} />
          }
          title={k.checklists}
          {...state(checklists, cl?.active)}
          hint={cl ? k.checklistsHint(cl.inactive) : undefined}
        />
      </Kpi>
    </div>
  )
}
