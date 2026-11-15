import '@ant-design/v5-patch-for-react-19'
import { ConfigProvider } from 'antd'
import { useMemo, type ReactNode } from 'react'

import { buildAppTheme } from '../../shared/theme/appTheme'
import { mgrPopupContainer } from '../manager/components/common/mgrPopupContainer'
import './opr.css'
import '../../shared/styles/app-shell/layout.scss'
import '../../shared/styles/app-shell/popups.scss'
import '../../shared/styles/app-shell/legacy-kit.scss'

/**
 * Shell-less wrapper for the full-screen flight workspace: it only provides the
 * customer theme (antd tokens, `--mgr-*` variables, Be Vietnam Pro) so the cockpit
 * chrome, dialogs and empty states match the rest of the Staff portal.
 */
export function OperatorFlightFrame({ children }: { children: ReactNode }) {
  const dark = document.documentElement.dataset.theme === 'dark'
  const themeConfig = useMemo(() => buildAppTheme(dark), [dark])
  return (
    <ConfigProvider theme={themeConfig} getPopupContainer={mgrPopupContainer}>
      <div className="odm odm-opr odm-opr-flight mgr-layout">{children}</div>
    </ConfigProvider>
  )
}
