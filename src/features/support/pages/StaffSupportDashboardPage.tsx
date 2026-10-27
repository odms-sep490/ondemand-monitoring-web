import { useState } from 'react'

import { authSession } from '../../auth/api/authApi'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { managerHref } from '../../manager/routes'
import { supportApi, type SupportTicketDto } from '../api/supportApi'
import {
  getTopHelpfulArticles,
  getTotalHelpfulVotes,
} from '../utils/faqAnalytics'

export function StaffSupportDashboardPage() {
  const role = authSession.getUser()?.role
  const canManage = role === 'MANAGER' || role === 'ADMIN'
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketDto | null>(
    null,
  )
  const [replyText, setReplyText] = useState('')
  const [replyAttachment, setReplyAttachment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const query = useApiQuery(
    (signal) => supportApi.listTickets(undefined, undefined, signal),
    [],
  )

  const staffAgentsQuery = useApiQuery(
    (signal) =>
      canManage ? supportApi.getStaffAgents(signal) : Promise.resolve([]),
    [canManage],
  )
  const staffAgents = staffAgentsQuery.data || []

  const analyticsQuery = useApiQuery(
    (signal) =>
      canManage ? supportApi.getAnalytics(signal) : Promise.resolve(undefined),
    [canManage],
  )
  const backendAnalytics = analyticsQuery.data

  const allTickets = query.data || []

  // Metrics computed across all tickets in queue
  const openCount = allTickets.filter((t) => t.status === 'OPEN').length
  const inProgressCount = allTickets.filter(
    (t) =>
      t.status === 'IN_PROGRESS' ||
      t.status === 'ASSIGNED' ||
      t.status === 'WAITING_FOR_STAFF',
  ).length
  const waitingCustomerCount = allTickets.filter(
    (t) =>
      t.status === 'WAITING_FOR_CUSTOMER' ||
      (t.status as string) === 'WAITING_CUSTOMER',
  ).length
  const resolvedCount = allTickets.filter(
    (t) => t.status === 'RESOLVED' || t.status === 'CLOSED',
  ).length

  // Dynamic FAQ Deflection & SLA Metrics (Backend REST API with local fallback)
  const totalHelpfulVotes =
    backendAnalytics?.totalHelpfulVotes ?? getTotalHelpfulVotes()
  const totalTicketsCount = backendAnalytics?.totalTickets ?? allTickets.length

  const deflectionRate =
    backendAnalytics?.deflectionRate ??
    (totalTicketsCount + totalHelpfulVotes > 0
      ? Math.round(
          (totalHelpfulVotes / (totalHelpfulVotes + totalTicketsCount)) * 1000,
        ) / 10
      : 0)

  let handledCount = 0
  let totalResponseMinutes = 0
  let slaMetCount = 0

  allTickets.forEach((t) => {
    let responseTimeMins: number | null = null
    if (t.messages && t.messages.length > 0) {
      const firstStaffMsg = t.messages.find(
        (m) => m.senderRole === 'STAFF' || m.senderRole === 'MANAGER',
      )
      if (firstStaffMsg) {
        const openTime = new Date(t.openedAt).getTime()
        const respTime = new Date(firstStaffMsg.createdAt).getTime()
        if (respTime >= openTime) {
          responseTimeMins = (respTime - openTime) / (1000 * 60)
        }
      }
    }
    if (responseTimeMins === null && t.resolvedAt) {
      const openTime = new Date(t.openedAt).getTime()
      const resolveTime = new Date(t.resolvedAt).getTime()
      if (resolveTime >= openTime) {
        responseTimeMins = (resolveTime - openTime) / (1000 * 60)
      }
    }

    if (responseTimeMins !== null && !isNaN(responseTimeMins)) {
      handledCount++
      totalResponseMinutes += responseTimeMins
      if (responseTimeMins <= 30) {
        slaMetCount++
      }
    }
  })

  const avgResponseTimeMins =
    backendAnalytics?.avgResponseTimeMins ??
    (handledCount > 0 ? (totalResponseMinutes / handledCount).toFixed(1) : '0')
  const slaComplianceRate =
    backendAnalytics?.slaComplianceRate ??
    (handledCount > 0 ? ((slaMetCount / handledCount) * 100).toFixed(1) : '100')

  const topHelpfulArticles =
    backendAnalytics?.topHelpfulArticles &&
    backendAnalytics.topHelpfulArticles.length > 0
      ? backendAnalytics.topHelpfulArticles.map((a) => ({
          id: a.articleId,
          question: a.articleQuestion,
          votesCount: a.votesCount,
        }))
      : getTopHelpfulArticles(3)

  const ordersCatCount = allTickets.filter(
    (t) => t.category === 'ORDERS',
  ).length
  const missionsCatCount = allTickets.filter(
    (t) => t.category === 'MISSIONS' || t.category === 'SCHEDULING',
  ).length

  const ordersPct =
    backendAnalytics?.categoryBreakdown?.ORDERS ??
    (totalTicketsCount > 0
      ? Math.round((ordersCatCount / totalTicketsCount) * 100)
      : 0)
  const missionsPct =
    backendAnalytics?.categoryBreakdown?.MISSIONS ??
    (totalTicketsCount > 0
      ? Math.round((missionsCatCount / totalTicketsCount) * 100)
      : 0)
  const mediaPct =
    backendAnalytics?.categoryBreakdown?.MEDIA ??
    (totalTicketsCount > 0 ? Math.max(0, 100 - ordersPct - missionsPct) : 0)

  const filtered = allTickets.filter((t) => {
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'OPEN' && t.status !== 'OPEN') return false
      if (
        statusFilter === 'IN_PROGRESS' &&
        !(
          t.status === 'IN_PROGRESS' ||
          t.status === 'ASSIGNED' ||
          t.status === 'WAITING_FOR_STAFF'
        )
      )
        return false
      if (
        statusFilter === 'WAITING_FOR_CUSTOMER' &&
        !(
          t.status === 'WAITING_FOR_CUSTOMER' ||
          (t.status as string) === 'WAITING_CUSTOMER'
        )
      )
        return false
      if (
        statusFilter === 'RESOLVED' &&
        !(t.status === 'RESOLVED' || t.status === 'CLOSED')
      )
        return false
      if (
        statusFilter !== 'OPEN' &&
        statusFilter !== 'IN_PROGRESS' &&
        statusFilter !== 'WAITING_FOR_CUSTOMER' &&
        statusFilter !== 'RESOLVED' &&
        t.status !== statusFilter
      )
        return false
    }
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const match =
        t.ticketCode.toLowerCase().includes(q) ||
        t.customerName?.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.orderId && t.orderId.toLowerCase().includes(q)) ||
        (t.missionId && t.missionId.toLowerCase().includes(q))
      if (!match) return false
    }
    return true
  })

  async function handleSendReply() {
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
      query.reload()
    } catch (err) {
      alert(
        'Error sending reply: ' +
          (err instanceof Error ? err.message : 'Unknown error'),
      )
    } finally {
      setActionLoading(false)
    }
  }

  async function handleUpdateStatus(status: string) {
    if (!selectedTicket) return
    setActionLoading(true)

    try {
      const updated = await supportApi.updateTicketStatus(selectedTicket.id, {
        status,
      })
      setSelectedTicket(updated)
      query.reload()
    } catch (err) {
      alert(
        'Error updating status: ' +
          (err instanceof Error ? err.message : 'Unknown error'),
      )
    } finally {
      setActionLoading(false)
    }
  }

  async function handleAssignStaff(staffId: string, staffName: string) {
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
      query.reload()
    } catch (err) {
      alert(
        'Error assigning staff: ' +
          (err instanceof Error ? err.message : 'Unknown error'),
      )
    } finally {
      setActionLoading(false)
    }
  }

  const statusTone: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    OPEN: { bg: '#eff6ff', text: '#1d4ed8', label: 'OPEN' },
    ASSIGNED: { bg: '#fefce8', text: '#a16207', label: 'ASSIGNED' },
    IN_PROGRESS: { bg: '#eff6ff', text: '#2563eb', label: 'IN PROGRESS' },
    WAITING_FOR_CUSTOMER: {
      bg: '#fff7ed',
      text: '#c2410c',
      label: 'WAITING FOR CUSTOMER',
    },
    WAITING_FOR_STAFF: {
      bg: '#fefce8',
      text: '#a16207',
      label: 'WAITING FOR STAFF',
    },
    RESOLVED: { bg: '#f0fdf4', text: '#15803d', label: 'RESOLVED' },
    CLOSED: { bg: '#f1f5f9', text: '#475569', label: 'CLOSED' },
  }

  if (query.error)
    return (
      <section className="odm-card odm-card-body" style={{ padding: 24 }}>
        <p role="alert">
          {query.error instanceof Error
            ? query.error.message
            : 'Không tải được danh sách hỗ trợ.'}
        </p>
        <button className="odm-btn" onClick={query.reload}>
          Thử lại
        </button>
      </section>
    )

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1300, margin: '0 auto' }}>
      {/* Banner */}
      <div
        style={{
          padding: '20px 24px',
          borderRadius: 14,
          background: '#0f172a',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: '#f8fafc',
            }}
          >
            Trung tâm Hỗ trợ & Hàng chờ Ticket
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
            Theo dõi yêu cầu hỗ trợ khách hàng, xem ngữ cảnh vận hành Đơn
            hàng/Nhiệm vụ và phản hồi theo thời gian thực.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="odm-btn"
            onClick={() => query.reload()}
            style={{
              height: 38,
              borderRadius: 8,
              fontSize: 13,
              background: '#ffffff',
              color: '#0f172a',
            }}
          >
            🔄 Làm mới
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div
          className="odm-card odm-hover-glow"
          onClick={() => setStatusFilter('OPEN')}
          style={{
            padding: 18,
            borderRadius: 12,
            border:
              statusFilter === 'OPEN'
                ? '2px solid #2563eb'
                : '1px solid #e2e8f0',
            background: statusFilter === 'OPEN' ? '#eff6ff' : '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title="Bấm để lọc danh sách ticket MỚI MỞ"
        >
          <div style={{ fontSize: 12.5, color: '#64748b', fontWeight: 600 }}>
            Ticket Mới
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#2563eb',
              marginTop: 4,
            }}
          >
            {openCount}
          </div>
        </div>

        <div
          className="odm-card odm-hover-glow"
          onClick={() => setStatusFilter('IN_PROGRESS')}
          style={{
            padding: 18,
            borderRadius: 12,
            border:
              statusFilter === 'IN_PROGRESS'
                ? '2px solid #d97706'
                : '1px solid #e2e8f0',
            background: statusFilter === 'IN_PROGRESS' ? '#fefce8' : '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title="Bấm để lọc danh sách ticket ĐANG XỬ LÝ / ĐÃ PHÂN CÔNG"
        >
          <div style={{ fontSize: 12.5, color: '#64748b', fontWeight: 600 }}>
            Đang Xử Lý
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#d97706',
              marginTop: 4,
            }}
          >
            {inProgressCount}
          </div>
        </div>

        <div
          className="odm-card odm-hover-glow"
          onClick={() => setStatusFilter('WAITING_FOR_CUSTOMER')}
          style={{
            padding: 18,
            borderRadius: 12,
            border:
              statusFilter === 'WAITING_FOR_CUSTOMER'
                ? '2px solid #ea580c'
                : '1px solid #e2e8f0',
            background:
              statusFilter === 'WAITING_FOR_CUSTOMER' ? '#fff7ed' : '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title="Bấm để lọc danh sách ticket CHỜ KHÁCH HÀNG PHẢN HỒI"
        >
          <div style={{ fontSize: 12.5, color: '#64748b', fontWeight: 600 }}>
            Chờ Khách Hàng
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#ea580c',
              marginTop: 4,
            }}
          >
            {waitingCustomerCount}
          </div>
        </div>

        <div
          className="odm-card odm-hover-glow"
          onClick={() => setStatusFilter('RESOLVED')}
          style={{
            padding: 18,
            borderRadius: 12,
            border:
              statusFilter === 'RESOLVED'
                ? '2px solid #059669'
                : '1px solid #e2e8f0',
            background: statusFilter === 'RESOLVED' ? '#f0fdf4' : '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title="Bấm để lọc danh sách ticket ĐÃ HOÀN THÀNH / GIẢI QUYẾT"
        >
          <div style={{ fontSize: 12.5, color: '#64748b', fontWeight: 600 }}>
            Hoàn Thành Hôm Nay
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#059669',
              marginTop: 4,
            }}
          >
            {resolvedCount}
          </div>
        </div>
      </div>

      {/* Support Deflection & FAQ Analytics Panel */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>📊</span>
            <h3
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              Chỉ số Cản Ticket (FAQ Deflection) & Hiệu quả Hỗ trợ
            </h3>
          </div>
          <span
            style={{
              fontSize: 12,
              color: '#10b981',
              fontWeight: 600,
              background: '#ecfdf5',
              padding: '4px 10px',
              borderRadius: 20,
            }}
          >
            ● Tỷ lệ cản ticket: <b>{deflectionRate}%</b> (Khách tự giải quyết
            qua FAQ - Total {totalHelpfulVotes} votes)
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}
        >
          <div
            style={{
              background: '#f8fafc',
              padding: 14,
              borderRadius: 10,
              border: '1px solid #f1f5f9',
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: '#64748b',
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Top 3 Bài FAQ Hữu ích Nhất
            </div>
            <div
              style={{
                fontSize: 12.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                color: '#334155',
              }}
            >
              {totalHelpfulVotes > 0 ? (
                topHelpfulArticles.map((art, idx) => (
                  <div
                    key={art.id}
                    style={{
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {idx + 1}.{' '}
                    <b>
                      {art.question.length > 30
                        ? art.question.slice(0, 30) + '...'
                        : art.question}
                    </b>{' '}
                    ({art.votesCount} lượt thích)
                  </div>
                ))
              ) : (
                <div
                  style={{
                    color: '#94a3b8',
                    fontStyle: 'italic',
                    fontSize: 12,
                    padding: '4px 0',
                  }}
                >
                  Chưa có lượt bình chọn FAQ từ khách hàng
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              background: '#f8fafc',
              padding: 14,
              borderRadius: 10,
              border: '1px solid #f1f5f9',
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: '#64748b',
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Thời gian Phản hồi (SLA)
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#4f46e5',
                marginTop: 2,
              }}
            >
              {avgResponseTimeMins} phút{' '}
              <span style={{ fontSize: 12, fontWeight: 500, color: '#16a34a' }}>
                (Thời gian phản hồi TB)
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
              Cam kết SLA đáp ứng: <b>{slaComplianceRate}%</b> ticket trong 30p
            </div>
          </div>

          <div
            style={{
              background: '#f8fafc',
              padding: 14,
              borderRadius: 10,
              border: '1px solid #f1f5f9',
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: '#64748b',
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Phân loại Nguồn sự cố
            </div>
            <div
              style={{
                fontSize: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                color: '#334155',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Đơn hàng & AI Feasibility:</span> <b>{ordersPct}%</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Nhiệm vụ & Drone:</span> <b>{missionsPct}%</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Media & Telemetry:</span> <b>{mediaPct}%</b>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: '14px 18px',
          border: '1px solid #e2e8f0',
          marginBottom: 20,
          display: 'flex',
          gap: 14,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{ display: 'flex', gap: 12, flex: 1, alignItems: 'center' }}
        >
          <input
            className="odm-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã Ticket, khách hàng, tiêu đề, mã đơn hàng hoặc nhiệm vụ..."
            style={{ flex: 1, height: 38, borderRadius: 8, fontSize: 13 }}
          />

          <select
            className="odm-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ height: 38, borderRadius: 8, fontSize: 13, minWidth: 160 }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="OPEN">Mới mở</option>
            <option value="ASSIGNED">Đã phân công</option>
            <option value="IN_PROGRESS">Đang xử lý</option>
            <option value="WAITING_FOR_CUSTOMER">Chờ khách hàng</option>
            <option value="WAITING_FOR_STAFF">Chờ hỗ trợ</option>
            <option value="RESOLVED">Đã giải quyết</option>
          </select>

          <select
            className="odm-input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ height: 38, borderRadius: 8, fontSize: 13, minWidth: 160 }}
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="ORDERS">Đơn hàng</option>
            <option value="MISSIONS">Nhiệm vụ bay</option>
            <option value="RESULTS">Kết quả giám sát</option>
            <option value="MEDIA">Media & Livestream</option>
            <option value="SCHEDULING">Lịch bay</option>
            <option value="ACCOUNT">Tài khoản</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          overflowX: 'auto',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: 13,
          }}
        >
          <thead>
            <tr
              style={{
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                color: '#475569',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <th style={{ padding: '12px 16px' }}>Mã Ticket</th>
              <th style={{ padding: '12px 16px' }}>Khách hàng</th>
              <th style={{ padding: '12px 16px' }}>Tiêu đề</th>
              <th style={{ padding: '12px 16px' }}>Danh mục</th>
              <th style={{ padding: '12px 16px' }}>Ngữ cảnh</th>
              <th style={{ padding: '12px 16px' }}>Ưu tiên</th>
              <th style={{ padding: '12px 16px' }}>Trạng thái</th>
              <th style={{ padding: '12px 16px' }}>Phân công cho</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>
                Hành động
              </th>
            </tr>
          </thead>

          <tbody>
            {query.loading ? (
              <tr>
                <td
                  colSpan={9}
                  style={{ padding: 24, textAlign: 'center', color: '#64748b' }}
                >
                  Đang tải hàng chờ yêu cầu hỗ trợ...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={{ padding: 32, textAlign: 'center', color: '#64748b' }}
                >
                  Không tìm thấy yêu cầu hỗ trợ nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              filtered.map((ticket) => {
                const tone = statusTone[ticket.status] || statusTone.OPEN
                return (
                  <tr
                    key={ticket.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background:
                        selectedTicket?.id === ticket.id
                          ? '#eff6ff'
                          : 'transparent',
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        className="odm-mono"
                        style={{ fontWeight: 700, color: '#4f46e5' }}
                      >
                        {ticket.ticketCode}
                      </span>
                    </td>

                    <td
                      style={{
                        padding: '12px 16px',
                        fontWeight: 600,
                        color: '#0f172a',
                      }}
                    >
                      {ticket.customerName || 'Seed Customer'}
                    </td>

                    <td
                      style={{
                        padding: '12px 16px',
                        fontWeight: 600,
                        color: '#1e293b',
                        maxWidth: 220,
                      }}
                    >
                      <div
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {ticket.subject}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: '#f1f5f9',
                          color: '#475569',
                        }}
                      >
                        {ticket.category}
                      </span>
                    </td>

                    <td
                      style={{
                        padding: '12px 16px',
                        fontSize: 12,
                        color: '#64748b',
                      }}
                    >
                      {canManage && ticket.orderId && (
                        <a
                          href={managerHref({
                            screen: 'orderReview',
                            orderId: ticket.orderId,
                          })}
                          className="odm-action-link"
                          style={{
                            color: '#2563eb',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                          title="Xem chi tiết đơn hàng"
                        >
                          🔗 Xem Đơn hàng ↗
                        </a>
                      )}
                      {canManage && ticket.missionId && (
                        <div style={{ marginTop: ticket.orderId ? 4 : 0 }}>
                          <a
                            href={managerHref({
                              screen: 'missionDispatch',
                              missionId: ticket.missionId,
                            })}
                            className="odm-action-link-green"
                            style={{
                              color: '#059669',
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                            title="Xem chi tiết nhiệm vụ"
                          >
                            🛸 Xem Nhiệm vụ ↗
                          </a>
                        </div>
                      )}
                      {!ticket.orderId && !ticket.missionId && (
                        <span style={{ color: '#cbd5e1' }}>Chung</span>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color:
                            ticket.priority === 'URGENT' ||
                            ticket.priority === 'HIGH'
                              ? '#ef4444'
                              : '#64748b',
                        }}
                      >
                        {ticket.priority}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: tone.bg,
                          color: tone.text,
                        }}
                      >
                        {tone.label}
                      </span>
                    </td>

                    <td
                      style={{
                        padding: '12px 16px',
                        fontSize: 12.5,
                        color: '#334155',
                      }}
                    >
                      {ticket.assignedStaffName || (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                          Chưa phân công
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="odm-btn"
                        onClick={() => setSelectedTicket(ticket)}
                        style={{
                          padding: '4px 12px',
                          fontSize: 12,
                          borderRadius: 6,
                          background: '#4f46e5',
                          color: '#ffffff',
                          border: 'none',
                          fontWeight: 600,
                        }}
                      >
                        Xem & Phản hồi →
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Staff Ticket Detail & Operational Context Drawer Modal */}
      {selectedTicket && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
          }}
          onClick={() => setSelectedTicket(null)}
        >
          <div
            style={{
              background: '#ffffff',
              width: 1060,
              maxHeight: '90vh',
              borderRadius: 16,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span
                    className="odm-mono"
                    style={{ fontSize: 14, fontWeight: 700, color: '#4f46e5' }}
                  >
                    {selectedTicket.ticketCode}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background:
                        statusTone[selectedTicket.status]?.bg || '#f1f5f9',
                      color:
                        statusTone[selectedTicket.status]?.text || '#475569',
                    }}
                  >
                    {selectedTicket.status}
                  </span>
                </div>
                <h3
                  style={{
                    margin: '4px 0 0',
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#0f172a',
                  }}
                >
                  {selectedTicket.subject}
                </h3>
              </div>

              <button
                type="button"
                className="odm-btn"
                onClick={() => setSelectedTicket(null)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '50%',
                  border: 'none',
                  background: '#e2e8f0',
                }}
              >
                ✕
              </button>
            </div>

            {/* Split View */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* LEFT / MAIN CONVERSATION AREA */}
              <div
                style={{
                  flex: 1,
                  padding: 24,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <h4
                  style={{
                    margin: '0 0 14px',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#0f172a',
                  }}
                >
                  Lịch sử hội thoại
                </h4>

                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    marginBottom: 20,
                  }}
                >
                  {(!selectedTicket.messages ||
                    selectedTicket.messages.length === 0) && (
                    <div
                      style={{
                        color: '#94a3b8',
                        fontSize: 13,
                        textAlign: 'center',
                        padding: 20,
                      }}
                    >
                      {selectedTicket.description ||
                        'Chưa có tin nhắn trong ticket này.'}
                    </div>
                  )}

                  {selectedTicket.messages?.map((msg) => {
                    const isStaff =
                      msg.senderRole === 'STAFF' || msg.senderRole === 'MANAGER'
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isStaff ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 4,
                            fontSize: 12,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              color: isStaff ? '#059669' : '#4f46e5',
                            }}
                          >
                            {msg.senderName} ({msg.senderRole})
                          </span>
                          <span style={{ color: '#94a3b8' }}>
                            {new Date(msg.createdAt).toLocaleTimeString(
                              'vi-VN',
                              { hour: '2-digit', minute: '2-digit' },
                            )}
                          </span>
                        </div>

                        <div
                          style={{
                            maxWidth: '85%',
                            background: isStaff ? '#f0fdf4' : '#f8fafc',
                            border: isStaff
                              ? '1px solid #bbf7d0'
                              : '1px solid #e2e8f0',
                            borderRadius: 12,
                            padding: '12px 16px',
                            color: '#1e293b',
                            fontSize: 13,
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {msg.content}
                          {msg.attachmentUrl && (
                            <div
                              style={{
                                marginTop: 6,
                                paddingTop: 6,
                                borderTop: '1px solid rgba(0,0,0,0.06)',
                              }}
                            >
                              <a
                                href={msg.attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  fontSize: 12,
                                  color: '#2563eb',
                                  fontWeight: 600,
                                }}
                              >
                                📎 Xem đính kèm
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Reply Form */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                  <div style={{ marginBottom: 8 }}>
                    <textarea
                      className="odm-input"
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Nhập phản hồi chính thức cho khách hàng..."
                      style={{
                        width: '100%',
                        borderRadius: 10,
                        fontSize: 13,
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <input
                      className="odm-input"
                      value={replyAttachment}
                      onChange={(e) => setReplyAttachment(e.target.value)}
                      placeholder="Đường dẫn đính kèm (tùy chọn)"
                      style={{
                        width: '55%',
                        height: 36,
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />

                    <button
                      type="button"
                      className="odm-btn odm-btn-p"
                      onClick={handleSendReply}
                      disabled={actionLoading || !replyText.trim()}
                      style={{
                        background: '#059669',
                        color: '#ffffff',
                        fontWeight: 600,
                        height: 38,
                        padding: '0 20px',
                        borderRadius: 8,
                        border: 'none',
                      }}
                    >
                      {actionLoading
                        ? 'Đang gửi...'
                        : 'Gửi phản hồi chính thức'}
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDEBAR: OPERATIONAL CONTEXT PANEL */}
              <div
                style={{
                  width: 340,
                  background: '#f8fafc',
                  borderLeft: '1px solid #e2e8f0',
                  padding: 20,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: '#0f172a',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Ngữ cảnh vận hành
                </h4>

                {/* Customer Info Card */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12.5,
                      color: '#64748b',
                      fontWeight: 600,
                    }}
                  >
                    Thông tin khách hàng
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#0f172a',
                      marginTop: 2,
                    }}
                  >
                    {selectedTicket.customerName || 'Seed Customer'}
                  </div>
                  <div
                    style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}
                  >
                    Vai trò:{' '}
                    <span style={{ color: '#4f46e5', fontWeight: 600 }}>
                      Khách hàng (CUSTOMER)
                    </span>
                  </div>
                </div>

                {/* Order & Mission Context Card */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11.5,
                      color: '#64748b',
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    Tài sản liên quan
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ color: '#64748b', marginBottom: 2 }}>
                        Đơn hàng liên quan:
                      </div>
                      {canManage && selectedTicket.orderId ? (
                        <a
                          href={managerHref({
                            screen: 'orderReview',
                            orderId: selectedTicket.orderId,
                          })}
                          className="odm-action-link"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            color: '#2563eb',
                            fontWeight: 700,
                            textDecoration: 'none',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            padding: '5px 12px',
                            borderRadius: 6,
                            fontSize: 12,
                          }}
                          title="Bấm để chuyển trực tiếp tới trang Quản lý Đơn hàng"
                        >
                          🔗 Xem chi tiết Đơn hàng ↗
                        </a>
                      ) : (
                        <b style={{ color: '#94a3b8', fontWeight: 500 }}>
                          Không có
                        </b>
                      )}
                    </div>
                    <div>
                      <div style={{ color: '#64748b', marginBottom: 2 }}>
                        Nhiệm vụ liên quan:
                      </div>
                      {canManage && selectedTicket.missionId ? (
                        <a
                          href={managerHref({
                            screen: 'missionDispatch',
                            missionId: selectedTicket.missionId,
                          })}
                          className="odm-action-link-green"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            color: '#059669',
                            fontWeight: 700,
                            textDecoration: 'none',
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            padding: '5px 12px',
                            borderRadius: 6,
                            fontSize: 12,
                          }}
                          title="Bấm để chuyển trực tiếp tới trang Quản lý Nhiệm vụ"
                        >
                          🛸 Xem chi tiết Nhiệm vụ ↗
                        </a>
                      ) : (
                        <b style={{ color: '#94a3b8', fontWeight: 500 }}>
                          Không có
                        </b>
                      )}
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>
                        Trạng thái nhiệm vụ:{' '}
                      </span>
                      <b style={{ color: '#d97706' }}>
                        CHỜ NGƯỜI VẬN HÀNH CHẤP NHẬN
                      </b>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>
                        Drone được phân công:{' '}
                      </span>
                      <b className="odm-mono" style={{ color: '#059669' }}>
                        DRONE-ALPHA-01
                      </b>
                    </div>
                  </div>
                </div>

                {/* Actions Panel */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11.5,
                      color: '#64748b',
                      fontWeight: 600,
                    }}
                  >
                    Điều khiển Ticket
                  </div>

                  {canManage && (
                    <div>
                      <label
                        style={{
                          fontSize: 12,
                          color: '#475569',
                          display: 'block',
                          marginBottom: 4,
                        }}
                      >
                        Phân công nhân viên
                      </label>
                      <select
                        className="odm-input"
                        value={selectedTicket.assignedStaffId || ''}
                        onChange={(e) => {
                          const agentId = e.target.value
                          const agent = staffAgents.find(
                            (a) => a.id === agentId,
                          )
                          if (agentId && agent)
                            handleAssignStaff(agent.id, agent.fullName)
                        }}
                        style={{
                          width: '100%',
                          height: 34,
                          borderRadius: 6,
                          fontSize: 12.5,
                        }}
                      >
                        <option value="">— Chưa phân công —</option>
                        {staffAgentsQuery.loading && (
                          <option disabled>Đang tải nhân viên...</option>
                        )}
                        {staffAgents.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        color: '#475569',
                        display: 'block',
                        marginBottom: 4,
                      }}
                    >
                      Trạng thái
                    </label>
                    <select
                      className="odm-input"
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      style={{
                        width: '100%',
                        height: 34,
                        borderRadius: 6,
                        fontSize: 12.5,
                      }}
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="ASSIGNED">ASSIGNED</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="WAITING_FOR_CUSTOMER">
                        WAITING_FOR_CUSTOMER
                      </option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    className="odm-btn"
                    onClick={() => handleUpdateStatus('RESOLVED')}
                    style={{
                      marginTop: 4,
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      color: '#15803d',
                      fontWeight: 700,
                      fontSize: 12.5,
                      padding: '8px',
                      borderRadius: 6,
                    }}
                  >
                    ✓ Đánh dấu ĐÃ GIẢI QUYẾT
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
