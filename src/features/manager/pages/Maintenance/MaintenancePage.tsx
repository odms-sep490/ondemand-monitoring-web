// MNG-10: Maintenance ticket list with Manager Search, Filter & System Operator Assignment Workflow
import { useMemo, useState } from 'react'
import { AuditOutlined } from '@ant-design/icons'

import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import type { TicketStatus } from '../../../../shared/types/domain'
import { maintenanceWorkflowApi } from '../../../maintenance-workflow/api/maintenanceWorkflowApi'
import { MaintenanceWorkflowDrawer } from '../../../maintenance-workflow/components/MaintenanceWorkflowDrawer'
import { maintenanceWorkflowMessages } from '../../../maintenance-workflow/messages'
import { maintenanceApi } from '../../api/maintenanceApi'
import { ErrorState } from '../../components/common/ErrorState'
import { PageHeader } from '../../components/common/PageHeader'
import type { MaintenanceTicket } from '../../types/maintenance'
import '../../manager.css'
import './maintenance.scss'
import { MaintenanceSkeleton } from './components/MaintenanceSkeleton'
import { MaintenanceStats } from './components/MaintenanceStats'
import { TicketBoard } from './components/TicketBoard'
import { TicketFilterBar } from './components/TicketFilterBar'
import { DetailPanel } from './components/DetailPanel'
import { maintenancePageMessages } from './MaintenancePage.messages'

export function MaintenancePage() {
  const { t } = useI18n(maintenancePageMessages)
  const { t: wf } = useI18n(maintenanceWorkflowMessages)
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null)
  const [workflowTicketId, setWorkflowTicketId] = useState<string | null>(null)

  // Manager Search & Filter controls state
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')
  const [assignedFilter, setAssignedFilter] = useState<string>('ALL')

  const query = useApiQuery((signal) => maintenanceApi.listTickets({ signal }), [])
  const acceptanceQueue = useApiQuery(
    (signal) =>
      maintenanceWorkflowApi
        .listManagerAcceptanceQueue(false, signal)
        .catch(() => []),
    [],
  )

  const allTickets = useMemo(() => query.data?.items ?? [], [query.data?.items])

  // Search, priority and assignment narrow the list; the board then splits it by status.
  const filteredTickets = useMemo(() => {
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

  const byColumn = useMemo(() => {
    const map: Record<TicketStatus, MaintenanceTicket[]> = { OPEN: [], IN_PROGRESS: [], RESOLVED: [], CLOSED: [] }
    for (const ticket of filteredTickets) map[ticket.status]?.push(ticket)
    return map
  }, [filteredTickets])

  const isActive = (ticket: MaintenanceTicket) => ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS'
  const unassignedCount = allTickets.filter((ticket) => isActive(ticket) && !ticket.assignedTo).length
  const urgentCount = allTickets.filter(
    (ticket) => isActive(ticket) && (ticket.priority === 'CRITICAL' || ticket.priority === 'HIGH'),
  ).length
  const openCount = allTickets.filter((ticket) => ticket.status === 'OPEN').length
  const inProgressCount = allTickets.filter((ticket) => ticket.status === 'IN_PROGRESS').length
  const resolvedCount = allTickets.filter(
    (ticket) => ticket.status === 'RESOLVED' || ticket.status === 'CLOSED',
  ).length

  return (
    <div className="mgr-view mgr-maintenance">
      <PageHeader
        title={t.page.title}
        description={t.page.subtitle}
      />

      <MaintenanceStats
        unassignedCount={unassignedCount}
        urgentCount={urgentCount}
        resolvedCount={resolvedCount}
        openCount={openCount}
        inProgressCount={inProgressCount}
        totalCount={allTickets.length}
      />

      {(acceptanceQueue.data?.length ?? 0) > 0 && (
        <section className="mgr-maint-accept-banner">
          <div className="mgr-maint-accept-head">
            <h3 className="mgr-maint-accept-title">
              <AuditOutlined />
              <span>{wf.queues.managerAcceptance}</span>
              <span className="mgr-maint-accept-count">
                {acceptanceQueue.data?.length ?? 0}
              </span>
            </h3>
          </div>
          <div className="mgr-maint-accept-grid">
            {acceptanceQueue.data?.map((item) => (
              <button
                key={item.ticketId}
                type="button"
                className="mgr-maint-accept-item"
                onClick={() => setWorkflowTicketId(item.ticketId)}
              >
                <div className="mgr-maint-accept-info">
                  <span className="mgr-maint-accept-code">{item.ticketCode}</span>
                  <span className="mgr-maint-accept-device">
                    {item.device?.name ?? '—'}
                  </span>
                </div>
                <span className="mgr-maint-accept-round">
                  {wf.roundShort(item.currentRound)}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <TicketFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        assignedFilter={assignedFilter}
        setAssignedFilter={setAssignedFilter}
      />

      {query.loading && <MaintenanceSkeleton />}

      {!query.loading && !!query.error && (
        <ErrorState title={t.page.loadError} error={query.error} onRetry={query.reload} />
      )}

      {!query.loading && !query.error && (
        <>
          <TicketBoard
            byColumn={byColumn}
            selectedTicket={selectedTicket}
            setSelectedTicket={setSelectedTicket}
          />
          {selectedTicket && (
            <DetailPanel
              key={selectedTicket.id}
              ticket={selectedTicket}
              onClose={() => setSelectedTicket(null)}
              onOpenWorkflow={(ticket) => setWorkflowTicketId(ticket.id)}
            />
          )}
          <MaintenanceWorkflowDrawer
            ticketId={workflowTicketId}
            open={workflowTicketId !== null}
            onClose={() => setWorkflowTicketId(null)}
            onWorkflowChanged={() => {
              query.reload()
              acceptanceQueue.reload()
            }}
          />
        </>
      )}

    </div>
  )
}
