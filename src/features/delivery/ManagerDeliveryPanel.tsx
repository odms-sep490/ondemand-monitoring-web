import { VideoThumbnail } from '../../shared/components/media/VideoThumbnail'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Button as AntButton,
  Checkbox,
  Collapse,
  Input,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd'
import { ApiError } from '../../shared/api/httpClient'
import { Button, useConfirm, useToast } from '../../shared/components/ui'
import { useI18n } from '../../shared/i18n'
import { managerDeliveryFeedbackMessages } from './managerDelivery.messages'
import { managerDeliveryPanelMessages } from './managerDeliveryPanel.messages'
import { customerDeliveryPanelMessages } from './customerDeliveryPanel.messages'
import { localizeRevisionFeedback } from './revisionFeedback'
import { deliveryApi } from './api'
import { managerHref } from '../manager/routes'
import { canCreateRework, canUseDeliveryMedia } from './reworkPolicy'
import type {
  ChecklistDeliveryDraft,
  ChecklistDeliveryPublishBody,
  ManagerChecklistDelivery,
  ResultRevisionCase,
} from './api'
import type { Delivery } from './types'
import { DeliveryProgress, DeliveryStatusPill } from './DeliveryProgress'
import type { DeliveryAsset } from './types'
import { DeliveryReplacementPicker } from './DeliveryReplacementPicker'
import { DeliveryImagePreview } from './DeliveryImagePreview'
import './delivery.css'
import { MissionDeliveryTabs } from './MissionDeliveryTabs'

type ReplacementSelection = Record<string, string>
type DeliveryDraftStatus =
  'idle' | 'saving' | 'saved' | 'error' | 'stale' | 'conflict'

type ManagerDeliveryPanelProps = {
  orderId: string
  refreshKey?: number
  allowLegacyPublication?: boolean
  initialMissionId?: string
}
export function ManagerDeliveryPanel(props: ManagerDeliveryPanelProps) {
  return (
    <MissionDeliveryTabs
      orderId={props.orderId}
      manager
      initialMissionId={props.initialMissionId}
    >
      {(missionId) => (
        <ScopedManagerDeliveryPanel {...props} missionId={missionId} />
      )}
    </MissionDeliveryTabs>
  )
}

function ScopedManagerDeliveryPanel({
  orderId,
  refreshKey = 0,
  allowLegacyPublication = false,
  missionId,
}: {
  orderId: string
  refreshKey?: number
  missionId?: string
  allowLegacyPublication?: boolean
}) {
  const { t: fb } = useI18n(managerDeliveryFeedbackMessages)
  const { t } = useI18n(managerDeliveryPanelMessages)
  const { t: reviewLabels } = useI18n(customerDeliveryPanelMessages)
  const toast = useToast()
  const confirm = useConfirm()
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [checklistDelivery, setChecklistDelivery] =
    useState<ManagerChecklistDelivery | null>(null)
  const [revisionCase, setRevisionCase] = useState<ResultRevisionCase | null>(
    null,
  )
  const [additions, setAdditions] = useState<Record<string, string[]>>({})
  const [removed, setRemoved] = useState<Record<string, string[]>>({})
  const [replacements, setReplacements] = useState<
    Record<string, ReplacementSelection>
  >({})
  const [decisionDrafts, setDecisionDrafts] = useState<
    Record<
      string,
      {
        scope: 'IN_SCOPE' | 'OUT_OF_SCOPE'
        strategy: 'UNDECIDED' | 'RESERVE_MEDIA' | 'REWORK'
        reason: string
        instructions: string
      }
    >
  >({})
  const [outOfScopeRequestIds, setOutOfScopeRequestIds] = useState<
    Record<string, string>
  >({})
  const [notes, setNotes] = useState('')
  const [deliveryDraft, setDeliveryDraft] =
    useState<ChecklistDeliveryDraft | null>(null)
  const [draftStatus, setDraftStatus] = useState<DeliveryDraftStatus>('idle')
  const [draftDirty, setDraftDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const draftVersionRef = useRef(0)
  const draftChangeRevisionRef = useRef(0)
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftSaveQueueRef = useRef<Promise<void>>(Promise.resolve())
  const publishRequestRef = useRef<{ fingerprint: string; id: string } | null>(
    null,
  )

  const markDraftChanged = useCallback(() => {
    draftChangeRevisionRef.current += 1
    setDraftDirty(true)
  }, [])

  const load = useCallback(async () => {
    setError(null)
    const [deliveryResult, checklistResult, caseResult, draftResult] =
      await Promise.allSettled([
        deliveryApi.managerGet(orderId, undefined, missionId),
        deliveryApi.managerGetChecklists(orderId, undefined, missionId),
        deliveryApi.managerGetRevisionCase(orderId),
        deliveryApi.managerGetChecklistDraft(orderId, undefined, missionId),
      ])
    let loadError: string | null = null
    if (deliveryResult.status === 'fulfilled') setDelivery(deliveryResult.value)
    else
      loadError =
        deliveryResult.reason instanceof Error
          ? deliveryResult.reason.message
          : t.loadFailed
    if (checklistResult.status === 'fulfilled') {
      setChecklistDelivery(checklistResult.value)
      const initial = checklistResult.value.currentReviewRoundId == null
      const defaultAdditions = Object.fromEntries(
        checklistResult.value.checklists.map((item) => [
          item.orderChecklistItemId,
          initial
            ? item.eligibleMedia
                .filter(
                  (asset) =>
                    !item.currentBundle.some(
                      (current) => current.mediaAssetId === asset.mediaAssetId,
                    ),
                )
                .map((asset) => asset.mediaAssetId)
            : [],
        ]),
      )
      setAdditions(defaultAdditions)
    } else if (checklistResult.reason instanceof Error) {
      loadError = checklistResult.reason.message
    }
    if (caseResult.status === 'fulfilled') {
      setRevisionCase(caseResult.value)
      setDecisionDrafts(
        Object.fromEntries(
          caseResult.value.items.map((item) => [
            item.caseItemId,
            {
              scope:
                item.scopeDecision === 'OUT_OF_SCOPE'
                  ? 'OUT_OF_SCOPE'
                  : 'IN_SCOPE',
              strategy: item.strategy,
              reason: item.scopeReason ?? '',
              instructions: item.managerInstructions ?? '',
            },
          ]),
        ),
      )
    } else if (!(
      caseResult.reason instanceof ApiError && caseResult.reason.status === 404
    )) {
      setRevisionCase(null)
      loadError ??=
        caseResult.reason instanceof Error
          ? caseResult.reason.message
          : t.loadFailed
    } else setRevisionCase(null)

    if (
      checklistResult.status === 'fulfilled' &&
      draftResult.status === 'fulfilled'
    ) {
      const draft = draftResult.value
      setDeliveryDraft(draft)
      draftVersionRef.current = draft.version
      draftChangeRevisionRef.current = 0
      if (draft.stale) {
        setDraftStatus('stale')
        setDraftDirty(false)
      } else if (draft.updatedAt) {
        const operations = new Map(
          draft.checklists.map((operation) => [
            operation.orderChecklistItemId,
            operation,
          ]),
        )
        setAdditions(
          Object.fromEntries(
            checklistResult.value.checklists.map((item) => [
              item.orderChecklistItemId,
              operations.get(item.orderChecklistItemId)?.addMediaAssetIds ?? [],
            ]),
          ),
        )
        setRemoved(
          Object.fromEntries(
            draft.checklists.map((operation) => [
              operation.orderChecklistItemId,
              operation.removeRoundEvidenceIds ?? [],
            ]),
          ),
        )
        setReplacements(
          Object.fromEntries(
            draft.checklists.map((operation) => [
              operation.orderChecklistItemId,
              Object.fromEntries(
                (operation.replacements ?? []).map((row) => [
                  row.sourceRoundEvidenceId,
                  row.newMediaAssetId,
                ]),
              ),
            ]),
          ),
        )
        setNotes(draft.notes ?? '')
        setDraftStatus('saved')
        setDraftDirty(false)
      } else {
        setRemoved({})
        setReplacements({})
        setNotes('')
        setDraftStatus('idle')
        setDraftDirty(false)
      }
    } else if (draftResult.status === 'rejected') {
      loadError ??=
        draftResult.reason instanceof Error
          ? draftResult.reason.message
          : t.loadFailed
    }
    setError(loadError)
  }, [orderId, missionId, refreshKey, t.loadFailed])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (
      !draftDirty ||
      !checklistDelivery ||
      !canDraftDelivery(checklistDelivery.deliveryStatus) ||
      draftStatus === 'stale' ||
      draftStatus === 'conflict' ||
      draftStatus === 'saving'
    )
      return
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    const changeRevision = draftChangeRevisionRef.current
    draftTimerRef.current = setTimeout(() => {
      const operations = checklistDelivery.checklists.map((item) => ({
        orderChecklistItemId: item.orderChecklistItemId,
        addMediaAssetIds: additions[item.orderChecklistItemId] ?? [],
        removeRoundEvidenceIds: removed[item.orderChecklistItemId] ?? [],
        replacements: Object.entries(
          replacements[item.orderChecklistItemId] ?? {},
        ).map(([sourceRoundEvidenceId, newMediaAssetId]) => ({
          sourceRoundEvidenceId,
          newMediaAssetId,
        })),
      }))
      setDraftStatus('saving')
      draftSaveQueueRef.current = draftSaveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          try {
            const saved = await deliveryApi.managerSaveChecklistDraft(
              orderId,
              {
                expectedDraftVersion: draftVersionRef.current,
                caseId: revisionCase?.caseId ?? null,
                baseReviewRoundId: checklistDelivery.currentReviewRoundId,
                expectedDeliveryVersion: checklistDelivery.deliveryVersion,
                notes,
                checklists: operations,
              },
              missionId,
            )
            draftVersionRef.current = saved.version
            setDeliveryDraft(saved)
            if (draftChangeRevisionRef.current === changeRevision) {
              setDraftDirty(false)
              setDraftStatus('saved')
            } else {
              setDraftDirty(true)
              setDraftStatus('idle')
            }
          } catch (cause) {
            const stale =
              cause instanceof ApiError &&
              [
                'RESULT_REVIEW_REFRESH_REQUIRED',
                'OPTIMISTIC_LOCK_CONFLICT',
              ].includes(cause.code ?? '')
            setDraftStatus(stale ? 'conflict' : 'error')
            const changedDuringSave =
              draftChangeRevisionRef.current !== changeRevision
            setDraftDirty(!stale && changedDuringSave)
            if (!stale && changedDuringSave) setDraftStatus('idle')
            if (!stale)
              setError(
                cause instanceof Error ? cause.message : t.draftSaveFailed,
              )
          }
        })
        .catch((cause: unknown) => {
          setDraftStatus('error')
          setDraftDirty(false)
          setError(cause instanceof Error ? cause.message : t.draftSaveFailed)
        })
    }, 600)
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    }
  }, [
    additions,
    checklistDelivery,
    draftDirty,
    draftStatus,
    notes,
    orderId,
    removed,
    replacements,
    revisionCase?.caseId,
    t.draftSaveFailed,
  ])

  const canReleasePreview =
    (allowLegacyPublication ||
      Boolean(revisionCase) ||
      checklistDelivery?.currentReviewRoundId != null) &&
    ['READY_FOR_MANAGER_REVIEW', 'REVISION_REQUESTED'].includes(
      delivery?.deliveryStatus ?? '',
    )
  const scopedCaseItems = useMemo(() => {
    if (!missionId) return revisionCase?.items ?? []
    const checklistIds = new Set(
      checklistDelivery?.checklists.map((item) => item.orderChecklistItemId),
    )
    return (revisionCase?.items ?? []).filter((item) =>
      checklistIds.has(item.orderChecklistItemId),
    )
  }, [missionId, revisionCase, checklistDelivery])

  const checklistItems = useMemo(
    () =>
      (checklistDelivery?.checklists ?? []).map((item) => ({
        ...item,
        eligibleMedia: item.eligibleMedia.filter((asset) =>
          canUseDeliveryMedia(
            revisionCase?.items.find(
              (row) => row.orderChecklistItemId === item.orderChecklistItemId,
            ),
            asset,
          ),
        ),
      })),
    [checklistDelivery, revisionCase],
  )
  const selection = useMemo(
    () =>
      checklistItems.map((item) => {
        const removedIds = new Set(removed[item.orderChecklistItemId] ?? [])
        const replacementsForItem =
          replacements[item.orderChecklistItemId] ?? {}
        const replacementSources = new Set(Object.keys(replacementsForItem))
        const mediaIds = new Set(
          item.currentBundle
            .filter(
              (asset) =>
                !removedIds.has(asset.roundEvidenceId ?? '') &&
                !replacementSources.has(asset.roundEvidenceId ?? ''),
            )
            .map((asset) => asset.mediaAssetId),
        )
        ;(additions[item.orderChecklistItemId] ?? []).forEach((id) =>
          mediaIds.add(id),
        )
        Object.values(replacementsForItem).forEach((id) => mediaIds.add(id))
        const selectedAssets = Array.from(
          new Map(
            [...item.currentBundle, ...item.eligibleMedia].map((asset) => [
              asset.mediaAssetId,
              asset,
            ]),
          ).values(),
        ).filter((asset) => mediaIds.has(asset.mediaAssetId))
        return {
          item,
          mediaIds,
          selectedAssets,
          changed:
            (additions[item.orderChecklistItemId]?.length ?? 0) > 0 ||
            removedIds.size > 0 ||
            replacementSources.size > 0,
        }
      }),
    [checklistItems, additions, removed, replacements],
  )

  const hasMissingMinimum = selection.some(
    ({ item, selectedAssets, changed }) =>
      !meetsMinimum(item, selectedAssets) ||
      (changed &&
        selectedAssets.some(
          (asset) =>
            !canUseDeliveryMedia(
              revisionCase?.items.find(
                (row) => row.orderChecklistItemId === item.orderChecklistItemId,
              ),
              asset,
            ),
        )),
  )
  const hasChanges = selection.some((item) => item.changed)

  async function publish(confirmSurplus: boolean, fingerprint: string | null) {
    if (
      !checklistDelivery ||
      draftDirty ||
      draftStatus === 'saving' ||
      draftStatus === 'stale'
    )
      return
    const body = makePublishBody(
      checklistDelivery,
      selection,
      additions,
      removed,
      replacements,
      notes,
      confirmSurplus,
      fingerprint,
    )
    const requestFingerprint = checklistPublishRequestFingerprint(orderId, body)
    const requestId =
      publishRequestRef.current?.fingerprint === requestFingerprint
        ? publishRequestRef.current.id
        : crypto.randomUUID()
    publishRequestRef.current = {
      fingerprint: requestFingerprint,
      id: requestId,
    }
    body.clientRequestId = requestId
    setBusy(true)
    setError(null)
    try {
      const result = await deliveryApi.managerPublishChecklists(
        orderId,
        body,
        missionId,
      )
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
      setDelivery(result)
      setDeliveryDraft(null)
      draftVersionRef.current = 0
      publishRequestRef.current = null
      setDraftStatus('idle')
      setDraftDirty(false)
      setNotes('')
      toast.success(fb.previewReleased)
      await load()
    } catch (cause) {
      if (
        !confirmSurplus &&
        cause instanceof ApiError &&
        cause.code === 'DELIVERY_SURPLUS_CONFIRMATION_REQUIRED'
      ) {
        const ok = await confirm({
          title: t.confirmingSurplus,
          description: t.confirmingSurplusBody,
          confirmLabel: t.publishChecklistResults,
          tone: 'danger',
        })
        if (ok) {
          const fingerprintValue = await publishFingerprint(orderId, body)
          await publish(true, fingerprintValue)
        }
      } else {
        const failure = cause instanceof Error ? cause.message : t.actionFailed
        setError(failure)
        toast.error(failure)
      }
    } finally {
      setBusy(false)
    }
  }

  async function saveDecision(item: ResultRevisionCase['items'][number]) {
    if (!revisionCase) return
    const draft = decisionDrafts[item.caseItemId]
    if (!draft?.reason.trim()) {
      setError(t.scopeReason)
      return
    }
    setBusy(true)
    try {
      const result = await deliveryApi.managerDecideRevisionCaseItem(
        revisionCase.caseId,
        item.caseItemId,
        {
          expectedVersion: item.version,
          scopeDecision: draft.scope,
          strategy:
            draft.scope === 'OUT_OF_SCOPE' ? 'UNDECIDED' : draft.strategy,
          reason: draft.reason.trim(),
          managerInstructions: draft.instructions.trim(),
        },
      )
      setRevisionCase(result)
      setDecisionDrafts(
        Object.fromEntries(
          result.items.map((row) => [
            row.caseItemId,
            {
              scope:
                row.scopeDecision === 'OUT_OF_SCOPE'
                  ? 'OUT_OF_SCOPE'
                  : 'IN_SCOPE',
              strategy: row.strategy,
              reason: row.scopeReason ?? '',
              instructions: row.managerInstructions ?? '',
            },
          ]),
        ),
      )
      toast.success(t.decisionSaved)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.actionFailed)
    } finally {
      setBusy(false)
    }
  }

  async function notifyOutOfScope(item: ResultRevisionCase['items'][number]) {
    if (!revisionCase) return
    setBusy(true)
    try {
      const clientRequestId =
        outOfScopeRequestIds[item.caseItemId] ?? crypto.randomUUID()
      setOutOfScopeRequestIds((current) => ({
        ...current,
        [item.caseItemId]: clientRequestId,
      }))
      const result = await deliveryApi.managerNotifyOutOfScope(
        revisionCase.caseId,
        item.caseItemId,
        {
          expectedVersion: item.version,
          clientRequestId,
        },
      )
      setRevisionCase(result)
      setOutOfScopeRequestIds((current) => {
        const next = { ...current }
        delete next[item.caseItemId]
        return next
      })
      toast.success(t.outOfScopeNotified)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.actionFailed)
    } finally {
      setBusy(false)
    }
  }

  async function discardStaleDraft() {
    setBusy(true)
    try {
      await deliveryApi.managerClearChecklistDraft(
        orderId,
        deliveryDraft?.version ?? draftVersionRef.current,
        missionId,
      )
      setDeliveryDraft(null)
      draftVersionRef.current = 0
      setDraftStatus('idle')
      setDraftDirty(false)
      setNotes('')
      setRemoved({})
      setReplacements({})
      setAdditions(
        Object.fromEntries(
          checklistItems.map((item) => [
            item.orderChecklistItemId,
            checklistDelivery?.currentReviewRoundId == null
              ? item.eligibleMedia
                  .filter(
                    (asset) =>
                      !item.currentBundle.some(
                        (current) =>
                          current.mediaAssetId === asset.mediaAssetId,
                      ),
                  )
                  .map((asset) => asset.mediaAssetId)
              : [],
          ]),
        ),
      )
      toast.success(t.draftDiscarded)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.actionFailed)
    } finally {
      setBusy(false)
    }
  }

  async function reloadDraft() {
    setBusy(true)
    try {
      await load()
    } finally {
      setBusy(false)
    }
  }

  if (!delivery || !checklistDelivery)
    return error ? (
      <p className="delivery-error" role="alert">
        {error}
      </p>
    ) : null

  return (
    <section
      className="odm-or-card delivery-shell delivery-manager"
      aria-labelledby="manager-delivery-title"
    >
      <header className="delivery-hero">
        <div className="delivery-hero__copy">
          <span className="delivery-eyebrow">{t.eyebrow}</span>
          <h2 id="manager-delivery-title">{t.title}</h2>
          <p>{t.intro}</p>
        </div>
        <DeliveryStatusPill status={delivery.deliveryStatus} />
      </header>
      <DeliveryProgress status={delivery.deliveryStatus} />
      <div className="delivery-content">
        {!canReleasePreview &&
          !allowLegacyPublication &&
          !revisionCase &&
          checklistDelivery?.currentReviewRoundId == null && (
            <Alert type="info" showIcon message={t.inspectorPublication} />
          )}

        {draftStatus === 'stale' ? (
          <Alert
            type="warning"
            showIcon
            message={t.staleDraft}
            action={
              <AntButton
                size="small"
                disabled={busy}
                onClick={() => void discardStaleDraft()}
              >
                {t.discardDraft}
              </AntButton>
            }
          />
        ) : null}
        {draftStatus === 'conflict' ? (
          <Alert
            type="warning"
            showIcon
            message={t.draftConflict}
            action={
              <AntButton
                size="small"
                disabled={busy}
                onClick={() => void reloadDraft()}
              >
                {t.reloadDraft}
              </AntButton>
            }
          />
        ) : null}
        {draftStatus === 'saving' ? (
          <p className="delivery-draft-status" role="status">
            {t.draftSaving}
          </p>
        ) : null}
        {draftStatus === 'saved' && deliveryDraft?.updatedAt ? (
          <p className="delivery-draft-status" role="status">
            {t.draftSaved(new Date(deliveryDraft.updatedAt).toLocaleString())}
          </p>
        ) : null}
        {delivery.revisionReason ? (
          <StatusBanner
            tone="warning"
            title={t.revisionTitle}
            text={localizeRevisionFeedback(
              delivery.revisionReason,
              reviewLabels.reasonCodes,
            )}
          />
        ) : null}
        {delivery.deliveryStatus === 'PROCESSING' ? (
          <StatusBanner title={t.processingTitle} text={t.processingText} />
        ) : null}
        {canReleasePreview && checklistItems.length === 0 ? (
          <StatusBanner
            tone="warning"
            title={t.noMediaTitle}
            text={t.noMediaText}
          />
        ) : null}

        <section
          className="delivery-section delivery-checklist-groups"
          aria-labelledby="delivery-checklists-title"
        >
          <div className="delivery-section__head">
            <div>
              <h3 id="delivery-checklists-title">{t.checklistHeading}</h3>
              <p>
                {canReleasePreview ? t.checklistHelp : t.checklistReadOnlyHelp}
              </p>
            </div>
          </div>
          <Collapse
            className="delivery-review-collapse"
            items={selection.map(({ item, selectedAssets }, index) => {
              const caseItem = revisionCase?.items.find(
                (row) => row.orderChecklistItemId === item.orderChecklistItemId,
              )
              const customerFeedback = caseItem?.feedback ?? []
              const flaggedMediaCount = customerFeedback.reduce(
                (count, feedback) => count + (feedback.evidence?.length ?? 0),
                0,
              )
              const blockedByCase =
                !!revisionCase &&
                (!caseItem ||
                  caseItem.scopeDecision !== 'IN_SCOPE' ||
                  caseItem.strategy === 'UNDECIDED' ||
                  caseItem.status !== 'IN_PROGRESS' ||
                  (caseItem.strategy === 'REWORK' &&
                    (!caseItem.assignedReworkMissionId ||
                      caseItem.assignedReworkMissionStatus !== 'COMPLETED')) ||
                  (!!caseItem.assignedReworkMissionId &&
                    !['COMPLETED', 'FAILED', 'CANCELLED'].includes(
                      caseItem.assignedReworkMissionStatus ?? '',
                    )))
              const editable = canReleasePreview && !blockedByCase
              const visibleAssets = editable
                ? selectedAssets
                : item.currentBundle
              const counts = countTypes(visibleAssets)
              const valid = meetsMinimum(item, visibleAssets)
              return {
                key: item.orderChecklistItemId,
                label: (
                  <div className="delivery-review-item-heading">
                    <Space>
                      <span className="delivery-review-item-number">
                        {index + 1}
                      </span>
                      <Typography.Text strong>{item.title}</Typography.Text>
                    </Space>
                    <Space wrap>
                      <Tag>
                        {editable
                          ? t.selectedRequirements(counts.images, counts.videos)
                          : t.deliveredRequirements(
                              counts.images,
                              counts.videos,
                            )}
                      </Tag>
                      {customerFeedback.length > 0 ? (
                        <Tag color={flaggedMediaCount > 0 ? 'orange' : 'default'}>
                          {t.customerFlaggedCount(flaggedMediaCount)}
                        </Tag>
                      ) : null}
                      <Tag color={valid ? 'green' : 'warning'}>
                        {t.minRequirement(
                          item.minimumImageCount,
                          item.minimumVideoCount,
                          item.minimumEvidenceCount,
                          item.requiredEvidenceType.toLowerCase(),
                        )}
                      </Tag>
                    </Space>
                  </div>
                ),
                children: (
                  <div className="delivery-checklist-editor">
                    <CustomerReviewEvidence
                      feedback={customerFeedback}
                      title={t.flaggedMedia}
                      noEvidence={t.noFlaggedMedia}
                      unavailable={t.flaggedMediaExpired}
                      previewUnavailable={t.replacementPreviewUnavailable}
                      roundLabel={t.feedbackRound}
                      reasonLabel={t.reasonCode}
                      reasonCodes={reviewLabels.reasonCodes}
                    />
                    <ChecklistEditor
                      item={item}
                      editable={editable}
                      additions={additions[item.orderChecklistItemId] ?? []}
                      removed={removed[item.orderChecklistItemId] ?? []}
                      replacements={replacements[item.orderChecklistItemId] ?? {}}
                      disabled={
                        !canReleasePreview ||
                        busy ||
                        blockedByCase ||
                        draftStatus === 'stale' ||
                        draftStatus === 'conflict'
                      }
                      onAdd={(ids) => {
                        markDraftChanged()
                        setAdditions((value) => ({
                          ...value,
                          [item.orderChecklistItemId]: ids,
                        }))
                      }}
                      onRemove={(ids) => {
                        markDraftChanged()
                        setRemoved((value) => ({
                          ...value,
                          [item.orderChecklistItemId]: ids,
                        }))
                      }}
                      onReplace={(value) => {
                        markDraftChanged()
                        setReplacements((current) => ({
                          ...current,
                          [item.orderChecklistItemId]: value,
                        }))
                      }}
                      rework={
                        caseItem?.strategy === 'REWORK' &&
                        caseItem.status === 'IN_PROGRESS'
                      }
                      messages={t}
                    />
                  </div>
                ),
              }
            })}
          />
          {canReleasePreview && hasMissingMinimum ? (
            <Alert type="warning" showIcon message={t.selectChecklistMedia} />
          ) : null}
          {canReleasePreview && checklistItems.length > 0 ? (
            <section
              className="delivery-composer"
              aria-labelledby="delivery-note-title"
            >
              <div className="delivery-field-head">
                <label id="delivery-note-title" htmlFor="delivery-notes">
                  {t.notesLabel}
                </label>
                <span>{notes.length}/1000</span>
              </div>
              <textarea
                id="delivery-notes"
                placeholder={t.notesPlaceholder}
                value={notes}
                maxLength={1000}
                disabled={draftStatus === 'stale' || draftStatus === 'conflict'}
                onChange={(event) => {
                  markDraftChanged()
                  setNotes(event.target.value)
                }}
              />
              <div className="delivery-action-bar">
                <div>
                  <b>
                    {t.filesCount(
                      selection.reduce(
                        (count, row) => count + row.selectedAssets.length,
                        0,
                      ),
                    )}
                  </b>
                  <span>{t.willBeSentAsPreview}</span>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  className="delivery-primary-action"
                  disabled={
                    busy ||
                    draftDirty ||
                    draftStatus === 'saving' ||
                    draftStatus === 'stale' ||
                    draftStatus === 'conflict' ||
                    hasMissingMinimum ||
                    !hasChanges
                  }
                  onClick={() => void publish(false, null)}
                >
                  {busy ? t.sending : t.publishChecklistResults}
                </Button>
              </div>
            </section>
          ) : null}
        </section>

        {revisionCase ? (
          <section
            className="delivery-section delivery-revision-case"
            aria-labelledby="delivery-revision-case-title"
          >
            <div className="delivery-section__head">
              <div>
                <h3 id="delivery-revision-case-title">{t.revisionCase}</h3>
                <p>
                  <a
                    href={managerHref({
                      screen: 'support',
                      ticketId: revisionCase.ticketId,
                    })}
                  >
                    {t.ticket(revisionCase.ticketCode)}
                  </a>
                </p>
              </div>
              <Tag color="blue">
                {revisionCase.status === 'OPEN' ? t.caseOpen : t.caseClosed}
              </Tag>
            </div>
            <Collapse
              className="delivery-review-collapse"
              items={scopedCaseItems.map((item, index) => {
                const draft = decisionDrafts[item.caseItemId] ?? {
                  scope: 'IN_SCOPE' as const,
                  strategy: 'UNDECIDED' as const,
                  reason: '',
                  instructions: '',
                }
                const reworkLocked = Boolean(
                  item.assignedReworkMissionId &&
                  !['FAILED', 'CANCELLED'].includes(
                    item.assignedReworkMissionStatus ?? '',
                  ),
                )
                return {
                  key: item.caseItemId,
                  label: (
                    <div className="delivery-review-item-heading">
                      <Space>
                        <span className="delivery-review-item-number">
                          {index + 1}
                        </span>
                        <Typography.Text strong>{item.title}</Typography.Text>
                      </Space>
                      <Tag
                        color={
                          item.scopeDecision === 'OUT_OF_SCOPE'
                            ? 'orange'
                            : item.scopeDecision === 'IN_SCOPE'
                              ? 'blue'
                              : 'default'
                        }
                      >
                        {item.scopeDecision === 'OUT_OF_SCOPE'
                          ? t.outOfScope
                          : item.scopeDecision === 'IN_SCOPE'
                            ? t.inScope
                            : t.scopePending}
                      </Tag>
                    </div>
                  ),
                  children: (
                    <div className="delivery-review-item">
                      <div className="delivery-case-feedback">
                        {item.feedback.map((feedback) => (
                          <article key={feedback.requestId}>
                            <Tag>{t.feedbackRound(feedback.roundNumber)}</Tag>
                            <Tag>
                              {t.reasonCode} ·{' '}
                              {reviewLabels.reasonCodes[feedback.reasonCode]}
                            </Tag>
                            <p>{feedback.customerNote}</p>
                            <small>
                              {new Date(feedback.submittedAt).toLocaleString()}
                            </small>
                            <div className="delivery-feedback-evidence">
                              <Typography.Text strong>
                                {t.flaggedMedia}
                              </Typography.Text>
                              {(feedback.evidence ?? []).length > 0 ? (
                                <div className="delivery-feedback-evidence-grid">
                                  {(feedback.evidence ?? []).map((evidence) => (
                                    <div
                                      className="delivery-feedback-evidence-card"
                                      key={evidence.roundEvidenceId}
                                    >
                                      {evidence.accessReason ? (
                                        <Typography.Text type="secondary">
                                          {evidence.accessReason ===
                                          'RETENTION_EXPIRED'
                                            ? t.flaggedMediaExpired
                                            : t.replacementPreviewUnavailable}
                                        </Typography.Text>
                                      ) : (
                                        <MediaPreview
                                          asset={{
                                            ...evidence,
                                            id: evidence.mediaAssetId,
                                          }}
                                        />
                                      )}
                                      <Typography.Text
                                        ellipsis={{
                                          tooltip: evidence.fileName,
                                        }}
                                      >
                                        {evidence.fileName}
                                      </Typography.Text>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <Typography.Text type="secondary">
                                  {t.noFlaggedMedia}
                                </Typography.Text>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                      {reworkLocked ? (
                        <Space direction="vertical" size={12}>
                          <Tag color="orange">{t.reworkStrategy}</Tag>
                          <Typography.Text strong>
                            {t.scopeReason}
                          </Typography.Text>
                          <Typography.Paragraph>
                            {item.scopeReason}
                          </Typography.Paragraph>
                          {item.managerInstructions && (
                            <>
                              <Typography.Text strong>
                                {t.managerInstructions}
                              </Typography.Text>
                              <Typography.Paragraph>
                                {item.managerInstructions}
                              </Typography.Paragraph>
                            </>
                          )}
                          <AntButton
                            type="primary"
                            href={
                              item.assignedReworkMissionStatus === 'PLANNING'
                                ? managerHref({
                                    screen: 'missionCreate',
                                    orderId,
                                    reworkCaseId: revisionCase.caseId,
                                  })
                                : managerHref({
                                    screen: 'missionDetail',
                                    missionId: item.assignedReworkMissionId!,
                                  })
                            }
                          >
                            {t.openReworkMission}
                          </AntButton>
                        </Space>
                      ) : (
                        <>
                          <label className="delivery-feedback-label">
                            {t.chooseScope}
                            <Select
                              value={draft.scope}
                              disabled={busy}
                              options={[
                                { value: 'IN_SCOPE', label: t.inScope },
                                { value: 'OUT_OF_SCOPE', label: t.outOfScope },
                              ]}
                              onChange={(scope) =>
                                setDecisionDrafts((old) => ({
                                  ...old,
                                  [item.caseItemId]: {
                                    ...draft,
                                    scope,
                                    strategy:
                                      scope === 'OUT_OF_SCOPE'
                                        ? 'UNDECIDED'
                                        : draft.strategy,
                                  },
                                }))
                              }
                            />
                          </label>
                          {draft.scope === 'IN_SCOPE' ? (
                            <label className="delivery-feedback-label">
                              {t.strategy}
                              <Select
                                value={draft.strategy}
                                disabled={busy}
                                options={[
                                  {
                                    value: 'UNDECIDED',
                                    label: t.undecidedStrategy,
                                  },
                                  {
                                    value: 'RESERVE_MEDIA',
                                    label: t.reserveStrategy,
                                  },
                                  { value: 'REWORK', label: t.reworkStrategy },
                                ]}
                                onChange={(strategy) =>
                                  setDecisionDrafts((old) => ({
                                    ...old,
                                    [item.caseItemId]: { ...draft, strategy },
                                  }))
                                }
                              />
                            </label>
                          ) : null}
                          <label className="delivery-feedback-label">
                            {t.scopeReason}
                            <Input.TextArea
                              rows={2}
                              maxLength={2000}
                              value={draft.reason}
                              onChange={(event) =>
                                setDecisionDrafts((old) => ({
                                  ...old,
                                  [item.caseItemId]: {
                                    ...draft,
                                    reason: event.target.value,
                                  },
                                }))
                              }
                            />
                          </label>
                          <label className="delivery-feedback-label">
                            {t.managerInstructions}
                            <Input.TextArea
                              rows={2}
                              maxLength={2000}
                              value={draft.instructions}
                              onChange={(event) =>
                                setDecisionDrafts((old) => ({
                                  ...old,
                                  [item.caseItemId]: {
                                    ...draft,
                                    instructions: event.target.value,
                                  },
                                }))
                              }
                            />
                          </label>
                          {item.status === 'OUT_OF_SCOPE_RESPONDED' ? (
                            <Alert
                              type="warning"
                              showIcon
                              message={t.waitingForScopeAcknowledgement}
                            />
                          ) : null}
                          {item.status === 'OUT_OF_SCOPE_ACKNOWLEDGED' ? (
                            <Alert
                              type="success"
                              showIcon
                              message={t.scopeAcknowledged}
                            />
                          ) : null}
                          <Space wrap>
                            <AntButton
                              type="primary"
                              disabled={
                                busy ||
                                item.status === 'OUT_OF_SCOPE_RESPONDED' ||
                                item.status === 'OUT_OF_SCOPE_ACKNOWLEDGED'
                              }
                              onClick={() => void saveDecision(item)}
                            >
                              {t.decide}
                            </AntButton>
                            {item.scopeDecision === 'OUT_OF_SCOPE' &&
                            item.status !== 'OUT_OF_SCOPE_RESPONDED' &&
                            item.status !== 'OUT_OF_SCOPE_ACKNOWLEDGED' ? (
                              <AntButton
                                disabled={busy}
                                onClick={() => void notifyOutOfScope(item)}
                              >
                                {t.notifyCustomer}
                              </AntButton>
                            ) : null}
                          </Space>
                        </>
                      )}
                    </div>
                  ),
                }
              })}
            />
            {scopedCaseItems.some(canCreateRework) ? (
              <div className="delivery-rework-create">
                <Typography.Title level={5}>{t.reworkMission}</Typography.Title>
                <Typography.Paragraph type="secondary">
                  {t.reworkScheduleHelp}
                </Typography.Paragraph>
                <AntButton
                  type="primary"
                  disabled={busy}
                  href={managerHref({
                    screen: 'missionCreate',
                    orderId,
                    reworkCaseId: revisionCase.caseId,
                  })}
                >
                  {t.reworkWorkspace}
                </AntButton>
              </div>
            ) : null}
          </section>
        ) : null}

        {delivery.deliveryStatus === 'CUSTOMER_REVIEW' ? (
          <StatusBanner title={t.sentTitle} text={t.sentText} />
        ) : null}
        {delivery.deliveryStatus === 'FINAL_PAYMENT_PENDING' ? (
          <StatusBanner
            tone="warning"
            title={t.acceptedTitle}
            text={t.acceptedText}
          />
        ) : null}
        {delivery.deliveryStatus === 'READY_FOR_DELIVERY' ||
        delivery.deliveryStatus === 'PAYMENT_CONFIRMED' ? (
          <div className="delivery-next-action">
            <div>
              <span className="delivery-next-action__icon" aria-hidden="true">
                ✓
              </span>
              <div>
                <b>{t.paymentConfirmed}</b>
                <span>{t.originalsReady}</span>
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              className="delivery-primary-action"
              disabled={busy}
              onClick={async () => {
                const ok = await confirm({
                  title: fb.releaseOriginalsTitle,
                  description: fb.releaseOriginalsBody,
                  confirmLabel: fb.releaseOriginalsAction,
                  tone: 'danger',
                })
                if (ok)
                  await runAction(
                    () => deliveryApi.releaseOriginals(orderId, missionId),
                    fb.originalsReleased,
                    setDelivery,
                    setError,
                    setBusy,
                    toast,
                    t.actionFailed,
                    load,
                  )
              }}
            >
              {busy ? t.delivering : t.deliverOriginals}
            </Button>
          </div>
        ) : null}
        {delivery.deliveryStatus === 'DELIVERED' ? (
          <StatusBanner
            tone="success"
            title={t.deliveredTitle}
            text={t.deliveredText(delivery.assets.length)}
          />
        ) : null}
        {error ? (
          <p className="delivery-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  )
}

function ChecklistEditor({
  item,
  editable,
  additions,
  removed,
  replacements,
  disabled,
  onAdd,
  onRemove,
  onReplace,
  rework,
  messages,
}: {
  item: ManagerChecklistDelivery['checklists'][number]
  editable: boolean
  additions: string[]
  removed: string[]
  replacements: ReplacementSelection
  rework?: boolean
  disabled: boolean
  onAdd: (ids: string[]) => void
  onRemove: (ids: string[]) => void
  onReplace: (value: ReplacementSelection) => void
  messages: typeof managerDeliveryPanelMessages.vi
}) {
  const removedSet = new Set(removed)
  const replacementSources = new Set(Object.keys(replacements))
  const included = new Set([
    ...item.currentBundle
      .filter(
        (asset) =>
          !removedSet.has(asset.roundEvidenceId ?? '') &&
          !replacementSources.has(asset.roundEvidenceId ?? ''),
      )
      .map((asset) => asset.mediaAssetId),
    ...additions,
    ...Object.values(replacements),
  ])
  return (
    <div className="delivery-checklist-editor">
      {rework && (
        <Alert type="info" showIcon message={messages.reworkMediaHelp} />
      )}
      {!editable && item.currentBundle.length === 0 && (
        <Typography.Text type="secondary">
          {messages.noDeliveredMedia}
        </Typography.Text>
      )}
      {item.currentBundle.length > 0 && (
        <section>
          <h4>
            {rework ? messages.reworkReferenceBundle : messages.currentBundle}
          </h4>
          <div className="delivery-grid">
            {item.currentBundle.map((asset) => {
              const evidenceId = asset.roundEvidenceId ?? ''
              const replacementId = replacements[evidenceId] ?? ''
              const options = item.eligibleMedia.filter(
                (candidate) =>
                  candidate.mediaAssetId !== asset.mediaAssetId &&
                  (!included.has(candidate.mediaAssetId) ||
                    candidate.mediaAssetId === replacementId),
              )
              return (
                <article className="delivery-asset" key={evidenceId}>
                  <MediaPreview asset={toDeliveryAsset(asset)} />
                  <div className="delivery-asset__meta">
                    <strong title={asset.fileName}>{asset.fileName}</strong>
                    <small>
                      {asset.type.toUpperCase().includes('VIDEO')
                        ? messages.video
                        : messages.image}{' '}
                      · {asset.missionCode ?? ''}
                    </small>
                  </div>
                  {editable && (
                    <div className="delivery-current-evidence__actions">
                      <Checkbox
                        checked={removedSet.has(evidenceId)}
                        disabled={disabled || !!replacementId}
                        onChange={(event) =>
                          onRemove(
                            event.target.checked
                              ? [...removed, evidenceId]
                              : removed.filter((id) => id !== evidenceId),
                          )
                        }
                      >
                        {messages.removeMedia}
                      </Checkbox>
                      <DeliveryReplacementPicker
                        source={asset}
                        options={options}
                        selectedId={replacementId || undefined}
                        disabled={disabled || removedSet.has(evidenceId)}
                        rework={rework}
                        onChange={(value) => {
                          const next = { ...replacements }
                          if (value) next[evidenceId] = value
                          else delete next[evidenceId]
                          onReplace(next)
                        }}
                      />
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </section>
      )}
      {editable &&
        item.eligibleMedia.some(
          (asset) =>
            !item.currentBundle.some(
              (current) => current.mediaAssetId === asset.mediaAssetId,
            ),
        ) && (
          <section>
            <h4>
              {rework ? messages.reworkAvailableMedia : messages.availableMedia}
            </h4>
            <div className="delivery-grid">
              {item.eligibleMedia
                .filter(
                  (asset) =>
                    !item.currentBundle.some(
                      (current) => current.mediaAssetId === asset.mediaAssetId,
                    ),
                )
                .map((asset) => (
                  <label
                    className={`delivery-asset delivery-select${additions.includes(asset.mediaAssetId) ? ' is-selected' : ''}`}
                    key={asset.mediaAssetId}
                  >
                    <Checkbox
                      checked={additions.includes(asset.mediaAssetId)}
                      disabled={
                        disabled ||
                        Object.values(replacements).includes(asset.mediaAssetId)
                      }
                      onChange={(event) =>
                        onAdd(
                          event.target.checked
                            ? [...additions, asset.mediaAssetId]
                            : additions.filter(
                                (id) => id !== asset.mediaAssetId,
                              ),
                        )
                      }
                    />
                    <MediaPreview asset={toDeliveryAsset(asset)} />
                    <span className="delivery-asset__meta">
                      <strong title={asset.fileName}>{asset.fileName}</strong>
                      <small>
                        {asset.type.toUpperCase().includes('VIDEO')
                          ? messages.video
                          : messages.image}{' '}
                        · {asset.missionCode ?? ''}
                      </small>
                    </span>
                  </label>
                ))}
            </div>
          </section>
        )}
    </div>
  )
}

function makePublishBody(
  checklistDelivery: ManagerChecklistDelivery,
  selection: { item: ManagerChecklistDelivery['checklists'][number] }[],
  additions: Record<string, string[]>,
  removed: Record<string, string[]>,
  replacements: Record<string, ReplacementSelection>,
  notes: string,
  confirmSurplus: boolean,
  fingerprint: string | null,
): ChecklistDeliveryPublishBody {
  return {
    clientRequestId: crypto.randomUUID(),
    expectedDeliveryVersion: checklistDelivery.deliveryVersion,
    baseReviewRoundId: checklistDelivery.currentReviewRoundId,
    expectedReviewRoundVersion: checklistDelivery.currentReviewRoundVersion,
    notes,
    confirmSurplus,
    surplusConfirmationFingerprint: fingerprint,
    checklists: selection.map(({ item }) => ({
      orderChecklistItemId: item.orderChecklistItemId,
      addMediaAssetIds: additions[item.orderChecklistItemId] ?? [],
      removeRoundEvidenceIds: removed[item.orderChecklistItemId] ?? [],
      replacements: Object.entries(
        replacements[item.orderChecklistItemId] ?? {},
      ).map(([sourceRoundEvidenceId, newMediaAssetId]) => ({
        sourceRoundEvidenceId,
        newMediaAssetId,
      })),
    })),
  }
}

function countTypes(
  assets: ManagerChecklistDelivery['checklists'][number]['eligibleMedia'],
) {
  return {
    images: assets.filter((asset) => asset.type.toUpperCase().includes('IMAGE'))
      .length,
    videos: assets.filter((asset) => asset.type.toUpperCase().includes('VIDEO'))
      .length,
  }
}

function canDraftDelivery(status: string) {
  return (
    status === 'READY_FOR_MANAGER_REVIEW' || status === 'REVISION_REQUESTED'
  )
}

function checklistPublishRequestFingerprint(
  orderId: string,
  body: ChecklistDeliveryPublishBody,
) {
  return JSON.stringify({
    orderId,
    expectedDeliveryVersion: body.expectedDeliveryVersion,
    baseReviewRoundId: body.baseReviewRoundId,
    expectedReviewRoundVersion: body.expectedReviewRoundVersion,
    notes: body.notes.trim(),
    checklists: body.checklists
      .slice()
      .sort((a, b) =>
        a.orderChecklistItemId.localeCompare(b.orderChecklistItemId),
      )
      .map((item) => ({
        orderChecklistItemId: item.orderChecklistItemId,
        addMediaAssetIds: [...item.addMediaAssetIds].sort(),
        removeRoundEvidenceIds: [...item.removeRoundEvidenceIds].sort(),
        replacements: item.replacements
          .slice()
          .sort((a, b) =>
            a.sourceRoundEvidenceId.localeCompare(b.sourceRoundEvidenceId),
          ),
      })),
  })
}

function meetsMinimum(
  item: ManagerChecklistDelivery['checklists'][number],
  assets: ManagerChecklistDelivery['checklists'][number]['eligibleMedia'],
) {
  const counts = countTypes(assets)
  if (item.minimumImageCount > 0 || item.minimumVideoCount > 0)
    return (
      counts.images >= item.minimumImageCount &&
      counts.videos >= item.minimumVideoCount
    )
  if (item.minimumEvidenceCount <= 0) return true
  if (item.requiredEvidenceType === 'IMAGE')
    return counts.images >= item.minimumEvidenceCount
  if (item.requiredEvidenceType === 'VIDEO')
    return counts.videos >= item.minimumEvidenceCount
  return assets.length >= item.minimumEvidenceCount
}

function toDeliveryAsset(
  asset: ManagerChecklistDelivery['checklists'][number]['eligibleMedia'][number],
): DeliveryAsset
function toDeliveryAsset(
  asset:
    | ManagerChecklistDelivery['checklists'][number]['eligibleMedia'][number]
    | ManagerChecklistDelivery['checklists'][number]['currentBundle'][number],
): DeliveryAsset {
  return {
    id: asset.mediaAssetId,
    type: asset.type,
    fileName: asset.fileName,
    size: asset.size ?? 0,
    url: asset.url ?? '',
    thumbnailUrl: asset.thumbnailUrl ?? null,
    previewUrl: asset.previewUrl ?? null,
    previewStatus: asset.previewStatus ?? null,
    urlExpiresAt: asset.urlExpiresAt ?? '',
    downloadable: false,
  }
}

async function publishFingerprint(
  orderId: string,
  body: ChecklistDeliveryPublishBody,
) {
  const canonical =
    `${orderId}\n${body.baseReviewRoundId ?? ''}\n${body.expectedReviewRoundVersion ?? ''}\n${body.notes.trim()}\n` +
    body.checklists
      .slice()
      .sort((a, b) =>
        a.orderChecklistItemId.localeCompare(b.orderChecklistItemId),
      )
      .map(
        (item) =>
          `${item.orderChecklistItemId}|${item.addMediaAssetIds
            .slice()
            .sort()
            .map((id) => `A:${id};`)
            .join('')}${item.removeRoundEvidenceIds
            .slice()
            .sort()
            .map((id) => `D:${id};`)
            .join('')}${item.replacements
            .slice()
            .sort((a, b) =>
              a.sourceRoundEvidenceId.localeCompare(b.sourceRoundEvidenceId),
            )
            .map(
              (row) => `R:${row.sourceRoundEvidenceId}:${row.newMediaAssetId};`,
            )
            .join('')}\n`,
      )
      .join('')
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonical),
  )
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function runAction(
  action: () => Promise<Delivery>,
  success: string,
  setDelivery: (value: Delivery) => void,
  setError: (value: string | null) => void,
  setBusy: (value: boolean) => void,
  toast: ReturnType<typeof useToast>,
  fallback: string,
  reload: () => Promise<void>,
) {
  setBusy(true)
  setError(null)
  try {
    setDelivery(await action())
    toast.success(success)
    await reload()
  } catch (cause) {
    const failure = cause instanceof Error ? cause.message : fallback
    setError(failure)
    toast.error(failure)
  } finally {
    setBusy(false)
  }
}

function MediaPreview({ asset }: { asset: DeliveryAsset }) {
  const { t } = useI18n(managerDeliveryPanelMessages)
  if (!asset.previewUrl) {
    return (
      <span className="delivery-replacement-unavailable">
        {t.replacementPreviewUnavailable}
      </span>
    )
  }
  return asset.type.toUpperCase().includes('VIDEO') ? (
    <VideoThumbnail
      src={asset.previewUrl}
      poster={asset.thumbnailUrl}
      fallbackUrl={asset.url}
      fileName={asset.fileName}
      fileSize={asset.size}
      original={asset.previewStatus !== 'READY'}
    />
  ) : (
    <DeliveryImagePreview
      src={asset.thumbnailUrl ?? asset.previewUrl}
      fallbackUrl={asset.url}
      fileSize={asset.size}
      original={asset.previewStatus !== 'READY'}
      previewSrc={asset.previewUrl}
      fileName={asset.fileName}
    />
  )
}

function CustomerReviewEvidence({
  feedback,
  title,
  noEvidence,
  unavailable,
  previewUnavailable,
  roundLabel,
  reasonLabel,
  reasonCodes,
}: {
  feedback: ResultRevisionCase['items'][number]['feedback']
  title: string
  noEvidence: string
  unavailable: string
  previewUnavailable: string
  roundLabel: (round: number) => string
  reasonLabel: string
  reasonCodes: Record<string, string>
}) {
  if (!feedback.length) return null

  return (
    <section className="delivery-checklist-customer-review">
      <Typography.Text strong>{title}</Typography.Text>
      {feedback.map((entry) => (
        <article key={entry.requestId}>
          <Space wrap>
            <Tag>{roundLabel(entry.roundNumber)}</Tag>
            <Tag>
              {reasonLabel} · {reasonCodes[entry.reasonCode] ?? entry.reasonCode}
            </Tag>
          </Space>
          {entry.customerNote ? <p>{entry.customerNote}</p> : null}
          {(entry.evidence ?? []).length > 0 ? (
            <div className="delivery-feedback-evidence-grid">
              {(entry.evidence ?? []).map((evidence) => (
                <div
                  className="delivery-feedback-evidence-card"
                  key={evidence.roundEvidenceId}
                >
                  {evidence.accessReason ? (
                    <Typography.Text type="secondary">
                      {evidence.accessReason === 'RETENTION_EXPIRED'
                        ? unavailable
                        : previewUnavailable}
                    </Typography.Text>
                  ) : (
                    <MediaPreview
                      asset={{ ...evidence, id: evidence.mediaAssetId }}
                    />
                  )}
                  <Typography.Text ellipsis={{ tooltip: evidence.fileName }}>
                    {evidence.fileName}
                  </Typography.Text>
                </div>
              ))}
            </div>
          ) : (
            <Typography.Text type="secondary">{noEvidence}</Typography.Text>
          )}
        </article>
      ))}
    </section>
  )
}

function StatusBanner({
  title,
  text,
  tone = 'info',
}: {
  title: string
  text: string
  tone?: 'info' | 'warning' | 'success'
}) {
  return (
    <div className={`delivery-banner delivery-banner--${tone}`} role="status">
      <span className="delivery-banner__icon" aria-hidden="true">
        {tone === 'success' ? '✓' : tone === 'warning' ? '!' : 'i'}
      </span>
      <div>
        <b>{title}</b>
        <span style={{ whiteSpace: 'pre-line' }}>{text}</span>
      </div>
    </div>
  )
}
