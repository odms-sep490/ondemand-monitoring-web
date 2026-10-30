import { Tabs } from 'antd'
import { useCallback, useEffect, useState } from 'react'

import { ErrorState, LoadingState } from '../../components/common/StateView'
import { useI18n } from '../../../../shared/i18n'
import { ContextAwareHelpWidget } from '../../../support/components/ContextAwareHelpWidget'
import { deliveryProgressMessages } from '../../../delivery/deliveryProgress.messages'
import { CustomerDeliveryPanel } from '../../../delivery/CustomerDeliveryPanel'
import type { Delivery, DeliveryPanelLoadState } from '../../../delivery/types'
import {
  CustomerFinancePanel,
  type CustomerFinanceState,
} from '../../../finance/CustomerFinance'
import { customerMissionReportApi } from '../../api/customerMissionReportApi'
import { CustomerOrderMissionsView } from '../../components/reports/CustomerOrderMissionsSection'
import { checklistMessages } from '../../lib/checklist/messages'
import { getOrderStatusMeta } from '../../lib/orderStatus'
import { ChecklistSnapshotCard } from '../../components/checklist/ChecklistSnapshotCard'
import { OrderHeader } from './components/OrderHeader'
import { OrderInfoCard } from './components/OrderInfoCard'
import { OrderNextStepSummary } from './components/OrderNextStepSummary'
import { OrderOverviewVisualCard } from './components/OrderOverviewVisualCard'
import { OrderTimeline } from './components/OrderTimeline'
import { ReviewNotice } from './components/ReviewNotice'
import { CardTitle } from './components/CardTitle'
import { useOrderDetail } from './hooks/useOrderDetail'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { orderDetailPageMessages } from './OrderDetailPage.messages'
import './OrderDetail.css'

type DetailTab = 'order' | 'monitoring' | 'finance' | 'support' | 'results'
type CachedDeliveryState = {
  orderId: string
  delivery: Delivery | null
  state: DeliveryPanelLoadState
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
  const [selectedTab, setSelectedTab] = useState<{
    orderId: string
    tab: DetailTab
  } | null>(null)
  const [deliveryState, setDeliveryState] =
    useState<CachedDeliveryState | null>(null)
  const [finalPaymentAction, setFinalPaymentAction] = useState<
    (() => Promise<void>) | null
  >(null)
  const [focusResultsOrderId, setFocusResultsOrderId] = useState<string | null>(
    null,
  )
  const currentMissionData =
    order && missionQuery.data?.orderId === order.id
      ? missionQuery.data
      : undefined
  const missions = currentMissionData?.missions ?? []
  const currentMissionQuery = currentMissionData
    ? {
        data: currentMissionData.missions,
        error: missionQuery.error,
        loading: missionQuery.loading,
        reload: missionQuery.reload,
      }
    : {
        data: undefined,
        error: undefined,
        loading: true,
        reload: missionQuery.reload,
      }
  const updateFinance = useCallback((state: CustomerFinanceState) => {
    setFinance(state)
  }, [])
  const updateDelivery = useCallback(
    (delivery: Delivery | null, state: DeliveryPanelLoadState) => {
      setDeliveryState({ orderId, delivery, state })
    },
    [orderId],
  )
  const updateFinalPaymentAction = useCallback(
    (action: (() => Promise<void>) | null) =>
      setFinalPaymentAction(() => action),
    [],
  )

  const cachedDelivery =
    deliveryState?.orderId === order?.id ? deliveryState : null
  const onPrimaryAction = useCallback(() => {
    if (cachedDelivery?.delivery?.deliveryStatus === 'FINAL_PAYMENT_PENDING') {
      if (finalPaymentAction) {
        void finalPaymentAction()
      } else {
        setSelectedTab({ orderId, tab: 'finance' })
      }
      return
    }
    setSelectedTab({ orderId, tab: 'results' })
    setFocusResultsOrderId(orderId)
  }, [cachedDelivery?.delivery?.deliveryStatus, finalPaymentAction, orderId])

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

  useEffect(() => {
    if (!order || focusResultsOrderId !== order.id || activeTab !== 'results')
      return
    const frame = window.requestAnimationFrame(() => {
      const panel = document.getElementById('customer-delivery-panel')
      panel?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
      panel?.focus({ preventScroll: true })
      setFocusResultsOrderId(null)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [activeTab, focusResultsOrderId, order])

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
      <div className="cus-main-grid">
        <div className="cus-stack">
          <OrderInfoCard
            order={order}
            canEdit={
              (['PENDING', 'NEEDS_INFO'].includes(order.status) &&
                !(
                  order.status === 'NEEDS_INFO' && order.requestedUpdateScope
                )) ||
              (order.status === 'APPROVED' &&
                finance.quote?.status !== 'ACCEPTED_BY_CUSTOMER' &&
                !finance.invoice)
            }
            onUpdated={detail.reload}
          />
        </div>
        <div className="cus-side">
          <OrderTimeline
            status={order.status}
            events={order.timeline}
            finance={finance}
            missions={missions}
          />
        </div>
      </div>
    </div>
  )
  const monitoringContent = (
    <div className="od-monitoring-panel cus-stack">
      <CustomerOrderMissionsView key={order.id} query={currentMissionQuery} />
      <ChecklistSnapshotCard
        title={<CardTitle icon="drone">{checklistT.title}</CardTitle>}
        items={order.checklistItems}
        snapshotAt={order.checklistSnapshotAt}
      />
      <OrderOverviewVisualCard order={order} />
    </div>
  )
  const financeContent = (
    <div className="od-finance-panel">
      <CustomerFinancePanel
        orderId={order.id}
        legalStatus={order.legalReviewStatus}
        onStateChange={updateFinance}
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
            ? deliveryT.status[cachedDelivery.delivery.deliveryStatus]
            : getOrderStatusMeta(order.status, lang).label
        }
        deliveryStatus={cachedDelivery?.delivery?.deliveryStatus}
        orderId={order.id}
      />
    </div>
  )

  return (
    <div className="cus-page od-page">
      <OrderHeader order={order} />
      <ReviewNotice order={order} onInformationSubmitted={detail.reload} />

      {hasResults ? (
        <OrderNextStepSummary
          delivery={cachedDelivery?.delivery ?? null}
          deliveryState={cachedDelivery?.state ?? 'loading'}
          missions={missions}
          missionLoading={currentMissionQuery.loading}
          missionError={Boolean(currentMissionQuery.error)}
          onPrimaryAction={onPrimaryAction}
        />
      ) : null}

      <Tabs
        id="customer-order-tabs"
        className="od-tabs"
        activeKey={activeTab}
        aria-label={t.pageTabs}
        onChange={(key) =>
          setSelectedTab({ orderId: order.id, tab: key as DetailTab })
        }
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
                        onFinalPaymentActionChange={updateFinalPaymentAction}
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
            label: t.tabFinance,
            forceRender: true,
            children: financeContent,
          },
          {
            key: 'support',
            label: t.tabSupport,
            children: activeTab === 'support' ? supportContent : null,
          },
        ]}
      />
    </div>
  )
}
