import { useEffect, useState } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { ApiError } from '../../../../../shared/api/httpClient'
import { LoadingState } from '../../../../../shared/components/odm/StateView'
import { adminApi } from '../../../api/adminApi'
import { PricingDraftEditor } from './PricingDraftEditor'
import { PricingPolicyOverview } from './PricingPolicyOverview'
import {
  migrateLegacyCustomerAdded,
  validateMediaRules,
} from '../../../lib/mediaPricingRules'
import type {
  PricingPolicy,
  PricingPolicyPayload,
  PricingRule,
} from '../../../types/pricing'

export function PricingPolicyTab() {
  const query = useApiQuery(
    (signal) => adminApi.listPricingPolicies(signal),
    [],
  )
  const [draft, setDraft] = useState<PricingPolicy | null>(null)
  // What the server holds for the draft; edits are compared with it to know whether anything is unsaved.
  const [saved, setSaved] = useState<PricingPolicy | null>(null)
  const [editing, setEditing] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const found = query.data?.find((p) => p.status === 'DRAFT')
    const next = found
      ? { ...found, rules: migrateLegacyCustomerAdded(found.rules) }
      : null
    setDraft(next)
    setSaved(next)
    setEditing(true)
  }, [query.data])
  const active = query.data?.find((p) => p.status === 'ACTIVE')

  const dirty =
    draft !== null &&
    saved !== null &&
    JSON.stringify(draft) !== JSON.stringify(saved)
  function cancel() {
    if (dirty && !window.confirm('Bỏ các thay đổi chưa lưu của bản nháp?'))
      return
    setDraft(saved)
    setEditing(false)
    setError(null)
    setMessage(null)
  }

  async function createDraft() {
    if (!active) return
    await run(async () => {
      await adminApi.clonePricingPolicy(active.id)
      query.reload()
    }, 'Đã nhân bản chính sách đang áp dụng thành bản nháp mới.')
  }
  const mediaValid = !draft || validateMediaRules(draft.rules).length === 0
  async function save() {
    if (!draft || !mediaValid) return
    await run(async () => {
      await adminApi.updatePricingPolicy(draft.id, payload(draft))
      query.reload()
    }, 'Đã lưu bản nháp.')
  }
  async function publish() {
    if (!draft || !mediaValid) return
    if (
      !window.confirm(
        `Bạn có chắc muốn áp dụng chính sách giá v${draft.version}? Chính sách đang áp dụng hiện tại sẽ được thay thế.`,
      )
    )
      return
    await run(async () => {
      await adminApi.publishPricingPolicy(draft.id)
      query.reload()
    }, 'Đã áp dụng chính sách giá.')
  }
  async function run(action: () => Promise<void>, success: string) {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await action()
      setMessage(success)
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'Không thể cập nhật chính sách giá. Vui lòng kiểm tra dữ liệu và thử lại.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="adm-card pricing-policy-admin">
      {query.loading && !query.data && <LoadingState />}
      {query.error !== undefined && !query.data && (
        <div role="alert">
          <p>Không thể tải chính sách giá. Vui lòng thử lại.</p>
          <button type="button" className="odm-btn" onClick={query.reload}>
            Thử lại
          </button>
        </div>
      )}
      {!query.loading && query.error === undefined && (!draft || !editing) && (
        <PricingPolicyOverview
          active={active}
          draft={draft}
          policies={query.data ?? []}
          busy={busy}
          onClone={() => void createDraft()}
          onEditDraft={() => setEditing(true)}
        />
      )}
      {!query.loading && query.error === undefined && draft && editing && (
        <PricingDraftEditor
          draft={draft}
          setDraft={setDraft}
          busy={busy}
          dirty={dirty}
          onSave={() => void save()}
          onPublish={() => void publish()}
          onCancel={cancel}
        />
      )}
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  )
}

function payload(policy: PricingPolicy): PricingPolicyPayload {
  return {
    name: policy.name,
    effectiveFrom: null,
    effectiveTo: null,
    managerMaxDiscountPercent: policy.managerMaxDiscountPercent,
    managerMaxMarkupPercent: policy.managerMaxMarkupPercent,
    highRiskDiscountPercent: policy.highRiskDiscountPercent,
    minimumPriceRatio: policy.minimumPriceRatio,
    minimumPrice: policy.minimumPrice,
    rules: policy.rules.map(
      (rule, priority) =>
        Object.fromEntries(
          Object.entries({ ...rule, priority }).filter(
            ([key]) => key !== 'id' && key !== 'checklistDefinitionName',
          ),
        ) as PricingRule,
    ),
  }
}
