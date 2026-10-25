import { useState } from 'react'
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
      setError(cause instanceof Error ? cause.message : 'Không thể lưu thay đổi.')
      setBusy(false)
    }
  }

  return <div className="od-inline-editor">
    {section === 'general' && <>
      <Field label="Tiêu đề"><input value={text('title')} onChange={(e) => set('title', e.target.value)} /></Field>
      <Field label="Địa điểm"><input value={text('address')} onChange={(e) => set('address', e.target.value)} /></Field>
      <Field label="Từ ngày"><input type="date" value={text('preferredDateFrom')} onChange={(e) => set('preferredDateFrom', e.target.value)} /></Field>
      <Field label="Đến ngày"><input type="date" value={text('preferredDateTo')} onChange={(e) => set('preferredDateTo', e.target.value)} /></Field>
      <Field label="Hạn nhận kết quả"><input type="date" value={text('resultDeadline')} onChange={(e) => set('resultDeadline', e.target.value)} /></Field>
    </>}
    {section === 'scope' && <>
      <Field label="Mục đích bay"><select value={text('flightPurpose')} onChange={(e) => set('flightPurpose', e.target.value)}><option value="SURVEY_MONITORING">Đo đạc, khảo sát, giám sát</option><option value="AGRICULTURE">Nông nghiệp</option><option value="CONSTRUCTION_MONITORING">Giám sát công trình</option><option value="INDUSTRIAL_INSPECTION">Kiểm tra nhà xưởng</option></select></Field>
      <Field label="Mục đích sử dụng"><select value={text('usagePurpose')} onChange={(e) => set('usagePurpose', e.target.value)}><option value="">—</option><option value="INTERNAL">Nội bộ</option><option value="LEGAL">Pháp lý</option><option value="PARTNER_REPORT">Báo cáo đối tác</option><option value="OTHER">Khác</option></select></Field>
      <Field label="Độ cao giám sát mong muốn (m)"><input type="number" min="10" max="120" value={text('altitudeM')} onChange={(e) => set('altitudeM', e.target.value)} /></Field>
      <Field label="Chiều dài ước tính (m)"><input type="number" min="1" value={text('estimatedLengthM')} onChange={(e) => set('estimatedLengthM', e.target.value)} /></Field>
      <Field label="Lịch lặp"><select value={text('recurrenceType')} onChange={(e) => set('recurrenceType', e.target.value)}><option value="NONE">Không có</option><option value="WEEKLY">Hằng tuần</option><option value="MONTHLY">Hằng tháng</option></select></Field>
      {text('recurrenceType') !== 'NONE' && <Field label="Số lần"><input type="number" min="2" max="52" value={text('recurrenceOccurrences')} onChange={(e) => set('recurrenceOccurrences', e.target.value)} /></Field>}
    </>}
    {section === 'site' && <>
      <Field label="Người liên hệ"><input value={text('siteContactName')} onChange={(e) => set('siteContactName', e.target.value)} /></Field>
      <Field label="Số điện thoại"><input value={text('siteContactPhone')} onChange={(e) => set('siteContactPhone', e.target.value)} /></Field>
      <Field label="Điều kiện ra vào"><textarea rows={3} value={text('accessNotes')} onChange={(e) => set('accessNotes', e.target.value)} /></Field>
      <Field label="Quan hệ với khu vực"><select value={text('monitoringRelationship')} onChange={(e) => set('monitoringRelationship', e.target.value)}><option value="">—</option><option value="OWNER">Chủ sở hữu / Chủ đầu tư</option><option value="AUTHORIZED_PERSON">Người được ủy quyền</option><option value="CONTRACTOR">Nhà thầu</option><option value="MANAGER_OR_SUPERVISOR">Đơn vị quản lý</option><option value="OTHER">Khác</option></select></Field>
      <Field label="Khi có sự cố"><select value={text('weatherFallback')} onChange={(e) => set('weatherFallback', e.target.value)}><option value="AUTO_RESCHEDULE">Tự dời lịch</option><option value="CONTACT_CUSTOMER">Liên hệ tôi</option><option value="CANCEL_ORDER">Hủy yêu cầu</option></select></Field>
    </>}
    {section === 'permit' && <>
      <label className="od-inline-check"><input type="checkbox" checked={Boolean(draft.monitoringAuthorizationConfirmed)} onChange={(e) => set('monitoringAuthorizationConfirmed', e.target.checked)} /> Tôi xác nhận có quyền yêu cầu giám sát</label>
      <Field label="Trạng thái giấy phép"><select value={text('permitStatus')} onChange={(e) => set('permitStatus', e.target.value)}><option value="">—</option><option value="HAVE_PERMIT">Đã có giấy phép</option><option value="NEED_SUPPORT">Cần hỗ trợ xin phép</option></select></Field>
      <Field label="Số giấy phép"><input value={text('permitNumber')} onChange={(e) => set('permitNumber', e.target.value)} /></Field>
      <Field label="Hiệu lực đến"><input type="date" value={text('permitExpiresOn')} onChange={(e) => set('permitExpiresOn', e.target.value)} /></Field>
    </>}
    {section === 'result' && <>
      <Field label="Định dạng (cách nhau bằng dấu phẩy)"><input value={text('resultFormats')} onChange={(e) => set('resultFormats', e.target.value)} /></Field>
      <Field label="Cách bàn giao (cách nhau bằng dấu phẩy)"><input value={text('deliveryMethods')} onChange={(e) => set('deliveryMethods', e.target.value)} /></Field>
      <Field label="Thời gian lưu dữ liệu"><select value={text('dataRetentionDays')} onChange={(e) => set('dataRetentionDays', e.target.value)}><option value="30">30 ngày</option><option value="90">90 ngày</option><option value="180">180 ngày</option><option value="365">365 ngày</option></select></Field>
    </>}
    {section === 'description' && <Field label="Mô tả"><textarea rows={5} value={text('description')} onChange={(e) => set('description', e.target.value)} /></Field>}
    {error && <p className="od-inline-error" role="alert">{error}</p>}
    <div className="od-inline-actions"><button type="button" className="odm-btn" onClick={onCancel}>Hủy</button><button type="button" className="odm-btn odm-btn-ok" disabled={busy} onClick={() => void save()}>{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</button></div>
  </div>
}
