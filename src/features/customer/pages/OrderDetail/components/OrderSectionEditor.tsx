import { Button } from 'antd'
import { useState } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { orderSectionEditorMessages } from './OrderSectionEditor.messages'
import { apiRequest } from '../../../../../shared/api/httpClient'
import type { OrderDetailView } from '../../../lib/orders/types'

export type EditableOrderSection = 'general' | 'scope' | 'site' | 'permit' | 'result' | 'description'

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="od-inline-edit-field"><span>{label}</span>{children}</label>
)

export function OrderSectionEditor({ section, order, onCancel, onSaved }: {
  section: EditableOrderSection
  order: OrderDetailView
  onCancel: () => void
  onSaved: () => void
}) {
  const { t } = useI18n(orderSectionEditorMessages)
  const [draft, setDraft] = useState<Record<string, string | boolean>>({
    title: order.title, address: order.address ?? '',
    preferredDateFrom: order.dateFrom ?? '', preferredDateTo: order.dateTo ?? '', resultDeadline: order.resultDeadline ?? '',
    flightPurpose: order.flightPurpose ?? 'SURVEY_MONITORING', usagePurpose: order.usagePurpose ?? '',
    altitudeM: order.altitudeM?.toString() ?? '', estimatedLengthM: order.estimatedLengthM?.toString() ?? '',
    recurrenceType: order.recurrenceType ?? 'NONE', recurrenceOccurrences: order.recurrenceOccurrences?.toString() ?? '',
    siteContactName: order.siteContactName ?? '', siteContactPhone: order.siteContactPhone ?? '',
    accessNotes: order.accessNotes ?? '', monitoringRelationship: order.monitoringRelationship ?? '',
    weatherFallback: order.weatherFallback ?? 'CONTACT_CUSTOMER',
    monitoringAuthorizationConfirmed: order.monitoringAuthorizationConfirmed,
    permitStatus: order.permitStatus ?? '', permitNumber: order.permitNumber ?? '', permitExpiresOn: order.permitExpiresOn ?? '',
    resultFormats: order.resultFormats.join(','), deliveryMethods: order.deliveryMethods.join(','),
    dataRetentionDays: order.dataRetentionDays?.toString() ?? '90', description: order.description ?? '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (key: string, value: string | boolean) => setDraft((current) => ({ ...current, [key]: value }))
  const text = (key: string) => String(draft[key] ?? '')

  async function save() {
    setBusy(true); setError('')
    const keys: Record<EditableOrderSection, string[]> = {
      general: ['title','address','preferredDateFrom','preferredDateTo','resultDeadline'],
      scope: ['flightPurpose','usagePurpose','altitudeM','estimatedLengthM','recurrenceType','recurrenceOccurrences'],
      site: ['siteContactName','siteContactPhone','accessNotes','monitoringRelationship','weatherFallback'],
      permit: ['monitoringAuthorizationConfirmed','permitStatus','permitNumber','permitExpiresOn'],
      result: ['resultFormats','deliveryMethods','dataRetentionDays'], description: ['description'],
    }
    const numeric = new Set(['altitudeM','estimatedLengthM','recurrenceOccurrences','dataRetentionDays'])
    const arrays = new Set(['resultFormats','deliveryMethods'])
    const omitWhenBlank = new Set(['usagePurpose','monitoringRelationship','permitStatus','permitExpiresOn','preferredDateFrom','preferredDateTo','resultDeadline'])
    const body: Record<string, unknown> = {}
    for (const key of keys[section]) {
      const value = draft[key]
      if (omitWhenBlank.has(key) && value === '') continue
      if (numeric.has(key)) body[key] = value === '' ? null : Number(value)
      else if (arrays.has(key)) body[key] = String(value).split(',').map((item) => item.trim()).filter(Boolean)
      else body[key] = value
    }
    try {
      await apiRequest(`/api/orders/${encodeURIComponent(order.id)}`, { method: 'PATCH', body })
      onSaved()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.saveFailed)
      setBusy(false)
    }
  }

  return <div className="od-inline-editor">
    {section === 'general' && <>
      <Field label={t.title}><input value={text('title')} onChange={(e) => set('title', e.target.value)} /></Field>
      <Field label={t.address}><input value={text('address')} onChange={(e) => set('address', e.target.value)} /></Field>
      <Field label={t.dateFrom}><input type="date" value={text('preferredDateFrom')} onChange={(e) => set('preferredDateFrom', e.target.value)} /></Field>
      <Field label={t.dateTo}><input type="date" value={text('preferredDateTo')} onChange={(e) => set('preferredDateTo', e.target.value)} /></Field>
      <Field label={t.resultDeadline}><input type="date" value={text('resultDeadline')} onChange={(e) => set('resultDeadline', e.target.value)} /></Field>
    </>}
    {section === 'scope' && <>
      <Field label={t.flightPurpose}><select value={text('flightPurpose')} onChange={(e) => set('flightPurpose', e.target.value)}><option value="SURVEY_MONITORING">{t.optSurvey}</option><option value="AGRICULTURE">{t.optAgri}</option><option value="CONSTRUCTION_MONITORING">{t.optConstruction}</option><option value="INDUSTRIAL_INSPECTION">{t.optIndustrial}</option></select></Field>
      <Field label={t.usagePurpose}><select value={text('usagePurpose')} onChange={(e) => set('usagePurpose', e.target.value)}><option value="">—</option><option value="INTERNAL">{t.optInternal}</option><option value="LEGAL">{t.optLegal}</option><option value="PARTNER_REPORT">{t.optPartner}</option><option value="OTHER">{t.optOther}</option></select></Field>
      <Field label={t.altitude}><input type="number" min="10" max="120" value={text('altitudeM')} onChange={(e) => set('altitudeM', e.target.value)} /></Field>
      <Field label={t.length}><input type="number" min="1" value={text('estimatedLengthM')} onChange={(e) => set('estimatedLengthM', e.target.value)} /></Field>
      <Field label={t.recurrence}><select value={text('recurrenceType')} onChange={(e) => set('recurrenceType', e.target.value)}><option value="NONE">{t.optNone}</option><option value="WEEKLY">{t.optWeekly}</option><option value="MONTHLY">{t.optMonthly}</option></select></Field>
      {text('recurrenceType') !== 'NONE' && <Field label={t.times}><input type="number" min="2" max="52" value={text('recurrenceOccurrences')} onChange={(e) => set('recurrenceOccurrences', e.target.value)} /></Field>}
    </>}
    {section === 'site' && <>
      <Field label={t.contact}><input value={text('siteContactName')} onChange={(e) => set('siteContactName', e.target.value)} /></Field>
      <Field label={t.phone}><input value={text('siteContactPhone')} onChange={(e) => set('siteContactPhone', e.target.value)} /></Field>
      <Field label={t.access}><textarea rows={3} value={text('accessNotes')} onChange={(e) => set('accessNotes', e.target.value)} /></Field>
      <Field label={t.relationship}><select value={text('monitoringRelationship')} onChange={(e) => set('monitoringRelationship', e.target.value)}><option value="">—</option><option value="OWNER">{t.optOwner}</option><option value="AUTHORIZED_PERSON">{t.optAuthorized}</option><option value="CONTRACTOR">{t.optContractor}</option><option value="MANAGER_OR_SUPERVISOR">{t.optManager}</option><option value="OTHER">{t.optOther}</option></select></Field>
      <Field label={t.fallback}><select value={text('weatherFallback')} onChange={(e) => set('weatherFallback', e.target.value)}><option value="AUTO_RESCHEDULE">{t.optAuto}</option><option value="CONTACT_CUSTOMER">{t.optContact}</option><option value="CANCEL_ORDER">{t.optCancelOrder}</option></select></Field>
    </>}
    {section === 'permit' && <>
      <label className="od-inline-check"><input type="checkbox" checked={Boolean(draft.monitoringAuthorizationConfirmed)} onChange={(e) => set('monitoringAuthorizationConfirmed', e.target.checked)} /> {t.authz}</label>
      <Field label={t.permitStatus}><select value={text('permitStatus')} onChange={(e) => set('permitStatus', e.target.value)}><option value="">—</option><option value="HAVE_PERMIT">{t.optHave}</option><option value="NEED_SUPPORT">{t.optNeed}</option></select></Field>
      <Field label={t.permitNumber}><input value={text('permitNumber')} onChange={(e) => set('permitNumber', e.target.value)} /></Field>
      <Field label={t.permitExpiry}><input type="date" value={text('permitExpiresOn')} onChange={(e) => set('permitExpiresOn', e.target.value)} /></Field>
    </>}
    {section === 'result' && <>
      <Field label={t.formats}><input value={text('resultFormats')} onChange={(e) => set('resultFormats', e.target.value)} /></Field>
      <Field label={t.methods}><input value={text('deliveryMethods')} onChange={(e) => set('deliveryMethods', e.target.value)} /></Field>
      <Field label={t.retention}><select value={text('dataRetentionDays')} onChange={(e) => set('dataRetentionDays', e.target.value)}><option value="30">{t.days(30)}</option><option value="90">{t.days(90)}</option><option value="180">{t.days(180)}</option><option value="365">{t.days(365)}</option></select></Field>
    </>}
    {section === 'description' && <Field label={t.description}><textarea rows={5} value={text('description')} onChange={(e) => set('description', e.target.value)} /></Field>}
    {error && <p className="od-inline-error" role="alert">{error}</p>}
    <div className="od-inline-actions"><Button onClick={onCancel}>{t.cancel}</Button><Button type="primary" disabled={busy} onClick={() => void save()}>{busy ? t.saving : t.save}</Button></div>
  </div>
}
