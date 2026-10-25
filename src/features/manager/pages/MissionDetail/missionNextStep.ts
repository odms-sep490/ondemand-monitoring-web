import type { NextStep } from './missionDetailTypes'

/** Plain-language "what is happening / what is next" for the manager, by Mission status. */
export function missionNextStep(
  status: string,
  accepted: number,
  crew: number,
): NextStep | null {
  switch (status) {
    case 'RESOURCE_ASSIGNING':
      return {
        tone: 'go',
        title: 'Cần phân công nguồn lực',
        detail: 'Gán đủ nhân sự và thiết bị để Mission được gửi cho đội bay.',
      }
    case 'WAITING_CREW_CONFIRMATION':
    case 'WAITING_OPERATOR_ACCEPTANCE':
      return {
        tone: 'wait',
        title: 'Đang chờ đội bay xác nhận',
        detail:
          crew > 0
            ? `${accepted}/${crew} nhân sự đã nhận. Mission sẽ được lên lịch khi tất cả xác nhận.`
            : 'Mission sẽ được lên lịch khi nhân sự xác nhận.',
      }
    case 'SCHEDULED':
      return {
        tone: 'wait',
        title: 'Đã lên lịch',
        detail: 'Đội bay sẽ kết nối thiết bị và kiểm tra trước chuyến bay.',
      }
    case 'FAILED_PREFLIGHT':
      return {
        tone: 'bad',
        title: 'Không đạt kiểm tra trước bay',
        detail: 'Xem tab Kết quả check, xử lý rồi cho đội bay kiểm tra lại.',
      }
    case 'PENDING_REVIEW':
      return {
        tone: 'go',
        title: 'Chờ duyệt kết quả',
        detail: 'Xem media và checklist rồi duyệt hoặc yêu cầu bổ sung.',
      }
    case 'FAILED':
    case 'CANCELLED':
      return {
        tone: 'bad',
        title: status === 'FAILED' ? 'Nhiệm vụ thất bại' : 'Nhiệm vụ đã hủy',
        detail: 'Có thể tạo Mission thay thế trong kế hoạch Order.',
      }
    default:
      return null
  }
}
