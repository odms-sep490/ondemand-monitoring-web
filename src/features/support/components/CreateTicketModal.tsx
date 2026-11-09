import { Alert, Button, Input, Select } from 'antd'
import { useState, type FormEvent } from 'react'

import { FormField } from '../../../shared/components/ui'
import { Modal } from '../../customer/components/common/ui'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { authSession } from '../../auth/api/authApi'
import { customerApi } from '../../customer/api/customerApi'
import { getOrderStatusMeta } from '../../customer/lib/orderStatus'
import {
  supportApi,
  type CreateSupportTicketRequest,
  type SupportTicketDto,
} from '../api/supportApi'
import { ticketLabelsMessages } from '../lib/ticketLabels.messages'
import '../support.css'
import './CreateTicketModal.css'
import { createTicketModalMessages } from './CreateTicketModal.messages'
import { TicketStatusBadge } from './TicketStatusBadge'

type Priority = 'NORMAL' | 'HIGH' | 'URGENT'

type CreateTicketModalProps = {
  initialOrderId?: string
  initialMissionId?: string
  initialCategory?: string
  initialSubject?: string
  onClose: () => void
  onSuccess: (ticket: SupportTicketDto) => void
}

const FORM_ID = 'create-ticket-form'
const CATEGORIES = [
  'ORDERS',
  'MISSIONS',
  'RESULTS',
  'MEDIA',
  'SCHEDULING',
  'ACCOUNT',
] as const
const PRIORITIES: Priority[] = ['NORMAL', 'HIGH', 'URGENT']

const isLongId = (id: string) => id.includes('-') && id.length > 20

export function CreateTicketModal({
  initialOrderId,
  initialMissionId,
  initialCategory = 'ORDERS',
  initialSubject = '',
  onClose,
  onSuccess,
}: CreateTicketModalProps) {
  const { t, lang } = useI18n(createTicketModalMessages)
  const { t: labels } = useI18n(ticketLabelsMessages)
  const [category, setCategory] = useState(initialCategory)
  const [orderId, setOrderId] = useState(initialOrderId || '')
  const [missionId, setMissionId] = useState(initialMissionId || '')
  const [subject, setSubject] = useState(initialSubject)
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('NORMAL')
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<
    { kind: 'subject' } | { kind: 'api'; message: string } | null
  >(null)
  const [createdTicket, setCreatedTicket] = useState<SupportTicketDto | null>(
    null,
  )

  const ordersQuery = useApiQuery(
    (signal) => customerApi.listOrders({ signal }),
    [],
  )
  const userOrders = ordersQuery.data?.items || []

  const orderLabel = (id: string) => (isLongId(id) ? t.selectedOrder : `#${id}`)
  const missionLabel = (id: string) =>
    isLongId(id) ? t.selectedMission : `#${id}`

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!subject.trim()) {
      setError({ kind: 'subject' })
      return
    }

    setSubmitting(true)
    setError(null)
    const currentUser = authSession.getUser()

    try {
      const payload: CreateSupportTicketRequest = {
        customerId: currentUser?.id,
        customerName: currentUser?.fullName || currentUser?.email || 'Customer',
        orderId: orderId.trim() || undefined,
        missionId: missionId.trim() || undefined,
        category,
        subject,
        description,
        priority,
        attachmentUrl: attachmentUrl.trim() || undefined,
      }
      const ticket = await supportApi.createTicket(payload)
      setCreatedTicket(ticket)
      onSuccess(ticket)
    } catch (err) {
      setError({
        kind: 'api',
        message: err instanceof Error && err.message ? err.message : '',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (createdTicket) {
    return (
      <Modal
        title={t.successTitle}
        icon="check"
        tone="success"
        width={520}
        onClose={onClose}
        footer={
          <>
            <Button onClick={onClose}>{t.close}</Button>
            <Button
              href={`#help/tickets/${createdTicket.id}`}
              type="primary"
              onClick={onClose}
            >
              {t.viewTicket}
            </Button>
          </>
        }
      >
        <div className="ct-success">
          <dl>
            <dt>{t.ticketCode}</dt>
            <dd className="sp-mono">{createdTicket.ticketCode}</dd>
            <dt>{t.status}</dt>
            <dd>
              <TicketStatusBadge status={createdTicket.status} />
            </dd>
          </dl>
          <Alert type="success" showIcon message={t.successNote} />
        </div>
      </Modal>
    )
  }

  const errorText =
    error?.kind === 'subject'
      ? t.subjectRequired
      : error
        ? error.message || t.createFailed
        : null

  return (
    <Modal
      title={t.title}
      subtitle={t.subtitle}
      icon="ticket"
      width={560}
      onClose={() => !submitting && onClose()}
      footer={
        <>
          <Button onClick={onClose} disabled={submitting}>
            {t.cancel}
          </Button>
          <Button
            htmlType="submit"
            form={FORM_ID}
            type="primary"
            disabled={submitting}
          >
            {submitting ? t.submitting : t.submit}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} className="ct-form" onSubmit={handleSubmit} noValidate>
        {(initialOrderId || initialMissionId) && (
          <div className="ct-context">
            {initialOrderId && (
              <div>
                {t.relatedOrder}: <strong>{orderLabel(initialOrderId)}</strong>
              </div>
            )}
            {initialMissionId && (
              <div>
                {t.relatedMission}:{' '}
                <strong>{missionLabel(initialMissionId)}</strong>
              </div>
            )}
          </div>
        )}

        <FormField id="ct-category" label={t.category} required>
          <Select
            id="ct-category"
            className="ct-select"
            value={category}
            onChange={setCategory}
            options={CATEGORIES.map((key) => ({
              value: key,
              label: labels.category[key],
            }))}
          />
        </FormField>

        <div className="ct-row">
          <FormField id="ct-order" label={t.orderField}>
            {userOrders.length > 0 ? (
              <Select
                id="ct-order"
                className="ct-select"
                value={orderId}
                onChange={setOrderId}
                options={[
                  { value: '', label: t.orderNone },
                  ...(initialOrderId &&
                  !userOrders.some(
                    (o) =>
                      o.id === initialOrderId || o.orderCode === initialOrderId,
                  )
                    ? [
                        {
                          value: initialOrderId,
                          label: t.orderCurrent(orderLabel(initialOrderId)),
                        },
                      ]
                    : []),
                  ...userOrders.map((ord) => ({
                    value: ord.id,
                    label: `#${ord.orderCode || (isLongId(ord.id) ? `ORD-${ord.id.slice(0, 6).toUpperCase()}` : ord.id)} - ${ord.title} (${getOrderStatusMeta(ord.status, lang).label})`,
                  })),
                ]}
              />
            ) : (
              <Input
                id="ct-order"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder={t.orderPlaceholder}
              />
            )}
          </FormField>
          <FormField id="ct-mission" label={t.missionField}>
            <Input
              id="ct-mission"
              value={missionId}
              onChange={(e) => setMissionId(e.target.value)}
              placeholder={t.missionPlaceholder}
            />
          </FormField>
        </div>

        <FormField id="ct-subject" label={t.subject} required>
          <Input
            id="ct-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t.subjectPlaceholder}
          />
        </FormField>

        <FormField id="ct-description" label={t.description}>
          <Input.TextArea
            id="ct-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.descriptionPlaceholder}
          />
        </FormField>

        <div className="ct-row">
          <FormField id="ct-priority" label={t.priority}>
            <Select
              id="ct-priority"
              className="ct-select"
              value={priority}
              onChange={(v) => setPriority(v as Priority)}
              options={PRIORITIES.map((key) => ({
                value: key,
                label: labels.priority[key],
              }))}
            />
          </FormField>
          <FormField id="ct-attachment" label={t.attachment}>
            <Input
              id="ct-attachment"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              placeholder={t.attachmentPlaceholder}
            />
          </FormField>
        </div>

        {errorText && <Alert type="error" showIcon message={errorText} />}
      </form>
    </Modal>
  )
}
