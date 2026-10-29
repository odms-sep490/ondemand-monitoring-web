import {
  BellOutlined,
  CameraOutlined,
  FileTextOutlined,
  HistoryOutlined,
  HomeOutlined,
  PlusCircleOutlined,
  QuestionCircleOutlined,
  ShoppingOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'

import type { CustomerRoute, CustomerScreen } from '../../routes'
import type { customerLayoutMessages } from '../../CustomerLayout.messages'

export type CustomerNavItemKey = keyof (typeof customerLayoutMessages)['vi']['navItems']
export type CustomerNavGroupKey = keyof (typeof customerLayoutMessages)['vi']['groups']

export type NavItem = {
  key: CustomerNavItemKey
  icon: ReactNode
  route?: CustomerRoute
  href?: string
  newMediaBadge?: boolean
}

export type NavGroup = { key: CustomerNavGroupKey; items: NavItem[] }

export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'monitoring',
    items: [
      { key: 'dashboard', icon: <HomeOutlined />, route: { screen: 'dashboard' } },
      { key: 'orders', icon: <ShoppingOutlined />, route: { screen: 'orders' } },
      { key: 'createOrder', icon: <PlusCircleOutlined />, route: { screen: 'createOrder' } },
      { key: 'missionHistory', icon: <HistoryOutlined />, route: { screen: 'missionHistory' } },
      {
        key: 'mediaLibrary',
        icon: <CameraOutlined />,
        route: { screen: 'mediaLibrary' },
        newMediaBadge: true,
      },
    ],
  },
  {
    key: 'support',
    items: [
      { key: 'help', icon: <QuestionCircleOutlined />, href: '#help' },
      { key: 'support', icon: <FileTextOutlined />, href: '#help/tickets' },
      { key: 'notifications', icon: <BellOutlined />, route: { screen: 'notifications' } },
    ],
  },
]

/** Which sidebar item highlights for each parsed screen. */
export const activeNavKey: Record<CustomerScreen, CustomerNavItemKey | null> = {
  missionHistory: 'missionHistory',
  missionHistoryDetail: 'missionHistory',
  missionReport: 'orders',
  dashboard: 'dashboard',
  orders: 'orders',
  createOrder: 'createOrder',
  orderDetail: 'orders',
  live: null,
  liveHub: null,
  media: 'mediaLibrary',
  mediaLibrary: 'mediaLibrary',
  mediaDetail: 'mediaLibrary',
  notifications: 'notifications',
  notFound: null,
}
