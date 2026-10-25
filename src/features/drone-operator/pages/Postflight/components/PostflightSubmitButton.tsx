import { postflightPageMessages } from '../PostflightPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { PostflightItemKey } from '../../../types/mission'

export function PostflightSubmitButton({
  saving,
  allAssessed,
  handleComplete,
  failItems,
}: {
  saving: boolean
  allAssessed: boolean
  handleComplete: () => Promise<void>
  failItems: PostflightItemKey[]
}) {
  const { t } = useI18n(postflightPageMessages)
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: 8,
      }}
    >
      <button
        type="button"
        className="odm-btn odm-btn-ok"
        disabled={saving || !allAssessed}
        onClick={handleComplete}
        style={{
          minWidth: 240,
          height: 46,
          fontSize: 15,
          fontWeight: 800,
          borderRadius: 10,
          background: !allAssessed
            ? '#94a3b8'
            : failItems.length > 0
              ? '#f59e0b'
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#fff',
          cursor: !allAssessed || saving ? 'not-allowed' : 'pointer',
          boxShadow: allAssessed
            ? '0 4px 14px rgba(16, 185, 129, 0.35)'
            : 'none',
          border: 'none',
        }}
      >
        {saving
          ? t.submitting
          : failItems.length > 0
            ? t.submitAndCreateTicket
            : t.completeFlight}
      </button>
    </div>
  )
}
