import { Alert, Button, Form, Input, Modal, Space } from 'antd'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useState } from 'react'
import { ApiError } from '../../../../shared/api/httpClient'
import { useI18n } from '../../../../shared/i18n'
import { financeApi } from '../../api'
import type { PricingChecklistItem } from '../../types'
import { guidanceMessages } from '../guidance.messages'
import { guidanceSections, normalizeGuidanceList } from '../guidanceHelpers'
import './ChecklistGuidanceEditor.css'

type Props = {
  orderId: string
  item: PricingChecklistItem
  checklistRevision: number
  invalidatesQuote: boolean
  onSaved: () => void
  onClose: () => void
}
export function ChecklistGuidanceEditor({
  orderId,
  item,
  checklistRevision,
  invalidatesQuote,
  onSaved,
  onClose,
}: Props) {
  const { t } = useI18n(guidanceMessages)
  // Capture once so background refreshes cannot replace draft text or concurrency tokens.
  const [baseline, setBaseline] = useState({ ...item, checklistRevision })
  const [description, setDescription] = useState(item.description ?? '')
  const [lists, setLists] = useState(
    () =>
      Object.fromEntries(
        guidanceSections.map((key) => [
          key,
          item[key]?.length ? [...item[key]!] : [''],
        ]),
      ) as Record<(typeof guidanceSections)[number], string[]>,
  )
  const [initial] = useState(() => JSON.stringify({ description, ...lists }))
  const [busy, setBusy] = useState(false)
  const [conflict, setConflict] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [reloaded, setReloaded] = useState(false)
  const [discard, setDiscard] = useState(false)
  const dirty = JSON.stringify({ description, ...lists }) !== initial
  const editable = baseline.canEditGuidance === true
  const completedSections = guidanceSections.filter(
    (key) => normalizeGuidanceList(lists[key]).length > 0,
  ).length
  function close() {
    if (!busy) {
      if (dirty) setDiscard(true)
      else onClose()
    }
  }
  function change(key: (typeof guidanceSections)[number], values: string[]) {
    setLists((current) => ({ ...current, [key]: values }))
    setFields((current) => ({ ...current, [key]: '' }))
  }
  async function reload() {
    setBusy(true)
    try {
      const review = await financeApi.getPricingReview(orderId)
      const latest = review.checklistItems.find((value) => value.id === item.id)
      if (!latest || latest.canEditGuidance !== true) {
        setError(t.unavailable)
        return
      }
      const revision = review.checklistRevision ?? latest.checklistRevision
      if (revision == null) {
        setError(t.unavailable)
        return
      }
      setBaseline({ ...latest, checklistRevision: revision })
      setConflict(false)
      setError(null)
      setReloaded(true)
    } catch {
      setError(t.failed)
    } finally {
      setBusy(false)
    }
  }
  async function save(confirm: boolean) {
    if (busy || conflict || !editable) return
    const normalized = Object.fromEntries(
      guidanceSections.map((key) => [key, normalizeGuidanceList(lists[key])]),
    ) as typeof lists
    const errors: Record<string, string> = {}
    if (description.trim().length > 4000)
      errors.description = t.descriptionLimit
    for (const key of guidanceSections) {
      if (
        normalized[key].length > 20 ||
        normalized[key].some((row) => row.length > 500)
      )
        errors[key] = t.limits
      else if (confirm && !normalized[key].length) errors[key] = t.required
    }
    setFields(errors)
    if (Object.keys(errors).length) return
    setBusy(true)
    setError(null)
    setReloaded(false)
    try {
      await financeApi.saveChecklistGuidance(orderId, item.id, {
        expectedChecklistRevision: baseline.checklistRevision,
        expectedGuidanceVersion: baseline.guidanceVersion ?? 0,
        description: description.trim() || null,
        executionSteps: normalized.executionSteps,
        inputRequirements: normalized.inputRequirements,
        expectedOutputs: normalized.expectedOutputs,
        confirm,
      })
      onSaved()
    } catch (cause) {
      if (cause instanceof ApiError) {
        const next: Record<string, string> = {}
        for (const [key, value] of Object.entries(cause.errors ?? {})) {
          const section = ['description', ...guidanceSections].find(
            (name) =>
              key === name ||
              key.startsWith(`${name}[`) ||
              key.startsWith(`${name}.`),
          )
          if (section && typeof value === 'string') next[section] = value
        }
        setFields(next)
      }
      if (
        cause instanceof ApiError &&
        cause.code === 'CHECKLIST_GUIDANCE_EDIT_BLOCKED'
      ) {
        setBaseline((current) => ({ ...current, canEditGuidance: false }))
        setError(t.blocked)
      } else if (
        cause instanceof ApiError &&
        cause.code === 'CHECKLIST_GUIDANCE_INCOMPLETE'
      ) {
        setError(t.pending)
      } else if (
        cause instanceof ApiError &&
        cause.code === 'CHECKLIST_GUIDANCE_INVALID'
      ) {
        setError(t.invalid)
      } else if (cause instanceof ApiError && cause.status === 409) {
        setConflict(true)
        setError(t.conflict)
      } else {
        setError(cause instanceof Error ? cause.message : t.failed)
        if (cause instanceof ApiError) {
          if (cause.status === 403 || cause.status === 423)
            setBaseline((current) => ({ ...current, canEditGuidance: false }))
        }
      }
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <Modal
        open
        className="checklist-guidance-modal"
        title={
          <div className="checklist-guidance-heading">
            <span>{t.title}</span>
            <p>{t.editorIntro}</p>
          </div>
        }
        width={800}
        onCancel={close}
        maskClosable={false}
        closable={busy ? false : { 'aria-label': t.close }}
        keyboard={!busy}
        footer={
          <div className="checklist-guidance-footer">
            <span>{t.footerHint}</span>
            <Space wrap>
              <Button onClick={close} disabled={busy}>
                {t.cancel}
              </Button>
              <Button
                onClick={() => void save(false)}
                disabled={busy || conflict || !editable}
              >
                {t.save}
              </Button>
              <Button
                type="primary"
                onClick={() => void save(true)}
                disabled={busy || conflict || !editable}
                loading={busy}
                icon={<CheckOutlined aria-hidden />}
              >
                {t.confirm}
              </Button>
            </Space>
          </div>
        }
      >
        <div className="checklist-guidance-editor">
          <div className="checklist-guidance-context">
            <div>
              <span className="checklist-guidance-eyebrow">
                {t.requirement}
              </span>
              <strong>{item.content}</strong>
              <p>
                {t.media(
                  item.requestedImageCount ?? 0,
                  item.requestedVideoCount ?? 0,
                )}
              </p>
            </div>
            <span
              className={`checklist-guidance-progress${completedSections === 3 ? ' is-complete' : ''}`}
            >
              {completedSections === 3 && <CheckOutlined aria-hidden />}
              {t.completion(completedSections)}
            </span>
          </div>
          {invalidatesQuote ? (
            <Alert type="warning" showIcon message={t.invalidates} />
          ) : null}
          {!editable ? <Alert type="warning" message={t.blocked} /> : null}
          {error ? (
            <div role="alert">
              <Alert type="error" message={error} />
            </div>
          ) : null}
          {conflict ? (
            <Button disabled={busy} onClick={() => void reload()}>
              {t.reload}
            </Button>
          ) : null}
          {reloaded ? <Alert type="info" message={t.reloaded} /> : null}
          <Form layout="vertical" component="div" disabled={busy || !editable}>
            <Form.Item
              className="checklist-guidance-description"
              label={t.description}
              validateStatus={fields.description ? 'error' : undefined}
              help={fields.description}
            >
              <Input.TextArea
                aria-label={t.description}
                value={description}
                maxLength={4000}
                autoSize={{ minRows: 2, maxRows: 4 }}
                placeholder={t.descriptionPlaceholder}
                onChange={(event) => {
                  setDescription(event.target.value)
                  setFields((current) => ({ ...current, description: '' }))
                }}
              />
            </Form.Item>
            <p className="checklist-guidance-limits">{t.limits}</p>
            {guidanceSections.map((key, sectionIndex) => (
              <section
                key={key}
                className={`checklist-guidance-section${fields[key] ? ' has-error' : ''}`}
                aria-labelledby={`guidance-section-${key}`}
              >
                <div className="checklist-guidance-section-heading">
                  <span className="checklist-guidance-section-index">
                    {String(sectionIndex + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 id={`guidance-section-${key}`}>
                      {t[key]} <span aria-hidden="true">*</span>
                    </h3>
                    <p>{t[`${key}Hint`]}</p>
                  </div>
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined aria-hidden />}
                    disabled={busy || !editable || lists[key].length >= 20}
                    onClick={() => change(key, [...lists[key], ''])}
                  >
                    {t.add}
                  </Button>
                </div>
                <Form.Item
                  validateStatus={fields[key] ? 'error' : undefined}
                  help={fields[key]}
                >
                  {lists[key].map((row, index) => (
                    <div key={index} className="checklist-guidance-editor-row">
                      <span
                        className="checklist-guidance-row-index"
                        aria-hidden="true"
                      >
                        {index + 1}
                      </span>
                      <Input.TextArea
                        aria-label={`${t[key]} ${index + 1}`}
                        aria-invalid={Boolean(fields[key])}
                        value={row}
                        maxLength={500}
                        autoSize={{ minRows: 2, maxRows: 5 }}
                        placeholder={t[`${key}Placeholder`]}
                        onChange={(event) =>
                          change(
                            key,
                            lists[key].map((value, i) =>
                              i === index ? event.target.value : value,
                            ),
                          )
                        }
                      />
                      <Space
                        size={0}
                        className="checklist-guidance-row-actions"
                      >
                        <Button
                          type="text"
                          icon={<ArrowUpOutlined aria-hidden />}
                          title={t.up}
                          aria-label={`${t.up} ${t[key]} ${index + 1}`}
                          disabled={busy || !editable || index === 0}
                          onClick={() => {
                            const rows = [...lists[key]]
                            ;[rows[index - 1], rows[index]] = [
                              rows[index],
                              rows[index - 1],
                            ]
                            change(key, rows)
                          }}
                        />
                        <Button
                          type="text"
                          icon={<ArrowDownOutlined aria-hidden />}
                          title={t.down}
                          aria-label={`${t.down} ${t[key]} ${index + 1}`}
                          disabled={
                            busy || !editable || index === lists[key].length - 1
                          }
                          onClick={() => {
                            const rows = [...lists[key]]
                            ;[rows[index + 1], rows[index]] = [
                              rows[index],
                              rows[index + 1],
                            ]
                            change(key, rows)
                          }}
                        />
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined aria-hidden />}
                          title={t.remove}
                          disabled={busy || !editable}
                          aria-label={`${t.remove} ${t[key]} ${index + 1}`}
                          onClick={() =>
                            change(
                              key,
                              lists[key].filter((_, i) => i !== index),
                            )
                          }
                        />
                      </Space>
                    </div>
                  ))}
                </Form.Item>
              </section>
            ))}
          </Form>
        </div>
      </Modal>
      <Modal
        open={discard}
        closable={{ 'aria-label': t.close }}
        title={t.discard}
        okText={t.discardAction}
        cancelText={t.keep}
        onOk={onClose}
        onCancel={() => setDiscard(false)}
      />
    </>
  )
}
