import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Input, Modal, Space, Tag } from 'antd'
import { ApiError, apiRequest } from '../../../../../shared/api/httpClient'
import {
  customerApi,
  type ServiceDeliverableOption,
  type ServiceOption,
} from '../../../api/customerApi'
import { buildOrderPayload } from '../../../lib/createOrder/payload'
import {
  applyConfirmedAgentChanges,
  type OrderAgentSession,
} from '../../../lib/createOrder/orderAgent'
import type { ChecklistInput } from '../../../lib/checklist/types'
import type { FormState, Step } from '../../../lib/createOrder/types'
import './OrderConversation.css'
import { useI18n } from '../../../../../shared/i18n'
import { requestInfoPanelMessages } from './RequestInfoPanel.messages'
import { monitoringAuthorizationMessages } from './MonitoringAuthorizationSection.messages'
import { AgreementSection } from './AgreementSection'

const base = '/api/customer/order-conversations'
const fieldNames: Record<string, string> = {
  serviceId: 'Dịch vụ',
  description: 'Mô tả',
  flightPurpose: 'Mục đích chuyến bay',
  siteContactName: 'Người liên hệ',
  siteContactPhone: 'Điện thoại',
  accessNotes: 'Điều kiện ra vào',
  altitudeM: 'Độ cao dự kiến',
  monitoringRelationship: 'Quan hệ với khu vực',
  preferredDateFrom: 'Từ ngày',
  preferredDateTo: 'Đến ngày',
  preferredTimeId: 'Khung giờ',
  resultDeadline: 'Hạn nhận kết quả',
  checklistItems: 'Nội dung giám sát',
  termsAccepted: 'Điều khoản',
  monitoringAuthorizationConfirmed: 'Xác nhận quyền giám sát',
  deliverables: 'Sản phẩm bàn giao',
  coverageArea: 'Vùng giám sát',
  address: 'Vị trí',
  latitude: 'Vĩ độ',
  longitude: 'Kinh độ',
  dataRetentionDays: 'Thời hạn lưu trữ',
  permitStatus: 'Thông tin giấy phép',
  permitNumber: 'Số giấy phép',
  permitDocuments: 'Tệp giấy phép',
  permitExpiresOn: 'Hạn giấy phép',
  business: 'Điều kiện thực hiện',
  recurrenceType: 'Lặp lịch',
  recurrenceOccurrences: 'Số lần',
  weatherFallback: 'Khi không thể thực hiện',
}

type Props = {
  form: FormState
  setForm: (updater: (current: FormState) => FormState) => void
  services: ServiceOption[]
  deliverables: ServiceDeliverableOption[]
  serializeChecklist: () => ChecklistInput[]
  mediaTotals: { images: number; videos: number }
  onApply: (session: OrderAgentSession, expected: FormState) => void
  onOpenStep: (step: Step) => void
  preferredTimes?: Array<{ id: string; name: string }>
}

export function OrderConversation(p: Props) {
  const { t: purposeText } = useI18n(requestInfoPanelMessages)
  const { t: authorizationText } = useI18n(monitoringAuthorizationMessages)
  function displayValue(key: string, value: unknown) {
    if (key === 'flightPurpose')
      return (
        purposeText.flightPurposes[
          value as keyof typeof purposeText.flightPurposes
        ] ?? 'Mục đích chuyến bay'
      )
    if (key === 'monitoringRelationship')
      return (
        authorizationText.relationships[String(value)] ?? 'Quan hệ với khu vực'
      )
    if (key === 'preferredTimeId')
      return (
        p.preferredTimes?.find((time) => time.id === value)?.name ??
        'Khung giờ đã chọn'
      )
    const options: Record<string, string> = {
      NONE: 'Không lặp',
      WEEKLY: 'Hàng tuần',
      MONTHLY: 'Hàng tháng',
      AUTO_RESCHEDULE: 'Dời lịch',
      CONTACT_CUSTOMER: 'Liên hệ với tôi',
      CANCEL_ORDER: 'Yêu cầu hủy',
    }
    return options[String(value)] ?? String(value)
  }
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState<OrderAgentSession>()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errorKind, setErrorKind] = useState<'conversation' | 'speech'>(
    'conversation',
  )
  const [retry, setRetry] = useState<{
    requestId: string
    text: string
    revision: number
  }>()
  const [catalog, setCatalog] = useState<Record<string, string>>({})
  const [recording, setRecording] = useState(false)
  const recorder = useRef<MediaRecorder | null>(null)
  const recordingTimer = useRef<number | undefined>(undefined)
  const keepRecording = useRef(false)
  const abort = useRef<AbortController | null>(null)
  const operationActive = useRef(false)
  const dialogOpen = useRef(false)
  const microphonePending = useRef(false)
  const live = useRef(p)
  live.current = p
  useEffect(
    () => () => {
      dialogOpen.current = false
      abort.current?.abort()
      keepRecording.current = false
      window.clearTimeout(recordingTimer.current)
      recorder.current?.stream.getTracks().forEach((t) => t.stop())
    },
    [],
  )
  useEffect(() => {
    if (open)
      void customerApi
        .getChecklistCatalog()
        .then((items) =>
          setCatalog(Object.fromEntries(items.map((i) => [i.id, i.content]))),
        )
        .catch(() => undefined)
  }, [open])
  function close() {
    dialogOpen.current = false
    abort.current?.abort()
    keepRecording.current = false
    window.clearTimeout(recordingTimer.current)
    if (recorder.current?.state === 'recording') recorder.current.stop()
    setRecording(false)
    setBusy(false)
    setOpen(false)
  }
  async function request(path: string, body?: unknown) {
    const controller = new AbortController()
    abort.current = controller
    const timeout = window.setTimeout(() => controller.abort(), 100_000)
    try {
      return await apiRequest<OrderAgentSession>(path, {
        method: body === undefined ? 'GET' : 'POST',
        body,
        signal: controller.signal,
      })
    } finally {
      window.clearTimeout(timeout)
    }
  }
  async function perform(
    action: () => Promise<void>,
    kind: 'conversation' | 'speech' = 'conversation',
  ) {
    if (operationActive.current) return
    operationActive.current = true
    setBusy(true)
    setError('')
    setErrorKind(kind)
    try {
      await action()
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409 && session) {
        // Load current revision only; do not replace the customer's form or auto-replay a mutation.
        let synchronized = false
        try {
          setSession(await request(`${base}/${session.id}`))
          synchronized = true
        } catch {
          /* retain the previous view */
        }
        setRetry(undefined)
        setError(
          synchronized
            ? 'Phiên đã thay đổi ở cửa sổ khác. Đã tải hội thoại mới nhất; hãy kiểm tra trước khi tiếp tục.'
            : 'Phiên đã thay đổi nhưng chưa tải lại được. Hãy tải lại phiên trước khi tiếp tục; biểu mẫu của bạn được giữ nguyên.',
        )
      } else
        setError(
          cause instanceof Error
            ? cause.message
            : 'Chưa kết nối được trợ lý. Bạn vẫn có thể tiếp tục nhập thủ công.',
        )
    } finally {
      operationActive.current = false
      setBusy(false)
    }
  }
  async function start() {
    dialogOpen.current = true
    setOpen(true)
    await perform(async () => {
      const value = await request(
        p.form.orderAgentSessionId
          ? `${base}/${p.form.orderAgentSessionId}`
          : base,
        p.form.orderAgentSessionId ? undefined : {},
      )
      setSession(value)
      if (value.id !== p.form.orderAgentSessionId)
        p.setForm((current) => ({ ...current, orderAgentSessionId: value.id }))
    })
  }
  async function send(resend = false, choice?: string) {
    if (!session || (!resend && !(choice ?? text).trim())) return
    const message =
      resend && retry
        ? retry
        : {
            requestId: crypto.randomUUID(),
            revision: session.revision,
            text: (choice ?? text).trim(),
            customerContext: {
              locationConfirmed:
                p.form.locationStatus === 'confirmed' &&
                Boolean(p.form.locationConfirmedAt),
              ...(p.form.locationStatus === 'confirmed'
                ? { address: p.form.address }
                : {}),
              ...(p.form.preferredTimeId
                ? {
                    preferredDateFrom: p.form.preferredDateFrom,
                    preferredDateTo: p.form.preferredDateTo,
                    preferredTimeId: p.form.preferredTimeId,
                  }
                : {}),
              siteContactName: p.form.siteContactName,
              siteContactPhone: p.form.siteContactPhone,
              accessNotes: p.form.accessNotes,
              monitoringRelationship: p.form.monitoringRelationship,
              monitoringAuthorizationConfirmed:
                p.form.monitoringAuthorizationConfirmed,
              termsAccepted: p.form.termsAccepted,
            },
          }
    setRetry(message)
    await perform(async () => {
      const value = await request(`${base}/${session.id}/messages`, message)
      setSession(value)
      setRetry(undefined)
      setText('')
      if (
        value.state.requestedUiAction === 'REVIEW' &&
        !Object.keys(value.state.pendingChanges).length
      )
        await validateSession(value)
    })
  }
  async function confirm() {
    if (!session) return
    const source = JSON.stringify(p.form)
    await perform(async () => {
      const value = await request(`${base}/${session.id}/confirm`, {
        revision: session.revision,
      })
      setSession(value)
      if (JSON.stringify(live.current.form) !== source)
        throw new Error(
          'Biểu mẫu đã thay đổi trong lúc xác nhận. Nội dung mới của bạn được giữ nguyên; hãy kiểm tra lựa chọn trước khi tiếp tục.',
        )
      // Apply precisely the customer-approved proposal, not all historical fields again.
      live.current.setForm((current) =>
        applyConfirmedAgentChanges(current, session.state.pendingChanges),
      )
    })
  }
  async function validate() {
    if (!session) return
    await perform(() => validateSession(session))
  }
  async function validateSession(currentSession: OrderAgentSession) {
    const props = live.current
    const snapshot = props.form
    const draft: Record<string, unknown> = {
      ...buildOrderPayload({
        form: snapshot,
        score: { score: 0, level: 'good', notes: [] },
        mediaTotals: props.mediaTotals,
        deliverableOptions: props.deliverables,
      }),
      checklistItems: props.serializeChecklist(),
    }
    // An incomplete draft must reach shared validation as missing fields,
    // rather than invalid enum/date JSON or the manual map's drawing defaults.
    for (const field of [
      'flightPurpose',
      'preferredDateFrom',
      'preferredDateTo',
      'preferredTimeId',
      'resultDeadline',
      'monitoringRelationship',
    ]) {
      if (draft[field] === '') delete draft[field]
    }
    if (
      snapshot.locationStatus !== 'confirmed' ||
      !snapshot.locationConfirmedAt ||
      !snapshot.coverageArea
    ) {
      delete draft.coverageArea
      delete draft.latitude
      delete draft.longitude
    }
    const value = await request(`${base}/${currentSession.id}/validate`, {
      revision: currentSession.revision,
      draft,
    })
    setSession(value)
    if (value.state.readyForReview) {
      live.current.onApply(value, snapshot)
      setOpen(false)
    } else
      setError(
        'Bản nháp còn thiếu thông tin. Hãy bổ sung trên biểu mẫu rồi kiểm tra lại.',
      )
  }
  async function microphone() {
    if (recording) {
      recorder.current?.stop()
      setRecording(false)
      return
    }
    if (microphonePending.current) return
    microphonePending.current = true
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!dialogOpen.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      keepRecording.current = true
      const chunks: BlobPart[] = []
      const media = new MediaRecorder(stream)
      recorder.current = media
      media.ondataavailable = (e) => chunks.push(e.data)
      media.onstop = async () => {
        window.clearTimeout(recordingTimer.current)
        stream.getTracks().forEach((t) => t.stop())
        if (!keepRecording.current) return
        await perform(async () => {
          const data = new FormData()
          data.append(
            'audio',
            new Blob(chunks, { type: media.mimeType }),
            'recording.webm',
          )
          const controller = new AbortController()
          abort.current = controller
          const timeout = window.setTimeout(() => controller.abort(), 230_000)
          try {
            const result = await apiRequest<{ text: string }>(
              `${base}/transcribe`,
              { method: 'POST', body: data, signal: controller.signal },
            )
            if (typeof result.text !== 'string' || !result.text.trim())
              throw new Error(
                'Chưa nghe rõ nội dung. Hãy ghi âm lại hoặc nhập bằng bàn phím.',
              )
            if (dialogOpen.current) setText(result.text) // Customer explicitly sends the editable transcript.
          } finally {
            window.clearTimeout(timeout)
          }
        }, 'speech')
      }
      media.start()
      recordingTimer.current = window.setTimeout(() => {
        if (media.state === 'recording') {
          media.stop()
          setRecording(false)
        }
      }, 60_000)
      setRecording(true)
    } catch {
      setErrorKind('speech')
      setError('Không mở được micro. Bạn có thể nhập câu hỏi bằng bàn phím.')
    } finally {
      microphonePending.current = false
    }
  }
  function openStep(step: Step) {
    close()
    p.onOpenStep(step)
  }
  const changes = session?.state.pendingChanges ?? {}
  return (
    <>
      <Button onClick={() => void start()} style={{ marginBottom: 12 }}>
        Tư vấn tạo đơn bằng AI
      </Button>
      <Modal
        title="Tư vấn tạo đơn bằng AI"
        open={open}
        onCancel={close}
        footer={null}
        width={760}
        destroyOnHidden
      >
        <div className="order-agent">
          <p className="order-agent-hint">
            Trao đổi nhu cầu của bạn. Bạn xác nhận lựa chọn và tự gửi yêu cầu
            sau khi xem lại.
          </p>
          <details>
            <summary>Thông tin trên biểu mẫu</summary>
            <p>
              {p.services.find((service) => service.id === p.form.serviceId)
                ?.name ?? 'Chưa chọn dịch vụ'}{' '}
              · {p.mediaTotals.images} ảnh, {p.mediaTotals.videos} video
            </p>
            {p.form.locationStatus === 'confirmed' && (
              <p>Khu vực đã chọn: {p.form.address}</p>
            )}
            {p.form.preferredTimeId && (
              <p>
                Lịch: {p.form.preferredDateFrom} – {p.form.preferredDateTo} ·{' '}
                {displayValue('preferredTimeId', p.form.preferredTimeId)}
              </p>
            )}
          </details>
          <div
            className="order-agent-history"
            role="log"
            aria-label="Hội thoại tư vấn"
            aria-live="polite"
          >
            {!session?.state.messages.length && (
              <p>
                Bạn muốn drone hỗ trợ việc gì? Hãy mô tả mục tiêu và khu vực cần
                chú ý.
              </p>
            )}
            {session?.state.messages.map((m, i) => (
              <div
                key={m.requestId ?? i}
                className={`order-agent-message is-${m.role}`}
              >
                <strong>{m.role === 'user' ? 'Bạn' : 'Trợ lý'}</strong>
                <p>{m.content}</p>
              </div>
            ))}
            {busy && (
              <p role="status">
                {errorKind === 'speech'
                  ? 'Đang nhận giọng nói. Lần đầu có thể mất vài phút…'
                  : 'Đang xử lý yêu cầu…'}
              </p>
            )}
          </div>
          {error && (
            <Alert
              type="warning"
              message={error}
              action={
                errorKind === 'speech' ? (
                  <Button disabled={busy} onClick={() => void microphone()}>
                    Ghi âm lại
                  </Button>
                ) : retry ? (
                  <Button disabled={busy} onClick={() => void send(true)}>
                    Thử lại
                  </Button>
                ) : (
                  <Button disabled={busy} onClick={() => void start()}>
                    Tải lại phiên
                  </Button>
                )
              }
            />
          )}
          {session?.state.validation?.invalidFields &&
            Object.keys(session.state.validation.invalidFields).length > 0 && (
              <Alert
                type="info"
                message="Cần bổ sung"
                description={
                  <ul>
                    {Object.entries(session.state.validation.invalidFields).map(
                      ([key, value]) => (
                        <li key={key}>
                          Bước{' '}
                          {session.state.validation?.fieldSteps?.[key] ?? 6} ·{' '}
                          {fieldNames[key] ?? key}: {value}
                        </li>
                      ),
                    )}
                  </ul>
                }
              />
            )}
          {Object.keys(changes).length > 0 && (
            <section
              className="order-agent-proposal"
              aria-label="Đề xuất cần xác nhận"
            >
              <strong>Đề xuất — cần bạn xác nhận</strong>
              <dl>
                {Object.entries(changes).map(([key, value]) => (
                  <div key={key}>
                    <dt>{fieldNames[key] ?? key}</dt>
                    <dd>
                      {key === 'serviceId'
                        ? (p.services.find((s) => s.id === value)?.name ??
                          'Dịch vụ trong catalog')
                        : key === 'checklistItems'
                          ? (value as ChecklistInput[]).map((i) => (
                              <Tag key={i.sourceChecklistId}>
                                {catalog[i.sourceChecklistId ?? ''] ??
                                  'Nội dung giám sát'}{' '}
                                · {i.requestedImageCount ?? 0} ảnh,{' '}
                                {i.requestedVideoCount ?? 0} video
                              </Tag>
                            ))
                          : displayValue(key, value)}
                    </dd>
                  </div>
                ))}
              </dl>
              <Button
                disabled={busy}
                type="primary"
                onClick={() => void confirm()}
              >
                Xác nhận lựa chọn này
              </Button>
            </section>
          )}
          {!session?.state.confirmedFields.serviceId && (
            <Space wrap aria-label="Dịch vụ có thể chọn">
              {p.services.slice(0, 3).map((service) => (
                <Button
                  key={service.id}
                  disabled={busy || !session}
                  onClick={() =>
                    void send(false, `Tôi chọn dịch vụ ${service.name}`)
                  }
                >
                  {service.name}
                </Button>
              ))}
            </Space>
          )}
          <label htmlFor="order-agent-text">Nội dung trao đổi</label>
          <Input.TextArea
            id="order-agent-text"
            maxLength={2000}
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ví dụ: Tôi muốn theo dõi tiến độ thi công nhà xưởng, chú ý phần mái."
          />
          <details>
            <summary>Điều khoản trước khi xem lại đơn</summary>
            <AgreementSection
              form={p.form}
              errors={{}}
              update={(key, value) =>
                p.setForm((current) => ({ ...current, [key]: value }))
              }
            />
          </details>
          <Space wrap>
            <Button
              disabled={busy || !text.trim() || !session}
              type="primary"
              onClick={() => void send()}
            >
              Gửi
            </Button>
            <Button disabled={busy} onClick={() => void microphone()}>
              {recording ? 'Dừng ghi âm' : 'Nhập bằng giọng nói'}
            </Button>
          </Space>
          <Space wrap>
            <Button disabled={busy} onClick={() => openStep(2)}>
              Chọn khu vực trên bản đồ
            </Button>
            <Button disabled={busy} onClick={() => openStep(3)}>
              Chọn nội dung giám sát
            </Button>
            <Button disabled={busy} onClick={() => openStep(5)}>
              Xác nhận lịch
            </Button>
            <Button disabled={busy} onClick={() => openStep(4)}>
              Liên hệ & quyền giám sát
            </Button>
          </Space>
          <Space wrap>
            <Button
              disabled={busy || !session || Object.keys(changes).length > 0}
              onClick={() => void validate()}
            >
              Kiểm tra và xem lại đơn
            </Button>
            <Button onClick={close}>Tiếp tục nhập thủ công</Button>
            <Button
              disabled={busy}
              onClick={() =>
                void perform(async () => {
                  const value = await request(base, {})
                  setSession(value)
                  setRetry(undefined)
                  p.setForm((current) => ({
                    ...current,
                    orderAgentSessionId: value.id,
                  }))
                })
              }
            >
              Phiên mới
            </Button>
          </Space>
        </div>
      </Modal>
    </>
  )
}
