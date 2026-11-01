import { Alert, Button } from 'antd'
import { useState } from 'react'

import {
  checklistPricingApi,
  type ServicePricePreview,
} from '../../../../../shared/api/checklistPricingApi'
import { useI18n } from '../../../../../shared/i18n'
import { AdminPriceBreakdown } from '../../../components/common/AdminPriceBreakdown'
import { adminHref } from '../../../routes'
import { serviceModalMessages } from './ServiceModal.messages'

/** Prices the stored default checklists of a saved service with the active policy; nothing is saved. */
export function ServicePriceCheck({
  serviceId,
  busy,
}: {
  serviceId?: string
  busy: boolean
}) {
  const { t } = useI18n(serviceModalMessages)
  const [priceCheck, setPriceCheck] = useState<ServicePricePreview | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function checkPrice() {
    if (!serviceId) return
    setError(null)
    try {
      setPriceCheck(await checklistPricingApi.adminPreview({ serviceId }))
    } catch {
      setPriceCheck(null)
      setError(t.previewError)
    }
  }

  return (
    <section aria-label={t.previewTitle} className="adm-service-price-check">
      <strong>{t.previewTitle}</strong>
      {serviceId ? (
        <>
          <div className="adm-row">
            <Button
              size="small"
              disabled={busy}
              onClick={() => void checkPrice()}
            >
              {t.previewButton}
            </Button>
            <Button
              size="small"
              type="link"
              href={adminHref({ screen: 'serviceChecklists', serviceId })}
            >
              {t.manageChecklists}
            </Button>
          </div>
          {error && (
            <Alert type="error" showIcon role="alert" message={error} />
          )}
          {priceCheck && <AdminPriceBreakdown preview={priceCheck} />}
        </>
      ) : (
        <small className="adm-check-hint">{t.previewSaveFirst}</small>
      )}
    </section>
  )
}
