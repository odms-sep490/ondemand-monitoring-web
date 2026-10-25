import type { MaintenanceTicket } from '../../../types/maintenance'
import { useI18n } from '../../../../../shared/i18n'
import { maintenancePageMessages } from '../MaintenancePage.messages'
import { useState } from 'react'
import type { TicketSeverity } from '../../../../../shared/types/domain'
import { maintenanceApi } from '../../../api/maintenanceApi'
import { SEVERITIES } from '../maintenanceHelpers'
import { getTicketSeverityLabel } from '../../../../../shared/lib/statusTone'

export type CreateModalProps = {
  onClose: () => void
  onCreate: (ticket: MaintenanceTicket) => void
}

export function CreateModal({ onClose, onCreate }: CreateModalProps) {
  const { t, lang } = useI18n(maintenancePageMessages)
  const [droneId, setDroneId] = useState('')
  const [title, setTitle] = useState('')
  const [issueType, setIssueType] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TicketSeverity>('MEDIUM')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setSaving(true)
    setError(null)
    try {
      const ticket = await maintenanceApi.createTicket({
        droneId,
        title,
        issueType: issueType || undefined,
        description: description || undefined,
        priority,
      })
      onCreate(ticket)
    } catch (e) {
      setError(e instanceof Error ? e.message : t.createModal.unknownError)
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
          width: 460,
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700 }}>
          {t.createModal.title}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label
              htmlFor="ct-drone"
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: '#334155',
                display: 'block',
                marginBottom: 4,
              }}
            >
              {t.createModal.droneId}
            </label>
            <input
              id="ct-drone"
              className="odm-input"
              value={droneId}
              onChange={(e) => setDroneId(e.target.value)}
              placeholder={t.createModal.droneIdPlaceholder}
              style={{ width: '100%', borderRadius: 8 }}
            />
          </div>
          <div>
            <label
              htmlFor="ct-title"
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: '#334155',
                display: 'block',
                marginBottom: 4,
              }}
            >
              {t.createModal.issueTitle}
            </label>
            <input
              id="ct-title"
              className="odm-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.createModal.issueTitlePlaceholder}
              style={{ width: '100%', borderRadius: 8 }}
            />
          </div>
          <div>
            <label
              htmlFor="ct-priority"
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: '#334155',
                display: 'block',
                marginBottom: 4,
              }}
            >
              {t.createModal.priority}
            </label>
            <select
              id="ct-priority"
              className="odm-input"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketSeverity)}
              style={{ width: '100%', borderRadius: 8 }}
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {getTicketSeverityLabel(s, lang)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="ct-issue"
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: '#334155',
                display: 'block',
                marginBottom: 4,
              }}
            >
              {t.createModal.issueType}
            </label>
            <input
              id="ct-issue"
              className="odm-input"
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              placeholder={t.createModal.issueTypePlaceholder}
              style={{ width: '100%', borderRadius: 8 }}
            />
          </div>
          <div>
            <label
              htmlFor="ct-desc"
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: '#334155',
                display: 'block',
                marginBottom: 4,
              }}
            >
              {t.createModal.description}
            </label>
            <textarea
              id="ct-desc"
              className="odm-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.createModal.descriptionPlaceholder}
              style={{ width: '100%', resize: 'vertical', borderRadius: 8 }}
            />
          </div>

          {error && (
            <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
              marginTop: 8,
            }}
          >
            <button
              type="button"
              className="odm-btn"
              onClick={onClose}
              disabled={saving}
            >
              {t.createModal.cancel}
            </button>
            <button
              type="button"
              className="odm-btn odm-btn-p"
              onClick={handleCreate}
              disabled={saving}
              style={{ fontWeight: 600, borderRadius: 8 }}
            >
              {saving ? t.createModal.creating : t.createModal.create}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
