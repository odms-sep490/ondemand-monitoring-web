import { describe, expect, it } from 'vitest'
import type { SupportTicketDto } from '../api/supportApi'
import { ticketLabelsMessages } from './ticketLabels.messages'
import {
  isResultRevisionTicket,
  supportTicketSubject,
} from './resultReviewPresentation'

describe('result review system content', () => {
  it('distinguishes legacy result revisions from normal order support tickets', () => {
    const ticket = {
      orderId: 'order-1',
      subject: 'Hỏi về lịch bay',
    } as SupportTicketDto
    expect(isResultRevisionTicket(ticket)).toBe(false)
    expect(
      isResultRevisionTicket({ ...ticket, ticketKind: 'RESULT_REVISION' }),
    ).toBe(true)
    const legacy = { ...ticket, subject: 'Yêu cầu chỉnh sửa kết quả' }
    expect(isResultRevisionTicket(legacy)).toBe(true)
    expect(isResultRevisionTicket({ ...legacy, ticketKind: 'GENERAL' })).toBe(
      false,
    )
  })

  it('localizes only the generated result revision subject', () => {
    const ticket = {
      ticketKind: 'RESULT_REVISION',
      subject: 'Yêu cầu chỉnh sửa kết quả',
    } as SupportTicketDto
    expect(
      supportTicketSubject(ticket, ticketLabelsMessages.en.revisionSubject),
    ).toBe('Result revision request')
    expect(
      supportTicketSubject(
        { ...ticket, subject: 'Roof issue' },
        ticketLabelsMessages.vi.revisionSubject,
      ),
    ).toBe('Roof issue')
  })
})
