import { useState } from 'react'

import { authSession } from '../../../auth/api/authApi'
import { supportApi, type SupportTicketDto } from '../../api/supportApi'

type ErrorLabels = { reply: string; status: string; assign: string; unknown: string }

/** Reply / status / assignment calls for the ticket open in the detail drawer. */
export function useTicketActions(
  selectedTicket: SupportTicketDto | null,
  setSelectedTicket: (ticket: SupportTicketDto | null) => void,
  reload: () => void,
  labels: ErrorLabels,
) {
  const [replyText, setReplyText] = useState('')
  const [replyAttachment, setReplyAttachment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const messageOf = (err: unknown) =>
    err instanceof Error ? err.message : labels.unknown

  async function sendReply() {
    if (!selectedTicket || !replyText.trim()) return
    setActionLoading(true)

    const currentUser = authSession.getUser()

    try {
      await supportApi.addMessage(selectedTicket.id, {
        senderId: currentUser?.id,
        senderName:
          currentUser?.fullName || currentUser?.email || 'Support Agent',
        senderRole: 'STAFF',
        content: replyText,
        attachmentUrl: replyAttachment.trim() || undefined,
      })

      setReplyText('')
      setReplyAttachment('')
      const updated = await supportApi.getTicketById(selectedTicket.id)
      setSelectedTicket(updated)
      reload()
    } catch (err) {
      alert(labels.reply + messageOf(err))
    } finally {
      setActionLoading(false)
    }
  }

  async function updateStatus(status: string) {
    if (!selectedTicket) return
    setActionLoading(true)

    try {
      const updated = await supportApi.updateTicketStatus(selectedTicket.id, {
        status,
      })
      setSelectedTicket(updated)
      reload()
    } catch (err) {
      alert(labels.status + messageOf(err))
    } finally {
      setActionLoading(false)
    }
  }

  async function assignStaff(staffId: string, staffName: string) {
    if (!selectedTicket) return
    setActionLoading(true)

    try {
      const updated = await supportApi.updateTicketStatus(selectedTicket.id, {
        assignedStaffId: staffId,
        assignedStaffName: staffName,
        status:
          selectedTicket.status === 'OPEN' ? 'ASSIGNED' : selectedTicket.status,
      })
      setSelectedTicket(updated)
      reload()
    } catch (err) {
      alert(labels.assign + messageOf(err))
    } finally {
      setActionLoading(false)
    }
  }

  return {
    replyText,
    setReplyText,
    replyAttachment,
    setReplyAttachment,
    actionLoading,
    sendReply,
    updateStatus,
    assignStaff,
  }
}
