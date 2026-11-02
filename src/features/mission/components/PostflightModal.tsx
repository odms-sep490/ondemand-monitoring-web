import { useState } from 'react'
import type { DeviceStatus } from '../types/mission'
import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'
import { useI18n } from '../../../shared/i18n'
import { postflightModalMessages } from './PostflightModal.messages'

interface PostflightModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (status: DeviceStatus, notes: string) => Promise<void>
  isSubmitting: boolean
}

export function PostflightModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: PostflightModalProps) {
  const { t } = useI18n(postflightModalMessages)
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>('AVAILABLE')
  const [notes, setNotes] = useState(t.defaultNotes)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(deviceStatus, notes)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 100,
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '520px',
          width: '100%',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px',
          }}
        >
          <div>
            <p
              className="eyebrow"
              style={{ margin: '0 0 4px', fontSize: '0.65rem' }}
            >
              {t.eyebrow}
            </p>
            <h3
              style={{
                margin: 0,
                fontSize: '1.3rem',
                fontWeight: 800,
                color: 'var(--color-foreground)',
              }}
            >
              {t.title}
            </h3>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            style={{ width: '32px', height: '32px' }}
          >
            <Icon name="x" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="postflight-device-status"
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--color-foreground)',
                marginBottom: '8px',
              }}
            >
              {t.deviceStatusLabel}
            </label>
            <select
              id="postflight-device-status"
              value={deviceStatus}
              onChange={(e) => setDeviceStatus(e.target.value as DeviceStatus)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '0.85rem',
                fontFamily: 'var(--sans)',
                fontWeight: 600,
                color: 'var(--color-foreground)',
                background: 'var(--color-background)',
              }}
            >
              <option value="AVAILABLE">{t.available}</option>
              <option value="IDLE_CHARGING">{t.idleCharging}</option>
              <option value="MAINTENANCE">{t.maintenance}</option>
            </select>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label
              htmlFor="postflight-notes"
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--color-foreground)',
                marginBottom: '8px',
              }}
            >
              {t.notesLabel}
            </label>
            <textarea
              id="postflight-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '0.82rem',
                fontFamily: 'var(--sans)',
                color: 'var(--color-foreground)',
                background: 'var(--color-background)',
                resize: 'vertical',
              }}
            />
          </div>

          <div
            style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}
          >
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t.cancel}
            </Button>
            <Button
              variant="primary"
              icon="check"
              type="submit"
              disabled={isSubmitting}
              style={{ backgroundColor: '#15803d' }}
            >
              {isSubmitting ? t.submitting : t.confirmComplete}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
