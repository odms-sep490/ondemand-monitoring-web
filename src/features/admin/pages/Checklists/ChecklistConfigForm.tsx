import { Alert, Button, Checkbox, Form, Tabs } from 'antd'
import type { ReactNode } from 'react'

import { useI18n } from '../../../../shared/i18n'
import { AdminPriceBreakdown } from '../../components/common/AdminPriceBreakdown'
import type { ChecklistDefinition } from '../../api/checklistsApi'
import { adminHref } from '../../routes'
import { ChecklistAdvancedFields } from './ChecklistAdvancedFields'
import { ChecklistContentFields } from './ChecklistContentFields'
import { ChecklistPriceGrid } from './ChecklistPriceGrid'
import type { ChecklistPage, ConfigServiceContext } from './checklistForm'
import { checklistMessages } from './checklists.messages'
import { useChecklistForm } from './useChecklistForm'

export type { ConfigServiceContext }

/**
 * The single form for a checklist. Everything that can be configured is on this one screen:
 * what the work is, what it costs (the checklist's own value and, when opened from a service, this service's own),
 * and whether the customer may drop it. A column per scope keeps "for everyone" and "for this service" side by side.
 */
export function ChecklistConfigForm({
  row,
  service,
  close,
  saved,
  extra,
}: {
  /** The library checklist; omitted when creating a new one. */
  row?: ChecklistDefinition
  /** Present when opened from a service template. */
  service?: ConfigServiceContext
  close: () => void
  saved: () => void
  /** Rendered above the fields, e.g. the "private copy" offer when the checklist is shared. */
  extra?: ReactNode
}) {
  const { t } = useI18n(checklistMessages)
  const form = useChecklistForm({ row, service, saved })
  const { shared, sharedBy, busy } = form

  return (
    <Form
      id="checklist-config"
      layout="vertical"
      className="checklist-dialog"
      noValidate
      onSubmitCapture={(event) => void form.submit(event)}
    >
      {!shared && extra}
      {shared && (
        <Alert
          type="warning"
          showIcon
          role="note"
          message={t.sharedWarning(sharedBy)}
          description={
            <>
              {extra}
              {form.sharedDirty && (
                <Checkbox
                  checked={form.acknowledged}
                  onChange={(event) =>
                    form.setAcknowledged(event.target.checked)
                  }
                >
                  {t.sharedAck(sharedBy)}
                </Checkbox>
              )}
            </>
          }
        />
      )}

      <Tabs
        activeKey={form.page}
        onChange={(key) => form.setPage(key as ChecklistPage)}
        aria-label={t.configTitle}
        items={[
          {
            key: 'content',
            label: t.sectionContent,
            forceRender: true,
            children: (
              <ChecklistContentFields
                content={form.content}
                onChange={form.setContent}
                invalid={form.error !== null}
              />
            ),
          },
          {
            key: 'pricing',
            label: t.sectionPricing,
            forceRender: true,
            children: (
              <>
                <fieldset className="checklist-section">
                  <legend>{t.sectionPricing}</legend>
                  <p className="checklist-field-meta is-block">
                    {service ? t.pricingScopeHint : t.pricingHint}{' '}
                    <a href={adminHref({ screen: 'operatingConfig' })}>
                      {t.openPricingPolicy}
                    </a>
                  </p>
                  <ChecklistPriceGrid
                    pricing={form.pricing}
                    pricingErrors={form.pricingErrors}
                    onPricing={form.setPricing}
                    overrides={form.overrides}
                    onOverrides={form.setOverrides}
                    service={service !== undefined}
                    sharedBy={sharedBy}
                  />
                </fieldset>
                <ChecklistAdvancedFields
                  content={form.content}
                  onContent={form.setContent}
                  pricing={form.pricing}
                  pricingErrors={form.pricingErrors}
                  onPricing={form.setPricing}
                />
              </>
            ),
          },
        ]}
      />

      {form.preview && <AdminPriceBreakdown preview={form.preview} />}
      {form.error && (
        <Alert type="error" showIcon role="alert" message={form.error} />
      )}
      <div className="checklist-form-actions">
        <Button htmlType="button" type="text" disabled={busy} onClick={close}>
          {t.cancel}
        </Button>
        {service && (
          <Button
            htmlType="button"
            disabled={busy}
            onClick={() => void form.check()}
          >
            {t.whatIf}
          </Button>
        )}
        <Button
          htmlType="submit"
          type="primary"
          disabled={busy || form.needsAck}
        >
          {busy ? t.saving : t.save}
        </Button>
      </div>
    </Form>
  )
}
