import { useEffect, useState } from 'react'
import { missionsApi } from '../../api/missionsApi'
import type { FlightPermitStatus, MissionResponse } from '../../types/missions'
import { Button, useToast } from '../../../../shared/components/ui'
import { getLanguage, useI18n } from '../../../../shared/i18n'
import { flightPermitCardMessages } from './FlightPermitCard.messages'
import { managerFeedbackMessages } from '../../feedback.messages'

export function FlightPermitCard({
  mission,
  onChanged,
}: {
  mission: MissionResponse
  onChanged: () => void
}) {
  const { t } = useI18n(flightPermitCardMessages)
  const { t: fb } = useI18n(managerFeedbackMessages)
  const toast = useToast()
  const status = mission.flightPermitStatus ?? 'NOT_REQUESTED'
  const [note, setNote] = useState(mission.flightPermitNote ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const hasChanges =
    note !== (mission.flightPermitNote ?? '') || file !== null
  useEffect(
    () => {
      setNote(mission.flightPermitNote ?? '')
      setFile(null)
    }, [mission.id, mission.flightPermitNote],
  )

  async function save(nextStatus: FlightPermitStatus) {
    setError('')
    if (file && file.size > 5 * 1024 * 1024) {
      setError(t.fileTooLarge)
      return
    }
    setBusy(true)
    try {
      await missionsApi.updateFlightPermit(mission.id, {
        status: nextStatus,
        note: note.trim() || null,
        fileName: file?.name ?? null,
        contentType: file?.type ?? null,
        dataUrl: file ? await readFile(file) : null,
      })
      setFile(null)
      toast.success(fb.flightPermitSaved)
      onChanged()
    } catch (cause) {
      const failure =
        cause instanceof Error
          ? cause.message
          : t.updateFailed
      setError(failure)
      toast.error(failure)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      className="odm-or-card odm-flight-permit"
      aria-label={t.ariaLabel(mission.missionCode)}
    >
      <header className="odm-or-card-head odm-flight-permit__head">
        <span className="odm-or-card-title">
          {t.title(mission.missionCode)}
        </span>
        <span
          className={`odm-or-pill ${status === 'APPROVED' ? 'odm-or-pill-green' : 'odm-or-pill-amber'}`}
        >
          {t.statuses[status]}
        </span>
      </header>
      <div className="odm-or-card-body odm-flight-permit__body">
        <p className="odm-or-muted odm-flight-permit__intro">
          {t.intro}
        </p>
        <label className="odm-flight-permit__field">
          <strong>{t.note}</strong>
          <textarea
            className="odm-flight-permit__textarea"
            value={note}
            maxLength={1000}
            rows={3}
            disabled={busy}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t.notePlaceholder}
          />
        </label>
        <div className="odm-flight-permit__field">
          <strong>{t.fileOptional}</strong>
          <input
            id={`flight-permit-file-${mission.id}`}
            type="file"
            accept="application/pdf,image/*"
            disabled={busy}
            aria-label={t.chooseFileAria}
            style={{ display: 'none' }}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <div className="odm-flight-permit__dropzone">
            <label
              className="odm-flight-permit__file-button"
              htmlFor={`flight-permit-file-${mission.id}`}
              aria-disabled={busy}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
                <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5h14v-5" />
              </svg>
              {t.chooseFile}
            </label>
            <span className="odm-or-muted odm-flight-permit__file-name" title={file?.name}>
              {file?.name ?? t.noFileChosen}
            </span>
          </div>
        </div>
        {mission.flightPermitFileName ? (
          <div className="odm-flight-permit__current-file">
            {t.currentFile}{' '}
            {mission.flightPermitDataUrl ? (
              <a
                href={mission.flightPermitDataUrl}
                download={mission.flightPermitFileName}
              >
                {mission.flightPermitFileName}
              </a>
            ) : (
              mission.flightPermitFileName
            )}
          </div>
        ) : (
          <div className="odm-or-muted odm-flight-permit__current-file">
            {t.noPermitFile}
          </div>
        )}
        {error ? (
          <p
            role="alert"
            className="odm-flight-permit__error"
          >
            {error}
          </p>
        ) : null}
        <div className="odm-flight-permit__actions">
          {status !== 'APPROVED' ? (
            <Button
              variant="primary" className="odm-flight-permit__approve"
              disabled={busy}
              onClick={() => save('APPROVED')}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              {t.confirmApproved}
            </Button>
          ) : hasChanges ? (
            <Button
              variant="primary" className="odm-flight-permit__save"
              disabled={busy}
              onClick={() => save('APPROVED')}
            >
              {t.saveChanges}
            </Button>
          ) : null}
          {status !== 'REJECTED' && status !== 'APPROVED' ? (
            <Button
              className="odm-flight-permit__reject"
              disabled={busy}
              onClick={() => save('REJECTED')}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
              {t.reject}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error(flightPermitCardMessages[getLanguage()].readFailed))
    reader.readAsDataURL(file)
  })
}
