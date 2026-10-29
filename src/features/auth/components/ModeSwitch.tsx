import { Button } from 'antd'

import { useI18n } from '../../../shared/i18n'
import type { AuthMode } from '../types/authMode'
import { modeSwitchMessages } from './ModeSwitch.messages'

export function ModeSwitch({
  mode,
  onChange,
}: {
  mode: AuthMode
  onChange: (mode: 'login' | 'register') => void
}) {
  const { t } = useI18n(modeSwitchMessages)
  if (
    mode === 'verify' ||
    mode === 'forgot' ||
    mode === 'reset' ||
    mode === 'first-login'
  )
    return null
  return (
    <p className="auth-switch">
      {mode === 'login' ? t.noAccount : t.hasAccount}{' '}
      <Button
        type="link"
        className="auth-link"
        onClick={() => onChange(mode === 'login' ? 'register' : 'login')}
      >
        {mode === 'login' ? t.register : t.login}
      </Button>
    </p>
  )
}
