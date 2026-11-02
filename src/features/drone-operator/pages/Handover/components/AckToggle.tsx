import { handoverPageMessages } from '../HandoverPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import { Icon } from '../../../../../shared/components/Icon'

export function AckToggle({ ack }: { ack: boolean }) {
  const { t } = useI18n(handoverPageMessages)
  return (
    <>
      <span className="handover-ack__indicator" aria-hidden="true">
        {ack ? <Icon name="check" width={17} height={17} /> : null}
      </span>
      <span className="handover-ack__label">{t.ackLabel}</span>
    </>
  )
}
