import { useI18n } from '../../../../../shared/i18n'
import { livePageMessages } from '../LivePage.messages'
import { useState } from 'react'
import { missionsApi } from '../../../api/missionsApi'
import { planningError } from '../../../lib/planningErrors'
import { INCIDENT_TYPE_VALUES } from '../liveHelpers'

export function IncidentModal({
  missionId,
  onClose,
  onCreated,
}: {
  missionId: string
  onClose: () => void
  onCreated: () => void
}) {
  const { t } = useI18n(livePageMessages)
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!type) {
      setError(t.incidentModal.chooseType)
      return
    }
    if (!description.trim()) {
      setError(t.incidentModal.descriptionRequired)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await missionsApi.createIncident(missionId, { type, description })
      onCreated()
    } catch (err) {
      setError(planningError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.incidentModal.ariaLabel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--sf)',
          borderRadius: 10,
          padding: 24,
          width: 380,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          {t.incidentModal.title}
        </h3>
        <label style={{ fontSize: 13 }}>
          {t.incidentModal.typeLabel}
          <select
            className="odm-inp"
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ display: 'block', marginTop: 4, width: '100%' }}
          >
            <option value="">{t.incidentModal.typePlaceholder}</option>
            {INCIDENT_TYPE_VALUES.map((value) => (
              <option key={value} value={value}>
                {t.incidentTypes[value]}
              </option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: 13 }}>
          {t.incidentModal.descriptionLabel}
          <textarea
            className="odm-inp"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              display: 'block',
              marginTop: 4,
              width: '100%',
              resize: 'vertical',
            }}
            placeholder={t.incidentModal.descriptionPlaceholder}
          />
        </label>
        {error && (
          <div
            role="alert"
            style={{
              fontSize: 12,
              color: 'var(--red-fg)',
              background: 'var(--red-bg)',
              borderRadius: 6,
              padding: '6px 10px',
            }}
          >
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="odm-btn" onClick={onClose}>
            {t.incidentModal.cancel}
          </button>
          <button
            type="submit"
            className="odm-btn odm-btn-rd"
            disabled={saving}
          >
            {saving ? t.incidentModal.saving : t.incidentModal.submit}
          </button>
        </div>
      </form>
    </div>
  )
}
