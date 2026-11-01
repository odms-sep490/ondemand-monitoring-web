import { App } from 'antd'
import { useCallback } from 'react'

import { useI18n } from '../../../../shared/i18n'
import { adminConfirmMessages } from './useAdminConfirm.messages'

export type AdminConfirmOptions = {
  title: string
  content?: string
  okText?: string
  danger?: boolean
}

/**
 * Localized antd confirmation dialog (replaces window.confirm). Resolves true when the admin confirms.
 * Uses the themed `App` modal, so the component must render inside antd's `<App>` (AdminLayout provides it).
 */
export function useAdminConfirm() {
  const { modal } = App.useApp()
  const { t } = useI18n(adminConfirmMessages)
  return useCallback(
    (options: AdminConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        modal.confirm({
          title: options.title,
          content: options.content,
          okText: options.okText ?? t.ok,
          cancelText: t.cancel,
          okButtonProps: options.danger ? { danger: true } : undefined,
          centered: true,
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        })
      }),
    [modal, t.ok, t.cancel],
  )
}
