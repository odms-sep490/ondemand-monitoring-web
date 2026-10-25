import type { OrderReviewMessages } from '../../pages/OrderReview/OrderReviewPage.messages'
import type { OrderDetail } from '../../types/orders'
import { OrderIcon } from './OrderIcon'
import { humanizeMediaRequirement } from './format'
import { type DetailItem } from './requestDetailTypes'
import {
  visibleItems,
  text,
  resultFormatsFromDeliverables,
  list,
  deliverableSummary,
  addOnItems,
  dateOnly,
  dateTime,
} from './requestDetailHelpers'
import { FactSection } from './FactSection'

export function OrderCustomerRequestDetails({
  order,
  t,
}: {
  order: OrderDetail
  t: OrderReviewMessages
}) {
  const contact =
    [order.siteContactName, order.siteContactPhone]
      .filter(Boolean)
      .join(' · ') || null
  const recurrence =
    order.recurrenceType && order.recurrenceOccurrences
      ? `${text(order.recurrenceType)} · ${order.recurrenceOccurrences} lần`
      : text(order.recurrenceType)
  const permit = [
    text(order.permitStatus),
    order.permitNumber,
    order.permitZoneName,
  ]
    .filter(Boolean)
    .join(' · ')
  const resultFormats =
    resultFormatsFromDeliverables(order) ?? list(order.resultFormats)
  const deliverableFacts: DetailItem[] =
    order.deliverables?.map((deliverable, index) => ({
      label: (
        <strong>
          {deliverable.deliverableTypeName || t.mediaN(index + 1)}
        </strong>
      ),
      value:
        deliverableSummary(
          deliverable.requirement,
          deliverable.deliverableTypeName,
        ).join(' · ') || t.noData,
    })) ??
    order.mediaRequirements?.map((requirement, index) => ({
      label: t.mediaN(index + 1),
      value: humanizeMediaRequirement(requirement.label, t),
    })) ??
    []
  const deliverableAddOns =
    order.deliverables?.flatMap((deliverable) =>
      addOnItems(deliverable.requirement),
    ) ?? []

  const scopeFacts: DetailItem[] = [
    {
      label: t.usagePurpose,
      value: text(order.usagePurpose),
    },
    {
      label: t.flightPurpose,
      value: text(order.flightPurpose),
    },
    {
      label: t.flightAltitude,
      value: order.altitudeM != null ? `${order.altitudeM} m` : null,
    },
    {
      label: t.estimatedLength,
      value:
        order.estimatedLengthM != null ? `${order.estimatedLengthM} m` : null,
    },
    { label: t.recurrence, value: recurrence },
  ]

  const siteFacts: DetailItem[] = [
    { label: t.siteContact, value: contact },
    { label: t.accessNotes, value: order.accessNotes },
    {
      label: 'Quan hệ với hiện trường',
      value: text(order.monitoringRelationship),
    },
    {
      label: 'Xác nhận quyền giám sát',
      value:
        order.monitoringAuthorizationConfirmed == null
          ? null
          : order.monitoringAuthorizationConfirmed
            ? 'Đã xác nhận'
            : 'Chưa xác nhận',
    },
    {
      label: 'Tài liệu hiện trường',
      value:
        order.monitoringAuthorizationDocuments &&
        order.monitoringAuthorizationDocuments.length > 0 ? (
          <span className="odm-or-req-files">
            {order.monitoringAuthorizationDocuments.map((file) => (
              <a
                key={file.id}
                href={file.dataUrl}
                download={file.fileName}
                title={file.documentName || file.fileName}
              >
                {file.documentName || file.fileName}
              </a>
            ))}
          </span>
        ) : null,
    },
  ]
  const weatherFallback = text(order.weatherFallback)

  const hasPermitInformation =
    order.permitRequired === true ||
    Boolean(
      (order.permitStatus && order.permitStatus !== 'NONE') ||
      order.permitNumber ||
      order.permitZoneName ||
      order.permitExpiresOn ||
      order.permitDocuments?.length,
    )
  const permitFacts: DetailItem[] = hasPermitInformation ? [
    {
      label: 'Yêu cầu giấy phép',
      value:
        order.permitRequired ? 'Có yêu cầu' : null,
    },
    {
      label: 'Trạng thái giấy phép',
      value:
        permit || null,
    },
    { label: 'Hiệu lực đến', value: dateOnly(order.permitExpiresOn) },
    {
      label: 'Tệp giấy phép',
      value:
        order.permitDocuments && order.permitDocuments.length > 0 ? (
          <span className="odm-or-req-files">
            {order.permitDocuments.map((file) => (
              <a
                key={file.id}
                href={file.dataUrl}
                download={file.fileName}
                title={file.fileName}
              >
                {file.fileName}
              </a>
            ))}
          </span>
        ) : order.permitRequired ? (
          'Chưa cung cấp'
        ) : null,
    },
  ] : []

  const resultFacts: DetailItem[] = [
    ...deliverableFacts,
    {
      label: t.resultDeadline,
      value: dateOnly(order.resultDeadline),
    },
    {
      label: t.resultFormats,
      // A deliverable card below already shows the output format and its
      // requirement details, so repeating the format here adds no information.
      value: order.deliverables?.length ? null : resultFormats,
    },
    {
      label: t.deliveryMethods,
      value: list(order.deliveryMethods),
    },
    {
      label: t.dataRetention,
      value:
        order.dataRetentionDays != null
          ? `${order.dataRetentionDays} ngày`
          : null,
    },
  ]

  const termsFacts: DetailItem[] = [
    {
      label: 'Khách gửi yêu cầu lúc',
      value: dateTime(order.submittedAt),
    },
    {
      label: 'Khách đồng ý điều khoản lúc',
      value: dateTime(order.termsAcceptedAt),
    },
    { label: 'Phiên bản điều khoản', value: order.termsVersion },
  ]

  const hasSummary = Boolean(order.title || order.description)
  const hasDetails =
    hasSummary ||
    visibleItems([
      ...scopeFacts,
      ...siteFacts,
      ...permitFacts,
      ...resultFacts,
      ...termsFacts,
    ]).length > 0 ||
    (order.deliverables != null && order.deliverables.length > 0) ||
    (order.mediaRequirements != null && order.mediaRequirements.length > 0)

  if (!hasDetails) return null

  return (
    <section className="odm-or-card odm-or-req">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="file" size={18} />
          {t.customerRequestDetails}
        </span>
      </header>
      <div className="odm-or-card-body odm-or-req-body">
        {hasSummary ? (
          <div className="odm-or-req-hero">
            <div className="odm-or-req-hero-text">
              {order.title ? <h3>{order.title}</h3> : null}
              {order.description ? <p>{order.description}</p> : null}
            </div>
          </div>
        ) : null}

        <div className="odm-or-req-section-grid">
          <FactSection
            title="Mục đích & thông số bay"
            icon="target"
            items={scopeFacts}
          />
          <FactSection
            title="Thông tin hiện trường"
            icon="pin"
            items={siteFacts}
          />
          <FactSection
            title="Quyền & giấy phép"
            icon="shield"
            items={permitFacts}
          />
          <FactSection
            title="Kết quả & dữ liệu"
            icon="database"
            items={resultFacts}
          >
            {deliverableAddOns.length > 0 ? (
              <div className="odm-or-addon-list">
                <span>Yêu cầu bổ sung</span>
                {deliverableAddOns.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            ) : null}
          </FactSection>
          <FactSection
            title="Xác nhận gửi yêu cầu"
            icon="check"
            items={termsFacts}
          />
        </div>

        {weatherFallback ? (
          <aside className="odm-or-req-fallback" aria-label={t.weatherFallback}>
            <span className="odm-or-req-fallback-icon" aria-hidden="true">
              <OrderIcon name="alert" size={22} />
            </span>
            <span className="odm-or-req-fallback-label">
              {t.weatherFallback}
            </span>
            <strong>{weatherFallback}</strong>
          </aside>
        ) : null}

      </div>
    </section>
  )
}
