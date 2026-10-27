import { useI18n } from '../../../../shared/i18n'
import { commonMiscMessages } from './commonMisc.messages'
import './pickers.css'

export function StaffStatusBadge() {
  const { t } = useI18n(commonMiscMessages)
  return (
    <span className="mgr-pk-ready">
      <i aria-hidden="true" />
      {t.ready}
    </span>
  )
}
