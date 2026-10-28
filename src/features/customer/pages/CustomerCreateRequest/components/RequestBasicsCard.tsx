import { Card, FormField } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { FormErrors, FormState, UpdateField } from '../../../lib/createOrder/types'
import { requestBasicsMessages } from './RequestBasicsCard.messages'

type Props = { form: FormState; errors: FormErrors; update: UpdateField }

/** Title and description used by the create-request flow. */
export function RequestBasicsCard({ form, errors, update }: Props) {
  const { t } = useI18n(requestBasicsMessages)
  return (
    <Card title={t.cardTitle}>
      <FormField id="co-title" label={t.titleLabel} required error={errors.title}>
        <input
          id="co-title"
          className="co-input"
          value={form.title}
          maxLength={255}
          placeholder={t.titlePlaceholder}
          onChange={(e) => update('title', e.target.value)}
        />
      </FormField>
      <FormField id="co-desc" label={t.descriptionLabel}>
        <textarea
          id="co-desc"
          className="co-input"
          rows={5}
          value={form.description}
          placeholder={t.descriptionPlaceholder}
          onChange={(e) => update('description', e.target.value)}
        />
      </FormField>
    </Card>
  )
}
