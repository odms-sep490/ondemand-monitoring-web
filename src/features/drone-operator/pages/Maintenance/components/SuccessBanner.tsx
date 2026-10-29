import { Alert, Button } from 'antd'
import type { Dispatch, SetStateAction } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { maintenancePageMessages } from '../MaintenancePage.messages'

export function SuccessBanner({
  successMsg,
  setSuccessMsg,
}: {
  successMsg: string
  setSuccessMsg: Dispatch<SetStateAction<string | null>>
}) {
  const { t } = useI18n(maintenancePageMessages)
  return (
    <Alert
      type="success"
      showIcon
      message={<strong>{successMsg}</strong>}
      action={
        <Button size="small" onClick={() => setSuccessMsg(null)}>
          {t.close}
        </Button>
      }
    />
  )
}
