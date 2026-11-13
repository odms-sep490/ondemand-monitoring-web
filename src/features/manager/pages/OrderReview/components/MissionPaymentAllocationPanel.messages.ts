import { defineMessages } from '../../../../../shared/i18n'

export const missionPaymentAllocationMessages = defineMessages({
  vi: {
    title: 'Khoản thanh toán theo nhiệm vụ',
    description: 'Tự cộng giá checklist đã duyệt theo từng Mission. Tiền cọc và khoản điều chỉnh cấp đơn được phân bổ theo tỷ trọng để tổng khớp số dư còn lại.',
    target: 'Còn phải thu',
    allocated: 'Đã tính cho Mission',
    customerPayment: 'Khách thanh toán sau cọc',
    calculating: 'Đang tính khoản thanh toán từ giá checklist…',
    calculateFailed: 'Chưa thể tính tự động. Kiểm tra báo giá checklist đã được duyệt, checklist đã gán vào Mission và chưa có giao dịch sau cọc.',
    allocationIncomplete: 'Các khoản thanh toán chưa khớp số dư hóa đơn. Kiểm tra checklist đã có giá và được gán cho Mission.',
    noMissions: 'Chưa có Mission hoặc checklist có giá để tính khoản thanh toán.',
    missionFallback: 'Nhiệm vụ',
    status: {
      NOT_YET_DUE: 'Chưa bàn giao',
      UNPAID: 'Chờ thanh toán',
      PENDING: 'Đang thanh toán',
      EXPIRED: 'Đã quá hạn',
      PAID: 'Đã thanh toán',
      CANCELLED: 'Đã hủy',
    } as Record<string, string>,
  },
  en: {
    title: 'Mission payment amounts',
    description: 'Calculated from approved checklist prices assigned to each Mission. The Deposit and order-level adjustments are apportioned by price so the total matches the remaining invoice balance.',
    target: 'Remaining to collect',
    allocated: 'Calculated for Missions',
    customerPayment: 'Customer payment after Deposit',
    calculating: 'Calculating payments from checklist prices…',
    calculateFailed: 'Could not calculate payments. Check that the quote is approved, priced checklists are assigned to Missions, and no post-Deposit payment has started.',
    allocationIncomplete: 'Mission payment amounts do not match the invoice balance. Check that priced checklists are assigned to Missions.',
    noMissions: 'There are no Missions or priced checklists to calculate.',
    missionFallback: 'Mission',
    status: {
      NOT_YET_DUE: 'Not handed over',
      UNPAID: 'Unpaid',
      PENDING: 'Pending',
      EXPIRED: 'Expired',
      PAID: 'Paid',
      CANCELLED: 'Cancelled',
    } as Record<string, string>,
  },
})
