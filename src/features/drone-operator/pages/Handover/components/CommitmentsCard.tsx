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
    <div className="odm-card-body" style={{ padding: '18px 22px' }}>
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
        {t.commitmentTitle}
      </div>
      <div
        className="odm-mono"
        style={{
          fontSize: 11.5,
          color: 'var(--tx3)',
          marginBottom: 12,
        }}
      >
        control_handover.acknowledgement_text
      </div>
      <ol
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {COMMITMENTS.map((text, i) => (
          <li
            key={i}
            style={{
              display: 'flex',
              gap: 12,
              fontSize: 13.5,
              lineHeight: 1.5,
            }}
          >
            <label
              style={{
                display: 'flex',
                gap: 12,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={(e) => {
                  const next = [...checked]
                  next[i] = e.target.checked
                  setChecked(next)
                }}
                style={{ marginTop: 2, flex: 'none' }}
              />
              <span>{text}</span>
            </label>
          </li>
        ))}
      </ol>
    </div>
  )
}
