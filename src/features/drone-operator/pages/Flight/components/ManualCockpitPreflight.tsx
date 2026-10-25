import { getLanguage } from '../../../../../shared/i18n'
import { useState } from 'react'

export const manualPreflightItems = [
  { key: 'drone', vi: 'Drone đã bật nguồn', en: 'Drone powered on' },
  { key: 'gps', vi: 'GPS đã sẵn sàng', en: 'GPS ready' },
  { key: 'battery', vi: 'Pin đủ bay demo', en: 'Battery ready for demo' },
  { key: 'propeller', vi: 'Cánh quạt an toàn', en: 'Propellers safe' },
  {
    key: 'area',
    vi: 'Khu vực cất cánh thông thoáng',
    en: 'Takeoff area clear',
  },
]

export function ManualCockpitPreflight({
  missionLabel,
  deviceLabel,
  onReady,
}: {
  missionLabel: string
  deviceLabel: string
  onReady: () => void | Promise<void>
}) {
  const lang = getLanguage()
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
    <div className="satellite-manual-preflight">
      <div className="satellite-manual-preflight__header">
        <div>
          <p>{lang === 'en' ? 'Manual preflight' : 'Kiểm tra thủ công'}</p>
          <h2>{missionLabel}</h2>
          <span>{deviceLabel}</span>
        </div>
        <strong>
          {doneCount}/{manualPreflightItems.length}
        </strong>
      </div>
      <div className="satellite-manual-preflight__list">
        {manualPreflightItems.map((item) => (
          <label key={item.key} className="satellite-manual-preflight__item">
            <input
              type="checkbox"
              checked={checked[item.key] === true}
              onChange={(event) =>
                setChecked((current) => ({
                  ...current,
                  [item.key]: event.target.checked,
                }))
              }
            />
            <span>{lang === 'en' ? item.en : item.vi}</span>
          </label>
        ))}
      </div>
      <button
        type="button"
        className="satellite-manual-preflight__button"
        disabled={!allDone || submitting}
        onClick={handleContinue}
      >
        {submitting
          ? lang === 'en'
            ? 'Continuing...'
            : 'Đang qua bước...'
          : lang === 'en'
            ? 'Skip to flight'
            : 'Qua bước này'}
      </button>
    </div>
  )
}
