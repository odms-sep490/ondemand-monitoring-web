import { Alert, Button, Input } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'

import {
  CardComponent,
  EmptyState,
  ErrorState,
  TableComponent,
} from '../../../../../shared/components/antd'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { adminApi } from '../../../api/adminApi'
import { AdminLoading } from '../../../components/common/AdminLoading'
import type { OperatingPolicy } from '../../../types/operatingConfig'
import { policyTableMessages } from './PolicyTable.messages'

export function PolicyTable() {
  const { t, locale } = useI18n(policyTableMessages)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminApi.listPolicies(signal),
    [],
  )
  const [saving, setSaving] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  async function handleSave(policy: OperatingPolicy, value: string) {
    setSaving(policy.id)
    setSaveError(null)
    try {
      await adminApi.updatePolicy(policy.id, { value })
      reload()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t.genericError)
    } finally {
      setSaving(null)
    }
  }

  if (loading && !data) return <AdminLoading />
  if (!data) return <ErrorState error={error} onRetry={reload} />
  if (data.items.length === 0)
    return (
      <CardComponent>
        <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
      </CardComponent>
    )

  const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString(locale) : '')
  const columns: ColumnsType<OperatingPolicy> = [
    {
      title: t.columnKey,
      key: 'key',
      render: (_, policy) => <span className="mgr-code adm-wrap">{policy.key}</span>,
    },
    {
      title: t.columnValue,
      key: 'value',
      render: (_, policy) => (
        <Input
          className="adm-inline-input"
          aria-label={policy.key}
          value={drafts[policy.id] ?? policy.value}
          onChange={(e) => setDrafts({ ...drafts, [policy.id]: e.target.value })}
        />
      ),
    },
    {
      title: t.columnUnit,
      key: 'unit',
      responsive: ['md'],
      render: (_, policy) => <span className="mgr-cell-sub">{policy.unit}</span>,
    },
    {
      title: t.columnDescription,
      key: 'description',
      responsive: ['lg'],
      render: (_, policy) => (
        <span className="mgr-cell-sub adm-wrap adm-col-desc">{policy.description}</span>
      ),
    },
    {
      title: t.columnFrom,
      key: 'from',
      responsive: ['lg'],
      render: (_, policy) => <span className="mgr-nowrap">{fmt(policy.effectiveFrom)}</span>,
    },
    {
      title: t.columnTo,
      key: 'to',
      responsive: ['lg'],
      render: (_, policy) => (
        <span className="mgr-cell-sub mgr-nowrap">{fmt(policy.effectiveTo)}</span>
      ),
    },
    {
      title: t.actions,
      key: 'actions',
      align: 'right',
      render: (_, policy) => {
        const value = drafts[policy.id] ?? policy.value
        const dirty = drafts[policy.id] !== undefined && value !== policy.value
        return dirty ? (
          <Button
            type="primary"
            size="small"
            loading={saving === policy.id}
            onClick={() => void handleSave(policy, value)}
          >
            {saving === policy.id ? '...' : t.save}
          </Button>
        ) : null
      },
    },
  ]

  return (
    <>
      {saveError && <Alert type="error" showIcon role="alert" message={saveError} />}
      <CardComponent styles={{ body: { padding: 0 } }}>
        <TableComponent<OperatingPolicy> rowKey="id" columns={columns} dataSource={data.items} />
      </CardComponent>
    </>
  )
}
