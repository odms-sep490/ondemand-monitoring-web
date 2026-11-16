import {
  AppstoreOutlined,
  EyeInvisibleOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { Button, Input, Segmented, Switch } from 'antd'
import { useMemo, useState } from 'react'

import { StatisticComponent } from '../../../../shared/components/antd'
import { ErrorState, LoadingState } from '../../../../shared/components/odm/StateView'
import { EmptyState, PageHeader, useConfirm, useToast } from '../../../../shared/components/ui'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import {
  deviceCheckCriteriaApi,
  groupByCategory,
  moveCriterion,
  type DeviceCheckCriterion,
  type DeviceCheckCriterionInput,
  type DeviceCheckPhase,
} from '../../api/deviceCheckCriteriaApi'
import { CriterionCard } from './components/CriterionCard'
import { CriterionPanel } from './components/CriterionPanel'
import { deviceCheckCriteriaMessages } from './DeviceCheckCriteriaPage.messages'
import './device-check-criteria.css'

type PanelState = { open: false } | { open: true; criterion: DeviceCheckCriterion | null }

export function DeviceCheckCriteriaPage() {
  const { t } = useI18n(deviceCheckCriteriaMessages)
  const toast = useToast()
  const confirm = useConfirm()
  const [phase, setPhase] = useState<DeviceCheckPhase>('PRE')
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(true)
  const [panel, setPanel] = useState<PanelState>({ open: false })
  const [saving, setSaving] = useState(false)
  const [reordering, setReordering] = useState(false)

  const { data, loading, error, reload } = useApiQuery(
    (signal) => deviceCheckCriteriaApi.list(phase, signal),
    [phase],
  )
  const criteria = useMemo(() => data ?? [], [data])

  const ordered = useMemo(() => [...criteria].sort((a, b) => a.sortOrder - b.sortOrder), [criteria])
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return ordered.filter(
      (c) =>
        (showInactive || c.active) &&
        (!q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)),
    )
  }, [ordered, search, showInactive])
  const lanes = useMemo(() => groupByCategory(visible), [visible])
  const categories = useMemo(() => [...new Set(criteria.map((c) => c.category))], [criteria])
  const selectedId = panel.open ? panel.criterion?.id : undefined

  function errorText(err: unknown) {
    return err instanceof Error ? err.message : String(err)
  }

  async function save(input: DeviceCheckCriterionInput) {
    if (!panel.open) return
    setSaving(true)
    try {
      if (panel.criterion) {
        await deviceCheckCriteriaApi.update(panel.criterion.id, input)
        toast.success(t.toast.updated)
      } else {
        await deviceCheckCriteriaApi.create(input)
        toast.success(t.toast.created)
      }
      setPanel({ open: false })
      reload()
    } catch (err) {
      toast.error(errorText(err))
    } finally {
      setSaving(false)
    }
  }

  async function remove(criterion: DeviceCheckCriterion) {
    const ok = await confirm({
      title: t.confirmDelete.title,
      description: (
        <>
          <p>{t.confirmDelete.description}</p>
          {criterion.systemLogic && <p className="adm-crit-warning">{t.confirmDelete.systemWarning}</p>}
        </>
      ),
      confirmLabel: t.confirmDelete.confirm,
      tone: 'danger',
    })
    if (!ok) return
    setSaving(true)
    try {
      await deviceCheckCriteriaApi.remove(criterion.id)
      toast.success(t.toast.deleted)
      setPanel({ open: false })
      reload()
    } catch (err) {
      toast.error(errorText(err))
    } finally {
      setSaving(false)
    }
  }

  async function move(criterion: DeviceCheckCriterion, delta: -1 | 1) {
    setReordering(true)
    try {
      await deviceCheckCriteriaApi.reorder(phase, moveCriterion(ordered, criterion.id, delta))
      reload()
    } catch (err) {
      toast.error(errorText(err))
    } finally {
      setReordering(false)
    }
  }

  const position = (id: string) => ordered.findIndex((c) => c.id === id)

  return (
    <div className="adm-crit">
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <Button type="primary" onClick={() => setPanel({ open: true, criterion: null })}>
            + {t.add}
          </Button>
        }
      />

      <Segmented
        className="adm-crit-tabs"
        value={phase}
        onChange={(value) => {
          setPhase(value as DeviceCheckPhase)
          setPanel({ open: false })
        }}
        options={[
          { label: t.tabs.PRE, value: 'PRE' },
          { label: t.tabs.POST, value: 'POST' },
        ]}
      />

      <div className="mgr-kpi-strip adm-crit-kpis">
        <StatisticComponent index={0} tone="blue" icon={<AppstoreOutlined />} title={t.stats.total} value={criteria.length} />
        <StatisticComponent index={1} tone="red" icon={<SafetyOutlined />} title={t.stats.required}
          value={criteria.filter((c) => c.required && c.active).length} />
        <StatisticComponent index={2} tone="amber" icon={<ThunderboltOutlined />} title={t.stats.system}
          value={criteria.filter((c) => c.systemLogic).length} />
        <StatisticComponent index={3} tone="green" icon={<EyeInvisibleOutlined />} title={t.stats.inactive}
          value={criteria.filter((c) => !c.active).length} />
      </div>

      <div className="adm-crit-filters">
        <Input.Search
          allowClear
          value={search}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchPlaceholder}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="adm-crit-toggle">
          <Switch size="small" checked={showInactive} onChange={setShowInactive} aria-label={t.showInactive} />
          {t.showInactive}
        </label>
      </div>

      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : lanes.length === 0 ? (
        <EmptyState title={t.empty} />
      ) : (
        <div className="adm-crit-board">
          {lanes.map((lane) => (
            <section key={lane.category} className="adm-crit-lane" aria-label={lane.category}>
              <div className="adm-crit-lane-head">
                <span className="adm-crit-lane-name">{lane.category}</span>
                <span className="adm-crit-lane-count">{lane.items.length}</span>
              </div>
              <div className="adm-crit-lane-list">
                {lane.items.map((criterion) => {
                  const index = position(criterion.id)
                  return (
                    <CriterionCard
                      key={criterion.id}
                      criterion={criterion}
                      selected={selectedId === criterion.id}
                      canMoveUp={index > 0}
                      canMoveDown={index < ordered.length - 1}
                      busy={reordering}
                      onSelect={(c) => setPanel({ open: true, criterion: c })}
                      onMove={move}
                    />
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <CriterionPanel
        open={panel.open}
        phase={phase}
        criterion={panel.open ? panel.criterion : null}
        categories={categories}
        saving={saving}
        onClose={() => setPanel({ open: false })}
        onSave={save}
        onDelete={remove}
      />
    </div>
  )
}
