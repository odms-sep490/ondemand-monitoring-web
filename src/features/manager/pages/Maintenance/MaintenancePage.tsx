// MNG-10: Maintenance ticket list with Manager Search, Filter & System Operator Assignment Workflow
import { useMemo, useState } from 'react'
import { Select } from 'antd'

import { CardComponent } from '../../../../shared/components/antd'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { getTicketSeverityLabel, getTicketStatusLabel } from '../../../../shared/lib/statusTone'
import type { TicketStatus } from '../../../../shared/types/domain'
import { maintenanceApi } from '../../api/maintenanceApi'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { FilterBar, FilterSegments } from '../../components/common/FilterBar'
import { PageHeader } from '../../components/common/PageHeader'
import type { MaintenanceTicket } from '../../types/maintenance'
import '../../manager.css'
import './maintenance.scss'
import { AssignModal } from './components/AssignModal'
import { DetailPanel } from './components/DetailPanel'
import { MaintenanceKpis } from './components/MaintenanceKpis'
import { MaintenanceSkeleton } from './components/MaintenanceSkeleton'
import { TicketTable } from './components/TicketTable'
import { COLUMNS, SEVERITIES } from './maintenanceHelpers'
import { maintenancePageMessages } from './MaintenancePage.messages'

type StatusFilter = 'ALL' | TicketStatus

export function MaintenancePage() {
  const { t, lang } = useI18n(maintenancePageMessages)
  const [tickets, setTickets] = useState<MaintenanceTicket[] | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null)
  const [assignTicket, setAssignTicket] = useState<MaintenanceTicket | null>(null)

  // Manager Search & Filter controls state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')
  const [assignedFilter, setAssignedFilter] = useState<string>('ALL')

  const query = useApiQuery((signal) => maintenanceApi.listTickets({ signal }), [])

  const allTickets = useMemo(() => tickets ?? query.data?.items ?? [], [tickets, query.data?.items])

  // Search, priority and assignment narrow the list; the status segments then split it.
  const narrowed = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return allTickets.filter((ticket) => {
      const matchQuery =
        !q ||
        ticket.code.toLowerCase().includes(q) ||
        ticket.droneCode.toLowerCase().includes(q) ||
        ticket.title.toLowerCase().includes(q) ||
        (!!ticket.assignedTo && ticket.assignedTo.toLowerCase().includes(q))
      const matchPriority = priorityFilter === 'ALL' || ticket.priority === priorityFilter
      const matchAssigned =
        assignedFilter === 'ALL' ||
        (assignedFilter === 'UNASSIGNED' && !ticket.assignedTo) ||
        (assignedFilter === 'ASSIGNED' && !!ticket.assignedTo)
      return matchQuery && matchPriority && matchAssigned
    })
  }, [allTickets, searchQuery, priorityFilter, assignedFilter])

  const visible = useMemo(
    () => (statusFilter === 'ALL' ? narrowed : narrowed.filter((ticket) => ticket.status === statusFilter)),
    [narrowed, statusFilter],
  )

  const isActive = (ticket: MaintenanceTicket) => ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS'
  const unassignedCount = allTickets.filter((ticket) => isActive(ticket) && !ticket.assignedTo).length
  const urgentCount = allTickets.filter(
    (ticket) => isActive(ticket) && (ticket.priority === 'CRITICAL' || ticket.priority === 'HIGH'),
  ).length
  const resolvedCount = allTickets.filter(
    (ticket) => ticket.status === 'RESOLVED' || ticket.status === 'CLOSED',
  ).length

  function handleTicketUpdated(updated: MaintenanceTicket) {
    const base = tickets ?? query.data?.items ?? []
    setTickets(base.map((ticket) => (ticket.id === updated.id ? updated : ticket)))
    if (selectedTicket?.id === updated.id) setSelectedTicket(updated)
    setAssignTicket(null)
  }

  const ready = !query.loading && !query.error

  return (
    <div className="mgr-view mgr-maintenance">
      <PageHeader title={t.page.title} description={t.page.subtitle} />

      {ready ? (
        <MaintenanceKpis
          unassignedCount={unassignedCount}
          urgentCount={urgentCount}
          resolvedCount={resolvedCount}
        />
      ) : null}

      <FilterBar
        start={
          <FilterSegments<StatusFilter>
            ariaLabel={t.page.statusAria}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'ALL', label: t.page.statusAll, count: narrowed.length },
              ...COLUMNS.map((status) => ({
                value: status,
                label: getTicketStatusLabel(status, lang),
                count: narrowed.filter((ticket) => ticket.status === status).length,
              })),
            ]}
          />
        }
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: t.page.searchPlaceholder,
          ariaLabel: t.page.searchAria,
        }}
        end={
          <>
            <Select
              aria-label={t.page.priorityAria}
              value={priorityFilter}
              onChange={setPriorityFilter}
              popupMatchSelectWidth={false}
              options={[
                { value: 'ALL', label: t.page.priorityAll },
                ...[...SEVERITIES].reverse().map((severity) => ({
                  value: severity,
                  label: getTicketSeverityLabel(severity, lang),
                })),
              ]}
            />
            <Select
              aria-label={t.page.assignedAria}
              value={assignedFilter}
              onChange={setAssignedFilter}
              popupMatchSelectWidth={false}
              options={[
                { value: 'ALL', label: t.page.assignedAll },
                { value: 'UNASSIGNED', label: t.page.assignedUnassigned },
                { value: 'ASSIGNED', label: t.page.assignedAssigned },
              ]}
            />
          </>
        }
      />

      {query.loading && <MaintenanceSkeleton />}

      {!query.loading && !!query.error && (
        <ErrorState title={t.page.loadError} error={query.error} onRetry={query.reload} />
      )}

      {ready && visible.length === 0 && (
        <CardComponent>
          <EmptyState title={t.page.emptyTitle} description={t.page.emptyDescription} />
        </CardComponent>
      )}

      {ready && visible.length > 0 && (
        <TicketTable
          rows={visible}
          total={allTickets.length}
          selectedId={selectedTicket?.id ?? null}
          onSelect={setSelectedTicket}
          onAssign={setAssignTicket}
        />
      )}

      {selectedTicket && (
        <DetailPanel
          key={selectedTicket.id}
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onAssignClick={setAssignTicket}
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
