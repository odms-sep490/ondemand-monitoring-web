// MNG-10: Maintenance ticket kanban board with Manager Search, Filter & System Operator Assignment Workflow
import { useMemo, useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import type { TicketStatus } from '../../../../shared/types/domain'
import { maintenanceApi } from '../../api/maintenanceApi'
import type { MaintenanceTicket } from '../../types/maintenance'
import '../../manager.css'
import { AssignModal } from './components/AssignModal'
import { CreateModal } from './components/CreateModal'
import { MaintenanceStats } from './components/MaintenanceStats'
import { TicketFilterBar } from './components/TicketFilterBar'
import { MaintenanceLoadError } from './components/MaintenanceLoadError'
import { TicketBoard } from './components/TicketBoard'

export function MaintenancePage() {
  const [tickets, setTickets] = useState<MaintenanceTicket[] | null>(null)
  const [selectedTicket, setSelectedTicket] =
    useState<MaintenanceTicket | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [assignTicket, setAssignTicket] = useState<MaintenanceTicket | null>(
    null,
  )

  // Manager Search & Filter controls state
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')
  const [assignedFilter, setAssignedFilter] = useState<string>('ALL')

  const query = useApiQuery(
    (signal) => maintenanceApi.listTickets({ signal }),
    [],
  )

  const allTickets = tickets ?? query.data?.items ?? []

  // Filtered tickets based on search query, priority, and assignment status
  const filteredTickets = useMemo(() => {
    return allTickets.filter((t) => {
      // Search text check
      const q = searchQuery.toLowerCase().trim()
      const matchQuery =
        !q ||
        t.code.toLowerCase().includes(q) ||
        t.droneCode.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        (t.assignedTo && t.assignedTo.toLowerCase().includes(q))

      // Priority check
      const matchPriority =
        priorityFilter === 'ALL' || t.priority === priorityFilter

      // Assigned check
      const matchAssigned =
        assignedFilter === 'ALL' ||
        (assignedFilter === 'UNASSIGNED' && !t.assignedTo) ||
        (assignedFilter === 'ASSIGNED' && !!t.assignedTo)

      return matchQuery && matchPriority && matchAssigned
    })
  }, [allTickets, searchQuery, priorityFilter, assignedFilter])

  const byColumn = useMemo(() => {
    const map: Record<TicketStatus, MaintenanceTicket[]> = {
      OPEN: [],
      IN_PROGRESS: [],
      RESOLVED: [],
      CLOSED: [],
    }
    for (const t of filteredTickets) {
      map[t.status]?.push(t)
    }
    return map
  }, [filteredTickets])

  const unassignedCount = allTickets.filter(
    (t) => (t.status === 'OPEN' || t.status === 'IN_PROGRESS') && !t.assignedTo,
  ).length
  const urgentCount = allTickets.filter(
    (t) =>
      (t.status === 'OPEN' || t.status === 'IN_PROGRESS') &&
      (t.priority === 'CRITICAL' || t.priority === 'HIGH'),
  ).length
  const resolvedCount = allTickets.filter(
    (t) => t.status === 'RESOLVED' || t.status === 'CLOSED',
  ).length

  function handleTicketUpdated(updated: MaintenanceTicket) {
    const base = tickets ?? query.data?.items ?? []
    setTickets(base.map((t) => (t.id === updated.id ? updated : t)))
    if (selectedTicket?.id === updated.id) {
      setSelectedTicket(updated)
    }
    setAssignTicket(null)
  }

  function handleCreated(ticket: MaintenanceTicket) {
    const base = tickets ?? query.data?.items ?? []
    setTickets([ticket, ...base])
    setShowCreate(false)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '0 4px',
      }}
    >
      {/* Header Banner & Stats */}
      <MaintenanceStats
        unassignedCount={unassignedCount}
        urgentCount={urgentCount}
        resolvedCount={resolvedCount}
        setShowCreate={setShowCreate}
      />

      {/* Search & Filter Toolbar */}
      <TicketFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        assignedFilter={assignedFilter}
        setAssignedFilter={setAssignedFilter}
      />

      {/* Content */}
      {query.loading && (
        <div style={{ padding: 40, textAlign: 'center' }} aria-busy="true">
          <div className="odm-sk" style={{ height: 300, borderRadius: 12 }} />
        </div>
      )}

      {!query.loading && !!query.error && (
        <MaintenanceLoadError query={query} />
      )}

      {!query.loading && !query.error && (
        <TicketBoard
          byColumn={byColumn}
          selectedTicket={selectedTicket}
          setSelectedTicket={setSelectedTicket}
          setAssignTicket={setAssignTicket}
        />
      )}

      {/* Modals */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreated}
        />
      )}

      {assignTicket && (
        <AssignModal
          ticket={assignTicket}
          onClose={() => setAssignTicket(null)}
          onAssigned={handleTicketUpdated}
        />
      )}
    </div>
  )
}
