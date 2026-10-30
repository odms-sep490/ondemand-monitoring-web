import { useEffect, useRef, useState } from 'react'
import { Button, Checkbox, Input, Modal, Select, Space, Spin } from 'antd'
import { useI18n } from '../../../shared/i18n'
import { checklistEvidenceApi } from '../api/checklistEvidenceApi'
import type { EvidenceCandidate } from '../types/checklistExecution'
import { checklistEvidencePickerMessages } from './ChecklistEvidencePicker.messages'
import './ChecklistEvidencePanel.css'

export function ChecklistEvidencePicker({
  missionId,
  open,
  requiredType,
  executionId,
  alreadyAttached = [],
  loadCandidates,
  onClose,
  onSelect,
  allowManualBackup = false,
}: {
  missionId: string
  open: boolean
  requiredType?: string
  executionId?: string
  alreadyAttached?: string[]
  loadCandidates?: (page: number) => Promise<EvidenceCandidate[]>
  onClose: () => void
  onSelect: (items: EvidenceCandidate[]) => Promise<void>
  allowManualBackup?: boolean
}) {
  const { t } = useI18n(checklistEvidencePickerMessages)
  const [page, setPage] = useState(0)
  const [items, setItems] = useState<EvidenceCandidate[]>([])
  const [selected, setSelected] = useState<Record<string, EvidenceCandidate>>(
    {},
  )
  const [search, setSearch] = useState('')
  const [type, setType] = useState('ALL')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [revision, setRevision] = useState(0)
  const loader = useRef(loadCandidates)
  loader.current = loadCandidates
  useEffect(() => {
    if (!open) return
    let current = true
    const abort = new AbortController()
    setLoading(true)
    setError(false)
    const request = loader.current
      ? loader.current(page)
      : checklistEvidenceApi.candidates(missionId, page, abort.signal)
    void request
      .then((data) => {
        if (current) setItems(data)
      })
      .catch(() => {
        if (current) setError(true)
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
      abort.abort()
    }
  }, [open, page, missionId, revision])
  const eligible = (item: EvidenceCandidate) =>
    item.attachable &&
    (item.mediaId.startsWith('local:') ||
      ['VALIDATING', 'PENDING_MANAGER_APPROVAL', 'AVAILABLE'].includes(
        item.status ?? '',
      ) ||
      (allowManualBackup && item.status === 'MANUAL_UPLOAD_REQUIRED')) &&
    !alreadyAttached.includes(item.mediaId) &&
    !(executionId && item.alreadyAttachedExecutionIds?.includes(executionId)) &&
    (requiredType === 'IMAGE'
      ? item.mediaType === 'IMAGE'
      : requiredType === 'VIDEO'
        ? item.mediaType === 'VIDEO'
        : true)
  const filtered = items.filter(
    (item) =>
      (type === 'ALL' || item.mediaType === type) &&
      item.fileName.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  )
  async function add() {
    setBusy(true)
    setError(false)
    try {
      await onSelect(Object.values(selected))
      setSelected({})
      onClose()
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      open={open}
      title={t.pick}
      onCancel={onClose}
      width={820}
      footer={
        <Space>
          <Button onClick={onClose}>{t.cancel}</Button>
          <Button
            type="primary"
            disabled={!Object.keys(selected).length || loading}
            loading={busy}
            onClick={() => void add()}
          >
            {t.selected(Object.keys(selected).length)}
          </Button>
        </Space>
      }
    >
      <p>{t.uploadHint}</p>
      <Space wrap>
        <Input
          aria-label={t.search}
          placeholder={t.search}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          aria-label={t.evidence}
          value={type}
          onChange={setType}
          options={[
            { value: 'ALL', label: t.all },
            { value: 'IMAGE', label: t.image },
            { value: 'VIDEO', label: t.video },
          ]}
        />
      </Space>
      {error && (
        <p role="alert">
          {t.error}{' '}
          <Button onClick={() => setRevision((value) => value + 1)}>
            {t.retry}
          </Button>
        </p>
      )}
      {loading ? (
        <Spin tip={t.loading}>
          <div style={{ minHeight: 100 }} />
        </Spin>
      ) : (
        <div className="checklist-evidence-picker">
          {!filtered.length && <p>{t.empty}</p>}
          {filtered.map((item) => (
            <label key={item.mediaId} className="checklist-evidence-picker-row">
              <Checkbox
                checked={!!selected[item.mediaId]}
                disabled={!eligible(item) || busy}
                onChange={(event) =>
                  setSelected((previous) => {
                    const next = { ...previous }
                    if (event.target.checked) next[item.mediaId] = item
                    else delete next[item.mediaId]
                    return next
                  })
                }
                aria-label={item.fileName}
              />
              {item.previewUrl && item.mediaType === 'IMAGE' && (
                <img src={item.previewUrl} alt="" loading="lazy" />
              )}
              <span>
                {item.fileName}
                <small>{item.mediaType === 'VIDEO' ? t.video : t.image}</small>
              </span>
            </label>
          ))}
        </div>
      )}
      <Space>
        <Button
          disabled={!page || loading}
          onClick={() => setPage((value) => value - 1)}
        >
          {t.previous}
        </Button>
        <Button
          disabled={items.length < 50 || loading}
          onClick={() => setPage((value) => value + 1)}
        >
          {t.more}
        </Button>
      </Space>
    </Modal>
  )
}
