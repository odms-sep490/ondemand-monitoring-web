import { useState } from 'react'
import { Alert, Button, Switch } from 'antd'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n, defineMessages } from '../../../../../shared/i18n'
import {
  ErrorState,
  LoadingState,
} from '../../../../../shared/components/odm/StateView'
import { ApiError } from '../../../../../shared/api/httpClient'
import {
  checklistImageAiApi,
  type ChecklistImageAiSettings as Settings,
} from '../../../api/checklistImageAiApi'
import './checklistImageAiSettings.css'

const messages = defineMessages({
  vi: {
    title: 'AI đánh giá ảnh checklist',
    description: 'Cho phép Inspector đối chiếu ảnh với tiêu chí của checklist.',
    enabled: 'Bật AI đánh giá ảnh toàn hệ thống',
    scope:
      'Áp dụng cho tất cả đơn hàng. Tắt AI vẫn lưu tiêu chí và snapshot để dùng khi bật lại. Mỗi checklist còn có công tắc riêng.',
    missingProvider:
      'Dịch vụ hoặc model AI chưa được cấu hình. Liên hệ vận hành để chuẩn bị dịch vụ trước khi sử dụng.',
    active: 'Đang bật',
    inactive: 'Đang tắt',
    unavailable: 'Chưa sẵn sàng',
    save: 'Lưu cấu hình AI',
    saved: 'Đã lưu cấu hình AI.',
    failed: 'Không lưu được cấu hình. Vui lòng thử lại.',
    conflict:
      'Cấu hình đã được cập nhật bởi người khác. Tải lại trước khi lưu.',
    reload: 'Tải lại cấu hình',
  },
  en: {
    title: 'Checklist image assessment AI',
    description: 'Allow Inspectors to compare images with checklist criteria.',
    enabled: 'Enable AI image assessment system-wide',
    scope:
      'Applies to all orders. Turning AI off retains criteria and snapshots for reuse. Each checklist also has its own switch.',
    missingProvider:
      'The AI service or model is not configured. Contact operations to prepare the service before use.',
    active: 'Enabled',
    inactive: 'Disabled',
    unavailable: 'Not ready',
    save: 'Save AI settings',
    saved: 'AI settings saved.',
    failed: 'Unable to save settings. Please try again.',
    conflict: 'Someone else updated these settings. Reload before saving.',
    reload: 'Reload settings',
  },
})

export function ChecklistImageAiSettings() {
  const query = useApiQuery((signal) => checklistImageAiApi.get(signal), [])
  if (query.loading) return <LoadingState />
  if (query.error)
    return <ErrorState error={query.error} onRetry={query.reload} />
  if (!query.data) return null
  return (
    <SettingsEditor
      key={query.data.version}
      initial={query.data}
      reload={query.reload}
    />
  )
}

function SettingsEditor({
  initial,
  reload,
}: {
  initial: Settings
  reload: () => void
}) {
  const { t } = useI18n(messages)
  const [current, setCurrent] = useState(initial)
  const [enabled, setEnabled] = useState(initial.enabled)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<'conflict' | 'failed' | null>(null)
  const [saved, setSaved] = useState(false)
  async function save() {
    if (busy || enabled === current.enabled || error === 'conflict') return
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      const next = await checklistImageAiApi.update(enabled, current.version)
      setCurrent(next)
      setEnabled(next.enabled)
      setSaved(true)
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.code === 'CONCURRENT_UPDATE'
          ? 'conflict'
          : 'failed',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="checklist-image-ai-settings">
      <header>
        <div>
          <h2>{t.title}</h2>
          <p>{t.description}</p>
        </div>
        <span>
          {!current.enabled
            ? t.inactive
            : current.effectiveEnabled
              ? t.active
              : t.unavailable}
        </span>
      </header>
      <div className="checklist-image-ai-settings__control">
        <div>
          <label id="checklist-image-ai-label">{t.enabled}</label>
          <p>{t.scope}</p>
        </div>
        <Switch
          aria-labelledby="checklist-image-ai-label"
          checked={enabled}
          disabled={busy}
          onChange={(value) => {
            setEnabled(value)
            setSaved(false)
          }}
        />
      </div>
      {!current.providerConfigured && (
        <Alert type="warning" showIcon message={t.missingProvider} />
      )}
      {error && <Alert type="error" showIcon message={t[error]} />}
      {saved && <p role="status">{t.saved}</p>}
      <footer>
        <Button disabled={busy} onClick={reload}>
          {t.reload}
        </Button>
        <Button
          type="primary"
          aria-label={t.save}
          aria-busy={busy}
          loading={busy}
          disabled={busy || enabled === current.enabled || error === 'conflict'}
          onClick={() => void save()}
        >
          {t.save}
        </Button>
      </footer>
    </section>
  )
}
