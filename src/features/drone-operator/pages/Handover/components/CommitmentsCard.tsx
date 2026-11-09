import { handoverPageMessages } from '../HandoverPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { Dispatch, SetStateAction } from 'react'

export function CommitmentsCard({
  COMMITMENTS,
  checked,
  setChecked,
}: {
  COMMITMENTS: string[]
  checked: boolean[]
  setChecked: Dispatch<SetStateAction<boolean[]>>
}) {
  const { t } = useI18n(handoverPageMessages)
  return (
    <div className="odm-card-body handover-commitments">
      <h2
        id="handover-commitments-title"
        className="handover-commitments__title"
      >
        {t.commitmentTitle}
      </h2>
      <ol className="handover-commitments__list">
        {COMMITMENTS.map((text, i) => (
          <li key={i}>
            <label
              className={`handover-commitments__label${checked[i] ? ' is-checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={(e) => {
                  const next = [...checked]
                  next[i] = e.target.checked
                  setChecked(next)
                }}
              />
              <span>{text}</span>
            </label>
          </li>
        ))}
      </ol>
    </div>
  )
}
