import { useEffect, useSyncExternalStore } from 'react'
import { authSession } from '../../auth/api/authSession'
import { UploadQueue } from '../../media/upload/uploadQueue'
import type {
  EvidenceCandidate,
  MissionChecklistExecution,
} from '../types/checklistExecution'
import { checklistEvidenceApi } from '../api/checklistEvidenceApi'
import { checklistExecutionApi } from '../api/checklistExecutionApi'
import { operatorMediaApi } from '../../media/api/operatorMediaApi'

export type EvidenceTransfer = (
  candidate: EvidenceCandidate,
  onPrepared: (id: string) => Promise<void>,
) => Promise<void>
export type EvidenceBackupTransfer = (
  candidate: EvidenceCandidate,
  file: File,
  onPrepared: (id: string) => Promise<void>,
) => Promise<void>
type Selection = {
  candidate: EvidenceCandidate
  executionId: string
  expectedVersion: number
  attachVersion?: number
  mediaId?: string
}
const queues = new Map<string, UploadQueue<Selection>>()
const versions = new Map<string, Map<string, number>>()
const attachLocks = new Map<string, Promise<void>>()
const backups = new Map<string, File>()
function getQueue(scope: string) {
  let queue = queues.get(scope)
  if (!queue) {
    queue = new UploadQueue<Selection>(scope)
    queues.set(scope, queue)
  }
  return queue
}

export function useMissionEvidenceQueue(
  missionId: string,
  transfer?: EvidenceTransfer,
  backupTransfer?: EvidenceBackupTransfer,
) {
  const accountId = authSession.getUser()?.id ?? 'anonymous'
  const scope = `${accountId}:${missionId}`
  const queue = getQueue(scope)
  const jobs = useSyncExternalStore(queue.subscribe, queue.getSnapshot)
  useEffect(() => {
    const current = () =>
      accountId !== 'anonymous' &&
      authSession.getUser()?.id === accountId &&
      !authSession.isLoggedOut()
    queue.bind(async (job, stage) => {
      const stamp = authSession.capture()
      const check = () => {
        if (!current() || !authSession.isCurrent(stamp))
          throw new Error('SESSION_CHANGED')
      }
      const attach = async (id: string) => {
        check()
        stage('ATTACHING')
        const lockKey = `${scope}:${job.payload.executionId}`
        const previous = attachLocks.get(lockKey) ?? Promise.resolve()
        const operation = previous
          .catch(() => undefined)
          .then(async () => {
            check()
            const ownVersions = versions.get(scope) ?? new Map<string, number>()
            versions.set(scope, ownVersions)
            const latestJob = queue
              .getSnapshot()
              .find((entry) => entry.id === job.id)!
            const payload = {
              ...latestJob.payload,
              mediaId: id,
              attachVersion:
                latestJob.payload.attachVersion ??
                Math.max(
                  ownVersions.get(job.payload.executionId) ?? 0,
                  job.payload.expectedVersion,
                ),
            }
            await queue.updatePayload(job.id, payload)
            const currentChecklist =
              await checklistExecutionApi.getMissionChecklistExecutions(
                missionId,
              )
            const alreadyLinked = currentChecklist.executions
              .find((row) => row.id === payload.executionId)
              ?.evidence?.some((file) => file.mediaId === id)
            if (!alreadyLinked) {
              await checklistEvidenceApi.batch(missionId, id, [
                {
                  executionId: payload.executionId,
                  expectedVersion: payload.attachVersion!,
                },
              ])
              ownVersions.set(payload.executionId, payload.attachVersion! + 1)
            }
          })
        attachLocks.set(lockKey, operation)
        try {
          await operation
        } finally {
          if (attachLocks.get(lockKey) === operation)
            attachLocks.delete(lockKey)
        }
        check()
        stage('TRANSFERRING')
      }
      check()
      if (job.payload.mediaId) {
        const status = await operatorMediaApi.status(job.payload.mediaId)
        check()
        if (
          status.status === 'MANUAL_UPLOAD_REQUIRED' &&
          !backups.has(`${scope}:${job.id}`)
        )
          throw Object.assign(new Error('Manual upload required'), {
            code: 'MANUAL_UPLOAD_REQUIRED',
          })
        if (
          ['AVAILABLE', 'PENDING_MANAGER_APPROVAL', 'VALIDATING'].includes(
            status.status,
          )
        ) {
          const checklist =
            await checklistExecutionApi.getMissionChecklistExecutions(missionId)
          const linked = checklist.executions
            .find((row) => row.id === job.payload.executionId)
            ?.evidence?.some((file) => file.mediaId === job.payload.mediaId)
          if (!linked) await attach(job.payload.mediaId)
          backups.delete(`${scope}:${job.id}`)
          stage('VALIDATING')
          return
        }
      }
      if (job.payload.candidate.mediaId.startsWith('local:')) {
        const backupKey = `${scope}:${job.id}`
        const backup = backups.get(backupKey)
        if (backup && backupTransfer) {
          await backupTransfer(job.payload.candidate, backup, attach)
          backups.delete(backupKey)
        } else {
          if (!transfer) throw new Error('LOCAL_MEDIA_UNAVAILABLE')
          await transfer(job.payload.candidate, attach)
        }
      } else {
        const id = job.payload.candidate.mediaId
        await attach(id)
        if (job.payload.candidate.status === 'MANUAL_UPLOAD_REQUIRED') {
          const backupKey = `${scope}:${job.id}`
          const backup = backups.get(backupKey)
          if (!backup || !backupTransfer)
            throw Object.assign(new Error('Manual upload required'), {
              code: 'MANUAL_UPLOAD_REQUIRED',
            })
          await backupTransfer(job.payload.candidate, backup, attach)
          backups.delete(backupKey)
        }
      }
      stage('VALIDATING')
    }, current)
  }, [accountId, missionId, scope, queue, transfer, backupTransfer])
  return {
    jobs,
    async forget(executionId: string, mediaId: string) {
      for (const job of queue.getSnapshot())
        if (
          job.payload.executionId === executionId &&
          (job.payload.mediaId === mediaId ||
            job.payload.candidate.mediaId === mediaId)
        )
          await queue.remove(job.id)
    },
    busy: jobs.some((job) => !['DONE', 'FAILED'].includes(job.stage)),
    blocked: jobs.some((job) => job.stage !== 'DONE'),
    async add(item: MissionChecklistExecution, selected: EvidenceCandidate[]) {
      for (const candidate of selected) {
        // Preview URLs expire and can be sensitive; the picker obtains fresh ones.
        const existing = queue
          .getSnapshot()
          .find(
            (job) =>
              job.key === `${item.id}:${candidate.mediaId}` &&
              job.stage === 'FAILED',
          )
        if (existing) {
          await queue.updatePayload(existing.id, {
            ...existing.payload,
            expectedVersion: item.version,
            attachVersion: undefined,
            candidate: { ...candidate, previewUrl: null, urlExpiresAt: null },
          })
          await queue.retry(existing.id)
          continue
        }
        await queue.enqueue(`${item.id}:${candidate.mediaId}`, {
          executionId: item.id,
          expectedVersion: item.version,
          candidate: { ...candidate, previewUrl: null, urlExpiresAt: null },
        })
      }
    },
    retry: (id: string) => queue.retry(id),
    retryBackup: (id: string, file: File) => {
      backups.set(`${scope}:${id}`, file)
      return queue.retry(id)
    },
    remove: (id: string) => {
      backups.delete(`${scope}:${id}`)
      return queue.remove(id)
    },
  }
}
