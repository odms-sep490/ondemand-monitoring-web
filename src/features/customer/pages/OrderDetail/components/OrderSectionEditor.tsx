import { Alert, Button, Checkbox, Input, Select } from 'antd'
import { useState } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { orderSectionEditorMessages } from './OrderSectionEditor.messages'
import { apiRequest } from '../../../../../shared/api/httpClient'
import type { OrderDetailView } from '../../../lib/orders/types'

export type EditableOrderSection =
  'general' | 'scope' | 'site' | 'permit' | 'result' | 'description'

const Field = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => (
  <label className="od-inline-edit-field">
    <span>{label}</span>
    {children}
  </label>
)

export function OrderSectionEditor({
  section,
  order,
  onCancel,
  onSaved,
}: {
  section: EditableOrderSection
  order: OrderDetailView
  onCancel: () => void
  onSaved: () => void
}) {
  const { t } = useI18n(orderSectionEditorMessages)
  const [draft, setDraft] = useState<Record<string, string | boolean>>({
    title: order.title,
    address: order.address ?? '',
    preferredDateFrom: order.dateFrom ?? '',
    preferredDateTo: order.dateTo ?? '',
    resultDeadline: order.resultDeadline ?? '',
    flightPurpose: order.flightPurpose ?? 'SURVEY_MONITORING',
    usagePurpose: order.usagePurpose ?? '',
    altitudeM: order.altitudeM?.toString() ?? '',
    estimatedLengthM: order.estimatedLengthM?.toString() ?? '',
    recurrenceType: order.recurrenceType ?? 'NONE',
    recurrenceOccurrences: order.recurrenceOccurrences?.toString() ?? '',
    siteContactName: order.siteContactName ?? '',
    siteContactPhone: order.siteContactPhone ?? '',
    accessNotes: order.accessNotes ?? '',
    monitoringRelationship: order.monitoringRelationship ?? '',
    weatherFallback: order.weatherFallback ?? 'CONTACT_CUSTOMER',
    monitoringAuthorizationConfirmed: order.monitoringAuthorizationConfirmed,
    permitStatus: order.permitStatus ?? '',
    permitNumber: order.permitNumber ?? '',
    permitExpiresOn: order.permitExpiresOn ?? '',
    resultFormats: order.resultFormats.join(','),
    deliveryMethods: order.deliveryMethods.join(','),
    dataRetentionDays: order.dataRetentionDays?.toString() ?? '90',
    description: order.description ?? '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (key: string, value: string | boolean) =>
    setDraft((current) => ({ ...current, [key]: value }))
  const text = (key: string) => String(draft[key] ?? '')

  async function save() {
    setBusy(true)
    setError('')
    const keys: Record<EditableOrderSection, string[]> = {
      general: [
        'title',
        'address',
        'preferredDateFrom',
        'preferredDateTo',
        'resultDeadline',
      ],
      scope: [
        'flightPurpose',
        'usagePurpose',
        'altitudeM',
        'estimatedLengthM',
        'recurrenceType',
        'recurrenceOccurrences',
      ],
      site: [
        'siteContactName',
        'siteContactPhone',
        'accessNotes',
        'monitoringRelationship',
        'weatherFallback',
      ],
      permit: [
        'monitoringAuthorizationConfirmed',
        'permitStatus',
        'permitNumber',
        'permitExpiresOn',
      ],
      result: ['resultFormats', 'deliveryMethods', 'dataRetentionDays'],
      description: ['description'],
    }
    const numeric = new Set([
      'altitudeM',
      'estimatedLengthM',
      'recurrenceOccurrences',
      'dataRetentionDays',
    ])
    const arrays = new Set(['resultFormats', 'deliveryMethods'])
    const omitWhenBlank = new Set([
      'usagePurpose',
      'monitoringRelationship',
      'permitStatus',
      'permitExpiresOn',
      'preferredDateFrom',
      'preferredDateTo',
      'resultDeadline',
    ])
    const body: Record<string, unknown> = {}
    for (const key of keys[section]) {
      const value = draft[key]
      if (omitWhenBlank.has(key) && value === '') continue
      if (numeric.has(key)) body[key] = value === '' ? null : Number(value)
      else if (arrays.has(key))
        body[key] = String(value)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      else body[key] = value
    }
    try {
      await apiRequest(`/api/orders/${encodeURIComponent(order.id)}`, {
        method: 'PATCH',
        body,
      })
      onSaved()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.saveFailed)
      setBusy(false)
    }
  }

  return (
    <div className="od-inline-editor">
      {section === 'general' && (
        <>
          <Field label={t.title}>
            <Input
              value={text('title')}
              onChange={(e) => set('title', e.target.value)}
            />
          </Field>
          <Field label={t.address}>
            <Input
              value={text('address')}
              onChange={(e) => set('address', e.target.value)}
            />
          </Field>
          <Field label={t.dateFrom}>
            <Input
              type="date"
              value={text('preferredDateFrom')}
              onChange={(e) => set('preferredDateFrom', e.target.value)}
            />
          </Field>
          <Field label={t.dateTo}>
            <Input
              type="date"
              value={text('preferredDateTo')}
              onChange={(e) => set('preferredDateTo', e.target.value)}
            />
          </Field>
          <Field label={t.resultDeadline}>
            <Input
              type="date"
              value={text('resultDeadline')}
              onChange={(e) => set('resultDeadline', e.target.value)}
            />
          </Field>
        </>
      )}
      {section === 'scope' && (
        <>
          <Field label={t.flightPurpose}>
            <Select
              className="od-inline-select"
              value={text('flightPurpose')}
              onChange={(value) => set('flightPurpose', value)}
              options={[
                { value: 'SURVEY_MONITORING', label: t.optSurvey },
                { value: 'AGRICULTURE', label: t.optAgri },
                { value: 'CONSTRUCTION_MONITORING', label: t.optConstruction },
                { value: 'INDUSTRIAL_INSPECTION', label: t.optIndustrial },
              ]}
            />
          </Field>
          <Field label={t.usagePurpose}>
            <Select
              className="od-inline-select"
              value={text('usagePurpose')}
              onChange={(value) => set('usagePurpose', value)}
              options={[
                { value: '', label: '—' },
                { value: 'INTERNAL', label: t.optInternal },
                { value: 'LEGAL', label: t.optLegal },
                { value: 'PARTNER_REPORT', label: t.optPartner },
                { value: 'OTHER', label: t.optOther },
              ]}
            />
          </Field>
          <Field label={t.altitude}>
            <Input
              type="number"
              min="10"
              max="120"
              value={text('altitudeM')}
              onChange={(e) => set('altitudeM', e.target.value)}
            />
          </Field>
          <Field label={t.length}>
            <Input
              type="number"
              min="1"
              value={text('estimatedLengthM')}
              onChange={(e) => set('estimatedLengthM', e.target.value)}
            />
          </Field>
          <Field label={t.recurrence}>
            <Select
              className="od-inline-select"
              value={text('recurrenceType')}
              onChange={(value) => set('recurrenceType', value)}
              options={[
                { value: 'NONE', label: t.optNone },
                { value: 'WEEKLY', label: t.optWeekly },
                { value: 'MONTHLY', label: t.optMonthly },
              ]}
            />
          </Field>
          {text('recurrenceType') !== 'NONE' && (
            <Field label={t.times}>
              <Input
                type="number"
                min="2"
                max="52"
                value={text('recurrenceOccurrences')}
                onChange={(e) => set('recurrenceOccurrences', e.target.value)}
              />
            </Field>
          )}
        </>
      )}
      {section === 'site' && (
        <>
          <Field label={t.contact}>
            <Input
              value={text('siteContactName')}
              onChange={(e) => set('siteContactName', e.target.value)}
            />
          </Field>
          <Field label={t.phone}>
            <Input
              value={text('siteContactPhone')}
              onChange={(e) => set('siteContactPhone', e.target.value)}
            />
          </Field>
          <Field label={t.access}>
            <Input.TextArea
              rows={3}
              value={text('accessNotes')}
              onChange={(e) => set('accessNotes', e.target.value)}
            />
          </Field>
          <Field label={t.relationship}>
            <Select
              className="od-inline-select"
              value={text('monitoringRelationship')}
              onChange={(value) => set('monitoringRelationship', value)}
              options={[
                { value: '', label: '—' },
                { value: 'OWNER', label: t.optOwner },
                { value: 'AUTHORIZED_PERSON', label: t.optAuthorized },
                { value: 'CONTRACTOR', label: t.optContractor },
                { value: 'MANAGER_OR_SUPERVISOR', label: t.optManager },
                { value: 'OTHER', label: t.optOther },
              ]}
            />
          </Field>
          <Field label={t.fallback}>
            <Select
              className="od-inline-select"
              value={text('weatherFallback')}
              onChange={(value) => set('weatherFallback', value)}
              options={[
                { value: 'AUTO_RESCHEDULE', label: t.optAuto },
                { value: 'CONTACT_CUSTOMER', label: t.optContact },
                { value: 'CANCEL_ORDER', label: t.optCancelOrder },
              ]}
            />
          </Field>
        </>
      )}
      {section === 'permit' && (
        <>
          <Checkbox
            className="od-inline-check"
            checked={Boolean(draft.monitoringAuthorizationConfirmed)}
            onChange={(e) =>
              set('monitoringAuthorizationConfirmed', e.target.checked)
            }
          >
            {t.authz}
          </Checkbox>
          <Field label={t.permitStatus}>
            <Select
              className="od-inline-select"
              value={text('permitStatus')}
              onChange={(value) => set('permitStatus', value)}
              options={[
                { value: '', label: '—' },
                { value: 'HAVE_PERMIT', label: t.optHave },
                { value: 'NEED_SUPPORT', label: t.optNeed },
              ]}
            />
          </Field>
          <Field label={t.permitNumber}>
            <Input
              value={text('permitNumber')}
              onChange={(e) => set('permitNumber', e.target.value)}
            />
          </Field>
          <Field label={t.permitExpiry}>
            <Input
              type="date"
              value={text('permitExpiresOn')}
              onChange={(e) => set('permitExpiresOn', e.target.value)}
            />
          </Field>
        </>
      )}
      {section === 'result' && (
        <>
          <Field label={t.formats}>
            <Input
              value={text('resultFormats')}
              onChange={(e) => set('resultFormats', e.target.value)}
            />
          </Field>
          <Field label={t.methods}>
            <Input
              value={text('deliveryMethods')}
              onChange={(e) => set('deliveryMethods', e.target.value)}
            />
          </Field>
          <Field label={t.retention}>
            <Select
              className="od-inline-select"
              value={text('dataRetentionDays')}
              onChange={(value) => set('dataRetentionDays', value)}
              options={[
                { value: '30', label: t.days(30) },
                { value: '90', label: t.days(90) },
                { value: '180', label: t.days(180) },
                { value: '365', label: t.days(365) },
              ]}
            />
          </Field>
        </>
      )}
      {section === 'description' && (
        <Field label={t.description}>
          <Input.TextArea
            rows={5}
            value={text('description')}
            onChange={(e) => set('description', e.target.value)}
          />
        </Field>
      )}
      {error && (
        <Alert
          className="od-inline-error"
          type="error"
          showIcon
          message={error}
        />
      )}
      <div className="od-inline-actions">
        <Button onClick={onCancel}>{t.cancel}</Button>
        <Button type="primary" disabled={busy} onClick={() => void save()}>
          {busy ? t.saving : t.save}
        </Button>
      </div>
    </div>
  )
}
