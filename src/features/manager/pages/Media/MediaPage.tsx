// MNG-11 · Media và giao kết quả
import { useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { mediaApi } from '../../api/mediaApi'
import '../../manager.css'
import { type ActiveModal } from './mediaTypes'
import { ReassignModal } from './components/ReassignModal'
import { ReuploadModal } from './components/ReuploadModal'
import { DeliverModal } from './components/DeliverModal'
import { MediaLoading } from './components/MediaLoading'
import { MediaLoadError } from './components/MediaLoadError'
import { MediaEmptyState } from './components/MediaEmptyState'
import { MediaHeader } from './components/MediaHeader'
import { MediaTabs } from './components/MediaTabs'
import { ManualUploadTable } from './components/ManualUploadTable'
import { BadMediaTable } from './components/BadMediaTable'
import { WaitingDeliveryList } from './components/WaitingDeliveryList'

export function MediaPage() {
  const [activeTab, setActiveTab] = useState<'man' | 'bad' | 'wait'>('man')
  const [modal, setModal] = useState<ActiveModal>(null)

  const query = useApiQuery((signal) => mediaApi.listNeedsAction(signal), [])
  const data = query.data

  const manualCount = data?.manualUploadTasks.length ?? 0
  const badCount = data?.badMediaItems.length ?? 0
  const waitCount = data?.waitingDeliveryMissions.length ?? 0

  function reload() {
    query.reload()
  }

  if (query.loading && !data) {
    return <MediaLoading />
  }

  if (query.error) {
    return <MediaLoadError reload={reload} />
  }

  const totalItems = manualCount + badCount + waitCount

  if (!data || totalItems === 0) {
    return <MediaEmptyState />
  }

  return (
    <div style={{ position: 'relative' }}>
      <MediaHeader
        manualCount={manualCount}
        badCount={badCount}
        waitCount={waitCount}
      />

      {/* Tabs */}
      <MediaTabs
        manualCount={manualCount}
        badCount={badCount}
        waitCount={waitCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Tab: Manual upload */}
      {activeTab === 'man' && (
        <ManualUploadTable data={data} setModal={setModal} />
      )}

      {/* Tab: Media lỗi validate */}
      {activeTab === 'bad' && <BadMediaTable data={data} setModal={setModal} />}

      {/* Tab: Chờ giao kết quả */}
      {activeTab === 'wait' && (
        <WaitingDeliveryList data={data} setModal={setModal} />
      )}

      {/* Modals */}
      {modal?.kind === 'reassign' && (
        <ReassignModal
          task={modal.task}
          operators={[
            { id: 'op-ngo-thi-lan-phuong', name: 'Ngô Thị Lan Phương' },
            { id: 'op-bui-anh-tuan', name: 'Bùi Anh Tuấn' },
            { id: 'op-hoang-duc-thang', name: 'Hoàng Đức Thắng' },
            { id: 'op-vu-hai-dang', name: 'Vũ Hải Đăng' },
            { id: 'op-do-minh-quan', name: 'Đỗ Minh Quân' },
            { id: 'op-ly-thanh-son', name: 'Lý Thanh Sơn' },
          ]}
          onClose={() => setModal(null)}
          onSuccess={() => {
            setModal(null)
            reload()
          }}
        />
      )}
      {modal?.kind === 'reupload' && (
        <ReuploadModal
          media={modal.media}
          onClose={() => setModal(null)}
          onSuccess={() => {
            setModal(null)
            reload()
          }}
        />
      )}
      {modal?.kind === 'deliver' && (
        <DeliverModal
          mission={modal.mission}
          onClose={() => setModal(null)}
          onSuccess={() => {
            setModal(null)
            reload()
          }}
        />
      )}
    </div>
  )
}
