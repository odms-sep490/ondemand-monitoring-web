import {
  CheckOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  SafetyOutlined,
  TagOutlined,
} from '@ant-design/icons'
import { Alert, Button, Form, InputNumber, Tag } from 'antd'
import type { FormEvent, ReactNode } from 'react'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { orderExpirationSettingsMessages } from './OrderExpirationSettings.messages'

export const MAX_HOURS = 8760

type Field = {
  id: string
  icon: ReactNode
  label: string
  description: string
  value: string
  error: string | null
  onChange: (value: string) => void
}

function TimeoutField({ field, unit }: { field: Field; unit: string }) {
  return (
    <div className={`adm-timeout-field${field.error ? ' is-invalid' : ''}`}>
      <div className="adm-timeout-head">
        <span className="mgr-tile mgr-tile-sm mgr-tone-blue" aria-hidden="true">
          {field.icon}
        </span>
        <div>
          <label htmlFor={field.id} className="adm-timeout-label">
            {field.label}
          </label>
          <p className="adm-card-hint">{field.description}</p>
        </div>
      </div>
      <Form.Item
        validateStatus={field.error ? 'error' : undefined}
        help={
          field.error ? (
            <span id={`${field.id}-error`} role="alert">
              {field.error}
            </span>
          ) : undefined
        }
        className="adm-timeout-input"
      >
        <InputNumber<string>
          id={field.id}
          aria-label={field.label}
          aria-invalid={Boolean(field.error)}
          aria-describedby={field.error ? `${field.id}-error` : undefined}
          stringMode
          step="1"
          value={field.value}
          addonAfter={unit}
          onChange={(value) =>
            field.onChange(value === null ? '' : String(value))
          }
        />
      </Form.Item>
    </div>
  )
}

export function ExpirationForm({
  quotation,
  deposit,
  hasChanges,
  hasSaved,
  canSave,
  busy,
  message,
  error,
  onSubmit,
}: {
  quotation: Omit<Field, 'id' | 'icon' | 'label' | 'description'>
  deposit: Omit<Field, 'id' | 'icon' | 'label' | 'description'>
  hasChanges: boolean
  hasSaved: boolean
  canSave: boolean
  busy: boolean
  message: string | null
  error: string | null
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const { t } = useI18n(orderExpirationSettingsMessages)
  return (
    <CardComponent
      title={t.formTitle}
      icon={<ClockCircleOutlined aria-hidden="true" aria-label={undefined} />}
      extra={
        <Tag
          bordered={false}
          color="processing"
          icon={<TagOutlined aria-hidden="true" aria-label={undefined} />}
        >
          {t.independentBadge}
        </Tag>
      }
    >
      {message && (
        <Alert
          role="status"
          type="success"
          showIcon
          message={message}
          className="adm-alert"
        />
      )}
      {error && (
        <Alert
          role="alert"
          type="error"
          showIcon
          message={error}
          className="adm-alert"
        />
      )}
      <p className="adm-card-hint">{t.description}</p>
      <Form layout="vertical" onSubmitCapture={onSubmit} noValidate>
        <div className="adm-timeout-grid">
          <TimeoutField
            unit={t.hoursShort}
            field={{
              ...quotation,
              id: 'quotation-acceptance-timeout',
              icon: (
                <FileTextOutlined aria-hidden="true" aria-label={undefined} />
              ),
              label: t.quotation,
              description: t.quotationHint,
            }}
          />
          <TimeoutField
            unit={t.hoursShort}
            field={{
              ...deposit,
              id: 'deposit-payment-timeout',
              icon: (
                <SafetyOutlined aria-hidden="true" aria-label={undefined} />
              ),
              label: t.deposit,
              description: t.depositHint,
            }}
          />
        </div>
        <div className="adm-toolbar adm-timeout-footer">
          <p className="adm-card-hint">
            <SafetyOutlined aria-hidden="true" aria-label={undefined} />{' '}
            {t.snapshotNote}
          </p>
          <div className="adm-row">
            {hasSaved && (
              <Tag bordered={false} color={hasChanges ? 'warning' : 'default'}>
                {hasChanges ? t.unsavedChanges : t.noPendingChanges}
              </Tag>
            )}
            <Button
              type="primary"
              htmlType="submit"
              icon={<CheckOutlined aria-hidden="true" aria-label={undefined} />}
              disabled={!canSave}
              loading={busy}
            >
              {busy ? t.saving : t.save}
            </Button>
          </div>
        </div>
      </Form>
    </CardComponent>
  )
}
