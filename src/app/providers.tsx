import { ConfigProvider } from 'antd'
import viVN from 'antd/locale/vi_VN'
import enUS from 'antd/locale/en_US'
import { useLanguage } from '../shared/i18n'
import type { PropsWithChildren } from 'react'

import { ConfirmProvider, ToastProvider } from '../shared/components/ui'

export function AppProviders({ children }: PropsWithChildren) {
  const { lang } = useLanguage()
  return (
    <ConfigProvider locale={lang === 'vi' ? viVN : enUS}>
      <ToastProvider>
        <ConfirmProvider>{children}</ConfirmProvider>
      </ToastProvider>
    </ConfigProvider>
  )
}
