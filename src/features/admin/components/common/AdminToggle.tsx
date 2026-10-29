import { Switch } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import { adminToggleMessages } from './AdminToggle.messages'

export function AdminToggle({
  active,
  label,
  onToggle,
  disabled,
}: {
  active: boolean
  label: string
  onToggle: () => void
  disabled?: boolean
}) {
  const { t } = useI18n(adminToggleMessages)
  return (
    <Switch
      checked={active}
      aria-label={`${active ? t.on : t.off} ${label}`}
      onChange={() => onToggle()}
      disabled={disabled}
    />
  )
}
