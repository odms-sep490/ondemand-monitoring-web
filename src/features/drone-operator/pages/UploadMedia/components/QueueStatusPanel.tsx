import { Button } from 'antd'
import { useI18n } from '../../../../../shared/i18n'
import { uploadMediaPageMessages } from '../UploadMediaPage.messages'
import { PcBackupPicker } from '../../../../media/components/PcBackupPicker'

export function QueueStatusPanel({
  jobs,
  retry,
  remove,
  backup,
  onRefresh,
}: {
  jobs: {
    id: string
    stage: string
    errorCode?: string
    payload: { candidate: { fileName: string; contentType: string } }
  }[]
  retry: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
  backup: (id: string, file: File) => Promise<void>
  onRefresh: () => void
}) {
  const { t } = useI18n(uploadMediaPageMessages)
  if (!jobs.length) return null
  const failed = jobs.filter((job) => job.stage === 'FAILED').length
  return (
    <details
      className="mission-evidence-queue"
      open={failed > 0 ? true : undefined}
    >
      <summary aria-live="polite">
        {t.queueSummary(
          jobs.filter((job) => job.stage === 'DONE').length,
          jobs.length,
          failed,
        )}
      </summary>
      <p>{t.queueHint}</p>
      {jobs.map((job) => (
        <div className="mission-evidence-queue__row" key={job.id}>
          <span>
            <b>{job.payload.candidate.fileName}</b>
            <small>{t.queueStages[job.stage] ?? t.processing}</small>
          </span>
          {job.stage === 'FAILED' && (
            <Button onClick={() => void retry(job.id).catch(onRefresh)}>
              {t.retryTask}
            </Button>
          )}
          {job.errorCode === 'MANUAL_UPLOAD_REQUIRED' && (
            <PcBackupPicker
              disabled={false}
              contentType={job.payload.candidate.contentType}
              onSelect={(file) => backup(job.id, file)}
            />
          )}
          {['FAILED', 'DONE'].includes(job.stage) && (
            <Button
              type="text"
              onClick={() => void remove(job.id).catch(onRefresh)}
            >
              {t.hideTask}
            </Button>
          )}
        </div>
      ))}
    </details>
  )
}
