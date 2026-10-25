import type { MaintenanceTicket } from '../../../types/maintenance'
import { useI18n } from '../../../../../shared/i18n'
import { maintenancePageMessages } from '../MaintenancePage.messages'
import { useState } from 'react'
import { systemOperatorList } from '../maintenanceHelpers'
import { maintenanceApi } from '../../../api/maintenanceApi'
import { formatTicketTitle } from '../../../lib/ticketText'

export function AssignModal({
  ticket,
  onClose,
  onAssigned,
}: {
  ticket: MaintenanceTicket
  onClose: () => void
  onAssigned: (ticket: MaintenanceTicket) => void
}) {
  const { t, lang } = useI18n(maintenancePageMessages)
  const [techId, setTechId] = useState('00000000-0000-0000-0000-000000000004')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const operatorList = systemOperatorList(lang)

  async function handleAssign() {
    setSaving(true)
    setError(null)
    try {
      const updated = await maintenanceApi.assignTechnician(ticket.id, techId)
      onAssigned(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : t.assignModal.failed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="odm-card"
        style={{
          padding: 24,
          width: 500,
          borderRadius: 16,
          boxShadow:
            '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            {t.assignModal.title}
          </h3>
          <button
            type="button"
            className="odm-btn"
            onClick={onClose}
            style={{ padding: '2px 8px', borderRadius: '50%' }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            background: '#f8fafc',
            padding: 12,
            borderRadius: 10,
            marginBottom: 18,
            border: '1px solid #e2e8f0',
            fontSize: 13,
          }}
        >
          <div>
            {t.assignModal.ticketLabel}
            <b className="odm-mono">{ticket.code}</b>
            {t.assignModal.droneLabel}
            <b>{ticket.droneCode}</b>
          </div>
          <div style={{ color: '#64748b', marginTop: 2 }}>
            {formatTicketTitle(ticket.title)}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
            {t.assignModal.chooseOperator}
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {operatorList.map((op) => {
              const selected = techId === op.id
              return (
                <div
                  key={op.id}
                  onClick={() => setTechId(op.id)}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    border: selected
                      ? '2px solid #2563eb'
                      : '1px solid #e2e8f0',
                    background: selected ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: selected ? '#2563eb' : '#f1f5f9',
                        color: selected ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {op.name.charAt(0)}
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13.5,
                          color: '#0f172a',
                        }}
                      >
                        {op.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {op.role}
                      </div>
                    </div>
                  </div>

                  <input
                    type="radio"
                    name="technician"
                    checked={selected}
                    onChange={() => setTechId(op.id)}
                    style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {error && (
          <div
            style={{
              color: '#ef4444',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="odm-btn"
            onClick={onClose}
            disabled={saving}
          >
            {t.assignModal.cancel}
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={handleAssign}
            disabled={saving}
            style={{
              fontWeight: 600,
              height: 38,
              padding: '0 18px',
              borderRadius: 8,
            }}
          >
            {saving ? t.assignModal.assigning : t.assignModal.confirm}
          </button>
        </div>
      </div>
    </div>
  )
}
