import { defineMessages } from '../../../../../shared/i18n'

export const missionPaymentAllocationMessages = defineMessages({
  vi: {
    title: 'Phân bổ khoản thanh toán theo nhiệm vụ',
    description: 'Nhập giá trị đã thỏa thuận cho từng Mission. Không tự chia đều hoặc suy ra từ checklist.',
    amount: 'Giá trị thanh toán (VND)',
    target: 'Cần phân bổ',
    allocated: 'Đã phân bổ',
    save: 'Lưu phân bổ',
    saved: 'Đã lưu giá trị cho các Mission.',
    exactTotal: 'Tổng giá trị phải bằng chính xác số dư sau tiền cọc.',
    noMissions: 'Chưa có Mission gốc để phân bổ.',
    locked: 'Không thể sửa sau khi Mission bắt đầu thực hiện, được bàn giao hoặc có giao dịch thanh toán.',
    status: {
      NOT_YET_DUE: 'Chưa bàn giao',
      UNPAID: 'Chờ thanh toán',
      PENDING: 'Đang thanh toán',
      PAID: 'Đã thanh toán',
      CANCELLED: 'Đã hủy',
    } as Record<string, string>,
  },
  en: {
    title: 'Mission payment allocation',
    description: 'Enter the agreed amount for each Mission. Do not split evenly or infer prices from checklists.',
    amount: 'Agreed amount (VND)',
    target: 'Amount to allocate',
    allocated: 'Allocated',
    save: 'Save allocation',
    saved: 'Mission payment allocations saved.',
    exactTotal: 'The total must exactly match the Invoice balance after the Deposit.',
    noMissions: 'There are no original Missions to allocate.',
    locked: 'Editing is locked after Mission execution starts, handover, or a payment attempt.',
    status: {
      NOT_YET_DUE: 'Not handed over',
      UNPAID: 'Unpaid',
      PENDING: 'Pending',
      PAID: 'Paid',
      CANCELLED: 'Cancelled',
    } as Record<string, string>,
  },
})
