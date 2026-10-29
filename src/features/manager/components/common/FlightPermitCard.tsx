import { useEffect, useState } from 'react'
import { missionsApi } from '../../api/missionsApi'
import { ordersApi } from '../../api/ordersApi'
import type {
  FlightPermitStatus,
  MissionResponse,
  PreferredTimeOption,
} from '../../types/missions'
import { Button, useToast } from '../../../../shared/components/ui'
import { getLanguage, useI18n } from '../../../../shared/i18n'
import { flightPermitCardMessages } from './FlightPermitCard.messages'
import { managerFeedbackMessages } from '../../feedback.messages'
import { localizeTimeslot } from '../../lib/viLabels'

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
  const cancelled =
    mission.status === 'CANCELLED' || mission.orderStatus === 'CANCELLED'
  const [note, setNote] = useState(mission.flightPermitNote ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [action, setAction] = useState<'reschedule' | 'cancel' | null>(null)
  const [newStart, setNewStart] = useState(
    toLocalInput(mission.scheduledStartAt),
  )
  const [newEnd, setNewEnd] = useState(toLocalInput(mission.scheduledEndAt))
  const [customerConfirmed, setCustomerConfirmed] = useState(false)
  const [actionNote, setActionNote] = useState('')
  const [rescheduleScope, setRescheduleScope] = useState<
    'MISSION_ONLY' | 'ORDER_AND_MISSION'
  >('MISSION_ONLY')
  const [orderDateFrom, setOrderDateFrom] = useState(
    mission.orderPreferredDateFrom ?? '',
  )
  const [orderDateTo, setOrderDateTo] = useState(
    mission.orderPreferredDateTo ?? '',
  )
  const [orderPreferredTimeId, setOrderPreferredTimeId] = useState(
    mission.orderPreferredTimeId ?? '',
  )
  const [preferredTimes, setPreferredTimes] = useState<PreferredTimeOption[]>(
    [],
  )
  const hasChanges = note !== (mission.flightPermitNote ?? '') || file !== null
  useEffect(() => {
    setNote(mission.flightPermitNote ?? '')
    setFile(null)
  }, [mission.id, mission.flightPermitNote])

  useEffect(() => {
    if (action !== 'reschedule' || rescheduleScope !== 'ORDER_AND_MISSION')
      return
    const controller = new AbortController()
    missionsApi
      .listPreferredTimes(controller.signal)
      .then((items) => {
        setPreferredTimes(items)
        setOrderPreferredTimeId((current) => current || items[0]?.id || '')
      })
      .catch(() => setPreferredTimes([]))
    return () => controller.abort()
  }, [action, rescheduleScope])

  async function save(nextStatus: FlightPermitStatus) {
    setError('')
    if (file && file.size > 5 * 1024 * 1024) {
      setError(t.fileTooLarge)
      return
    }
    if (nextStatus === 'REJECTED' && !note.trim()) {
      setError(t.rejectionReasonRequired)
      return
    }
    if (
      nextStatus === 'PENDING' &&
      !file &&
      note.trim() === (mission.flightPermitNote ?? '').trim()
    ) {
      setError(t.resubmitRequired)
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
      const failure = cause instanceof Error ? cause.message : t.updateFailed
      setError(failure)
      toast.error(failure)
    } finally {
      setBusy(false)
    }
  }

  async function submitReschedule() {
    setError('')
    const start = new Date(newStart)
    const end = new Date(newEnd)
    if (!newStart || !newEnd || end <= start) {
      setError(t.invalidSchedule)
      return
    }
    if (!customerConfirmed) {
      setError(t.customerConfirmationRequired)
      return
    }
    if (
      rescheduleScope === 'ORDER_AND_MISSION' &&
      (!orderDateFrom || !orderDateTo || !orderPreferredTimeId)
    ) {
      setError(t.orderScheduleRequired)
      return
    }
    if (rescheduleScope === 'ORDER_AND_MISSION') {
      if (orderDateTo < orderDateFrom) {
        setError(t.invalidOrderDateRange)
        return
      }
      const missionDate = newStart.slice(0, 10)
      if (missionDate < orderDateFrom || missionDate > orderDateTo) {
        setError(t.missionOutsideOrderRange)
        return
      }
    }
    setBusy(true)
    try {
      await missionsApi.patchSchedule(mission.id, {
        scheduledStartAt: start.toISOString(),
        scheduledEndAt: end.toISOString(),
        reason: 'FLIGHT_PERMISSION_DELAY',
        note: actionNote.trim() || undefined,
        customerConfirmed: true,
        scope: rescheduleScope,
        orderPreferredDateFrom:
          rescheduleScope === 'ORDER_AND_MISSION' ? orderDateFrom : undefined,
        orderPreferredDateTo:
          rescheduleScope === 'ORDER_AND_MISSION' ? orderDateTo : undefined,
        orderPreferredTimeId:
          rescheduleScope === 'ORDER_AND_MISSION'
            ? orderPreferredTimeId
            : undefined,
      })
      toast.success(t.rescheduled)
      setAction(null)
      onChanged()
    } catch (cause) {
      const failure = cause instanceof Error ? cause.message : t.updateFailed
      setError(failure)
      toast.error(failure)
    } finally {
      setBusy(false)
    }
  }

  async function submitCancellationProposal() {
    setError('')
    if (!actionNote.trim()) {
      setError(t.cancellationReasonRequired)
      return
    }
    setBusy(true)
    try {
      await ordersApi.cancelAfterPermitRejection(
        mission.orderId,
        actionNote.trim(),
      )
      toast.success(t.cancellationProposed)
      setAction(null)
      onChanged()
    } catch (cause) {
      const failure = cause instanceof Error ? cause.message : t.updateFailed
      setError(failure)
      toast.error(failure)
    } finally {
      setBusy(false)
    }
  }

  return (() => {
    const canEditPermitFile = !cancelled && status !== 'APPROVED'

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
          <p className="odm-or-muted odm-flight-permit__intro">{t.intro}</p>
          {cancelled ? (
            <div className="odm-flight-permit__blocked" role="status">
              <strong>{t.cancelledNotice}</strong>
            </div>
          ) : null}
          {status === 'REJECTED' && !cancelled ? (
            <div className="odm-flight-permit__blocked" role="status">
              <strong>{t.rejectedTitle}</strong>
              <span>{t.rejectedBody}</span>
              {mission.flightPermitResourceHoldUntil ? (
                <small>
                  {t.holdUntil(
                    new Date(
                      mission.flightPermitResourceHoldUntil,
                    ).toLocaleString(),
                  )}
                </small>
              ) : null}
              {mission.flightPermitResourcesReleasedAt ? (
                <small>{t.resourcesReleased}</small>
              ) : null}
            </div>
          ) : null}
          <label className="odm-flight-permit__field">
            <strong>{t.note}</strong>
            <textarea
              className="odm-flight-permit__textarea"
              value={note}
              maxLength={1000}
              rows={3}
              disabled={busy || cancelled}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t.notePlaceholder}
            />
          </label>
          {canEditPermitFile ? (
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
              {!mission.flightPermitFileName ? (
                <div className="odm-flight-permit__dropzone">
                  <FilePickerButton
                    inputId={`flight-permit-file-${mission.id}`}
                    disabled={busy}
                    label={t.chooseFile}
                  />
                  <span
                    className="odm-or-muted odm-flight-permit__file-name"
                    title={file?.name}
                  >
                    {file?.name ?? t.noFileChosen}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}
          {mission.flightPermitFileName ? (
            <div className="odm-flight-permit__current-file">
              <span>
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
              </span>
              {canEditPermitFile ? (
                <FilePickerButton
                  inputId={`flight-permit-file-${mission.id}`}
                  disabled={busy}
                  label={t.replaceFile}
                />
              ) : null}
              {file ? (
                <span
                  className="odm-flight-permit__file-name"
                  title={file.name}
                >
                  {t.replacementFile} {file.name}
                </span>
              ) : null}
            </div>
          ) : (
            <div className="odm-or-muted odm-flight-permit__current-file">
              {t.noPermitFile}
            </div>
          )}
          {error ? (
            <p role="alert" className="odm-flight-permit__error">
              {error}
            </p>
          ) : null}
          {!cancelled ? (
            <div className="odm-flight-permit__actions">
              {status === 'REJECTED' ? (
                <>
                  <Button
                    variant="primary"
                    disabled={busy}
                    onClick={() => save('PENDING')}
                  >
                    {t.resubmit}
                  </Button>
                  <Button
                    disabled={busy}
                    onClick={() => {
                      setAction('reschedule')
                      setActionNote('')
                    }}
                  >
                    {t.reschedule}
                  </Button>
                  <Button
                    className="odm-flight-permit__reject"
                    disabled={busy}
                    onClick={() => {
                      setAction('cancel')
                      setActionNote('')
                    }}
                  >
                    {t.proposeCancellation}
                  </Button>
                </>
              ) : null}
              {hasChanges && status !== 'REJECTED' ? (
                <Button
                  variant="primary"
                  className="odm-flight-permit__save"
                  disabled={busy}
                  onClick={() => save('PENDING')}
                >
                  {t.saveChanges}
                </Button>
              ) : null}
              {status !== 'APPROVED' && status !== 'REJECTED' ? (
                <Button
                  className="odm-flight-permit__approve"
                  disabled={busy}
                  onClick={() => save('APPROVED')}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                  >
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                  {t.confirmApproved}
                </Button>
              ) : null}
              {status !== 'REJECTED' && status !== 'APPROVED' ? (
                <Button
                  className="odm-flight-permit__reject"
                  disabled={busy}
                  onClick={() => save('REJECTED')}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                  {t.reject}
                </Button>
              ) : null}
            </div>
          ) : null}
          {!cancelled && action === 'reschedule' ? (
            <div className="odm-flight-permit__remediation">
              <fieldset className="odm-flight-permit__scope">
                <legend>{t.rescheduleScope}</legend>
                <label>
                  <input
                    type="radio"
                    name={`reschedule-scope-${mission.id}`}
                    value="MISSION_ONLY"
                    checked={rescheduleScope === 'MISSION_ONLY'}
                    onChange={() => setRescheduleScope('MISSION_ONLY')}
                  />
                  <span>
                    <strong>{t.missionOnly}</strong>
                    <small>{t.missionOnlyHelp}</small>
                  </span>
                </label>
                <label>
                  <input
                    type="radio"
                    name={`reschedule-scope-${mission.id}`}
                    value="ORDER_AND_MISSION"
                    checked={rescheduleScope === 'ORDER_AND_MISSION'}
                    onChange={() => setRescheduleScope('ORDER_AND_MISSION')}
                  />
                  <span>
                    <strong>{t.orderAndMission}</strong>
                    <small>{t.orderAndMissionHelp}</small>
                  </span>
                </label>
              </fieldset>
              <div className="odm-flight-permit__current-schedule">
                <strong>{t.currentMissionScheduleTitle}</strong>
                <span>
                  {formatMissionSchedule(
                    mission.scheduledStartAt,
                    mission.scheduledEndAt,
                    t.preferredScheduleMissing,
                  )}
                </span>
              </div>
              <div className="odm-flight-permit__preferred-schedule">
                <strong>{t.preferredScheduleTitle}</strong>
                <dl>
                  <div>
                    <dt>{t.preferredDate}</dt>
                    <dd>
                      {formatPreferredDates(
                        mission.orderPreferredDateFrom,
                        mission.orderPreferredDateTo,
                        t.preferredScheduleMissing,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>{t.preferredTime}</dt>
                    <dd>
                      {formatPreferredTime(
                        mission.orderPreferredTimeName,
                        mission.orderPreferredTimeStart,
                        mission.orderPreferredTimeEnd,
                        t.preferredScheduleMissing,
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
              {rescheduleScope === 'ORDER_AND_MISSION' ? (
                <section className="odm-flight-permit__schedule-step">
                  <strong>{t.orderScheduleStep}</strong>
                  <div className="odm-flight-permit__schedule-grid">
                    <label>
                      {t.newOrderDateFrom}
                      <input
                        type="date"
                        value={orderDateFrom}
                        onChange={(event) =>
                          setOrderDateFrom(event.target.value)
                        }
                      />
                    </label>
                    <label>
                      {t.newOrderDateTo}
                      <input
                        type="date"
                        value={orderDateTo}
                        onChange={(event) => setOrderDateTo(event.target.value)}
                      />
                    </label>
                  </div>
                  <label>
                    {t.newOrderTime}
                    <select
                      value={orderPreferredTimeId}
                      onChange={(event) =>
                        setOrderPreferredTimeId(event.target.value)
                      }
                    >
                      <option value="">{t.selectPreferredTime}</option>
                      {preferredTimes.map((item) => (
                        <option key={item.id} value={item.id}>
                          {localizeTimeslot(item.name)} (
                          {item.startTime.slice(0, 5)} –{' '}
                          {item.endTime.slice(0, 5)})
                        </option>
                      ))}
                    </select>
                  </label>
                </section>
              ) : null}
              <section className="odm-flight-permit__schedule-step">
                <strong>
                  {rescheduleScope === 'ORDER_AND_MISSION'
                    ? t.missionScheduleStep
                    : t.missionScheduleOnly}
                </strong>
                <div className="odm-flight-permit__schedule-grid">
                  <label>
                    {t.newStart}
                    <input
                      type="datetime-local"
                      value={newStart}
                      onChange={(e) => setNewStart(e.target.value)}
                    />
                  </label>
                  <label>
                    {t.newEnd}
                    <input
                      type="datetime-local"
                      value={newEnd}
                      onChange={(e) => setNewEnd(e.target.value)}
                    />
                  </label>
                </div>
              </section>
              <label>
                {t.rescheduleNote}
                <textarea
                  rows={2}
                  maxLength={1000}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                />
              </label>
              <label className="odm-flight-permit__check">
                <input
                  type="checkbox"
                  checked={customerConfirmed}
                  onChange={(e) => setCustomerConfirmed(e.target.checked)}
                />
                {t.customerConfirmed}
              </label>
              <div className="odm-flight-permit__actions">
                <Button
                  variant="primary"
                  disabled={busy}
                  onClick={submitReschedule}
                >
                  {rescheduleScope === 'ORDER_AND_MISSION'
                    ? t.confirmOrderAndMissionReschedule
                    : t.confirmReschedule}
                </Button>
                <Button disabled={busy} onClick={() => setAction(null)}>
                  {t.close}
                </Button>
              </div>
            </div>
          ) : null}
          {!cancelled && action === 'cancel' ? (
            <div className="odm-flight-permit__remediation odm-flight-permit__remediation--danger">
              <strong>{t.cancellationWarning}</strong>
              <label>
                {t.cancellationReason}
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                />
              </label>
              <div className="odm-flight-permit__actions">
                <Button
                  className="odm-flight-permit__reject"
                  disabled={busy}
                  onClick={submitCancellationProposal}
                >
                  {t.submitCancellation}
                </Button>
                <Button disabled={busy} onClick={() => setAction(null)}>
                  {t.close}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    )
  })()
}

function FilePickerButton({
  inputId,
  disabled,
  label,
}: {
  inputId: string
  disabled: boolean
  label: string
}) {
  return (
    <label
      className="odm-flight-permit__file-button"
      htmlFor={inputId}
      aria-disabled={disabled}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
        <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5h14v-5" />
      </svg>
      {label}
    </label>
  )
}

function toLocalInput(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function formatPreferredDates(
  from?: string | null,
  to?: string | null,
  fallback = '—',
) {
  if (!from && !to) return fallback
  const format = (value: string) => {
    const [year, month, day] = value.split('-').map(Number)
    return new Intl.DateTimeFormat(
      getLanguage() === 'vi' ? 'vi-VN' : 'en-US',
    ).format(new Date(year, month - 1, day))
  }
  if (from && to && from !== to) return `${format(from)} – ${format(to)}`
  return format(from ?? to!)
}

function formatMissionSchedule(
  start?: string | null,
  end?: string | null,
  fallback = '—',
) {
  if (!start && !end) return fallback
  const formatter = new Intl.DateTimeFormat(
    getLanguage() === 'vi' ? 'vi-VN' : 'en-US',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  )
  if (start && end)
    return `${formatter.format(new Date(start))} – ${formatter.format(new Date(end))}`
  return formatter.format(new Date(start ?? end!))
}

function formatPreferredTime(
  name?: string | null,
  start?: string | null,
  end?: string | null,
  fallback = '—',
) {
  const range =
    start && end ? `${start.slice(0, 5)} – ${end.slice(0, 5)}` : null
  const localizedName = localizeTimeslot(name)
  if (localizedName && range) return `${localizedName} (${range})`
  return localizedName || range || fallback
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () =>
      reject(new Error(flightPermitCardMessages[getLanguage()].readFailed))
    reader.readAsDataURL(file)
  })
}
