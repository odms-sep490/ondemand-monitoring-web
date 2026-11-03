import { useEffect, useMemo, useState } from 'react'

import { Button, Skeleton } from 'antd'
import { ReloadOutlined, RocketOutlined } from '@ant-design/icons'

import { CardComponent } from '../../../../shared/components/antd'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { displayOrderCode } from '../../../../shared/lib/orderCode'
import { financeApi } from '../../../finance/api'
import type { DepositStatus } from '../../../finance/types'
import { ordersApi } from '../../api/ordersApi'
import { planningApi } from '../../api/planningApi'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { FilterBar, FilterSegments } from '../../components/common/FilterBar'
import { PageHeader } from '../../components/common/PageHeader'
import { managerHref } from '../../routes'
import type { OrderCreateResponse } from '../../types/orders'
import { QueueKpis } from './components/QueueKpis'
import { QueueSkeleton } from './components/QueueSkeleton'
import { QueueTable, type QueueTableMode } from './components/QueueTable'
import { orderQueuePageMessages } from './OrderQueuePage.messages'
import { ALL_FILTERS } from './queueHelpers'

function matchesSearch(order: OrderCreateResponse, search: string): boolean {
  const needle = search.trim().toLowerCase()
  if (!needle) return true
  return [displayOrderCode(order.orderCode, order.id), order.customerName, order.serviceName]
    .join(' ')
    .toLowerCase()
    .includes(needle)
}

export function OrderQueuePage() {
  const { t } = useI18n(orderQueuePageMessages)
  const [tab, setTab] = useState<QueueTableMode | null>(null)
  const [filter, setFilter] = useState<(typeof ALL_FILTERS)[number]>('ALL')
  const [search, setSearch] = useState('')

  const query = useApiQuery(async (signal) => {
    const [pending, approved] = await Promise.all([
      ordersApi.getQueue(signal),
      ordersApi.getApproved(signal),
    ])
    const invoices = (
      await Promise.all(
        approved.map(async (order) => {
          try {
            const invoice = await financeApi.getManagerInvoice(order.id, signal)
            const depositStatus = invoice.depositStatus ??
              (invoice.paidAmount >= invoice.depositAmount ? 'DEPOSIT_PAID' : 'WAITING_DEPOSIT')
            return { order, depositStatus }
          } catch {
            return null
          }
        }),
      )
    ).filter((row): row is { order: OrderCreateResponse; depositStatus: DepositStatus } => row !== null)
    const depositStatusByOrder = Object.fromEntries(
      invoices.map(({ order, depositStatus }) => [order.id, depositStatus]),
    ) as Record<string, DepositStatus>
    const paid = (
      await Promise.all(
        invoices
          .filter(({ depositStatus }) => depositStatus === 'DEPOSIT_PAID')
          .map(async ({ order }) => {
            try {
              const missions = await planningApi.getOrderMissions(order.id, signal)
              return missions.some((mission) => mission.status !== 'CANCELLED') ? null : order
            } catch {
              return null
            }
          }),
      )
    ).filter((order): order is OrderCreateResponse => order !== null)
    return { pending, paid, depositStatusByOrder }
  }, [])

  // Every order, newest first, so an order never "disappears" once it leaves the review queue.
  const allQuery = useApiQuery(async (signal) => {
    const orders = await ordersApi.getManaged(undefined, signal)
    // An approved order stays APPROVED until its work is done; it is "in progress" once it has a live Mission.
    const started = new Set<string>()
    await Promise.all(
      orders
        .filter((order) => order.orderStatus === 'APPROVED')
        .map(async (order) => {
          try {
            const missions = await planningApi.getOrderMissions(order.id, signal)
            if (missions.some((mission) => mission.status !== 'CANCELLED'))
              started.add(order.id)
          } catch {
            /* keep it under "Đã duyệt" */
          }
        }),
    )
    return { orders, started }
  }, [])

  useEffect(() => {
    const refresh = () => query.reload()
    window.addEventListener('focus', refresh)
    const interval = window.setInterval(refresh, 15_000)
    return () => {
      window.removeEventListener('focus', refresh)
      window.clearInterval(interval)
    }
  }, [query.reload])

  const pendingOrders = query.data?.pending ?? []
  const paidOrders = query.data?.paid ?? []
  const depositStatusByOrder = query.data?.depositStatusByOrder ?? {}
  const allOrders = allQuery.data?.orders
  const started = allQuery.data?.started

  const groupOf = (order: OrderCreateResponse) =>
    order.orderStatus === 'APPROVED' && started?.has(order.id) ? 'IN_PROGRESS' : order.orderStatus

  const kpiExtras = useMemo(() => {
    if (!allOrders || !started || !query.data) return { needsInfo: null, waitingDeposit: null }
    return {
      needsInfo: allOrders.filter((order) => order.orderStatus === 'NEEDS_INFO').length,
      waitingDeposit: Object.values(depositStatusByOrder)
        .filter((status) => status === 'WAITING_DEPOSIT').length,
    }
  }, [allOrders, started, depositStatusByOrder, query.data])

  if (query.loading) return <QueueSkeleton />

  if (query.error) {
    return (
      <div className="mgr-view">
        <PageHeader
          title={t.title}
          actions={<Button icon={<ReloadOutlined aria-hidden="true" />} onClick={query.reload}>{t.refresh}</Button>}
        />
        <ErrorState title={t.loadError} error={query.error} onRetry={query.reload} />
      </div>
    )
  }

  const activeTab: QueueTableMode =
    tab ?? (pendingOrders.length > 0
      ? 'pending'
      : paidOrders.length > 0
        ? 'ready'
        : (kpiExtras.waitingDeposit ?? 0) > 0
          ? 'all'
          : 'pending')

  const filteredAll = (allOrders ?? []).filter((order) =>
    filter === 'ALL'
      ? true
      : filter === 'WAITING_DEPOSIT' || filter === 'DEPOSIT_PAID'
        ? filter === 'WAITING_DEPOSIT'
          ? depositStatusByOrder[order.id] === filter
          : depositStatusByOrder[order.id] === filter
      : filter === 'CLOSED'
        ? order.orderStatus === 'REJECTED' || order.orderStatus === 'CANCELLED'
        : groupOf(order) === filter,
  )
  const source =
    activeTab === 'pending' ? pendingOrders : activeTab === 'ready' ? paidOrders : filteredAll
  const total = activeTab === 'all' ? (allOrders ?? []).length : source.length
  const rows = source.filter((order) => matchesSearch(order, search))

  const missionsLink = (
    <Button icon={<RocketOutlined aria-hidden="true" />} href={managerHref({ screen: 'missions' })}>
      {t.viewMissions}
    </Button>
  )

  let body
  if (activeTab === 'all' && allQuery.loading) {
    body = (
      <CardComponent>
        <Skeleton active paragraph={{ rows: 5 }} />
      </CardComponent>
    )
  } else if (activeTab === 'all' && allQuery.error) {
    body = <ErrorState title={t.allLoadError} error={allQuery.error} onRetry={allQuery.reload} />
  } else if (rows.length === 0) {
    const empty =
      search.trim() && source.length > 0
        ? { title: t.emptySearch }
        : activeTab === 'pending'
          ? { title: t.emptyTitle, description: t.emptyDescription, action: missionsLink }
          : activeTab === 'ready'
            ? { title: t.emptyReady }
            : { title: t.emptyAll }
    body = (
      <CardComponent>
        <EmptyState {...empty} />
      </CardComponent>
    )
  } else {
    body = (
      <QueueTable
        rows={rows}
        total={total}
        mode={activeTab}
        depositStatusByOrder={depositStatusByOrder}
        isInProgress={(order) => groupOf(order) === 'IN_PROGRESS'}
      />
    )
  }

  return (
    <div className="mgr-view">
      <PageHeader
        title={t.title}
        description={t.summary(
          pendingOrders.length,
          paidOrders.length,
          kpiExtras.waitingDeposit ?? 0,
        )}
        actions={
          <>
            {missionsLink}
            <Button icon={<ReloadOutlined aria-hidden="true" />} onClick={query.reload}>
              {t.refresh}
            </Button>
          </>
        }
      />

      <QueueKpis
        pending={pendingOrders.length}
        ready={paidOrders.length}
        needsInfo={kpiExtras.needsInfo}
        waitingDeposit={kpiExtras.waitingDeposit}
      />

      <FilterBar
        start={
          <FilterSegments<QueueTableMode>
            ariaLabel={t.tabs.aria}
            value={activeTab}
            onChange={setTab}
            options={[
              { value: 'pending', label: t.tabs.pending, count: pendingOrders.length },
              { value: 'ready', label: t.tabs.ready, count: paidOrders.length },
              { value: 'all', label: t.tabs.all, count: allOrders?.length },
            ]}
          />
        }
        search={{
          value: search,
          onChange: setSearch,
          placeholder: t.searchPlaceholder,
          ariaLabel: t.searchAria,
        }}
        end={
          activeTab === 'all' ? (
            <FilterSegments
              ariaLabel={t.filtersAria}
              value={filter}
              onChange={setFilter}
              options={ALL_FILTERS.map((value) => ({ value, label: t.filters[value] }))}
            />
          ) : null
        }
      />

      {body}
    </div>
  )
}
