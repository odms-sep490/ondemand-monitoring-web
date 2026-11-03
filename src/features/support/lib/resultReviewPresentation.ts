import type { SupportTicketDto } from '../api/supportApi'

/** Explicit kinds take precedence; the generated subject identifies legacy revision tickets. */
export function isResultRevisionTicket(ticket: SupportTicketDto): boolean {
  if (ticket.ticketKind) return ticket.ticketKind === 'RESULT_REVISION'
  return Boolean(
    ticket.orderId && ticket.subject === 'Yêu cầu chỉnh sửa kết quả',
  )
}

export function supportTicketSubject(
  ticket: SupportTicketDto,
  revisionSubject: string,
) {
  return ticket.ticketKind === 'RESULT_REVISION' &&
    ticket.subject === 'Yêu cầu chỉnh sửa kết quả'
    ? revisionSubject
    : ticket.subject
}
