import { Badge, Tabs } from 'antd'
import { Client } from '@stomp/stompjs'
import { useCallback, useEffect, useState } from 'react'

import { ErrorState, LoadingState } from '../../components/common/StateView'
import { useI18n } from '../../../../shared/i18n'
import { ContextAwareHelpWidget } from '../../../support/components/ContextAwareHelpWidget'
import { deliveryProgressMessages } from '../../../delivery/deliveryProgress.messages'
import { CustomerDeliveryPanel } from '../../../delivery/CustomerDeliveryPanel'
import type { Delivery } from '../../../delivery/types'
import {
  CustomerFinancePanel,
  type CustomerFinanceState,
} from '../../../finance/CustomerFinance'
import { customerMissionReportApi } from '../../api/customerMissionReportApi'
import { checklistMessages } from '../../lib/checklist/messages'
import { getOrderStatusMeta } from '../../lib/orderStatus'
import { ChecklistSnapshotCard } from '../../components/checklist/ChecklistSnapshotCard'
import { OrderHeader } from './components/OrderHeader'
import { OrderInfoCard } from './components/OrderInfoCard'
import { OrderOverviewVisualCard } from './components/OrderOverviewVisualCard'
import { ReviewNotice } from './components/ReviewNotice'
import { CardTitle } from './components/CardTitle'
import { useOrderDetail } from './hooks/useOrderDetail'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { orderDetailPageMessages } from './OrderDetailPage.messages'
import { authSession } from '../../../auth/api/authApi'
import { env } from '../../../../config/env'
import './OrderDetail.css'

type DetailTab =
  'order' | 'monitoring' | 'finance' | 'contract' | 'payment' | 'support' | 'results'
type CachedDeliveryState = {
  orderId: string
  delivery: Delivery | null
}

type CustomerOrderEvent = {
  eventType: string
  orderId: string
  quoteId?: string | null
  occurredAt?: string
}

function quoteSeenStorageKey(orderId: string) {
  return `customer-order-quote-seen:${orderId}`
}

function getSeenQuoteId(orderId: string) {
  try {
    return window.localStorage.getItem(quoteSeenStorageKey(orderId))
  } catch {
    return null
  }
}

function markQuoteAsSeen(orderId: string, quoteId: string) {
  try {
    window.localStorage.setItem(quoteSeenStorageKey(orderId), quoteId)
  } catch {
    // The live session still clears the badge when browser storage is unavailable.
  }
}

/** Customer order detail backed by `GET /api/orders/{id}`. */
export function OrderDetailPage({ orderId }: { orderId: string }) {
  const { t, lang } = useI18n(orderDetailPageMessages)
  const { t: checklistT } = useI18n(checklistMessages)
  const { t: deliveryT } = useI18n(deliveryProgressMessages)
  const detail = useOrderDetail(orderId)
  const { order } = detail
  const missionQuery = useApiQuery(
    async (signal) => ({
      orderId,
      missions: await customerMissionReportApi.list(orderId, signal),
    }),
    [orderId],
  )
  const [finance, setFinance] = useState<CustomerFinanceState>({
    quote: null,
    invoice: null,
    loading: true,
  })
  const [financeRefreshVersion, setFinanceRefreshVersion] = useState(0)
  const [unreadQuoteId, setUnreadQuoteId] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<{
    orderId: string
    tab: DetailTab
  } | null>(null)
  useEffect(() => {
    const openLinkedTab = () => {
      const tab = new URLSearchParams(window.location.hash.split('?')[1]).get('tab')
      if (tab === 'contract' || tab === 'finance' || tab === 'payment') {
        setSelectedTab({ orderId, tab })
      }
    }
    openLinkedTab()
    window.addEventListener('hashchange', openLinkedTab)
    return () => window.removeEventListener('hashchange', openLinkedTab)
  }, [orderId])
  const [deliveryState, setDeliveryState] =
    useState<CachedDeliveryState | null>(null)
  const currentMissionData =
    order && missionQuery.data?.orderId === order.id
      ? missionQuery.data
      : undefined
  const missions = currentMissionData?.missions ?? []
  const updateFinance = useCallback((state: CustomerFinanceState) => {
    setFinance(state)
  }, [])

  useEffect(() => {
    if (env.useMockApi) return

    const token = authSession.getAccessToken()
    if (!token) return

    const brokerUrl = new URL('/ws', env.apiBaseUrl)
    brokerUrl.protocol = brokerUrl.protocol === 'https:' ? 'wss:' : 'ws:'

    const client = new Client({
      brokerURL: brokerUrl.toString(),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3_000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      debug: () => undefined,
    })

    client.onConnect = () => {
      client.subscribe('/user/queue/order-events', (message) => {
        let event: CustomerOrderEvent
        try {
          event = JSON.parse(message.body) as CustomerOrderEvent
        } catch {
          return
        }
        if (event.orderId !== orderId) return

        if (event.eventType === 'QUOTE_APPROVED' && event.quoteId) {
          if (getSeenQuoteId(orderId) !== event.quoteId)
            setUnreadQuoteId(event.quoteId)
          setFinanceRefreshVersion((version) => version + 1)
          detail.reload()
          return
        }
      })
    }

    client.activate()
    return () => {
      void client.deactivate()
    }
  }, [detail.reload, orderId])

  useEffect(() => {
    const quote = finance.quote
    if (!quote || quote.status !== 'APPROVED') return
    if (getSeenQuoteId(orderId) === quote.id) setUnreadQuoteId(null)
    else setUnreadQuoteId(quote.id)
  }, [finance.quote?.id, finance.quote?.status, orderId])

  const acknowledgeQuote = useCallback(() => {
    const quoteId = finance.quote?.id ?? unreadQuoteId
    if (quoteId) markQuoteAsSeen(orderId, quoteId)
    setUnreadQuoteId(null)
  }, [finance.quote?.id, orderId, unreadQuoteId])

  const handleTabChange = useCallback(
    (key: string) => {
      setSelectedTab({ orderId, tab: key as DetailTab })
      if (key === 'finance') acknowledgeQuote()
    },
    [acknowledgeQuote, orderId],
  )
  const updateDelivery = useCallback(
    (delivery: Delivery | null) => {
      setDeliveryState({ orderId, delivery })
    },
    [orderId],
  )
  const cachedDelivery =
    deliveryState?.orderId === order?.id ? deliveryState : null

  const hasResults = Boolean(
    order && ['IN_PROGRESS', 'COMPLETED'].includes(order.status),
  )
  const defaultTab: DetailTab =
    order?.status === 'COMPLETED' ? 'results' : 'order'
  const requestedTab =
    order && selectedTab?.orderId === order.id ? selectedTab.tab : undefined
  const activeTab: DetailTab =
    requestedTab && (requestedTab !== 'results' || hasResults)
      ? requestedTab
      : defaultTab

  if (detail.loading && !order) return <LoadingState />
  if (!order || detail.error) {
    return (
      <ErrorState
        title={t.errorTitle}
        error={undefined}
        onRetry={detail.reload}
      />
    )
  }

  const orderContent = (
    <div className="od-order-panel">
      <OrderInfoCard
        order={order}
        canEdit={
          (['PENDING', 'NEEDS_INFO'].includes(order.status) &&
            !(order.status === 'NEEDS_INFO' && order.requestedUpdateScope)) ||
          (order.status === 'APPROVED' &&
            finance.quote?.status !== 'ACCEPTED_BY_CUSTOMER' &&
            !finance.invoice)
        }
        onUpdated={detail.reload}
      />
    </div>
  )
  const monitoringContent = (
    <div className="od-monitoring-panel cus-stack">
      <ChecklistSnapshotCard
        title={<CardTitle icon="drone">{checklistT.title}</CardTitle>}
        items={order.checklistItems}
        snapshotAt={order.checklistSnapshotAt}
        order={order}
        canEdit={
          order.canEditChecklist &&
          ((['PENDING', 'NEEDS_INFO'].includes(order.status) &&
            !(order.status === 'NEEDS_INFO' && order.requestedUpdateScope)) ||
            (order.status === 'APPROVED' &&
              finance.quote?.status !== 'ACCEPTED_BY_CUSTOMER' &&
              !finance.invoice)) &&
          missions.filter((m) => m.status !== 'CANCELLED').length === 0
        }
        blockedReason={
          order.checklistEditBlockedReason ??
          (finance.quote?.status === 'ACCEPTED_BY_CUSTOMER' || finance.invoice
            ? 'QUOTE_ACCEPTED'
            : order.status === 'NEEDS_INFO' && order.requestedUpdateScope
              ? 'NEEDS_INFO_SCOPE_RESTRICTED'
              : missions.some((m) => m.status !== 'CANCELLED')
                ? 'EXECUTION_STARTED'
                : null)
        }
        onUpdated={detail.reload}
      />
      <OrderOverviewVisualCard order={order} />
    </div>
  )
  const financeContent = (
    <div className="od-finance-panel">
      <CustomerFinancePanel
        orderId={order.id}
        legalStatus={order.legalReviewStatus}
        active={activeTab === 'finance' || activeTab === 'payment'}
        section={activeTab === 'contract' ? 'contract' : activeTab === 'payment' ? 'payment' : 'quote'}
        onQuoteAccepted={(invoice) => setSelectedTab({ orderId, tab: invoice.contractRequired && !invoice.contractConfirmedAt ? 'contract' : 'payment' })}
        onOpenContract={() => setSelectedTab({ orderId, tab: 'contract' })}
        onOpenPayment={() => setSelectedTab({ orderId, tab: 'payment' })}
        onStateChange={updateFinance}
        refreshKey={`${order.status}:${order.checklistRevision}:${financeRefreshVersion}`}
      />
    </div>
  )
  const supportContent = (
    <div className="od-support-panel">
      <ContextAwareHelpWidget
        type="ORDER"
        id={order.code}
        status={order.status}
        statusLabel={
          cachedDelivery?.delivery
            ? (deliveryT.status[cachedDelivery.delivery.deliveryStatus] ??
              deliveryT.unknownStatus)
            : getOrderStatusMeta(order.status, lang).label
        }
        deliveryStatus={cachedDelivery?.delivery?.deliveryStatus}
        orderId={order.id}
      />
    </div>
  )

  return (
    <div className="cus-page od-page">
      <OrderHeader order={order} onUpdated={detail.reload} />
      <ReviewNotice order={order} onInformationSubmitted={detail.reload} />

      <div className="od-detail-layout">
        <div className="od-detail-main">
          <Tabs
            id="customer-order-tabs"
            className="od-tabs"
            activeKey={activeTab}
            aria-label={t.pageTabs}
            onChange={handleTabChange}
            onTabClick={(key) => {
              if (key === 'finance') acknowledgeQuote()
            }}
            items={[
              ...(hasResults
                ? [
                    {
                      key: 'results',
                      label: t.tabResults,
                      forceRender: true,
                      children: (
                        <div className="od-results-panel">
                          <CustomerDeliveryPanel
                            key={order.id}
                            orderId={order.id}
                            initialDelivery={cachedDelivery?.delivery ?? null}
                            onStateChange={updateDelivery}
                            onOpenPayment={() => setSelectedTab({ orderId, tab: 'payment' })}
                            onOpenFinance={() => handleTabChange('payment')}
                            onPaymentCompleted={() => {
                              setFinanceRefreshVersion((version) => version + 1)
                              detail.reload()
                            }}
                          />
                        </div>
                      ),
                    },
                  ]
                : []),
              {
                key: 'order',
                label: t.tabOverview,
                children: activeTab === 'order' ? orderContent : null,
              },
              {
                key: 'monitoring',
                label: t.tabMonitoring,
                children: activeTab === 'monitoring' ? monitoringContent : null,
              },
              {
                key: 'finance',
                label: (
                  <span className="od-finance-tab-label">
                    {t.tabFinance}
                    {unreadQuoteId ? (
                      <Badge dot title={t.newQuoteApproval} />
                    ) : null}
                  </span>
                ),
                forceRender: true,
                children: null,
              },
              {
                key: 'contract',
                label: t.tabContract,
                children: null,
              },
              {
                key: 'payment',
                label: t.tabPayment,
                children: null,
              },
              {
                key: 'support',
                label: t.tabSupport,
                children: activeTab === 'support' ? supportContent : null,
              },
            ]}
          />
          <div hidden={activeTab !== 'finance' && activeTab !== 'payment' && activeTab !== 'contract'}>
            {financeContent}
          </div>
        </div>
      </div>
    </div>
  )
}
