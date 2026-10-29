import '@ant-design/v5-patch-for-react-19'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button, ConfigProvider } from 'antd'
import { useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { authSession } from '../../../features/auth/api/authApi'
import { getRoleHomePath } from '../../../features/auth/routing'
import { useI18n } from '../../i18n'
import { buildAppTheme } from '../../theme/appTheme'
import { Icon } from '../Icon'
import { LanguageToggle } from '../LanguageToggle'
import { mgrPopupContainer } from './mgrPopupContainer'
import { ShellContext } from './shellContext'
import { pageFrameMessages } from './PageFrame.messages'
import '../../styles/app-shell/layout.scss'
import '../../styles/app-shell/popups.scss'
import '../../styles/app-shell/frame.scss'

type Props = {
  children: ReactNode
  /** Back link target; defaults to the signed-in role's home. */
  backHref?: string
  backLabel?: string
  /** Max content width in px. */
  maxWidth?: number
}

/**
 * Page frame for routes that live outside the portal shells (help centre,
 * tickets, payment result, profile). It applies the shared antd theme and a
 * simple top bar (logo, back link, VI | EN, dark toggle). Inside a portal shell
 * it renders only the page stack so nothing is framed twice.
 */
export function PageFrame({
  children,
  backHref,
  backLabel,
  maxWidth = 1200,
}: Props) {
  const inShell = useContext(ShellContext)
  if (inShell) return <div className="mgr-view">{children}</div>
  return (
    <StandaloneFrame
      backHref={backHref}
      backLabel={backLabel}
      maxWidth={maxWidth}
    >
      {children}
    </StandaloneFrame>
  )
}

function StandaloneFrame({ children, backHref, backLabel, maxWidth }: Props) {
  const { t } = useI18n(pageFrameMessages)
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  )
  const themeConfig = useMemo(() => buildAppTheme(dark), [dark])
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])
  const home = backHref ?? getRoleHomePath(authSession.getUser()?.role)

  return (
    <ConfigProvider theme={themeConfig} getPopupContainer={mgrPopupContainer}>
      <div className="odm mgr-layout mgr-frame">
        <header className="mgr-frame-bar">
          <a className="mgr-frame-brand" href={home} aria-label={t.home}>
            <img src="/images/logo-new.png" alt="" width={32} height={32} />
            <span>{t.brand}</span>
          </a>
          <Button
            type="text"
            className="mgr-frame-back"
            href={home}
            icon={<ArrowLeftOutlined />}
          >
            {backLabel ?? t.back}
          </Button>
          <div className="mgr-frame-actions">
            <LanguageToggle className="mgr-lang-toggle" />
            <Button
              type="text"
              className="mgr-icon-btn"
              aria-label={t.toggleTheme}
              icon={
                <Icon name={dark ? 'sun' : 'moon'} width={18} height={18} />
              }
              onClick={() => setDark((v) => !v)}
            />
          </div>
        </header>
        <main className="mgr-frame-main">
          <div className="mgr-view" style={{ maxWidth }}>
            {children}
          </div>
        </main>
      </div>
    </ConfigProvider>
  )
}
