import { defineMessages } from '../../../shared/i18n'

export const postflightModalMessages = defineMessages({
  vi: {
    defaultNotes:
      'Drone hoàn thành chuyến bay an toàn, không tổn hại cấu trúc.',
    title: 'Kiểm tra Sau Chuyến bay (Post-flight)',
    deviceStatusLabel: 'Trạng thái Thiết bị sau Chuyến bay',
    available: '✅ AVAILABLE (Sẵn sàng cho nhiệm vụ tiếp theo)',
    idleCharging: '🔋 IDLE_CHARGING (Đưa vào trạm sạc pin)',
    maintenance: '🔧 MAINTENANCE (Gặp sự cố - Cần bảo trì)',
    notesLabel: 'Ghi chú Kiểm tra Kỹ thuật (Inspection Log Notes)',
    notesPlaceholder: 'Nhập chi tiết ghi chú...',
    cancel: 'Hủy',
    submitting: 'Đang gửi...',
    confirmComplete: 'Xác nhận & Hoàn thành nhiệm vụ',
  },
  en: {
    defaultNotes:
      'The drone completed the flight safely, no structural damage.',
    title: 'Post-flight Inspection',
    deviceStatusLabel: 'Device status after flight',
    available: '✅ AVAILABLE (Ready for next mission)',
    idleCharging: '🔋 IDLE_CHARGING (Move to charging station)',
    maintenance: '🔧 MAINTENANCE (Issue found - needs maintenance)',
    notesLabel: 'Inspection log notes',
    notesPlaceholder: 'Enter note details...',
    cancel: 'Cancel',
    submitting: 'Submitting...',
    confirmComplete: 'Confirm & Complete Mission',
  },
})
