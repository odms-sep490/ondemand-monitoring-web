import { Card, FormField } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { FormErrors, FormState, PermitStatus, UpdateField } from '../../../lib/createOrder/types'
import { airspaceNoticeMessages } from './AirspaceNotice.messages'
import { PermitDocumentsField } from './PermitDocumentsField'

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
}

/** Optional customer-supplied permit information; Operations owns the permit workflow. */
export function AirspaceNotice({ form, errors, update }: Props) {
  const { t } = useI18n(airspaceNoticeMessages)
  const choose = (status: PermitStatus) => update('permitStatus', status)

  return (
    <Card title={t.title}>
      <div className="co-notice is-warning" role="alert">
        {t.message}
      </div>
      <FormField id="co-permit-status" label={t.question} error={errors.permitStatus}>
        <div className="co-stack" role="radiogroup" aria-label={t.question}>
          <label>
            <input
              type="radio"
              name="co-permit-status"
              checked={form.permitStatus === 'NONE'}
              onChange={() => choose('NONE')}
            />{' '}
            {t.noPermitRequired}
          </label>
          <label>
            <input
              type="radio"
              name="co-permit-status"
              checked={form.permitStatus === 'HAVE_PERMIT'}
              onChange={() => choose('HAVE_PERMIT')}
            />{' '}
            {t.havePermit}
          </label>
          <label>
            <input
              type="radio"
              name="co-permit-status"
              checked={form.permitStatus === 'NEED_SUPPORT'}
              onChange={() => choose('NEED_SUPPORT')}
            />{' '}
            {t.needSupport}
          </label>
        </div>
      </FormField>
      {form.permitStatus === 'HAVE_PERMIT' && (
        <>
          <FormField id="co-permit-number" label={t.permitNumberLabel} required error={errors.permitNumber}>
            <input
              id="co-permit-number"
              className="co-input"
              maxLength={80}
              value={form.permitNumber}
              placeholder={t.permitNumberPlaceholder}
              onChange={(e) => update('permitNumber', e.target.value)}
            />
          </FormField>
          <FormField id="co-permit-expires" label={t.permitExpiresLabel} required error={errors.permitExpiresOn}>
            <input
              id="co-permit-expires"
              className="co-input"
              type="date"
              value={form.permitExpiresOn}
              onChange={(e) => update('permitExpiresOn', e.target.value)}
            />
          </FormField>
          <PermitDocumentsField
            files={form.permitDocuments}
            error={errors.permitDocuments}
            onChange={(files) => update('permitDocuments', files)}
          />
        </>
      )}
      {form.permitStatus === 'NEED_SUPPORT' && <div className="co-help">{t.supportHint}</div>}
    </Card>
  )
}
