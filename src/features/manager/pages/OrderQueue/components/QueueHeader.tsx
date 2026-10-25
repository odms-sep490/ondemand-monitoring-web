import { orderQueuePageMessages } from '../OrderQueuePage.messages'

export function QueueHeader({
  onRefresh,
  t,
}: {
  onRefresh: () => void
  t: (typeof orderQueuePageMessages)['vi']
}) {
  return (
    <div className="odm-mgr-dash-head">
      <div>
        <h1 className="odm-mgr-dash-title">{t.title}</h1>
      </div>
      <button type="button" className="odm-btn" onClick={onRefresh}>
        {t.refresh}
      </button>
    </div>
  )
}
