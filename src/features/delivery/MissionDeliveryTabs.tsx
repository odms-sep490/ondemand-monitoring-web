import { useEffect, useState, type ReactNode } from 'react'
import { Alert, Button, Skeleton, Tabs } from 'antd'
import { defineMessages, useI18n } from '../../shared/i18n'
import { deliveryApi, type MissionDeliverySummary } from './api'

const messages = defineMessages({
  vi: {
    title: 'Kết quả theo nhiệm vụ',
    failed: 'Không tải được danh sách kết quả nhiệm vụ.',
    retry: 'Thử lại',
  },
  en: {
    title: 'Results by mission',
    failed: 'Could not load mission deliveries.',
    retry: 'Retry',
  },
})

/** Mount only the selected scope so drafts, acceptance and feedback cannot leak between Missions. */
export function MissionDeliveryTabs({
  orderId,
  manager = false,
  initialMissionId,
  children,
}: {
  orderId: string
  manager?: boolean
  initialMissionId?: string
  children: (missionId?: string) => ReactNode
}) {
  const { t } = useI18n(messages)
  const [rows, setRows] = useState<MissionDeliverySummary[] | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [selected, setSelected] = useState<string>()
  useEffect(() => {
    const controller = new AbortController()
    setRows(null)
    setError(false)
    setSelected(undefined)
    void deliveryApi
      .missionDeliveries(orderId, manager, controller.signal)
      .then(
        (value) => {
          if (!controller.signal.aborted) setRows(value)
        },
        () => {
          if (!controller.signal.aborted) setError(true)
        },
      )
    return () => controller.abort()
  }, [orderId, manager, attempt])
  if (error)
    return (
      <Alert
        type="error"
        message={t.failed}
        action={
          <Button onClick={() => setAttempt((v) => v + 1)}>{t.retry}</Button>
        }
      />
    )
  if (!rows) return <Skeleton active />
  if (!rows.length) return <>{children(undefined)}</>
  const current = rows.some((row) => row.missionId === selected)
    ? selected
    : (rows.find(
        (row) =>
          row.missionId === initialMissionId ||
          row.relatedMissionIds?.includes(initialMissionId ?? ''),
      )?.missionId ?? rows[0].missionId)
  return (
    <section aria-label={t.title}>
      {rows.length > 1 && <Tabs
        activeKey={current}
        onChange={setSelected}
        items={rows.map((row) => ({
          key: row.missionId,
          label: row.missionCode,
        }))}
      />}
      <div key={`${orderId}:${current}`}>{children(current)}</div>
    </section>
  )
}
