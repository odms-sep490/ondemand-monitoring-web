import { Button } from 'antd'
import { OrderTermsLink } from '../../../components/common/OrderTermsLink'
import { Children, useState, type ReactNode } from 'react'

import { Card } from '../../../components/common/ui'
import { OrderStatusBadge } from '../../../components/common/OrderStatusBadge'
import { useI18n } from '../../../../../shared/i18n'
import { OrderIcon, type OrderIconName } from '../../../../manager/components/common/OrderIcon'
import { useTimeslotLabel } from '../../../hooks/usePreferredTimes'
import { localizeServiceName } from '../../../lib/i18n/serviceNames'
import { fmtDate, fmtDateTime } from '../../../lib/orderStatus'
import { formatDateRange } from '../../../lib/orders/format'
import type { OrderDetailView } from '../../../lib/orders/types'
import { CardTitle } from './CardTitle'
import { orderInfoCardMessages } from './OrderInfoCard.messages'
import { OrderSectionEditor, type EditableOrderSection } from './OrderSectionEditor'

const DASH = '—'

function Field({
  icon,
  label,
  value,
  num,
  wide,
}: {
  icon: OrderIconName
  label: string
  value: ReactNode
  num?: boolean
  wide?: boolean
}) {
  return (
    <div className={wide ? 'od-field is-wide' : 'od-field'}>
      <span className="od-field-icon">
        <OrderIcon name={icon} size={16} />
      </span>
      <div className="od-field-body">
        <dt>{label}</dt>
        <dd className={num ? 'od-num' : undefined}>{value}</dd>
      </div>
    </div>
  )
}

function Section({
  icon,
  title,
  wide,
  onSupplement,
  editor,
  children,
}: {
  icon: OrderIconName
  title: string
  wide?: boolean
  onSupplement?: () => void
  editor?: ReactNode
  children: ReactNode
}) {
  const { t } = useI18n(orderInfoCardMessages)
  const empty = Children.toArray(children).length === 0
  return (
    <section className={wide ? 'od-info-section is-wide' : 'od-info-section'}>
      <div className="od-info-section-heading">
        <h3 className="od-info-section-title">
          <span className="od-card-icon">
            <OrderIcon name={icon} size={16} />
          </span>
          {title}
        </h3>
        {onSupplement ? (
          <Button type="link" size="small" className="od-info-edit" onClick={onSupplement}>
            {t.edit}
          </Button>
        ) : null}
      </div>
      {empty ? <p className="od-hint od-info-empty">{t.noInfo}</p> : <dl className="od-info-list">{children}</dl>}
      {editor}
    </section>
  )
}

export function OrderInfoCard({
  order,
  canEdit,
  onUpdated,
  progress,
}: {
  order: OrderDetailView
  canEdit?: boolean
  onUpdated?: () => void
  progress?: ReactNode
}) {
  const [editing, setEditing] = useState<EditableOrderSection | null>(null)
  const { t, locale, lang } = useI18n(orderInfoCardMessages)
  const timeLabel = useTimeslotLabel()
  const label = (value: string | null) => (value ? (t.values[value] ?? value) : DASH)
  const join = (values: string[]) => (values.length ? values.map((value) => t.values[value] ?? value).join(', ') : DASH)
  const time =
    order.timeName || order.timeId ? timeLabel({ id: order.timeId, name: order.timeName }) : null
  const schedule = formatDateRange(order.dateFrom, order.dateTo, locale)
  const serviceName = order.serviceName
    ? localizeServiceName(order.serviceId ?? order.serviceName, lang, order.serviceName)
    : DASH
  const preferredSchedule = [schedule, time].filter(Boolean).join(' · ') || DASH
  const coordinates =
    order.latitude != null && order.longitude != null
      ? `${order.latitude}, ${order.longitude}`
      : DASH
  const editable = canEdit ?? ['PENDING', 'NEEDS_INFO', 'APPROVED'].includes(order.status)

  return (
    <div className="od-balanced-layout">
    <Card title={<CardTitle icon="doc">{t.title}</CardTitle>}>
      <p className="od-info-subtitle">{t.subtitle}</p>
      <section className="od-order-summary" aria-label={t.summary}>
        <h3>{t.summary}</h3>
        <dl>
          <div className="od-order-summary-item">
            <dt>{t.service}</dt>
            <dd>
              <OrderIcon name="stack" size={15} />
              {serviceName}
            </dd>
          </div>
          <div className="od-order-summary-item">
            <dt>{t.address}</dt>
            <dd>
              <OrderIcon name="pin" size={15} />
              {order.address || DASH}
            </dd>
          </div>
          <div className="od-order-summary-item">
            <dt>{t.schedule}</dt>
            <dd>
              <OrderIcon name="calendar" size={15} />
              {preferredSchedule}
            </dd>
          </div>
          <div className="od-order-summary-item">
            <dt>{t.currentStatus}</dt>
            <dd>
              <OrderStatusBadge status={order.status} />
            </dd>
          </div>
        </dl>
      </section>
      <div className="od-info-sections">
        <Section icon="doc" title={t.sectionGeneral} wide onSupplement={editable ? () => setEditing('general') : undefined} editor={editing === 'general' ? <OrderSectionEditor section="general" order={order} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); onUpdated?.() }} /> : undefined}>
          <Field
            icon="stack"
            label={t.service}
            value={serviceName}
          />
          {order.createdAt && <Field icon="calendar" label={t.createdAt} value={fmtDateTime(order.createdAt, locale)} />}
          {(schedule || time) && <Field icon="calendar" label={t.schedule} value={preferredSchedule} />}
          {order.resultDeadline && <Field icon="clock" label={t.resultDeadline} value={fmtDate(order.resultDeadline, locale)} />}
          {order.address && <Field icon="pin" label={t.address} value={order.address} />}
        </Section>
      </div>
    </Card>
    {progress}
    <div className="od-balanced-details">
    <Card>
      <div className="od-info-sections">
        <Section icon="drone" title={t.sectionScope} onSupplement={editable ? () => setEditing('scope') : undefined} editor={editing === 'scope' ? <OrderSectionEditor section="scope" order={order} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); onUpdated?.() }} /> : undefined}>
          {order.flightPurpose && <Field icon="target" label={t.flightPurpose} value={label(order.flightPurpose)} />}
          {coordinates !== DASH && <Field icon="locate" label={t.coordinates} value={coordinates} num />}
          {order.radiusM != null && <Field icon="target" label={t.radius} value={`${order.radiusM} m`} num />}
          {order.altitudeM != null && <Field icon="altitude" label={t.altitude} value={`${order.altitudeM} m`} num />}
          {order.estimatedLengthM != null && <Field icon="radius" label={t.estimatedLength} value={`${order.estimatedLengthM} m`} num />}
          {order.recurrenceType && order.recurrenceType !== 'NONE' && <Field icon="refresh" label={t.recurrence} value={`${label(order.recurrenceType)}${order.recurrenceOccurrences ? ` · ${t.times(order.recurrenceOccurrences)}` : ''}`} />}
        </Section>
        <Section icon="pin" title={t.sectionSite} onSupplement={editable ? () => setEditing('site') : undefined} editor={editing === 'site' ? <OrderSectionEditor section="site" order={order} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); onUpdated?.() }} /> : undefined}>
          {(order.siteContactName || order.siteContactPhone) && <Field icon="user" label={t.siteContact} value={[order.siteContactName, order.siteContactPhone].filter(Boolean).join(' · ')} />}
          {order.accessNotes && <Field icon="info" label={t.accessNotes} value={order.accessNotes} />}
          {order.monitoringRelationship && <Field icon="shield" label={t.relationship} value={label(order.monitoringRelationship)} />}
          {order.weatherFallback && <Field icon="cloud" label={t.weatherFallback} value={label(order.weatherFallback)} />}
        </Section>
        <Section icon="shield" title={t.sectionPermit} onSupplement={editable ? () => setEditing('permit') : undefined} editor={editing === 'permit' ? <OrderSectionEditor section="permit" order={order} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); onUpdated?.() }} /> : undefined}>
          <Field icon="check" label={t.authorization} value={order.monitoringAuthorizationConfirmed ? t.yes : t.no} />
          {order.permitRequired != null && <Field icon="shield" label={t.permitRequired} value={order.permitRequired ? t.yes : t.no} />}
          {order.permitStatus && order.permitStatus !== 'NONE' && <Field icon="doc" label={t.permit} value={[label(order.permitStatus), order.permitNumber, order.permitZoneName].filter(Boolean).join(' · ')} />}
          {order.permitExpiresOn && <Field icon="calendar" label={t.permitExpiry} value={fmtDate(order.permitExpiresOn, locale)} />}
          {order.permitDocuments.length > 0 && <Field icon="file" label={t.permitFiles} value={order.permitDocuments.map((file) => file.fileName).join(', ')} />}
          {order.monitoringAuthorizationDocuments.length > 0 && <Field icon="file" label={t.authorizationFiles} value={order.monitoringAuthorizationDocuments.map((file) => file.documentName || file.fileName).join(', ')} />}
        </Section>
        <Section icon="database" title={t.sectionResult} onSupplement={editable ? () => setEditing('result') : undefined} editor={editing === 'result' ? <OrderSectionEditor section="result" order={order} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); onUpdated?.() }} /> : undefined}>
          {order.resultFormats.length > 0 && <Field icon="media" label={t.resultFormats} value={join(order.resultFormats)} />}
          {order.deliveryMethods.length > 0 && <Field icon="download" label={t.deliveryMethods} value={join(order.deliveryMethods)} />}
          {order.dataRetentionDays != null && <Field icon="clock" label={t.retention} value={t.days(order.dataRetentionDays)} />}
          {order.termsAcceptedAt && <Field icon="check" label={t.terms} value={<span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 12px' }}><span>{fmtDateTime(order.termsAcceptedAt, locale)}</span><OrderTermsLink /></span>} />}
        </Section>
        {order.description && (
          <Section wide icon="file" title={t.description} onSupplement={editable ? () => setEditing('description') : undefined} editor={editing === 'description' ? <OrderSectionEditor section="description" order={order} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); onUpdated?.() }} /> : undefined}>
            <p className="od-desc-text">{order.description}</p>
          </Section>
        )}
      </div>
    </Card>
    </div>
    </div>
  )
}
