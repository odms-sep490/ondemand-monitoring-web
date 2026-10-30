import { CloseOutlined } from '@ant-design/icons'
import { Drawer } from 'antd'
import { useState } from 'react'

import { Button } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import type { OrderDetail } from '../../types/orders'
import { orderReviewPageMessages } from '../../pages/OrderReview/OrderReviewPage.messages'
import { formatOrderCode } from './format'
import { mgrPopupContainer } from './mgrPopupContainer'
import { OrderAttachmentsCard } from './OrderAttachmentsCard'
import { OrderCustomerCard } from './OrderCustomerCard'
import { OrderCustomerRequestDetails } from './OrderCustomerRequestDetails'
import { OrderServiceInfo } from './OrderServiceInfo'
import './orderDetailsDrawer.scss'

/** Read-only order facts that stay available while managers work through later stages. */
export function OrderDetailsDrawer({ order }: { order: OrderDetail }) {
  const { t } = useI18n(orderReviewPageMessages)
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        icon="file-text"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {t.viewOrderDetails}
      </Button>
      <Drawer
        open={open}
        getContainer={mgrPopupContainer}
        placement="right"
        width="min(720px, 100vw)"
        onClose={() => setOpen(false)}
        className="mgr-order-details-drawer"
        title={
          <span className="mgr-order-details-title">
            <span>{t.pageTitle}</span>
            <small>{formatOrderCode(order.code)}</small>
          </span>
        }
        closeIcon={<CloseOutlined aria-label={t.close} />}
        aria-label={t.viewOrderDetails}
        destroyOnHidden
      >
        <div className="odm-or mgr-order-detail-drawer-content">
          <OrderServiceInfo order={order} t={t} hideEmpty />
          <OrderCustomerRequestDetails order={order} t={t} />
          <OrderCustomerCard order={order} t={t} hideEmpty />
          {order.attachments?.length ? (
            <OrderAttachmentsCard order={order} t={t} />
          ) : null}
        </div>
      </Drawer>
    </>
  )
}
