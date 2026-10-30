import { defineMessages, useI18n } from '../i18n'
import './ChecklistGuidance.css'

/** Description and work guidance of a checklist item (catalog value or the copy frozen on an order). */
export type ChecklistGuidanceData = {
  description?: string | null
  executionSteps?: string[] | null
  inputRequirements?: string[] | null
  expectedOutputs?: string[] | null
}

type Section = 'description' | 'steps' | 'inputs' | 'outputs'

const messages = defineMessages({
  vi: {
    summary: 'Chi tiết thực hiện',
    empty: 'Chưa có hướng dẫn chi tiết',
    description: 'Mô tả',
    steps: 'Các bước thực hiện',
    inputs: 'Đầu vào cần có',
    outputs: 'Đầu ra cần nộp',
  },
  en: {
    summary: 'Work details',
    empty: 'No detailed guidance available',
    description: 'Description',
    steps: 'Steps',
    inputs: 'Required inputs',
    outputs: 'Expected outputs',
  },
})

const list = (values?: string[] | null) =>
  (values ?? []).map((value) => value.trim()).filter(Boolean)

export function hasChecklistGuidance(
  guidance?: ChecklistGuidanceData | null,
  sections: Section[] = ['description', 'steps', 'inputs', 'outputs'],
): boolean {
  if (!guidance) return false
  return sections.some((section) =>
    section === 'description'
      ? Boolean(guidance.description?.trim())
      : section === 'steps'
        ? list(guidance.executionSteps).length > 0
        : section === 'inputs'
          ? list(guidance.inputRequirements).length > 0
          : list(guidance.expectedOutputs).length > 0,
  )
}

/**
 * Collapsible guidance block. Renders nothing when the item has no guidance (custom items, orders placed before the
 * guidance existed), so callers can drop it in unconditionally. `sections` lets a screen show only what its reader needs.
 */
export function ChecklistGuidance({
  guidance,
  sections = ['description', 'steps', 'inputs', 'outputs'],
  defaultOpen = false,
  summaryLabel,
  showEmpty = false,
}: {
  guidance?: ChecklistGuidanceData | null
  sections?: Section[]
  defaultOpen?: boolean
  summaryLabel?: string
  showEmpty?: boolean
}) {
  const { t } = useI18n(messages)
  if (!guidance || !hasChecklistGuidance(guidance, sections))
    return showEmpty ? <p className="odm-cg-empty">{t.empty}</p> : null
  const steps = list(guidance.executionSteps)
  const inputs = list(guidance.inputRequirements)
  const outputs = list(guidance.expectedOutputs)
  return (
    <details className="odm-cg" open={defaultOpen}>
      <summary>{summaryLabel ?? t.summary}</summary>
      <div className="odm-cg-body">
        {sections.includes('description') && guidance.description?.trim() ? (
          <section>
            <h4>{t.description}</h4>
            <p>{guidance.description.trim()}</p>
          </section>
        ) : null}
        {sections.includes('steps') && steps.length > 0 ? (
          <section>
            <h4>{t.steps}</h4>
            <ol>
              {steps.map((step, index) => (
                <li key={`${index}:${step}`}>{step}</li>
              ))}
            </ol>
          </section>
        ) : null}
        {sections.includes('inputs') && inputs.length > 0 ? (
          <section>
            <h4>{t.inputs}</h4>
            <ul>
              {inputs.map((item, index) => (
                <li key={`${index}:${item}`}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}
        {sections.includes('outputs') && outputs.length > 0 ? (
          <section>
            <h4>{t.outputs}</h4>
            <ul>
              {outputs.map((item, index) => (
                <li key={`${index}:${item}`}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </details>
  )
}
