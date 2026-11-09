import { inFlightControlMessages } from './InFlightControl.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { Mission } from '../../../types/omss'

export function MissionControlFooter({
  footerStatusColor,
  footerStatusDot,
  geofenceMessage,
  missionPanelOpen = false,
  mediaPanelOpen = false,
  onShowChecklist,
  onShowMedia,
  onShowOverview,
}: {
  mission: Mission
  footerStatusColor: string
  footerStatusDot: string
  geofenceMessage: string
  missionPanelOpen?: boolean
  mediaPanelOpen?: boolean
  onShowChecklist?: () => void
  onShowMedia?: () => void
  onShowOverview?: () => void
}) {
  const { t } = useI18n(inFlightControlMessages)
  const overviewActive = !missionPanelOpen && !mediaPanelOpen
  return (
    <footer
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '5px 18px',
        background: '#071324',
        borderTop: '1px solid rgba(59,130,246,.24)',
      }}
    >
      <button
        type="button"
        onClick={onShowChecklist}
        aria-pressed={missionPanelOpen}
        style={{
          height: 28,
          padding: '0 12px',
          borderRadius: 9,
          border: '1px solid transparent',
          background: missionPanelOpen ? 'rgba(37,99,235,.2)' : 'transparent',
          color: missionPanelOpen ? '#bfdbfe' : '#94a3b8',
          fontSize: 12,
          fontWeight: 800,
          cursor: 'pointer',
        }}
      >
        {t.footer.checklist}
      </button>
      <button
        type="button"
        onClick={onShowMedia}
        aria-pressed={mediaPanelOpen}
        style={{
          height: 28,
          padding: '0 12px',
          borderRadius: 9,
          border: '1px solid transparent',
          background: mediaPanelOpen ? 'rgba(37,99,235,.2)' : 'transparent',
          color: mediaPanelOpen ? '#bfdbfe' : '#94a3b8',
          fontSize: 12,
          fontWeight: 800,
          cursor: 'pointer',
        }}
      >
        {t.footer.media}
      </button>
      <button
        type="button"
        onClick={onShowOverview}
        aria-pressed={overviewActive}
        style={{
          height: 28,
          padding: '0 12px',
          borderRadius: 9,
          border: '1px solid transparent',
          background: overviewActive ? 'rgba(37,99,235,.2)' : 'transparent',
          color: overviewActive ? '#bfdbfe' : '#94a3b8',
          fontSize: 12,
          fontWeight: 800,
          cursor: 'pointer',
        }}
      >
        {t.footer.overview}
      </button>
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            color: footerStatusColor,
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          <span
            className="pulse-dot"
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: footerStatusDot,
            }}
          />
          {geofenceMessage}
        </span>
        <span
          style={{
            padding: '5px 10px',
            borderRadius: 999,
            background: 'rgba(37,99,235,.22)',
            border: '1px solid rgba(96,165,250,.28)',
            color: '#bfdbfe',
            fontSize: 11,
            fontWeight: 900,
          }}
        >
          {t.footer.inFlight}
        </span>
      </div>
    </footer>
  )
}
