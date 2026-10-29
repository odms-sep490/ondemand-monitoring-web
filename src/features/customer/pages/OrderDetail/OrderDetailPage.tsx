import { Tabs } from 'antd'
import { useCallback, useState } from 'react'

import {
  ErrorState,
  LoadingState,
} from '../../components/common/StateView'
import { useI18n } from '../../../../shared/i18n'
import { ContextAwareHelpWidget } from '../../../support/components/ContextAwareHelpWidget'
import { OrderHeader } from './components/OrderHeader'
import { OrderInfoCard } from './components/OrderInfoCard'
import { OrderOverviewVisualCard } from './components/OrderOverviewVisualCard'
import { OrderTimeline } from './components/OrderTimeline'
import { ReviewNotice } from './components/ReviewNotice'
import { useOrderDetail } from './hooks/useOrderDetail'
import { checklistMessages } from '../../lib/checklist/messages'
import { getOrderStatusMeta } from '../../lib/orderStatus'
import { CardTitle } from './components/CardTitle'
import { ChecklistSnapshotCard } from '../../components/checklist/ChecklistSnapshotCard'
import { CustomerOrderMissionsSection } from '../../components/reports/CustomerOrderMissionsSection'
import './OrderDetail.css'
import { orderDetailPageMessages } from './OrderDetailPage.messages'
import {
  CustomerFinancePanel,
  type CustomerFinanceState,
} from '../../../finance/CustomerFinance'
import { CustomerDeliveryPanel } from '../../../delivery/CustomerDeliveryPanel'
import type { CustomerMissionSummary } from '../../api/customerMissionReportApi'

/** Customer order detail backed by `GET /api/orders/{id}`. */
export function OrderDetailPage({ orderId }: { orderId: string }) {
  const { t, lang } = useI18n(orderDetailPageMessages)
  const { t: checklistT } = useI18n(checklistMessages)
  const detail = useOrderDetail(orderId)
  const { order } = detail
  const [finance, setFinance] = useState<CustomerFinanceState>({
    quote: null,
    invoice: null,
    loading: true,
  })
  const [tab, setTab] = useState<'overview' | 'results'>('overview')
  const [missions, setMissions] = useState<CustomerMissionSummary[]>([])
  const updateFinance = useCallback((state: CustomerFinanceState) => {
    setFinance(state)
  }, [])

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

  const hasResults = ['IN_PROGRESS', 'COMPLETED'].includes(order.status)
  const activeTab = hasResults ? tab : 'overview'

  return (
    <div className="cus-page od-page">
      <OrderHeader order={order} />
      <ReviewNotice order={order} onInformationSubmitted={detail.reload} />
      <OrderOverviewVisualCard order={order} />
      {hasResults ? (
        <Tabs
          className="od-tabs"
          activeKey={activeTab}
          onChange={(key) => setTab(key as 'overview' | 'results')}
          items={[
            { key: 'overview', label: t.tabOverview },
            { key: 'results', label: t.tabResults },
          ]}
        />
      ) : null}
      {activeTab === 'results' ? <CustomerDeliveryPanel orderId={order.id} /> : null}
      <div hidden={activeTab !== 'overview'}>
      <div className="cus-main-grid">
        <div className="cus-stack">
          <CustomerOrderMissionsSection key={order.id} orderId={order.id} onMissionsChange={setMissions} />
          <OrderInfoCard
            order={order}
            canEdit={
              (['PENDING', 'NEEDS_INFO'].includes(order.status) &&
                !(order.status === 'NEEDS_INFO' && order.requestedUpdateScope)) ||
              (order.status === 'APPROVED' && finance.quote?.status !== 'ACCEPTED_BY_CUSTOMER' && !finance.invoice)
            }
            onUpdated={detail.reload}
          />
          <ChecklistSnapshotCard
            title={<CardTitle icon="drone">{checklistT.title}</CardTitle>}
            items={order.checklistItems}
            snapshotAt={order.checklistSnapshotAt}
          />
        </div>
        <div className="cus-side">
          <CustomerFinancePanel
            orderId={order.id}
            legalStatus={order.legalReviewStatus}
            onStateChange={updateFinance}
          />
          <OrderTimeline status={order.status} events={order.timeline} finance={finance} missions={missions} />
          <ContextAwareHelpWidget
            type="ORDER"
            id={order.code}
            status={order.status}
            statusLabel={getOrderStatusMeta(order.status, lang).label}
            orderId={order.id}
          />
        </div>
      </div>
      </div>
    </div>
  )
}
