import { Button, Checkbox, Radio } from 'antd'
import { SafetyOutlined } from '@ant-design/icons'
import { useRef, useState } from 'react'

import { Card } from '../../../components/common/ui'

import { useI18n } from '../../../../../shared/i18n'
import { monitoringAuthorizationMessages } from './MonitoringAuthorizationSection.messages'

import {
  AUTHORIZATION_DOCUMENT_TYPES,
  MONITORING_RELATIONSHIPS,
  type AuthorizationDocumentType,
  type FormErrors,
  type FormState,
  type MonitoringAuthorizationDocument,
  type UpdateField,
} from '../../../lib/createOrder/types'

const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_DOCUMENTS = 10
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

function readDataUrl(file: File, readError: string) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error(readError))
    reader.readAsDataURL(file)
  })
}

function newDocument(): MonitoringAuthorizationDocument {
  return {
    id: crypto.randomUUID(),
    documentType: 'OWNER_CONSENT',
    documentName: '',
    notes: '',
    fileName: '',
    contentType: '',
    sizeBytes: 0,
    dataUrl: '',
  }
}

export function MonitoringAuthorizationSection({
  form,
  errors,
  update,
}: {
  form: FormState
  errors: FormErrors
  update: UpdateField
}) {
  const { t } = useI18n(monitoringAuthorizationMessages)
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({})
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})
  const documents = form.monitoringAuthorizationDocuments

  function patchDocument(
    id: string,
    patch: Partial<MonitoringAuthorizationDocument>,
  ) {
    update(
      'monitoringAuthorizationDocuments',
      documents.map((document) =>
        document.id === id ? { ...document, ...patch } : document,
      ),
    )
  }

  async function selectFile(id: string, file?: File) {
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadErrors((current) => ({
        ...current,
        [id]: t.unsupportedType,
      }))
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadErrors((current) => ({
        ...current,
        [id]: t.tooLarge,
      }))
      return
    }
    try {
      const dataUrl = await readDataUrl(file, t.readError)
      patchDocument(id, {
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        dataUrl,
        documentName:
          documents.find((item) => item.id === id)?.documentName || file.name,
      })
      setUploadErrors((current) => {
        const next = { ...current }
        delete next[id]
        return next
      })
    } catch (cause) {
      setUploadErrors((current) => ({
        ...current,
        [id]: cause instanceof Error ? cause.message : t.readError,
      }))
    }
  }

  return (
    <Card
      icon={<SafetyOutlined />}
      title={t.title}
      className="co-authz"
    >
      <p className="co-authz-intro">{t.intro}</p>

      <fieldset className="co-authz-fieldset">
        <legend>{t.relationship}</legend>
        <div className="co-authz-relationships">
          {MONITORING_RELATIONSHIPS.map((relationship) => (
            <Radio
              key={relationship}
              name="monitoring-relationship"
              checked={form.monitoringRelationship === relationship}
              onChange={() => update('monitoringRelationship', relationship)}
            >
              {t.relationships[relationship]}
            </Radio>
          ))}
        </div>
        {errors.monitoringRelationship ? (
          <div className="ui-field-error">{errors.monitoringRelationship}</div>
        ) : null}
        {form.monitoringRelationship === 'OTHER' ? (
          <label className="co-authz-other">
            <span>
              {t.otherRelationshipLabel} <b aria-hidden="true">*</b>
            </span>
            <input
              className="co-input"
              value={form.otherMonitoringRelationship}
              maxLength={200}
              placeholder={t.otherRelationshipPlaceholder}
              aria-invalid={Boolean(errors.otherMonitoringRelationship)}
              aria-describedby={
                errors.otherMonitoringRelationship
                  ? 'co-other-relationship-error'
                  : undefined
              }
              onChange={(event) =>
                update('otherMonitoringRelationship', event.target.value)
              }
            />
            {errors.otherMonitoringRelationship ? (
              <span id="co-other-relationship-error" className="ui-field-error">
                {errors.otherMonitoringRelationship}
              </span>
            ) : null}
          </label>
        ) : null}
      </fieldset>

      <div className="co-authz-docs-head">
        <div>
          <strong>{t.docsTitle}</strong>
          <span>{t.docsHint}</span>
        </div>
        <Button
          size="small"
          disabled={documents.length >= MAX_DOCUMENTS}
          onClick={() =>
            update('monitoringAuthorizationDocuments', [
              ...documents,
              newDocument(),
            ])
          }
        >
          {t.addDocument}
        </Button>
      </div>

      {documents.length > 0 ? (
        <div className="co-authz-documents">
          {documents.map((document, index) => (
            <div className="co-authz-document" key={document.id}>
              <div className="co-authz-document-title">
                <strong>{t.document(index + 1)}</strong>
                <button
                  type="button"
                  onClick={() =>
                    update(
                      'monitoringAuthorizationDocuments',
                      documents.filter((item) => item.id !== document.id),
                    )
                  }
                >
                  {t.remove}
                </button>
              </div>
              <div className="co-authz-document-grid">
                <label>
                  <span>{t.documentType}</span>
                  <select
                    className="co-input"
                    value={document.documentType}
                    onChange={(event) =>
                      patchDocument(document.id, {
                        documentType: event.target
                          .value as AuthorizationDocumentType,
                      })
                    }
                  >
                    {AUTHORIZATION_DOCUMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {t.documentTypes[type]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>{t.documentName}</span>
                  <input
                    className="co-input"
                    value={document.documentName}
                    maxLength={160}
                    onChange={(event) =>
                      patchDocument(document.id, {
                        documentName: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <label>
                <span>
                  {t.notes} <small>{t.optional}</small>
                </span>
                <input
                  className="co-input"
                  value={document.notes}
                  maxLength={500}
                  onChange={(event) =>
                    patchDocument(document.id, { notes: event.target.value })
                  }
                />
              </label>
              <input
                aria-label={t.fileAria(index + 1)}
                ref={(node) => {
                  fileInputs.current[document.id] = node
                }}
                hidden
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={(event) => {
                  void selectFile(document.id, event.target.files?.[0])
                  event.target.value = ''
                }}
              />
              <div className="co-authz-file">
                <span>{document.fileName || t.noFile}</span>
                <button
                  type="button"
                  onClick={() => fileInputs.current[document.id]?.click()}
                >
                  {document.fileName ? t.replace : t.chooseFile}
                </button>
              </div>
              {uploadErrors[document.id] ? (
                <div className="ui-field-error">
                  {uploadErrors[document.id]}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {errors.monitoringAuthorizationDocuments ? (
        <div className="ui-field-error">
          {errors.monitoringAuthorizationDocuments}
        </div>
      ) : null}

      <Checkbox
        className="co-authz-confirm"
        checked={form.monitoringAuthorizationConfirmed}
        onChange={(event) =>
          update('monitoringAuthorizationConfirmed', event.target.checked)
        }
      >
        {t.confirm}
      </Checkbox>
      {errors.monitoringAuthorizationConfirmed ? (
        <div className="ui-field-error">
          {errors.monitoringAuthorizationConfirmed}
        </div>
      ) : null}
      <p className="co-authz-note">{t.note}</p>
    </Card>
  )
}
