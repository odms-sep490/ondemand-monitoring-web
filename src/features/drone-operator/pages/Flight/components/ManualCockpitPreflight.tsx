import { Button, Checkbox } from 'antd'
import { useState } from 'react'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { manualCockpitPreflightMessages } from './ManualCockpitPreflight.messages'

export const manualPreflightItems = [
  { key: 'drone' },
  { key: 'gps' },
  { key: 'battery' },
  { key: 'propeller' },
  { key: 'area' },
] as const

export function ManualCockpitPreflight({
  missionLabel,
  deviceLabel,
  onReady,
}: {
  missionLabel: string
  deviceLabel: string
  onReady: () => void | Promise<void>
}) {
  const { t } = useI18n(manualCockpitPreflightMessages)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const doneCount = manualPreflightItems.filter(
    (item) => checked[item.key],
  ).length
  const allDone = doneCount === manualPreflightItems.length

  async function handleContinue() {
    if (!allDone || submitting) return
    setSubmitting(true)
    try {
      await onReady()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CardComponent className="stf-manual-preflight">
      <div className="stf-stack-sm">
        <div className="stf-row" style={{ justifyContent: 'space-between' }}>
          <div>
            <div className="stf-group-title">{t.title}</div>
            <h2 className="stf-manual-title">{missionLabel}</h2>
            <span className="stf-muted">{deviceLabel}</span>
          </div>
          <strong className="stf-mono stf-manual-count">
            {doneCount}/{manualPreflightItems.length}
          </strong>
        </div>
        <div className="stf-stack-sm">
          {manualPreflightItems.map((item) => (
            <label key={item.key} className="stf-item stf-manual-item">
              <Checkbox
                checked={checked[item.key] === true}
                onChange={(event) =>
                  setChecked((current) => ({
                    ...current,
                    [item.key]: event.target.checked,
                  }))
                }
              >
                {t.items[item.key]}
              </Checkbox>
            </label>
          ))}
        </div>
        <Button
          type="primary"
          size="large"
          block
          disabled={!allDone || submitting}
          loading={submitting}
          onClick={handleContinue}
        >
          {submitting ? t.continuing : t.skip}
        </Button>
      </div>
    </CardComponent>
  )
}
