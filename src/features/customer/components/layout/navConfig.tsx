import {
  CameraOutlined,
  FileTextOutlined,
  PlusCircleOutlined,
  QuestionCircleOutlined,
  ShoppingOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'

import type { CustomerRoute, CustomerScreen } from '../../routes'
import type { customerLayoutMessages } from '../../CustomerLayout.messages'

export type CustomerNavItemKey =
  keyof (typeof customerLayoutMessages)['vi']['navItems']
export type CustomerNavGroupKey =
  keyof (typeof customerLayoutMessages)['vi']['groups']

export type NavItem = {
  key: CustomerNavItemKey
  icon: ReactNode
  route?: CustomerRoute
  href?: string
}

export type NavGroup = { key: CustomerNavGroupKey; items: NavItem[] }

export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'monitoring',
    items: [
      {
        key: 'orders',
        icon: <ShoppingOutlined />,
        route: { screen: 'orders' },
      },
      {
        key: 'createOrder',
        icon: <PlusCircleOutlined />,
        route: { screen: 'createOrder' },
      },
      {
        key: 'mediaLibrary',
        icon: <CameraOutlined />,
        route: { screen: 'mediaLibrary' },
      },
    ],
  },
  {
    key: 'support',
    items: [
      { key: 'help', icon: <QuestionCircleOutlined />, href: '#help' },
      { key: 'support', icon: <FileTextOutlined />, href: '#help/tickets' },
    ],
  },
]

/** Which sidebar item highlights for each parsed screen. */
export const activeNavKey: Record<CustomerScreen, CustomerNavItemKey | null> = {
  missionHistory: 'missionHistory',
  missionHistoryDetail: 'missionHistory',
  missionReport: 'orders',
  dashboard: 'orders',
  orders: 'orders',
  createOrder: 'createOrder',
  orderDetail: 'orders',
  live: null,
  liveHub: null,
  media: 'mediaLibrary',
  mediaLibrary: 'mediaLibrary',
  mediaDetail: 'mediaLibrary',
  notifications: null,
  notFound: null,
}
