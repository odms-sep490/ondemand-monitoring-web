import { useMemo, useState } from 'react'

import { LeftOutlined, RightOutlined, SaveOutlined } from '@ant-design/icons'
import { Alert, Button, Skeleton, Space } from 'antd'

import {
  CardComponent,
  ErrorState,
  PageHeader,
} from '../../../../shared/components/antd'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { operatorApi } from '../../api/operatorApi'
import {
  mergeSlots,
  slotKey,
  type AvailabilityStatus,
} from '../../lib/availabilitySlots'
import {
  AvailabilityGrid,
  type MissionOverlay,
} from './components/AvailabilityGrid'
import { availabilityPageMessages } from './AvailabilityPage.messages'

// Fixed to the design's reference week (21/09 - 27/09/2026, Tuần 39). A real
// implementation would derive this from the demo clock plus ‹ › navigation;
// out of scope for the mock.
const WEEK_KEY = '2026-W39'
const WEEK_DAYS = [
  '2026-09-21',
  '2026-09-22',
  '2026-09-23',
  '2026-09-24',
  '2026-09-25',
  '2026-09-26',
  '2026-09-27',
]

// Structural (day/time/tone) part of the demo mission overlays; the label
// text comes from `availabilityScreenMessages` so it can be bilingual.
const OVERLAY_SHAPE: { day: string; time: string; tone: 'green' | 'gray' }[] = [
  { day: '2026-09-21', time: '16:00', tone: 'green' },
  { day: '2026-09-24', time: '13:00', tone: 'gray' },
  { day: '2026-09-25', time: '08:00', tone: 'gray' },
]

export function AvailabilityPage() {
  const query = useApiQuery(
    (signal) => operatorApi.getAvailability(WEEK_KEY, signal),
    [],
  )
  const [localSlots, setLocalSlots] = useState<Record<
    string,
    AvailabilityStatus
  > | null>(null)
  const [selection, setSelection] = useState<string[]>([])
  const [mode, setMode] = useState<AvailabilityStatus>('AVAILABLE')
  const [saving, setSaving] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')
  const { t } = useI18n(availabilityPageMessages)

  const slots = localSlots ?? query.data?.slots ?? {}
  const selectedSet = useMemo(() => new Set(selection), [selection])
  const missionOverlays: MissionOverlay[] = OVERLAY_SHAPE.map((o, i) => ({
    ...o,
    label: t.overlayLabels[i],
  }))

  if (query.loading)
    return (
      <div className="stf-stack" aria-busy="true">
        <CardComponent>
          <Skeleton active paragraph={{ rows: 1 }} />
        </CardComponent>
        <CardComponent>
          <Skeleton active paragraph={{ rows: 8 }} />
        </CardComponent>
      </div>
    )
  if (query.error) {
    return (
      <ErrorState
        title={t.loadFailedTitle}
        description={t.loadFailedDesc}
        action={
          <Button type="primary" onClick={() => query.reload()}>
            {t.retry}
          </Button>
        }
      />
    )
  }

  function applyMode() {
    if (selection.length === 0) return
    setLocalSlots(mergeSlots(slots, selection, mode))
    setSelection([])
  }

  async function handleSave() {
    setSaving(true)
    setSaveState('idle')
    try {
      await operatorApi.saveAvailability({ week: WEEK_KEY, slots })
      setSaveState('saved')
    } catch {
      setSaveState('error')
    } finally {
      setSaving(false)
    }
  }

  const dirty = localSlots !== null

  return (
    <div className="stf-stack">
      <PageHeader
        title={t.title}
        description={t.description}
        actions={
          <Button
            type="primary"
            icon={<SaveOutlined aria-hidden="true" />}
            onClick={handleSave}
            disabled={saving || !dirty}
            loading={saving}
          >
            {saving ? t.saving : t.saveChanges}
          </Button>
        }
      />

      {saveState === 'saved' ? (
        <Alert type="success" showIcon message={t.savedBanner} />
      ) : saveState === 'error' ? (
        <Alert type="error" showIcon message={t.saveErrorBanner} />
      ) : !dirty && Object.keys(slots).length === 0 ? (
        <Alert type="warning" showIcon message={t.emptyWeekBanner} />
      ) : null}

      <CardComponent>
        <div className="stf-row" style={{ justifyContent: 'space-between' }}>
          <Space>
            <Button
              size="small"
              icon={<LeftOutlined aria-hidden="true" />}
              aria-label={t.prevWeek}
            />
            <strong>{t.weekLabel}</strong>
            <Button
              size="small"
              icon={<RightOutlined aria-hidden="true" />}
              aria-label={t.nextWeek}
            />
          </Space>
          <div className="stf-row">
            <span className="stf-muted">{t.declarePrefix}</span>
            {(['AVAILABLE', 'BUSY', 'OFF'] as AvailabilityStatus[]).map((m) => (
              <Button
                key={m}
                size="small"
                type={mode === m ? 'primary' : 'default'}
                danger={mode === m && m === 'OFF'}
                aria-pressed={mode === m}
                onClick={() => {
                  setMode(m)
                  if (selection.length > 0) {
                    setLocalSlots(mergeSlots(slots, selection, m))
                    setSelection([])
                  }
                }}
              >
                {t.modeLabel[m]}
              </Button>
            ))}
            {selection.length > 0 ? (
              <>
                <span className="stf-muted">
                  {t.selectionCount(selection.length)}
                </span>
                <Button size="small" onClick={() => setSelection([])}>
                  {t.deselect}
                </Button>
                <Button size="small" type="primary" onClick={applyMode}>
                  {t.apply}
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </CardComponent>

      <AvailabilityGrid
        days={WEEK_DAYS}
        slots={applySelectionPreview(slots, selectedSet, mode)}
        overlays={missionOverlays}
        onSelectionChange={setSelection}
      />
    </div>
  )
}

function applySelectionPreview(
  slots: Record<string, AvailabilityStatus>,
  selected: Set<string>,
  mode: AvailabilityStatus,
): Record<string, AvailabilityStatus> {
  if (selected.size === 0) return slots
  const next = { ...slots }
  for (const key of selected) next[key] = mode
  return next
}

// re-export for tests / potential reuse elsewhere
export { slotKey }
