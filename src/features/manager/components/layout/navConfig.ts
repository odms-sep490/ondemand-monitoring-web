import type { ManagerRoute, ManagerScreen } from '../../routes'
import type { ManagerIconName } from '../common/ManagerIcon'
import type { managerLayoutMessages } from '../../ManagerLayout.messages'

export type SidebarKey = keyof (typeof managerLayoutMessages)['vi']['sidebar']

export type NavItem = {
  label: SidebarKey
  icon: ManagerIconName
  route?: ManagerRoute
  href?: string
  /** Key into `counts` for the numeric badge, when this item has one. */
  countKey?: 'pendingOrders'
}

export type NavGroup = { label: SidebarKey; items: NavItem[] }

export type ManagerNavCounts = {
  pendingOrders?: number
}

// Groups + items copied from the sidebar markup shared by every MNG-*.dc.html
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'groupOperations',
    items: [
      { label: 'dashboard', icon: 'dashboard', route: { screen: 'dashboard' } },
      {
        label: 'orders',
        icon: 'order-queue',
        route: { screen: 'orderQueue' },
        countKey: 'pendingOrders',
      },
      { label: 'missions', icon: 'mission', route: { screen: 'missions' } },
      { label: 'schedule', icon: 'schedule', route: { screen: 'schedule' } },
    ],
  },
  {
    label: 'groupSupport',
    items: [
      { label: 'support', icon: 'reports', href: '#portal/manager/support' },
    ],
  },
  {
    label: 'groupResources',
    items: [
      { label: 'drones', icon: 'drones', route: { screen: 'drones' } },
      {
        label: 'maintenance',
        icon: 'maintenance',
        route: { screen: 'maintenance' },
      },
    ],
  },
]

// Which nav item highlights as active for each parsed screen — screens that
// aren't reachable directly from the sidebar (order review, mission
// create/dispatch) highlight the item their flow started from.
export const activeNavLabel: Record<ManagerScreen, SidebarKey | ''> = {
  dashboard: 'dashboard',
  orderQueue: 'orders',
  orderReview: 'orders',
  orderResults: 'orders',
  missionCreate: 'orders',
  missionDispatch: 'missions',
  missionSetup: 'missions',
  missionDetail: 'missions',
  schedule: 'schedule',
  missions: 'missions',
  drones: 'drones',
  maintenance: 'maintenance',
  support: 'support',
  notFound: '',
}
