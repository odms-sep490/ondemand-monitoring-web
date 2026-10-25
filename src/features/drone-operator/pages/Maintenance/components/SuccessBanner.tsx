import { maintenancePageMessages } from '../MaintenancePage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { Dispatch, SetStateAction } from 'react'

export function SuccessBanner({
  successMsg,
  setSuccessMsg,
}: {
  successMsg: string
  setSuccessMsg: Dispatch<SetStateAction<string | null>>
}) {
  const { t } = useI18n(maintenancePageMessages)
  return (
    <div
      role="alert"
      style={{
        padding: '12px 16px',
        borderRadius: 10,
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        color: '#166534',
        fontSize: 13.5,
        fontWeight: 600,
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span>{successMsg}</span>
      <button
        type="button"
        className="odm-btn"
        style={{ padding: '2px 8px', fontSize: 12 }}
        onClick={() => setSuccessMsg(null)}
      >
        {t.close}
      </button>
    </div>
  )
}
