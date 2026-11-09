import { Button } from 'antd'
import { useState } from 'react'

import {
  ErrorState,
  LoadingState,
} from '../../../customer/components/common/StateView'
import {
  Card,
  EmptyState,
  PageHeader,
} from '../../../customer/components/common/ui'
import { useI18n } from '../../../../shared/i18n'
import { CreateTicketModal } from '../../components/CreateTicketModal'
import { ticketLabelsMessages } from '../../lib/ticketLabels.messages'
import '../../support.css'
import { TicketRow } from './components/TicketRow'
import './CustomerTicketsList.css'
import { customerTicketsListMessages } from './CustomerTicketsListPage.messages'
import { useTicketsList } from './hooks/useTicketsList'

/** Status values the customer can filter by. */
const FILTERS = [
  'OPEN',
  'IN_PROGRESS',
  'WAITING_FOR_CUSTOMER',
  'RESOLVED',
] as const

export function CustomerTicketsListPage() {
  const { t } = useI18n(customerTicketsListMessages)
  const { t: labels } = useI18n(ticketLabelsMessages)
  const list = useTicketsList()
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div className="sp-page">
      <PageHeader
        back={<a href="#help">{t.back}</a>}
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <Button type="primary" onClick={() => setShowCreateModal(true)}>
            {t.create}
          </Button>
        }
      />

      <Card>
        <div className="tl-bar">
          <div>
            {t.total}: <strong>{list.tickets.length}</strong>
          </div>
          <label className="tl-filter">
            <span className="sp-muted">{t.filter}</span>
            <select
              className="sp-input"
              value={list.statusFilter}
              onChange={(e) => list.setStatusFilter(e.target.value)}
            >
              <option value="ALL">{t.all}</option>
              {FILTERS.map((status) => (
                <option key={status} value={status}>
                  {labels.status[status]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {list.loading && !list.loaded && <LoadingState />}
      {!list.loaded && !list.loading && (
        <ErrorState
          title={t.errorTitle}
          error={list.error}
          onRetry={list.reload}
        />
      )}
      {list.loaded && list.tickets.length === 0 && (
        <Card>
          <EmptyState
            title={t.emptyTitle}
            description={t.emptyDescription}
            action={
              <Button type="primary" onClick={() => setShowCreateModal(true)}>
                {t.emptyAction}
              </Button>
            }
          />
        </Card>
      )}
      {list.loaded && list.tickets.length > 0 && (
        <ul className="tl-list">
          {list.tickets.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} />
          ))}
        </ul>
      )}

      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => list.reload()}
        />
      )}
    </div>
  )
}
