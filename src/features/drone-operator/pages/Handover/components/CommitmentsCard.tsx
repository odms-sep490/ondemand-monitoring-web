import { SafetyCertificateOutlined } from '@ant-design/icons'
import { Checkbox } from 'antd'
import type { Dispatch, SetStateAction } from 'react'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { handoverPageMessages } from '../HandoverPage.messages'

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
    <CardComponent
      title={t.commitmentTitle}
      icon={<SafetyCertificateOutlined />}
    >
      <div
        className="stf-mono stf-muted"
        style={{ fontSize: 12, marginBottom: 12 }}
      >
        control_handover.acknowledgement_text
      </div>
      <ol className="stf-commitments">
        {COMMITMENTS.map((text, i) => (
          <li key={i}>
            <Checkbox
              checked={checked[i]}
              onChange={(e) => {
                const next = [...checked]
                next[i] = e.target.checked
                setChecked(next)
              }}
            >
              {text}
            </Checkbox>
          </li>
        ))}
      </ol>
    </CardComponent>
  )
}
