import {
  criterionTitleOverrides,
  criterionDescriptionOverrides,
  failNotePlaceholders,
  contextualAnswerLabels,
  resultLabel,
} from '../readinessHelpers'
import type { Answer } from '../readinessTypes'
import type { ReadinessCriterion } from '../../../types/readiness'
import type { Dispatch, SetStateAction } from 'react'

export function ReadinessCriterionRow({
  current,
  c,
  draft,
  needsNote,
  note,
  editable,
  setDrafts,
  savingCode,
  save,
  options,
  choose,
}: {
  current: Answer
  c: ReadinessCriterion
  draft: { result: Answer; note: string }
  needsNote: boolean
  note: string
  editable: boolean
  setDrafts: Dispatch<
    SetStateAction<Record<string, { result: Answer; note: string }>>
  >
  savingCode: string | null
  save: (code: string, result: Answer, note: string) => Promise<void>
  options: Answer[]
  choose: (criterion: ReadinessCriterion, result: Answer) => void
}) {
  return (
    <li className={`is-${(current ?? 'pending').toLowerCase()}`}>
      <span className="odm-or-readiness-dot" aria-hidden="true" />
      <div>
        <strong>
          {criterionTitleOverrides[c.code] ?? c.title}
          {c.required ? (
            <span className="odm-or-readiness-tag">Bắt buộc</span>
          ) : null}
        </strong>
        <span>{criterionDescriptionOverrides[c.code] ?? c.description}</span>
        {c.decidedByName && !draft ? (
          <span className="odm-or-readiness-meta">
            Người xác nhận: {c.decidedByName}
          </span>
        ) : null}
        {needsNote || (c.note && !draft) || draft ? (
          <input
            className="odm-or-readiness-note"
            value={note}
            disabled={!editable}
            placeholder={
              needsNote
                ? (failNotePlaceholders[c.code] ?? 'Lý do không đạt (bắt buộc)')
                : 'Ghi chú'
            }
            aria-label={`Ghi chú: ${criterionTitleOverrides[c.code] ?? c.title}`}
            onChange={(event) =>
              setDrafts((state) => ({
                ...state,
                [c.code]: {
                  result: (state[c.code]?.result ??
                    (c.result === 'PENDING' ? 'PASS' : c.result)) as Answer,
                  note: event.target.value,
                },
              }))
            }
          />
        ) : null}
        {draft ? (
          <button
            type="button"
            className="odm-btn odm-btn-sm"
            disabled={
              savingCode === c.code ||
              (draft.result === 'FAIL' && !draft.note.trim())
            }
            onClick={() => void save(c.code, draft.result, draft.note)}
          >
            Lưu
          </button>
        ) : null}
      </div>
      <div
        className="odm-or-readiness-choices"
        role="group"
        aria-label={criterionTitleOverrides[c.code] ?? c.title}
      >
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`is-${option.toLowerCase()}${current === option ? ' is-on' : ''}`}
            aria-pressed={current === option}
            aria-busy={savingCode === c.code && current === option}
            disabled={!editable || savingCode === c.code}
            onClick={() => choose(c, option)}
          >
            {savingCode === c.code && current === option
              ? 'Đang lưu…'
              : (contextualAnswerLabels[c.code]?.[option] ??
                resultLabel[option])}
          </button>
        ))}
      </div>
    </li>
  )
}
