import { Skeleton } from 'antd'
import { useMemo, useState } from 'react'

import { CardComponent } from '../../../../shared/components/antd'

import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { authSession } from '../../../auth/api/authApi'
import {
  maintenanceTicketApi,
  type MaintenanceTicketDto,
} from '../../api/maintenanceTicketApi'
import { maintenancePageMessages } from './MaintenancePage.messages'
import { maintenanceDeviceLabel } from './maintenanceHelpers'
import { MaintenanceHeader } from './components/MaintenanceHeader'
import { SuccessBanner } from './components/SuccessBanner'
import { MaintenanceTabs } from './components/MaintenanceTabs'
import { MaintenanceEmpty } from './components/MaintenanceEmpty'
import { TicketCard } from './components/TicketCard'
import { ResolveModal } from './components/ResolveModal'

export function MaintenancePage() {
  const { t } = useI18n(maintenancePageMessages)
  const user = authSession.getUser()
  const [activeTab, setActiveTab] = useState<
    'MY_TICKETS' | 'ALL_ACTIVE' | 'RESOLVED'
  >('MY_TICKETS')
  const [selectedTicket, setSelectedTicket] =
    useState<MaintenanceTicketDto | null>(null)
  const [notes, setNotes] = useState('')
  const [targetDroneStatus, setTargetDroneStatus] = useState('AVAILABLE')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const query = useApiQuery(
    (signal) =>
      maintenanceTicketApi.listTickets(undefined, undefined, undefined, signal),
    [],
  )

  const allTickets = query.data || []

  const filteredTickets = useMemo(() => {
    if (activeTab === 'MY_TICKETS') {
      return allTickets.filter(
        (t) =>
          (t.assignedTechnicianId === user?.id ||
            t.assignedTechnicianName === user?.fullName) &&
          (t.status === 'OPEN' || t.status === 'IN_PROGRESS'),
      )
    }
    if (activeTab === 'ALL_ACTIVE') {
      return allTickets.filter(
        (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS',
      )
    }
    return allTickets.filter(
      (t) => t.status === 'RESOLVED' || t.status === 'CLOSED',
    )
  }, [allTickets, activeTab, user])

  const myOpenCount = allTickets.filter(
    (t) =>
      (t.assignedTechnicianId === user?.id ||
        t.assignedTechnicianName === user?.fullName) &&
      (t.status === 'OPEN' || t.status === 'IN_PROGRESS'),
  ).length

  async function handleResolveSubmit() {
    if (!selectedTicket) return
    if (!notes.trim()) {
      setError(t.notesRequiredError)
      return
    }

    setSaving(true)
    setError(null)

    try {
      await maintenanceTicketApi.resolveTicket(selectedTicket.id, {
        resolutionNotes: notes,
        newDeviceStatus: targetDroneStatus,
      })

      setSuccessMsg(
        t.resolveSuccess(
          selectedTicket.ticketCode,
          maintenanceDeviceLabel(selectedTicket),
          targetDroneStatus,
        ),
      )
      setSelectedTicket(null)
      setNotes('')
      query.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : t.resolveFailed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="stf-stack">
      <MaintenanceHeader myOpenCount={myOpenCount} allTickets={allTickets} />

      {successMsg && (
        <SuccessBanner successMsg={successMsg} setSuccessMsg={setSuccessMsg} />
      )}

      {/* Tabs */}
      <MaintenanceTabs
        setActiveTab={setActiveTab}
        activeTab={activeTab}
        myOpenCount={myOpenCount}
        allTickets={allTickets}
      />

      {/* Ticket List */}
      {query.loading ? (
        <div className="stf-ticket-grid" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <CardComponent key={i}>
              <Skeleton active paragraph={{ rows: 3 }} />
            </CardComponent>
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <MaintenanceEmpty />
      ) : (
        <div className="stf-ticket-grid">
          {filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              setSelectedTicket={setSelectedTicket}
              setError={setError}
            />
          ))}
        </div>
      )}

      {/* Resolution Modal */}
      {selectedTicket && (
        <ResolveModal
          setSelectedTicket={setSelectedTicket}
          selectedTicket={selectedTicket}
          notes={notes}
          setNotes={setNotes}
          targetDroneStatus={targetDroneStatus}
          setTargetDroneStatus={setTargetDroneStatus}
          error={error}
          saving={saving}
          handleResolveSubmit={handleResolveSubmit}
        />
      )}
    </div>
  )
}
