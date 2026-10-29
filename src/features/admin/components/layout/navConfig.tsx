import {
  AuditOutlined,
  ControlOutlined,
  ProfileOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'

import type { AdminRoute, AdminScreen } from '../../routes'

export type AdminNavItemKey =
  | 'accounts'
  | 'roles'
  | 'catalog'
  | 'checklists'
  | 'operatingConfig'
  | 'auditLog'

export type AdminNavItem = {
  key: AdminNavItemKey
  icon: ReactNode
  route: AdminRoute
}

export const NAV_ITEMS: AdminNavItem[] = [
  { key: 'accounts', icon: <TeamOutlined />, route: { screen: 'accounts' } },
  { key: 'roles', icon: <SafetyCertificateOutlined />, route: { screen: 'roles' } },
  { key: 'catalog', icon: <UnorderedListOutlined />, route: { screen: 'catalog' } },
  { key: 'checklists', icon: <ProfileOutlined />, route: { screen: 'checklists' } },
  { key: 'operatingConfig', icon: <ControlOutlined />, route: { screen: 'operatingConfig' } },
  { key: 'auditLog', icon: <AuditOutlined />, route: { screen: 'auditLog' } },
]

// Which nav item highlights as active for each parsed screen.
export const activeNavKey: Record<AdminScreen, AdminNavItemKey | null> = {
  dashboard: null,
  accounts: 'accounts',
  createAccount: 'accounts',
  accountDetail: 'accounts',
  roles: 'roles',
  catalog: 'catalog',
  checklists: 'checklists',
  serviceChecklists: 'catalog',
  operatingConfig: 'operatingConfig',
  auditLog: 'auditLog',
  notFound: null,
}
