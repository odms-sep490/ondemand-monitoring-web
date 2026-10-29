import { CheckOutlined } from '@ant-design/icons'
import { theme } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import { handoverPageMessages } from '../HandoverPage.messages'

export function AckToggle({ ack }: { ack: boolean }) {
  const { t } = useI18n(handoverPageMessages)
  const { token } = theme.useToken()
  return (
    <>
      <span
        className={`stf-ack-box${ack ? ' is-on mgr-tone-green' : ''}`}
        style={ack ? { color: token.colorWhite } : undefined}
        aria-hidden="true"
      >
        {ack ? <CheckOutlined /> : null}
      </span>
      <span className="stf-ack-label">{t.ackLabel}</span>
    </>
  )
}
