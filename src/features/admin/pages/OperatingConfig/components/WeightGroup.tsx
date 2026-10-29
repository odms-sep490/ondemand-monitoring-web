import { Alert, Button, Slider, Typography } from 'antd'
import { useEffect, useState } from 'react'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { DispatchWeight } from '../../../types/operatingConfig'
import { weightGroupMessages } from './WeightGroup.messages'

type Weights = Array<{ key: string; value: number }>

type Props = {
  group: 'DRONE' | 'OPERATOR'
  label: string
  items: DispatchWeight[]
  onSave: (weights: Weights) => Promise<void>
}

const toValues = (items: DispatchWeight[]) =>
  Object.fromEntries(items.map((w) => [w.key, w.value]))

export function WeightGroup({ group, label, items, onSave }: Props) {
  const { t } = useI18n(weightGroupMessages)
  const [values, setValues] = useState<Record<string, number>>(toValues(items))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => setValues(toValues(items)), [items])

  const sum = Object.values(values).reduce((a, b) => a + b, 0)
  const isValid = sum === 100
  const tone = isValid ? 'success' : 'danger'

  async function handleSave() {
    if (!isValid) {
      setError(t.sumInvalid(sum))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(Object.entries(values).map(([key, value]) => ({ key, value })))
    } catch (err) {
      setError(err instanceof Error ? err.message : t.genericError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <CardComponent
      title={t.groupTitle(label, group === 'DRONE' ? t.droneGroup : t.pilotGroup)}
    >
      {items.map((w) => (
        <div key={w.key} className="adm-weight-row">
          <span className="adm-weight-label adm-wrap">{w.label}</span>
          <Slider
            min={0}
            max={100}
            step={5}
            aria-label={w.label}
            tooltip={{ open: false }}
            value={values[w.key] ?? w.value}
            onChange={(value) => setValues({ ...values, [w.key]: value })}
          />
          <Typography.Text type={tone} className="adm-weight-value">
            {values[w.key] ?? w.value}%
          </Typography.Text>
        </div>
      ))}
      <div className="adm-weight-footer">
        <Typography.Text type={tone} strong className="adm-weight-total">
          {t.total(sum, isValid)}
        </Typography.Text>
        <div className="adm-row-actions">
          <Button
            onClick={() => {
              setValues(toValues(items))
              setError(null)
            }}
          >
            {t.resetDefault}
          </Button>
          <Button type="primary" disabled={!isValid} loading={saving} onClick={handleSave}>
            {saving ? t.saving : t.save}
          </Button>
        </div>
      </div>
      {error && <Alert type="error" showIcon role="alert" message={error} />}
    </CardComponent>
  )
}
