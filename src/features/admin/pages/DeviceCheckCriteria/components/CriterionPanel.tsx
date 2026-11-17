import { AutoComplete, Button, Drawer, Input, Switch } from 'antd'
import { useEffect, useState } from 'react'

import { mgrPopupContainer } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type {
  DeviceCheckCriterion,
  DeviceCheckCriterionInput,
  DeviceCheckPhase,
} from '../../../api/deviceCheckCriteriaApi'
import { deviceCheckCriteriaMessages } from '../DeviceCheckCriteriaPage.messages'

type Props = {
  open: boolean
  phase: DeviceCheckPhase
  /** null = create mode */
  criterion: DeviceCheckCriterion | null
  categories: string[]
  saving: boolean
  onClose: () => void
  onSave: (input: DeviceCheckCriterionInput) => void
  onDelete: (criterion: DeviceCheckCriterion) => void
}

type Draft = { code: string; name: string; description: string; category: string; required: boolean; active: boolean }

function toDraft(c: DeviceCheckCriterion | null): Draft {
  return {
    code: c?.code ?? '',
    name: c?.name ?? '',
    description: c?.description ?? '',
    category: c?.category ?? '',
    required: c?.required ?? true,
    active: c?.active ?? true,
  }
}

/** Side panel to create or edit a criterion (mirrors the maintenance ticket detail panel). */
export function CriterionPanel({ open, phase, criterion, categories, saving, onClose, onSave, onDelete }: Props) {
  const { t } = useI18n(deviceCheckCriteriaMessages)
  const [draft, setDraft] = useState<Draft>(() => toDraft(criterion))
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (open) {
      setDraft(toDraft(criterion))
      setTouched(false)
    }
  }, [open, criterion])

  const nameMissing = draft.name.trim() === ''
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  function submit() {
    setTouched(true)
    if (nameMissing) return
    onSave({
      ...(criterion ? { version: criterion.version } : { phase, code: draft.code.trim() || undefined }),
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      category: draft.category.trim() || null,
      required: draft.required,
      active: draft.active,
    })
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={420}
      getContainer={mgrPopupContainer}
      title={criterion ? t.panel.editTitle : t.panel.createTitle}
      className="adm-crit-panel"
      destroyOnHidden
      footer={
        <div className="adm-crit-panel-footer">
          {criterion ? (
            <Button danger onClick={() => onDelete(criterion)} disabled={saving}>
              {t.panel.delete}
            </Button>
          ) : (
            <span />
          )}
          <span className="adm-crit-panel-actions">
            <Button onClick={onClose} disabled={saving}>
              {t.panel.cancel}
            </Button>
            <Button type="primary" onClick={submit} loading={saving}>
              {t.panel.save}
            </Button>
          </span>
        </div>
      }
    >
      <div className="adm-crit-form">
        <div className="adm-crit-field">
          <span className="adm-crit-label">{t.panel.phase}</span>
          <span className="adm-crit-static">{t.tabs[criterion?.phase ?? phase]}</span>
        </div>

        {criterion?.systemLogic && <div className="adm-crit-note">{t.panel.systemNote}</div>}

        <label className="adm-crit-field">
          <span className="adm-crit-label">{t.panel.code}</span>
          {criterion ? (
            <span className="adm-crit-static adm-crit-mono">{criterion.code}</span>
          ) : (
            <>
              <Input
                value={draft.code}
                maxLength={50}
                placeholder="vd: den_dinh_vi"
                onChange={(e) => set('code', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
              />
              <span className="adm-crit-hint">{t.panel.codeHint}</span>
            </>
          )}
        </label>

        <label className="adm-crit-field">
          <span className="adm-crit-label">{t.panel.name} *</span>
          <Input
            value={draft.name}
            maxLength={120}
            status={touched && nameMissing ? 'error' : undefined}
            onChange={(e) => set('name', e.target.value)}
          />
          {touched && nameMissing && <span className="adm-crit-error">{t.panel.nameRequired}</span>}
        </label>

        <label className="adm-crit-field">
          <span className="adm-crit-label">{t.panel.description}</span>
          <Input.TextArea
            value={draft.description}
            maxLength={500}
            autoSize={{ minRows: 3, maxRows: 6 }}
            onChange={(e) => set('description', e.target.value)}
          />
        </label>

        <label className="adm-crit-field">
          <span className="adm-crit-label">{t.panel.category}</span>
          <AutoComplete
            value={draft.category}
            options={categories.map((value) => ({ value }))}
            placeholder={t.panel.categoryPlaceholder}
            getPopupContainer={mgrPopupContainer}
            filterOption={(input, option) => (option?.value ?? '').toLowerCase().includes(input.toLowerCase())}
            onChange={(value) => set('category', value)}
          />
        </label>

        <div className="adm-crit-switch">
          <div>
            <span className="adm-crit-label">{t.panel.required}</span>
            <span className="adm-crit-hint">{t.panel.requiredHint}</span>
          </div>
          <Switch checked={draft.required} onChange={(v) => set('required', v)} aria-label={t.panel.required} />
        </div>

        <div className="adm-crit-switch">
          <span className="adm-crit-label">{t.panel.active}</span>
          <Switch checked={draft.active} onChange={(v) => set('active', v)} aria-label={t.panel.active} />
        </div>
      </div>
    </Drawer>
  )
}
