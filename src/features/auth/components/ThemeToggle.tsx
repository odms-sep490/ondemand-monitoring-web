import { Button } from 'antd'
import { useEffect, useState } from 'react'

import { Icon } from '../../../shared/components/Icon'
import { LanguageToggle } from '../../../shared/components/LanguageToggle'
import { useI18n } from '../../../shared/i18n'
import { themeToggleMessages } from './ThemeToggle.messages'

export function ThemeToggle() {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  )
  const { t } = useI18n(themeToggleMessages)
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])
  return (
    <div className="auth-toggles">
      <LanguageToggle className="mgr-lang-toggle" />
      <Button
        type="text"
        className="mgr-icon-btn"
        title={t.label}
        aria-label={dark ? t.switchToLight : t.switchToDark}
        icon={<Icon name={dark ? 'sun' : 'moon'} width={18} height={18} />}
        onClick={() => setDark((value) => !value)}
      />
    </div>
  )
}
