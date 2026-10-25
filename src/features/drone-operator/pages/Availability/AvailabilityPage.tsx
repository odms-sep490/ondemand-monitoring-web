import { useMemo, useState } from 'react'

import {
  EmptyState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
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

const MODE_CLASS: Record<AvailabilityStatus, string> = {
  AVAILABLE: 'odm-btn-ok',
  BUSY: '',
  OFF: 'odm-btn-rd',
}

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

  if (query.loading) return <LoadingState />
  if (query.error) {
    return (
      <EmptyState
        title={t.loadFailedTitle}
        description={t.loadFailedDesc}
        action={
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={() => query.reload()}
          >
            {t.retry}
          </button>
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
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="odm-btn odm-btn-sm"
            aria-label={t.prevWeek}
          >
            ‹
          </button>
          <span style={{ fontWeight: 600, fontSize: 13.5 }}>{t.weekLabel}</span>
          <button
            type="button"
            className="odm-btn odm-btn-sm"
            aria-label={t.nextWeek}
          >
            ›
          </button>
        </div>
        <button
          type="button"
          className="odm-btn odm-btn-p"
          onClick={handleSave}
          disabled={saving || !dirty}
        >
          {saving ? t.saving : t.saveChanges}
        </button>
      </div>

      {saveState === 'saved' ? (
        <Banner tone="green">{t.savedBanner}</Banner>
      ) : saveState === 'error' ? (
        <Banner tone="red">{t.saveErrorBanner}</Banner>
      ) : !dirty && Object.keys(slots).length === 0 ? (
        <Banner tone="yellow">{t.emptyWeekBanner}</Banner>
      ) : null}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 12.5, color: 'var(--tx3)' }}>
          {t.declarePrefix}
        </span>
        {(['AVAILABLE', 'BUSY', 'OFF'] as AvailabilityStatus[]).map((m) => (
          <button
            key={m}
            type="button"
            className={`odm-btn odm-btn-sm ${mode === m ? MODE_CLASS[m] : ''}`}
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
          </button>
        ))}
        {selection.length > 0 ? (
          <>
            <span style={{ fontSize: 12, color: 'var(--tx3)' }}>
              {t.selectionCount(selection.length)}
            </span>
            <button
              type="button"
              className="odm-btn odm-btn-sm"
              onClick={() => setSelection([])}
            >
              {t.deselect}
            </button>
            <button
              type="button"
              className="odm-btn odm-btn-sm odm-btn-p"
              onClick={applyMode}
            >
              {t.apply}
            </button>
          </>
        ) : null}
      </div>

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

function Banner({
  tone,
  children,
}: {
  tone: 'green' | 'red' | 'yellow'
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        marginBottom: 14,
        padding: '10px 14px',
        borderRadius: 8,
        background: `var(--${tone}-bg)`,
        color: `var(--${tone}-fg)`,
        border: `1px solid var(--${tone}-dot)`,
        fontSize: 13,
      }}
    >
      {children}
    </div>
  )
}

// re-export for tests / potential reuse elsewhere
export { slotKey }
