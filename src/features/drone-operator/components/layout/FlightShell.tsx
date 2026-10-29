import '@ant-design/v5-patch-for-react-19'
import { ConfigProvider } from 'antd'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { mgrPopupContainer } from '../../../../shared/components/antd'
import { buildAppTheme } from '../../../../shared/theme/appTheme'
import '../../../../shared/styles/app-shell/layout.scss'
import '../../../../shared/styles/app-shell/popups.scss'

/**
 * Full-screen frame for the cockpit. It has no sider or header, but it keeps
 * the staff theme: antd tokens plus the --mgr-* variables, following the
 * light / dark choice stored on the document root by the staff shell.
 */
export function FlightShell({ children }: { children: ReactNode }) {
  const read = () => document.documentElement.dataset.theme === 'dark'
  const [dark, setDark] = useState(read)

  useEffect(() => {
    const observer = new MutationObserver(() => setDark(read()))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  }, [])

  const themeConfig = useMemo(() => buildAppTheme(dark), [dark])
  return (
    <ConfigProvider theme={themeConfig} getPopupContainer={mgrPopupContainer}>
      <div className="odm mgr-layout stf-flight-shell">{children}</div>
    </ConfigProvider>
  )
}
