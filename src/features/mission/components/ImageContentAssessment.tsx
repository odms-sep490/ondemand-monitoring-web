import { useEffect, useId, useRef, useState } from 'react'
import { Alert, Button, Tag } from 'antd'
import { PictureOutlined, RobotOutlined } from '@ant-design/icons'
import { ApiError } from '../../../shared/api/httpClient'
import type { Language } from '../../../shared/i18n'
import { checklistEvidenceApi } from '../api/checklistEvidenceApi'
import { EvidenceThumbnail } from './EvidenceThumbnail'
import type {
  ContentAssessment,
  DeliverySuggestion,
  MissionChecklistEvidence,
} from '../types/checklistExecution'

const messages = {
  en: {
    title: 'AI checklist image assessment',
    hint: 'Choose an image to compare with the checklist criteria.',
    assessmentDisabled:
      'AI image assessment has been turned off. You can still select evidence manually.',
    image: 'Image to assess',
    choose: 'Choose an image',
    preview: (fileName: string) => 'Selected image preview for ' + fileName,
    assess: 'Assess image content',
    advisory:
      'The selected image preview is sent to the configured AI provider. The result is advisory. Review the image and make your own assessment.',
    error:
      'Could not assess this image. You can still select evidence manually.',
    providerUnavailable:
      'AI image assessment is temporarily unavailable. Try again later or select evidence manually.',
    rateLimited: 'Too many assessment requests. Try again later.',
    stale:
      'The assessment no longer matches this suggestion. Get new image suggestions before trying again.',
    previewNotReady:
      'The preview for this image is not ready. Try again later or choose another image.',
    verdict: 'Content assessment',
    noDetails: 'No criterion details provided.',
    noObservation: 'No observation provided.',
    verdicts: { MATCH: 'Match', MISMATCH: 'Mismatch', UNCERTAIN: 'Uncertain' },
  },
  vi: {
    title: 'AI đánh giá ảnh theo checklist',
    hint: 'Chọn ảnh để đối chiếu với các tiêu chí của checklist.',
    assessmentDisabled:
      'AI đánh giá ảnh đã được tắt. Bạn vẫn có thể tự chọn bằng chứng.',
    image: 'Ảnh cần đánh giá',
    choose: 'Chọn một ảnh',
    preview: (fileName: string) => 'Bản xem trước của ảnh đã chọn ' + fileName,
    assess: 'Đánh giá nội dung ảnh',
    advisory:
      'Bản xem trước của ảnh đã chọn sẽ được gửi đến nhà cung cấp AI đã cấu hình. Kết quả chỉ để tham khảo. Hãy xem ảnh và tự đưa ra đánh giá.',
    error: 'Không thể đánh giá ảnh này. Bạn vẫn có thể tự chọn bằng chứng.',
    providerUnavailable:
      'AI đánh giá ảnh hiện không khả dụng. Hãy thử lại sau hoặc tự chọn bằng chứng.',
    rateLimited: 'Có quá nhiều yêu cầu đánh giá. Hãy thử lại sau.',
    stale:
      'Đánh giá không còn khớp với gợi ý hiện tại. Hãy lấy gợi ý ảnh mới trước khi thử lại.',
    previewNotReady:
      'Bản xem trước của ảnh này chưa sẵn sàng. Hãy thử lại sau hoặc chọn ảnh khác.',
    verdict: 'Kết quả đánh giá nội dung',
    noDetails: 'Không có thông tin chi tiết về tiêu chí.',
    noObservation: 'Không có nhận xét.',
    verdicts: {
      MATCH: 'Phù hợp',
      MISMATCH: 'Không phù hợp',
      UNCERTAIN: 'Chưa xác định',
    },
  },
}

export function ImageContentAssessment({
  missionId,
  executionId,
  context,
  suggestion,
  links,
  lang,
  disabled,
}: {
  missionId: string
  executionId: string
  context: string
  suggestion?: DeliverySuggestion
  links: MissionChecklistEvidence[]
  lang: Language
  disabled: boolean
}) {
  // Keep the in-flight guard when the form resets for a new suggestion or language.
  const inFlight = useRef<AbortController | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => () => inFlight.current?.abort(), [])

  if (suggestion?.contentAssessmentAvailable !== true) return null
  const candidateIds = new Set(
    suggestion.candidates.map(({ evidenceId }) => evidenceId),
  )
  const images = links.filter(
    (link) => link.mediaType === 'IMAGE' && candidateIds.has(link.evidenceId),
  )
  if (images.length === 0) return null
  const expectedVersion = suggestion.executionVersion

  function assess(evidenceId: string) {
    if (inFlight.current || disabled || !candidateIds.has(evidenceId)) return
    const controller = new AbortController()
    inFlight.current = controller
    setBusy(true)
    return checklistEvidenceApi
      .assessImageContent(
        missionId,
        executionId,
        evidenceId,
        {
          expectedVersion,
          language: lang,
        },
        controller.signal,
      )
      .finally(() => {
        inFlight.current = null
        if (!controller.signal.aborted) setBusy(false)
      })
  }

  return (
    <AssessmentForm
      key={context}
      images={images}
      expectedVersion={expectedVersion}
      assess={assess}
      lang={lang}
      busy={busy}
      disabled={disabled}
    />
  )
}

function AssessmentForm({
  images,
  expectedVersion,
  assess,
  lang,
  busy,
  disabled,
}: {
  images: MissionChecklistEvidence[]
  expectedVersion: number
  assess: (id: string) => Promise<ContentAssessment> | undefined
  lang: Language
  busy: boolean
  disabled: boolean
}) {
  const id = useId()
  const t = messages[lang]
  const [imageId, setImageId] = useState('')
  const [result, setResult] = useState<ContentAssessment | null>(null)
  const [error, setError] = useState<
    | 'error'
    | 'stale'
    | 'previewNotReady'
    | 'rateLimited'
    | 'providerUnavailable'
    | 'assessmentDisabled'
    | null
  >(null)
  const selectedImage = images.find(({ evidenceId }) => evidenceId === imageId)
  const locked = busy || disabled || error === 'stale'

  async function requestAssessment() {
    if (locked || !imageId) return
    const response = assess(imageId)
    if (!response) return
    setError(null)
    setResult(null)
    try {
      const data = await response
      if (!hasAssessmentDetails(data)) {
        setError('error')
      } else if (
        data.executionVersion !== expectedVersion ||
        data.evidenceId !== imageId
      ) {
        setError('stale')
      } else {
        setResult(data)
      }
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : undefined
      if (code === 'CONCURRENT_UPDATE') setError('stale')
      else if (code === 'CHECKLIST_IMAGE_ASSESSMENT_DISABLED')
        setError('assessmentDisabled')
      else if (code === 'MEDIA_DERIVATIVE_UNAVAILABLE')
        setError('previewNotReady')
      else if (code === 'AI_PROVIDER_UNAVAILABLE')
        setError('providerUnavailable')
      else if (cause instanceof ApiError && cause.status === 429)
        setError('rateLimited')
      else setError('error')
    }
  }

  return (
    <div className="image-content-assessment">
      <div className="image-content-assessment__header">
        <span className="image-content-assessment__icon" aria-hidden="true">
          <RobotOutlined />
        </span>
        <div>
          <h4>{t.title}</h4>
          <p>{t.hint}</p>
        </div>
      </div>
      <div className="image-content-assessment__controls">
        <div
          className="image-content-assessment__thumbnail"
          aria-hidden={selectedImage ? undefined : true}
        >
          {selectedImage ? (
            <EvidenceThumbnail
              key={imageId}
              link={selectedImage}
              alt={t.preview(selectedImage.fileName)}
            />
          ) : (
            <PictureOutlined />
          )}
        </div>
        <label className="image-content-assessment__choice">
          {t.image}
          <select
            value={imageId}
            disabled={locked}
            onChange={(event) => {
              setImageId(event.target.value)
              setResult(null)
              setError(null)
            }}
          >
            <option value="">{t.choose}</option>
            {images.map(({ evidenceId, fileName }) => (
              <option key={evidenceId} value={evidenceId}>
                {fileName}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="primary"
          icon={<RobotOutlined />}
          disabled={locked || !imageId}
          loading={busy}
          aria-label={t.assess}
          aria-busy={busy}
          aria-describedby={id}
          onClick={() => void requestAssessment()}
        >
          {t.assess}
        </Button>
      </div>
      <p id={id} className="image-content-assessment__advisory">
        {t.advisory}
      </p>
      {error && <Alert type="warning" showIcon message={t[error]} />}
      <div aria-live="polite" className="image-content-assessment__feedback">
        {result && (
          <div className="image-content-assessment__result">
            <div className="image-content-assessment__verdict">
              <strong>{t.verdict}</strong>
              <Tag
                color={
                  result.verdict === 'MATCH'
                    ? 'success'
                    : result.verdict === 'MISMATCH'
                      ? 'error'
                      : 'warning'
                }
              >
                {t.verdicts[result.verdict]}
              </Tag>
            </div>
            {result.criteria.length ? (
              <ul>
                {result.criteria.map(
                  ({ code, label, verdict, observation }) => (
                    <li key={code}>
                      <strong>
                        {label.trim() || code} · {t.verdicts[verdict]}
                      </strong>
                      <div>{observation.trim() || t.noObservation}</div>
                    </li>
                  ),
                )}
              </ul>
            ) : (
              <div>{t.noDetails}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function hasAssessmentDetails(
  data: ContentAssessment | null | undefined,
): data is ContentAssessment {
  return Boolean(
    data &&
    typeof data.executionVersion === 'number' &&
    typeof data.evidenceId === 'string' &&
    Object.hasOwn(messages.en.verdicts, data.verdict) &&
    Array.isArray(data.criteria) &&
    data.criteria.every(
      (criterion) =>
        criterion &&
        typeof criterion.code === 'string' &&
        typeof criterion.label === 'string' &&
        typeof criterion.observation === 'string' &&
        Object.hasOwn(messages.en.verdicts, criterion.verdict),
    ),
  )
}
