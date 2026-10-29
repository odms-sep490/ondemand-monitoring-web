import { Form, Input, Select } from 'antd'

import { mgrPopupContainer } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { ZoneType } from '../../../types/operatingConfig'
import type { ZoneFormState } from './zoneForm'
import { zoneModalMessages } from './ZoneModal.messages'
import { ZONE_TYPES, zoneTypeMessages } from './zoneTypes'

type Props = {
  form: ZoneFormState
  errors: Record<string, string>
  onChange: (patch: Partial<ZoneFormState>) => void
}

export function ZoneFormFields({ form, errors, onChange }: Props) {
  const { t } = useI18n(zoneModalMessages)
  const { t: zt } = useI18n(zoneTypeMessages)
  const text = (id: string, key: keyof ZoneFormState, type = 'text', extra = {}) => (
    <Input
      id={id}
      type={type}
      value={form[key]}
      onChange={(e) => onChange({ [key]: e.target.value })}
      {...extra}
    />
  )
  return (
    <>
      <Form.Item label={t.name} required htmlFor="adm-nfz-name" validateStatus={errors.name ? 'error' : undefined} help={errors.name}>
        {text('adm-nfz-name', 'name')}
      </Form.Item>
      <div className="adm-form-pair">
        <Form.Item label={t.source} htmlFor="adm-nfz-source">
          {text('adm-nfz-source', 'source')}
        </Form.Item>
        <Form.Item label={t.zoneTypeLabel} htmlFor="adm-nfz-type">
          <Select<ZoneType>
            id="adm-nfz-type"
            value={form.zoneType}
            onChange={(zoneType) => onChange({ zoneType })}
            getPopupContainer={mgrPopupContainer}
            options={ZONE_TYPES.map((z) => ({ value: z, label: zt[z] }))}
          />
        </Form.Item>
      </div>
      <div className="adm-form-pair">
        <Form.Item label={t.lat} htmlFor="adm-nfz-lat">
          {text('adm-nfz-lat', 'lat', 'number', { step: '0.0001' })}
        </Form.Item>
        <Form.Item label={t.lon} htmlFor="adm-nfz-lon">
          {text('adm-nfz-lon', 'lon', 'number', { step: '0.0001' })}
        </Form.Item>
      </div>
      <div className="adm-form-pair">
        <Form.Item label={t.radius} htmlFor="adm-nfz-radius">
          {text('adm-nfz-radius', 'radiusM', 'number')}
        </Form.Item>
        <Form.Item label={t.maxAlt} htmlFor="adm-nfz-alt">
          {text('adm-nfz-alt', 'maxAlt', 'number', { placeholder: t.unlimited })}
        </Form.Item>
      </div>
      <div className="adm-form-pair">
        <Form.Item label={t.effectiveFrom} htmlFor="adm-nfz-from">
          {text('adm-nfz-from', 'effectiveFrom', 'date')}
        </Form.Item>
        <Form.Item label={t.effectiveTo} htmlFor="adm-nfz-to">
          {text('adm-nfz-to', 'effectiveTo', 'date')}
        </Form.Item>
      </div>
    </>
  )
}
