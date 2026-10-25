import { defineMessages } from '../../../../../shared/i18n'

export const handoverBannersMessages = defineMessages({
  vi: {
    revokedTitle: 'Quyền điều khiển đã bị thu hồi.',
    revokedBody:
      'Quản lý đã thu hồi bàn giao lúc 13:29 (control_handover.status = REVOKED). Bạn phải xác nhận lại trước khi tiếp tục.',
    statusTitle: 'Trạng thái bàn giao',
    revokedNote: 'Không được phép cất cánh khi chưa xác nhận lại.',
    revokedBadge: 'Đã thu hồi',
    reconfirm: 'Xác nhận lại',
    confirmedText:
      'Bạn đã xác nhận bàn giao quyền điều khiển · control_handover.status = CONFIRMED',
    continueToCockpit: 'Tiếp tục tới buồng lái',
  },
  en: {
    revokedTitle: 'Control access has been revoked.',
    revokedBody:
      'The manager revoked the handover at 13:29 (control_handover.status = REVOKED). You must re-confirm before continuing.',
    statusTitle: 'Handover status',
    revokedNote: 'Takeoff is not allowed until you re-confirm.',
    revokedBadge: 'Revoked',
    reconfirm: 'Re-confirm',
    confirmedText:
      'You confirmed the control handover · control_handover.status = CONFIRMED',
    continueToCockpit: 'Continue to cockpit',
  },
})
