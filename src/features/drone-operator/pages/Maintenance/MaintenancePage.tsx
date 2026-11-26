import { useMemo, useState } from 'react'

import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { authSession } from '../../../auth/api/authApi'
import { maintenanceWorkflowApi } from '../../../maintenance-workflow/api/maintenanceWorkflowApi'
import { MaintenanceWorkflowDrawer } from '../../../maintenance-workflow/components/MaintenanceWorkflowDrawer'
import { maintenanceWorkflowMessages } from '../../../maintenance-workflow/messages'
import {
  maintenanceTicketApi,
  type MaintenanceTicketDto,
} from '../../api/maintenanceTicketApi'
import { MaintenanceHeader } from './components/MaintenanceHeader'
import { SuccessBanner } from './components/SuccessBanner'
import { MaintenanceTabs } from './components/MaintenanceTabs'
import { MaintenanceEmpty } from './components/MaintenanceEmpty'
import { TicketCard } from './components/TicketCard'

export function MaintenancePage() {
  const { t: wf } = useI18n(maintenanceWorkflowMessages)
  const user = authSession.getUser()
  const [activeTab, setActiveTab] = useState<
    'MY_TICKETS' | 'ALL_ACTIVE' | 'RESOLVED'
  >('MY_TICKETS')
  const [workflowTicketId, setWorkflowTicketId] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const query = useApiQuery(
    (signal) =>
      maintenanceTicketApi.listTickets(undefined, undefined, undefined, signal),
    [],
  )
  const techQueue = useApiQuery(
    (signal) =>
      maintenanceWorkflowApi.listTechnicalQueue('ALL', signal).catch(() => []),
    [],
  )

  // Unclaimed tickets any qualified Technical can take, most severe first (ordered by the backend).
  const sharedPool = useApiQuery(
    (signal) =>
      maintenanceWorkflowApi.listTechnicalQueue('POOL', signal).catch(() => []),
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

  const handleOpenWorkflow = (
    ticketOrUpdater:
      | MaintenanceTicketDto
      | null
      | ((prev: MaintenanceTicketDto | null) => MaintenanceTicketDto | null),
  ) => {
    const resolved =
      typeof ticketOrUpdater === 'function'
        ? ticketOrUpdater(null)
        : ticketOrUpdater
    if (resolved?.id) {
      setWorkflowTicketId(resolved.id)
    }
  }

  return (
    <div className="odm-opr-page">
      {/* Header Banner */}
      <MaintenanceHeader myOpenCount={myOpenCount} allTickets={allTickets} />

      <section className="mw-queue-panel">
        <div className="mw-queue-header">
          <h3 className="mw-queue-title">
            <span>{wf.queues.sharedPool}</span>
            <span className="mw-sheet-count">
              {sharedPool.data?.length ?? 0}
            </span>
          </h3>
        </div>
        {(sharedPool.data?.length ?? 0) === 0 ? (
          <div className="mw-empty-state">{wf.queues.sharedPoolEmpty}</div>
        ) : (
          <div className="mw-queue-grid">
            {sharedPool.data?.map((item) => {
              const urgent =
                item.severity === 'CRITICAL' || item.severity === 'HIGH'
              return (
                <button
                  key={item.ticketId}
                  type="button"
                  className={`mw-queue-item${urgent ? ' mw-queue-item--urgent' : ''}`}
                  onClick={() => setWorkflowTicketId(item.ticketId)}
                >
                  <div className="mw-queue-item-main">
                    <div className="mw-queue-item-code">{item.ticketCode}</div>
                    <div className="mw-queue-item-device">
                      {item.device?.name ?? '—'}
                    </div>
                  </div>
                  <span
                    className={`mw-chip ${urgent ? 'mw-chip--crimson' : 'mw-chip--cobalt'}`}
                  >
                    {wf.severity[item.severity] ?? item.severity}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {(techQueue.data?.length ?? 0) > 0 && (
        <section className="mw-queue-panel">
          <div className="mw-queue-header">
            <h3 className="mw-queue-title">
              <span>
                {wf.queues.techAwaitingReceipt} / {wf.queues.techInProgress}
              </span>
              <span className="mw-sheet-count">
                {techQueue.data?.length ?? 0}
              </span>
            </h3>
          </div>
          <div className="mw-queue-grid">
            {techQueue.data?.map((item) => {
              const awaitingReceipt =
                item.stage === 'AWAITING_TECHNICAL_RECEIPT'
              return (
                <button
                  key={item.ticketId}
                  type="button"
                  className="mw-queue-item"
                  onClick={() => setWorkflowTicketId(item.ticketId)}
                >
                  <div className="mw-queue-item-main">
                    <div className="mw-queue-item-code">{item.ticketCode}</div>
                    <div className="mw-queue-item-device">
                      {item.device?.name ?? '—'}
                    </div>
                  </div>
                  <span
                    className={`mw-chip ${awaitingReceipt ? 'mw-chip--amber' : 'mw-chip--cobalt'}`}
                  >
                    {wf.stages[item.stage] ?? item.stage}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}

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
              setSelectedTicket={handleOpenWorkflow}
              setError={() => undefined}
            />
          ))}
        </div>
      )}

      {/* Maintenance Workflow Drawer */}
      <MaintenanceWorkflowDrawer
        ticketId={workflowTicketId}
        open={workflowTicketId !== null}
        onClose={() => setWorkflowTicketId(null)}
        onWorkflowChanged={() => {
          query.reload()
          techQueue.reload()
          sharedPool.reload()
        }}
      />
    </div>
  )
}
