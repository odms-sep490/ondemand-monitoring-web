import {
  AppstoreOutlined,
  BellOutlined,
  CalendarOutlined,
  CompassOutlined,
  CustomerServiceOutlined,
  RocketOutlined,
  ToolOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'

import type { OperatorSidebarMessages } from '../../OperatorSidebar.messages'
import type { OperatorRoute, OperatorScreen } from '../../routes'

export type OperatorNavItemKey = keyof OperatorSidebarMessages['nav']
export type OperatorNavGroupKey = keyof OperatorSidebarMessages['groups']

export type OperatorNavItem = {
  key: OperatorNavItemKey
  icon: ReactNode
  route: OperatorRoute
  /** Which count badge (if any) this item shows. */
  badge?: 'pending' | 'notifications'
}

export type OperatorNavGroup = {
  key: OperatorNavGroupKey
  items: OperatorNavItem[]
}

export const NAV_GROUPS: OperatorNavGroup[] = [
  {
    key: 'work',
    items: [
      { key: 'missions', icon: <RocketOutlined />, route: { screen: 'missions' }, badge: 'pending' },
      { key: 'support', icon: <CustomerServiceOutlined />, route: { screen: 'support' } },
      { key: 'availability', icon: <CalendarOutlined />, route: { screen: 'availability' } },
    ],
  },
  {
    key: 'technical',
    items: [
      { key: 'technical', icon: <AppstoreOutlined />, route: { screen: 'technical' } },
      { key: 'devices', icon: <VideoCameraOutlined />, route: { screen: 'devices' } },
      { key: 'maintenance', icon: <ToolOutlined />, route: { screen: 'maintenance' } },
    ],
  },
  {
    key: 'flight',
    items: [{ key: 'zoneMap', icon: <CompassOutlined />, route: { screen: 'zoneMap' } }],
  },
  {
    key: 'account',
    items: [
      {
        key: 'notifications',
        icon: <BellOutlined />,
        route: { screen: 'notifications' },
        badge: 'notifications',
      },
      { key: 'profile', icon: <UserOutlined />, route: { screen: 'profile' } },
    ],
  },
]

/**
 * Which nav item highlights as active for each parsed screen (missionDetail
 * falls back to the "missions" item, same as the old label-based match).
 */
export const activeNavKey: Record<OperatorScreen, OperatorNavItemKey | null> = {
  missions: 'missions',
  missionDetail: 'missions',
  availability: 'availability',
  connect: null,
  handover: null,
  preflight: null,
  flight: null,
  upload: null,
  postflight: null,
  technical: 'technical',
  devices: 'devices',
  support: 'support',
  maintenance: 'maintenance',
  zoneMap: 'zoneMap',
  notifications: 'notifications',
  profile: 'profile',
  notFound: null,
}
