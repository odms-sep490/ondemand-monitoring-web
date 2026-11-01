import { useI18n } from '../../../../shared/i18n'
import { AdminField } from '../../components/common/AdminField'
import { LocalizedTextInput } from '../../components/common/LocalizedTextInput'
import { LOCALIZED_LIMITS } from '../../lib/localizedField'
import { linesMismatch, type ContentForm } from './checklistForm'
import { checklistMessages } from './checklists.messages'

type Props = {
  content: ContentForm
  onChange: (content: ContentForm) => void
  invalid: boolean
}

/** Meta line under a field: the hint and, optionally, the character counter. */
function Meta({
  id,
  hint,
  count,
}: {
  id: string
  hint: string
  count?: string
}) {
  return (
    <div id={id} className="checklist-field-meta">
      <span>{hint}</span>
      {count && <span>{count}</span>}
    </div>
  )
}

/** The "what is the work" page of the checklist form: title, description and the three guidance lists. */
export function ChecklistContentFields({ content, onChange, invalid }: Props) {
  const { t } = useI18n(checklistMessages)
  const lists = [
    ['steps', t.stepsLabel, t.stepsHint, 4],
    ['inputs', t.inputsLabel, t.inputsHint, 3],
    ['outputs', t.outputsLabel, t.outputsHint, 3],
  ] as const
  return (
    <fieldset className="checklist-section checklist-content-grid">
      <legend>{t.sectionContent}</legend>
      <AdminField id="checklist-content" label={t.content} required>
        <LocalizedTextInput
          id="checklist-content"
          label={t.content}
          multiline
          rows={2}
          required
          maxEncoded={LOCALIZED_LIMITS.checklistContent}
          value={content.content}
          error={invalid ? t.required : undefined}
          onChange={(value) => onChange({ ...content, content: value })}
        />
      </AdminField>
      <Meta id="checklist-content-hint" hint={t.contentHint} />
      <AdminField id="checklist-description" label={t.descriptionLabel}>
        <LocalizedTextInput
          id="checklist-description"
          label={t.descriptionLabel}
          multiline
          rows={3}
          maxEncoded={LOCALIZED_LIMITS.checklistDescription}
          value={content.description}
          onChange={(value) => onChange({ ...content, description: value })}
        />
      </AdminField>
      <Meta id="checklist-description-hint" hint={t.descriptionHint} />
      {lists.map(([key, label, hint, rows]) => (
        <div key={key} className={key === 'steps' ? undefined : 'is-half'}>
          <AdminField id={`checklist-${key}`} label={label}>
            <LocalizedTextInput
              id={`checklist-${key}`}
              label={label}
              multiline
              rows={rows}
              value={content[key]}
              onChange={(value) => onChange({ ...content, [key]: value })}
            />
          </AdminField>
          <Meta
            id={`checklist-${key}-hint`}
            hint={linesMismatch(content[key]) ? t.linesMismatch : hint}
          />
        </div>
      ))}
    </fieldset>
  )
}
