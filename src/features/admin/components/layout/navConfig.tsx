import {
  AppstoreOutlined,
  CheckSquareOutlined,
  ControlOutlined,
  DashboardOutlined,
  RobotOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'

import type { AdminRoute, AdminScreen } from '../../routes'

export type AdminNavItemKey =
  | 'dashboard'
  | 'accounts'
  | 'catalog'
  | 'checklists'
  | 'devices'
  | 'operatingConfig'

export type AdminNavItem = {
  key: AdminNavItemKey
  icon: ReactNode
  route: AdminRoute
}

export const NAV_ITEMS: AdminNavItem[] = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined aria-hidden="true" aria-label={undefined} />,
    route: { screen: 'dashboard' },
  },
  {
    key: 'accounts',
    icon: <TeamOutlined aria-hidden="true" aria-label={undefined} />,
    route: { screen: 'accounts' },
  },
  {
    key: 'catalog',
    icon: <AppstoreOutlined aria-hidden="true" aria-label={undefined} />,
    route: { screen: 'catalog' },
  },
  {
    key: 'checklists',
    icon: <CheckSquareOutlined aria-hidden="true" aria-label={undefined} />,
    route: { screen: 'checklists' },
  },
  {
    key: 'devices',
    icon: <RobotOutlined aria-hidden="true" aria-label={undefined} />,
    route: { screen: 'devices' },
  },
  {
    key: 'operatingConfig',
    icon: <ControlOutlined aria-hidden="true" aria-label={undefined} />,
    route: { screen: 'operatingConfig' },
  },
]

// Which nav item highlights as active for each parsed screen.
export const activeNavKey: Record<AdminScreen, AdminNavItemKey | null> = {
  dashboard: 'dashboard',
  accounts: 'accounts',
  createAccount: 'accounts',
  accountDetail: 'accounts',
  catalog: 'catalog',
  checklists: 'checklists',
  serviceChecklists: 'catalog',
  devices: 'devices',
  operatingConfig: 'operatingConfig',
  notFound: null,
}
