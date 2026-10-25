import { useMemo, useState } from 'react'

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
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header Banner */}
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
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div
            className="odm-sk"
            style={{ height: 120, borderRadius: 12, marginBottom: 12 }}
          />
          <div className="odm-sk" style={{ height: 120, borderRadius: 12 }} />
        </div>
      ) : filteredTickets.length === 0 ? (
        <MaintenanceEmpty />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 16,
          }}
        >
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
