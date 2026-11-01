import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
} from '@ant-design/icons'

import { CardComponent } from '../../../../../shared/components/antd'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { BarChartCard } from '../../../../manager/pages/Dashboard/components/charts/BarChartCard'
import { DonutChart } from '../../../../manager/pages/Dashboard/components/charts/DonutChart'
import { BE_USER_ROLES } from '../../../api/adminUsersApi'
import { roleBadgeMessages } from '../../../components/common/RoleBadge.messages'
import type { AccountStats } from '../../../lib/accountStats'
import { adminDashboardPageMessages } from '../AdminDashboardPage.messages'
import type { DeviceSummary, RecentAccounts } from '../dashboardData'
import {
  DEVICE_GROUPS,
  weeklyCounts,
  type DeviceGroupKey,
} from '../dashboardStats'
import { ColumnChart } from './charts/ColumnChart'
import { QueryBody } from './QueryBody'

const WEEKS = 8

type Props = {
  stats: UseApiQueryState<AccountStats>
  recent: UseApiQueryState<RecentAccounts>
  devices: UseApiQueryState<DeviceSummary>
  now: Date
}

/** Roles donut, weekly new-accounts columns and device-group bars. */
export function DashboardCharts({ stats, recent, devices, now }: Props) {
  const { t, locale } = useI18n(adminDashboardPageMessages)
  const { t: roles } = useI18n(roleBadgeMessages)
  const c = t.charts
  const fmt = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
  })

  return (
    <>
      <div className="adm-dash-pair">
        <CardComponent
          title={c.roles}
          icon={<PieChartOutlined aria-hidden="true" aria-label={undefined} />}
          tone="violet"
        >
          <QueryBody query={stats} rows={5}>
            {(s) => (
              <DonutChart
                points={BE_USER_ROLES.map((r) => ({
                  label: roles.labels[r],
                  value: s.byRole[r],
                }))}
                empty={c.rolesEmpty}
                ariaLabel={c.rolesAria}
              />
            )}
          </QueryBody>
        </CardComponent>
        <CardComponent
          title={c.devices}
          icon={<BarChartOutlined aria-hidden="true" aria-label={undefined} />}
          tone="green"
        >
          <QueryBody query={devices} rows={5}>
            {(d) => (
              <BarChartCard
                points={(Object.keys(DEVICE_GROUPS) as DeviceGroupKey[]).map(
                  (k) => ({
                    label: c.groups[k],
                    value: d.groups[k],
                  }),
                )}
                empty={c.devicesEmpty}
                ariaLabel={c.devicesAria}
              />
            )}
          </QueryBody>
        </CardComponent>
      </div>
      <CardComponent
        title={c.weekly}
        icon={<LineChartOutlined aria-hidden="true" aria-label={undefined} />}
        tone="blue"
      >
        <QueryBody query={recent} rows={5}>
          {(r) => (
            <>
              <ColumnChart
                points={weeklyCounts(r.items, WEEKS, now).map((p) => ({
                  label: fmt.format(p.start),
                  value: p.count,
                }))}
                name={c.weeklyName}
                empty={c.rolesEmpty}
                ariaLabel={c.weeklyAria}
              />
              {r.totalItems > r.items.length ? (
                <p className="adm-muted">{c.weeklyNote(r.items.length)}</p>
              ) : null}
            </>
          )}
        </QueryBody>
      </CardComponent>
    </>
  )
}
