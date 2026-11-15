import { ImagePreview } from '../../../../../shared/components/media/ImagePreview'
import { VideoThumbnail } from '../../../../../shared/components/media/VideoThumbnail'
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { missionApi } from '../../../../mission/api/missionApi'
import { useMissionMonitoring } from '../../../../mission/hooks/useMissionMonitoring'
import { MonitoringChecklistSection } from '../../../../mission/components/MonitoringChecklistSection'
import { missionResultActions, staffResultError } from '../../../components/common/MissionResultActions'
import type { ManualPostflightReadings } from '../manualInspection'
import { FlightStepHeader } from '../../../components/common/FlightStepper'
import { operatorHref } from '../../../routes'
import { useI18n } from '../../../../../shared/i18n'
import { postflightPageMessages } from '../PostflightPage.messages'
import { usePostflightReviewData } from '../usePostflightReviewData'
import type { PostflightCheckStatus } from '../../MissionDetail/types'
import { formatMetric } from '../postflightHelpers'
import './PostflightCompletedView.css'

export type DevicePostflightResult = {
  id: string
  label: string
  check?: PostflightCheckStatus | null
}

export function PostflightCompletedView({
  missionId,
  missionLabel,
  completed,
  deviceChecks = [],
  deviceId,
  inspectionResults,
  notes,
  telemetrySnapshot,
}: {
  missionId: string
  missionLabel: string
  completed: { overallOk: boolean; ticketCreated: boolean; droneStatus: string }
  deviceChecks?: DevicePostflightResult[]
  deviceId: string
  inspectionResults: Record<string, 'PASS' | 'FAIL'> | null
  notes: string
  telemetrySnapshot: ManualPostflightReadings | null
}) {
  const { t, lang } = useI18n(postflightPageMessages)
  const review = usePostflightReviewData(missionId)
  const monitoring = useMissionMonitoring(missionId, undefined, {
    autoRefresh: false,
  })
  const [busyAction, setBusyAction] = useState<'complete' | 'send' | 'restore' | 'fail' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [missionCompletedLocally, setMissionCompletedLocally] = useState(false)
  const [failureConfirmedLocally, setFailureConfirmedLocally] = useState(false)
  const [submittedLocally, setSubmittedLocally] = useState(false)
  const [activeReviewTab, setActiveReviewTab] = useState('checklist')
  const reviewTabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const mission = review.data?.mission
  const missionStatus = mission?.status
  const failureConfirmed = failureConfirmedLocally || missionStatus === 'FAILED'
  const awaitingFailureAcceptance =
    Boolean(mission?.failureRequestedAt) && !failureConfirmed
  const canConfirmFailure =
    awaitingFailureAcceptance &&
    monitoring.data?.permissions.canConfirmMissionFailure === true
  const resultState = missionResultActions(
    missionId,
    missionStatus,
    monitoring,
  )
  const inspectorApproved =
    monitoring.data?.result?.approvalStatus === 'APPROVED'
  const isSubmitted =
    submittedLocally ||
    resultState.submitted ||
    monitoring.data?.result?.approvalStatus === 'PENDING_MANAGER_APPROVAL'
  const acceptanceConfirmed =
    !failureConfirmed && (submittedLocally || inspectorApproved)
  const acceptanceProgressLabel = acceptanceConfirmed
    ? t.reviewStepComplete
    : undefined
  const isMissionCompleted =
    missionCompletedLocally ||
    Boolean(mission?.completedAt) ||
    ['AWAITING_REVIEW', 'PENDING_REVIEW', 'COMPLETED'].includes(
      missionStatus ?? '',
    )

  const checklistRows = monitoring.data?.checklist.executions ?? []
  const checklistPassed = checklistRows.filter(
    (row) => Boolean(row.fulfilledByMissionId) || row.assessmentStatus === 'COMPLIANT',
  ).length
  const checklistAssessed = checklistRows.filter(
    (row) => Boolean(row.fulfilledByMissionId) || row.assessmentStatus !== 'NOT_ASSESSED',
  ).length
  const checklistAssessmentsComplete = checklistRows.every(
    (row) => Boolean(row.fulfilledByMissionId) || row.assessmentStatus === 'COMPLIANT',
  )
  const preflightItems = review.data?.preflight?.items ?? []
  const preflightPassed = preflightItems.filter(
    (item) => item.status === 'PASSED',
  ).length
  const postflightItems = review.data?.postflight?.items ?? []
  const postflightPassed = postflightItems.filter((item) =>
    ['PASS', 'PASSED'].includes(item.status ?? ''),
  ).length
  const failedCount = postflightItems.filter((item) =>
    ['FAIL', 'FAILED'].includes(item.status ?? ''),
  ).length
  const media = review.data?.media ?? []
  const reviewLoading = review.loading || monitoring.loading
  const sectionLoadErrors = review.data?.loadErrors
  const requiredReviewError = Boolean(
    review.error ||
      sectionLoadErrors?.mission ||
      sectionLoadErrors?.preflight ||
      sectionLoadErrors?.weather ||
      sectionLoadErrors?.postflight,
  )
  const reviewError = requiredReviewError || Boolean(monitoring.error)
  const reviewLoadFailed = Boolean(reviewError)
  const failedReviewSections = [
    ...(sectionLoadErrors?.mission ? [t.reviewMissionInfo] : []),
    ...(sectionLoadErrors?.preflight ? [t.reviewPreflight] : []),
    ...(sectionLoadErrors?.weather ? [t.reviewWeather] : []),
    ...(sectionLoadErrors?.postflight ? [t.reviewPostflight] : []),
    ...(monitoring.error ? [t.reviewMissionChecklist] : []),
  ]
  const reviewLoadErrorMessage = failedReviewSections.length
    ? t.reviewLoadFailedSections(failedReviewSections)
    : t.reviewLoadFailed
  const reviewDataReady = Boolean(
    review.data?.mission &&
      review.data.preflight &&
      review.data.weather &&
      review.data.postflight &&
      !requiredReviewError,
  )

  async function handleCompleteMission() {
    if (
      !resultState.completeReady ||
      monitoring.data?.checklist.readyForSubmission !== true ||
      !checklistAssessmentsComplete ||
      !reviewDataReady ||
      busyAction
    )
      return

    setBusyAction('complete')
    setActionError(null)
    try {
      await missionApi.completeMission(missionId)
      setMissionCompletedLocally(true)
      review.reload()
      monitoring.reload()
    } catch (error) {
      setActionError(staffResultError(error))
    } finally {
      setBusyAction(null)
    }
  }

  async function handleConfirmMissionFailure() {
    if (!mission || !canConfirmFailure || busyAction) return

    setBusyAction('fail')
    setActionError(null)
    try {
      await missionApi.failMission(
        missionId,
        mission.failureReason?.trim() || t.reviewFailureDefaultReason,
      )
      setFailureConfirmedLocally(true)
      review.reload()
      monitoring.reload()
    } catch (error) {
      setActionError(staffResultError(error))
    } finally {
      setBusyAction(null)
    }
  }

  async function handleConfirmInspection() {
    if (
      !mission ||
      !isMissionCompleted ||
      !resultState.submitReady ||
      !checklistAssessmentsComplete ||
      !reviewDataReady ||
      busyAction
    )
      return

    setBusyAction('send')
    setActionError(null)
    try {
      const weather = review.data?.weather
      const summary = lang === 'vi'
        ? [
            `${missionLabel} · ${mission.serviceName || t.reviewService}: ${mission.address || t.reviewLocation}.`,
            `Checklist công trình: ${checklistPassed}/${checklistRows.length} mục công việc được nghiệm thu.`,
            `Kiểm tra trước bay: ${preflightPassed}/${preflightItems.length} mục đạt.`,
            `Thời tiết: ${weather?.status ?? 'chưa có dữ liệu'}${weather ? `, gió ${weather.windSpeedMps.toFixed(1)}/${weather.windGustMps.toFixed(1)} m/s, mưa ${weather.precipitationMmH.toFixed(1)} mm/h` : ''}.`,
            `Kiểm tra sau bay: ${postflightPassed}/${postflightItems.length} mục đạt${failedCount ? `, ${failedCount} mục không đạt` : ''}.`,
            `Media: ${media.length} tệp.`,
          ].join(' ')
        : [
            `${missionLabel} · ${mission.serviceName || t.reviewService}: ${mission.address || t.reviewLocation}.`,
            `Work acceptance checklist: ${checklistPassed}/${checklistRows.length} compliant.`,
            `Precheck: ${preflightPassed}/${preflightItems.length} passed.`,
            `Weather: ${weather?.status ?? 'no data'}${weather ? `, wind ${weather.windSpeedMps.toFixed(1)}/${weather.windGustMps.toFixed(1)} m/s, rain ${weather.precipitationMmH.toFixed(1)} mm/h` : ''}.`,
            `Postcheck: ${postflightPassed}/${postflightItems.length} passed${failedCount ? `, ${failedCount} failed` : ''}.`,
            `Media: ${media.length} file(s).`,
          ].join(' ')

      const checklistDetails = checklistRows.map((row) =>
        [
          `- ${row.content}: ${row.assessmentStatus} (${row.executionStatus})`,
          row.observation,
          row.unableToVerifyReason,
          `${row.evidence?.length ?? 0} ${lang === 'vi' ? 'bằng chứng' : 'evidence item(s)'}`,
        ]
          .filter(Boolean)
          .join(' · '),
      )
      const preflightDetails = preflightItems.map(
        (item) => `- ${item.checkName}: ${item.status}${item.message ? ` · ${item.message}` : ''}`,
      )
      const postflightDetails = postflightItems.map(
        (item) =>
          `- ${item.checkName ?? item.checkType}: ${item.status}${item.message ? ` · ${item.message}` : ''}`,
      )
      const weatherDetails = weather
        ? [
            `${weather.summary} (${weather.status})`,
            `${lang === 'vi' ? 'Gió' : 'Wind'} ${weather.windSpeedMps.toFixed(1)} m/s; ${lang === 'vi' ? 'giật' : 'gust'} ${weather.windGustMps.toFixed(1)} m/s; ${lang === 'vi' ? 'mưa' : 'rain'} ${weather.precipitationMmH.toFixed(1)} mm/h; ${lang === 'vi' ? 'tầm nhìn' : 'visibility'} ${weather.visibilityKm.toFixed(1)} km; ${weather.temperatureC.toFixed(1)}°C; ${lang === 'vi' ? 'độ ẩm' : 'humidity'} ${weather.humidityPercent}%.`,
            ...(weather.safeToFly
              ? []
              : weather.advisories.map((advisory) => `- ${advisory}`)),
          ].join('\n')
        : ''
      const reportNotes = (
        lang === 'vi'
          ? [
              notes.trim(),
              `CHECKLIST CÔNG TRÌNH\n${checklistDetails.join('\n')}`,
              `KIỂM TRA THIẾT BỊ TRƯỚC BAY\n${preflightDetails.join('\n')}`,
              `THỜI TIẾT\n${weatherDetails}`,
              `KIỂM TRA THIẾT BỊ SAU BAY\n${postflightDetails.join('\n')}`,
              `ẢNH/VIDEO: ${media.length} tệp được đính kèm cùng báo cáo.`,
            ]
          : [
              notes.trim(),
              `SITE CHECKLIST\n${checklistDetails.join('\n')}`,
              `DEVICE PRECHECK\n${preflightDetails.join('\n')}`,
              `WEATHER\n${weatherDetails}`,
              `DEVICE POSTCHECK\n${postflightDetails.join('\n')}`,
              `PHOTOS/VIDEOS: ${media.length} file(s) attached to the report.`,
            ]
      )
        .filter(Boolean)
        .join('\n')

      await missionApi.submitMissionResult(missionId, {
        status: 'COMPLETED',
        startedAt: mission.startedAt ?? null,
        endedAt: mission.completedAt ?? null,
        completedAt: mission.completedAt ?? new Date().toISOString(),
        summary: summary.slice(0, 1000),
        notes: reportNotes || null,
      })
      setSubmittedLocally(true)
      monitoring.reload()
      review.reload()
    } catch (error) {
      setActionError(staffResultError(error))
    } finally {
      setBusyAction(null)
    }
  }

  async function handleRestorePostflight() {
    if (
      !inspectionResults ||
      monitoring.data?.permissions.canMaintainDevice !== true ||
      busyAction
    )
      return

    setBusyAction('restore')
    setActionError(null)
    try {
      await missionApi.postFlightStatus(
        missionId,
        deviceId,
        completed.droneStatus === 'MAINTENANCE' ? 'MAINTENANCE' : 'AVAILABLE',
        notes,
        inspectionResults,
        telemetrySnapshot,
      )
      review.reload()
      monitoring.reload()
    } catch (error) {
      setActionError(staffResultError(error))
    } finally {
      setBusyAction(null)
    }
  }

  const retryReview = () => {
    review.reload()
    monitoring.reload()
  }

  if (reviewLoading && !review.data && !monitoring.data) {
    return (
      <div className="odm-card postflight-page postflight-acceptance">
        {mission?.inspectionSourceMissionId && <a className="postflight-review-secondary" href={operatorHref({screen:'postflight',missionId:mission.inspectionSourceMissionId})}>{t.backToInspectionSource}</a>}
      <FlightStepHeader
          title={t.completedStepTitle}
          missionId={missionLabel}
          active={6}
          failed={failureConfirmed}
        />
        <div className="postflight-review-state" role="status" aria-live="polite">
          <span className="postflight-review-spinner" aria-hidden="true" />
          <span>{t.reviewLoading}</span>
        </div>
      </div>
    )
  }

  const canComplete =
    resultState.canComplete && !isMissionCompleted && !awaitingFailureAcceptance
  const completionReady =
    resultState.completeReady &&
    monitoring.data?.checklist.readyForSubmission === true &&
    checklistAssessmentsComplete &&
    reviewDataReady &&
    !reviewError
  const canSend =
    isMissionCompleted && resultState.canSubmit && !isSubmitted
  const sendReady =
    canSend &&
    resultState.submitReady &&
    checklistAssessmentsComplete &&
    reviewDataReady &&
    !reviewError
  const currentWeather = review.data?.weather
  const postflight = review.data?.postflight
  const preflight = review.data?.preflight
  const reviewTabPrefix = `postflight-review-${missionId}`
  const reviewTabs = [
    {
      id: 'checklist',
      label: t.reviewTabChecklist,
      summary: monitoring.loading
        ? t.reviewTabLoading
        : monitoring.error
          ? t.reviewTabNoData
          : checklistRows.length
            ? t.reviewTabChecklistCount(checklistAssessed, checklistRows.length)
            : t.reviewTabNoItems,
    },
    {
      id: 'preflight',
      label: t.reviewTabPreflight,
      summary: review.loading
        ? t.reviewTabLoading
        : preflight
          ? preflight.items.length
            ? t.reviewTabPassedCount(preflightPassed, preflight.items.length)
            : t.reviewTabNoItems
          : t.reviewTabNoData,
    },
    {
      id: 'weather',
      label: t.reviewWeather,
      summary: review.loading
        ? t.reviewTabLoading
        : currentWeather
          ? currentWeather.safeToFly ? t.reviewPass : t.reviewWarn
          : t.reviewTabNoData,
    },
    {
      id: 'postflight',
      label: t.reviewTabPostflight,
      summary: deviceChecks.length > 0
        ? (lang === 'vi' ? `${deviceChecks.length} thiết bị` : `${deviceChecks.length} devices`)
        : review.loading
        ? t.reviewTabLoading
        : postflight
          ? postflightItems.length
            ? t.reviewTabPassedCount(postflightPassed, postflightItems.length)
            : t.reviewTabNoItems
          : t.reviewTabNoData,
    },
    {
      id: 'media',
      label: t.reviewMedia,
      summary: review.loading
        ? t.reviewTabLoading
        : t.reviewTabMediaCount(media.length),
    },
  ]

  function handleReviewTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    let nextIndex: number | null = null
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % reviewTabs.length
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + reviewTabs.length) % reviewTabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = reviewTabs.length - 1
    if (nextIndex === null) return

    event.preventDefault()
    const nextTab = reviewTabs[nextIndex]
    setActiveReviewTab(nextTab.id)
    reviewTabRefs.current[nextIndex]?.focus()
  }

  return (
    <div className="odm-card postflight-page postflight-acceptance">
      <FlightStepHeader
        title={t.completedStepTitle}
        missionId={missionLabel}
        active={6}
        failed={failureConfirmed}
        completed={acceptanceConfirmed}
        completedLabel={acceptanceProgressLabel}
      />

      <div className="postflight-content postflight-review-content">
        <section className="postflight-review-hero">
          <div className="postflight-review-hero-copy">
            <p>{t.reviewSubtitle}</p>
          </div>
          <div className="postflight-review-status-stack">
            {deviceChecks.map(({ id, label, check }) => (
              <button type="button" key={id}
                className={`postflight-device-result postflight-review-status ${!check?.completedAt ? '' : check.overallOk ? 'is-pass' : 'is-warning'}`}
                onClick={() => {
                  setActiveReviewTab('postflight')
                  reviewTabRefs.current[3]?.focus()
                }}>
                {label} · {check?.completedAt ? (check.overallOk ? t.reviewPass : t.reviewFail) : t.reviewTabNoData}
              </button>
            ))}
            {isSubmitted && (
              <span className="postflight-review-manager-status" role="status">
                {inspectorApproved || submittedLocally ? t.reviewApproved : t.reviewSent}
              </span>
            )}
          </div>
        </section>

        {reviewLoadFailed && (
          <div className="postflight-error" role="alert">
            <span>{reviewLoadErrorMessage}</span>
            <button type="button" className="postflight-review-retry" onClick={retryReview}>
              {t.reviewRetry}
            </button>
          </div>
        )}

        {actionError && <div className="postflight-error" role="alert">{actionError}</div>}

        <div className="postflight-review-workspace">
          <div className="postflight-review-tabs" role="tablist" aria-label={t.reviewTabsLabel}>
            {reviewTabs.map((tab, index) => (
              <button
                key={tab.id}
                ref={(element) => { reviewTabRefs.current[index] = element }}
                id={`${reviewTabPrefix}-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={activeReviewTab === tab.id}
                aria-controls={`${reviewTabPrefix}-panel-${tab.id}`}
                tabIndex={activeReviewTab === tab.id ? 0 : -1}
                onClick={() => setActiveReviewTab(tab.id)}
                onKeyDown={(event) => handleReviewTabKeyDown(event, index)}
              >
                <span>{tab.label}</span>
                <small>{tab.summary}</small>
              </button>
            ))}
          </div>

          <div
            id={`${reviewTabPrefix}-panel-checklist`}
            className="postflight-review-tab-panel"
            role="tabpanel"
            aria-labelledby={`${reviewTabPrefix}-tab-checklist`}
            tabIndex={0}
            hidden={activeReviewTab !== 'checklist'}
          >
            <MonitoringChecklistSection
              missionId={missionId}
              data={monitoring.data?.checklist}
              loading={monitoring.loading}
              error={monitoring.error}
              canExecute={false}
              canSelectForCustomer={monitoring.data?.permissions.canAssessMonitoringChecklist === true}
              canAssess={
                monitoring.data?.permissions.canAssessMonitoringChecklist === true
              }
              resultStatus={monitoring.data?.result?.approvalStatus}
              resultNote={monitoring.data?.result?.reviewNote}
              resultKnown={monitoring.data !== undefined}
              refresh={monitoring.reload}
              compact
              compactTitle={t.reviewMissionChecklist}
              assessmentOnly
              hideImplementationHints
            />
          </div>

          <div
            id={`${reviewTabPrefix}-panel-preflight`}
            className="postflight-review-tab-panel"
            role="tabpanel"
            aria-labelledby={`${reviewTabPrefix}-tab-preflight`}
            tabIndex={0}
            hidden={activeReviewTab !== 'preflight'}
          >
            <ReviewSection
              title={t.reviewPreflight}
              detail={preflight ? t.reviewPassedCount(preflightPassed, preflight.items.length) : undefined}
            >
              {!preflight ? (
                <ReviewEmpty>
                  {sectionLoadErrors?.preflight ? t.reviewPreflightLoadFailed : t.reviewNoPreflight}
                </ReviewEmpty>
              ) : (
                <>
                  {(preflight.completedAt || preflight.startedAt) && (
                    <ReviewTimestamp
                      value={formatDate(preflight.completedAt ?? preflight.startedAt ?? '', lang)}
                      label={t.reviewCheckedAt}
                    />
                  )}
                  <ResultList>
                    {preflight.items.map((item) => (
                      <ResultLine
                        key={item.checkType}
                        title={item.checkName}
                        detail={item.message ?? undefined}
                        label={resultStatusLabel(item.status, t)}
                        tone={item.status === 'PASSED' ? 'pass' : item.status === 'FAILED' ? 'fail' : 'pending'}
                      />
                    ))}
                  </ResultList>
                </>
              )}
            </ReviewSection>
          </div>

          <div
            id={`${reviewTabPrefix}-panel-weather`}
            className="postflight-review-tab-panel"
            role="tabpanel"
            aria-labelledby={`${reviewTabPrefix}-tab-weather`}
            tabIndex={0}
            hidden={activeReviewTab !== 'weather'}
          >
            <ReviewSection title={t.reviewWeather} detail={currentWeather?.summary}>
              {!currentWeather ? (
                <ReviewEmpty>
                  {sectionLoadErrors?.weather ? t.reviewWeatherLoadFailed : t.reviewNoWeather}
                </ReviewEmpty>
              ) : (
                <>
                  <div className="postflight-review-weather-status">
                    <ResultBadge
                      label={currentWeather.safeToFly ? t.reviewPass : t.reviewWarn}
                      tone={currentWeather.safeToFly ? 'pass' : 'warning'}
                    />
                    <time>{formatDate(currentWeather.checkedAt, lang)}</time>
                  </div>
                  <div className="postflight-review-weather-grid">
                    <WeatherMetric label={t.reviewWind} value={`${currentWeather.windSpeedMps.toFixed(1)} / ${currentWeather.windGustMps.toFixed(1)} m/s`} />
                    <WeatherMetric label={t.reviewRain} value={`${currentWeather.precipitationMmH.toFixed(1)} mm/h`} />
                    <WeatherMetric label={t.reviewVisibility} value={`${currentWeather.visibilityKm.toFixed(1)} km`} />
                    <WeatherMetric label={t.reviewTemperature} value={`${currentWeather.temperatureC.toFixed(1)} °C`} />
                    <WeatherMetric label={t.reviewHumidity} value={`${currentWeather.humidityPercent}%`} />
                  </div>
                  {!currentWeather.safeToFly &&
                    currentWeather.advisories.length > 0 && (
                      <ul className="postflight-review-advisories">
                        {currentWeather.advisories.map((advisory) => (
                          <li key={advisory}>{advisory}</li>
                        ))}
                      </ul>
                    )}
                </>
              )}
            </ReviewSection>
          </div>

          <div
            id={`${reviewTabPrefix}-panel-postflight`}
            className="postflight-review-tab-panel"
            role="tabpanel"
            aria-labelledby={`${reviewTabPrefix}-tab-postflight`}
            tabIndex={0}
            hidden={activeReviewTab !== 'postflight'}
          >
            <ReviewSection
              title={t.reviewPostflight}
              detail={!deviceChecks.length && postflight ? t.reviewPassedCount(postflightPassed, postflightItems.length) : undefined}
            >
              {deviceChecks.length > 0 ? (
                <div className="postflight-device-results">
                  {deviceChecks.map(({ id, label, check }) => (
                    <details key={id}>
                      <summary>
                        <strong>{label}</strong>
                        {check?.completedAt && (
                          <ResultBadge label={check.overallOk ? t.reviewPass : t.reviewFail}
                            tone={check.overallOk ? 'pass' : 'fail'} />
                        )}
                      </summary>
                      {check?.completedAt ? (
                        <ResultList>
                          {(check.items ?? []).map((item, index) => (
                            <ResultLine key={item.checkType ?? index}
                              title={item.checkName ?? item.checkType ?? `${index + 1}`}
                              detail={item.message ?? undefined}
                              label={resultStatusLabel(item.status, t)}
                              tone={resultTone(item.status)} />
                          ))}
                        </ResultList>
                      ) : <ReviewEmpty>{t.reviewNoPostflight}</ReviewEmpty>}
                    </details>
                  ))}
                </div>
              ) : !postflight ? (
                <>
                  <ReviewEmpty>
                    {sectionLoadErrors?.postflight ? t.reviewPostflightLoadFailed : t.reviewNoPostflight}
                  </ReviewEmpty>
                  {inspectionResults &&
                    monitoring.data?.permissions.canMaintainDevice === true &&
                    !isSubmitted && (
                      <button
                        type="button"
                        className="postflight-review-retry"
                        disabled={busyAction !== null || reviewLoading}
                        onClick={handleRestorePostflight}
                      >
                        {busyAction === 'restore' ? t.reviewRestoringPostflight : t.reviewRestorePostflight}
                      </button>
                    )}
                </>
              ) : (
                <>
                  <div className="postflight-review-weather-status">
                    <ResultBadge
                      label={postflight.overallOk ? t.reviewPass : t.reviewFail}
                      tone={postflight.overallOk ? 'pass' : 'fail'}
                    />
                    <time>{formatDate(postflight.checkedAt, lang)}</time>
                  </div>
                  <ResultList>
                    {postflightItems.map((item, index) => (
                      <ResultLine
                        key={item.checkType ?? index}
                        title={item.checkName ?? item.checkType ?? `${t.reviewPostflight} ${index + 1}`}
                        detail={item.message ?? undefined}
                        label={resultStatusLabel(item.status, t)}
                        tone={resultTone(item.status)}
                      />
                    ))}
                  </ResultList>
                  {typeof postflight.landingBatteryPercent === 'number' && (
                    <WeatherMetric label={t.landingBattery} value={`${postflight.landingBatteryPercent.toFixed(1)}%`} />
                  )}
                </>
              )}
              {(telemetrySnapshot || notes.trim()) && (
                <div className="postflight-review-notes-group">
                  <h3>{t.reviewNotes}</h3>
                  {telemetrySnapshot && (
                    <div className="postflight-review-telemetry">
                      <WeatherMetric label={t.landingBattery} value={formatMetric(telemetrySnapshot.batteryPercent, '%', 1)} />


                    </div>
                  )}
                  <p className="postflight-review-notes">{notes.trim() || t.reviewNoNotes}</p>
                </div>
              )}
            </ReviewSection>
          </div>

          <div
            id={`${reviewTabPrefix}-panel-media`}
            className="postflight-review-tab-panel"
            role="tabpanel"
            aria-labelledby={`${reviewTabPrefix}-tab-media`}
            tabIndex={0}
            hidden={activeReviewTab !== 'media'}
          >
            <ReviewSection title={t.reviewMedia} detail={t.reviewTabMediaCount(media.length)}>
              {media.length === 0 ? (
                <ReviewEmpty>
                  {sectionLoadErrors?.media ? t.reviewMediaLoadFailed : t.reviewNoMedia}
                </ReviewEmpty>
              ) : (
                <div className="postflight-review-media-grid">
                  {media.map((item) => {
                    const isVideo =
                      item.contentType?.startsWith('video/') ||
                      item.type?.toUpperCase() === 'VIDEO'
                    const mediaLabel = item.type ?? item.contentType ?? t.reviewMedia
                    const previewUrl = item.previewUrl ?? null
                    const mediaPreview = isVideo ? previewUrl ? (
                      <VideoThumbnail src={previewUrl} poster={item.thumbnailUrl} fileName={mediaLabel} />
                    ) : (
                      <span className="postflight-review-file-placeholder">{t.reviewPreviewPending}</span>
                    ) : item.contentType?.startsWith('image/') || item.type?.toUpperCase() === 'IMAGE' ? (
                      item.thumbnailUrl || previewUrl ? (
                        <ImagePreview src={item.thumbnailUrl ?? previewUrl!} previewSrc={previewUrl ?? undefined} fileName={`${missionLabel} ${mediaLabel}`} />
                      ) : (
                        <span className="postflight-review-file-placeholder">{t.reviewPreviewPending}</span>
                      )
                    ) : (
                      <span className="postflight-review-file-placeholder">{mediaLabel}</span>
                    )
                    return (
                      <article className="postflight-review-media-card" key={item.id}>
                        {mediaPreview}
                        <div className="postflight-review-media-caption">
                          <strong>{mediaLabel}</strong>
                          <span>{t.reviewMediaStatus}: {item.status ?? t.reviewPending}</span>
                          {item.capturedAt && <time>{formatDate(item.capturedAt, lang)}</time>}
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </ReviewSection>
          </div>
        </div>

        <section className="postflight-review-actions" aria-label={t.reviewTitle}>
          {(!isSubmitted || failureConfirmed || awaitingFailureAcceptance) && (
            <div className="postflight-review-action-copy" aria-live="polite">
              {failureConfirmed ? (
                <>
                  <strong>{t.reviewMissionFailed}</strong>
                  <span>{t.reviewFailureConfirmed}</span>
                </>
              ) : awaitingFailureAcceptance ? (
                <>
                  <strong>{t.reviewMissionFailed}</strong>
                  <span>
                    {canConfirmFailure
                      ? t.reviewFailureWaitingConfirmation
                      : t.reviewFailureWaitingPermission}
                  </span>
                </>
              ) : !isMissionCompleted ? (
                <>
                  <strong>{t.reviewMissionComplete}</strong>
                  {!completionReady && (
                    <span>
                      {canComplete
                        ? !checklistAssessmentsComplete
                          ? t.reviewWaitingAssessment
                          : !reviewDataReady || reviewError
                            ? t.reviewAllDataRequired
                            : resultState.readinessReason || t.reviewWaitingChecklist
                        : t.reviewWaitingPermission}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <strong>{t.reviewConfirmInspection}</strong>
                  {!sendReady && (
                    <span>
                      {resultState.submitReady
                        ? !checklistAssessmentsComplete
                          ? t.reviewWaitingAssessment
                          : t.reviewAllDataRequired
                        : resultState.readinessReason || t.reviewWaitingChecklist}
                    </span>
                  )}
                </>
              )}
            </div>
          )}
          {awaitingFailureAcceptance && canConfirmFailure && (
            <button
              type="button"
              className="postflight-review-primary"
              disabled={busyAction !== null || reviewLoading}
              onClick={handleConfirmMissionFailure}
            >
              {busyAction === 'fail'
                ? t.reviewFailureConfirming
                : t.reviewFailureConfirmButton}
            </button>
          )}
          {!isSubmitted && canComplete && (
            <button
              type="button"
              className="postflight-review-primary"
              disabled={!completionReady || busyAction !== null || reviewLoading}
              onClick={handleCompleteMission}
            >
              {busyAction === 'complete' ? t.reviewCompleting : t.reviewMissionComplete}
            </button>
          )}
          {!isSubmitted && isMissionCompleted && canSend && (
            <button
              type="button"
              className="postflight-review-primary"
              disabled={!sendReady || busyAction !== null || reviewLoading}
              onClick={handleConfirmInspection}
            >
              {busyAction === 'send' ? t.reviewSending : t.reviewConfirmInspection}
            </button>
          )}
          <a className="postflight-review-secondary" href={operatorHref({ screen: 'missions' })}>
            {t.backToMissionList}
          </a>
        </section>
      </div>
    </div>
  )
}

function ReviewSection({
  title,
  detail,
  className = '',
  children,
}: {
  title: string
  detail?: string
  className?: string
      children: ReactNode
}) {
  return (
    <section className={`postflight-review-section ${className}`.trim()}>
      <header>
        <h2>{title}</h2>
        {detail && <span>{detail}</span>}
      </header>
      <div className="postflight-review-section-body">{children}</div>
    </section>
  )
}

function ReviewEmpty({ children }: { children: string }) {
  return <p className="postflight-review-empty">{children}</p>
}

function ResultList({ children }: { children: ReactNode }) {
  return <div className="postflight-review-result-list">{children}</div>
}

function ResultLine({
  title,
  detail,
  label,
  tone,
}: {
  title: string
  detail?: string
  label: string
  tone: 'pass' | 'fail' | 'warning' | 'pending'
}) {
  return (
    <div className="postflight-review-result-line">
      <div>
        <strong>{title}</strong>
        {detail && <p>{detail}</p>}
      </div>
      <ResultBadge label={label} tone={tone} />
    </div>
  )
}

function ResultBadge({
  label,
  tone,
}: {
  label: string
  tone: 'pass' | 'fail' | 'warning' | 'pending'
}) {
  return <span className={`postflight-review-badge is-${tone}`}>{label}</span>
}

function WeatherMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="postflight-review-weather-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function ReviewTimestamp({ label, value }: { label: string; value: string }) {
  return (
    <div className="postflight-review-timestamp">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function resultStatusLabel(status: string | null | undefined, t: (typeof postflightPageMessages)['vi']) {
  if (status === 'PASS' || status === 'PASSED') return t.reviewPass
  if (status === 'FAIL' || status === 'FAILED') return t.reviewFail
  if (status === 'WARN') return t.reviewWarn
  return t.reviewPending
}

function resultTone(status: string | null | undefined) {
  if (status === 'PASS' || status === 'PASSED') return 'pass' as const
  if (status === 'FAIL' || status === 'FAILED') return 'fail' as const
  if (status === 'WARN') return 'warning' as const
  return 'pending' as const
}

function formatDate(value: string, lang: 'vi' | 'en') {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
