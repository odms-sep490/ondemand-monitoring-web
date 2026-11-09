import type { PropsWithChildren } from 'react'

import { ConfirmProvider, ToastProvider } from '../shared/components/ui'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  )
}
