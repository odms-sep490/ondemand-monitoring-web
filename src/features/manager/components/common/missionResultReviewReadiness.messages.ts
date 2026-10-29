import { defineMessages } from '../../../../shared/i18n'

export const missionResultReviewReadinessMessages = defineMessages({
  vi: {
    reasons: {
      MEDIA_APPROVAL_REQUIRED:
        'Cần duyệt toàn bộ ảnh/video trước khi duyệt kết quả.',
      MEDIA_REJECTED: 'Ảnh/video bị từ chối. Cần bổ sung bằng chứng phù hợp.',
      MEDIA_NOT_VALIDATED:
        'Ảnh/video đang được kiểm tra. Vui lòng chờ trước khi duyệt kết quả.',
      INSUFFICIENT_EVIDENCE:
        'Danh mục kiểm tra chưa đủ bằng chứng. Cần bổ sung trước khi duyệt kết quả.',
      EXECUTION_NOT_TERMINAL:
        'Danh mục kiểm tra chưa hoàn tất. Cần hoàn tất các mục trước khi duyệt kết quả.',
      EXECUTION_NOT_COMPLETED:
        'Danh mục kiểm tra chưa hoàn tất. Cần hoàn tất các mục trước khi duyệt kết quả.',
      UNABLE_REASON_REQUIRED:
        'Cần bổ sung lý do cho mục danh mục kiểm tra chưa thể xác minh.',
      CHECKLIST_INTEGRITY_INVALID:
        'Không thể xác nhận danh mục kiểm tra. Vui lòng tải lại.',
      EVIDENCE_SOURCE_NOT_ELIGIBLE:
        'Bằng chứng chưa phù hợp. Cần bổ sung ảnh/video phù hợp.',
      EVIDENCE_TYPE_NOT_ELIGIBLE:
        'Loại ảnh/video chưa phù hợp. Cần bổ sung ảnh/video đúng loại yêu cầu.',
    },
    checking: 'Đang kiểm tra điều kiện duyệt…',
    unknown:
      'Chưa xác nhận được điều kiện duyệt. Vui lòng tải lại danh mục kiểm tra.',
    missionNotComplete:
      'Nhiệm vụ chưa hoàn thành. Chỉ duyệt kết quả sau khi nhiệm vụ hoàn thành.',
    checklistNotReady:
      'Danh mục kiểm tra chưa sẵn sàng. Kiểm tra các mục và bằng chứng trước khi duyệt kết quả.',
    sessionExpired: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
    forbidden: 'Bạn không có quyền duyệt kết quả này.',
    notPending: 'Kết quả không còn chờ duyệt. Vui lòng tải lại.',
    checklistNotReadyError:
      'Danh mục kiểm tra hoặc ảnh/video chưa sẵn sàng. Vui lòng kiểm tra lại trước khi duyệt kết quả.',
    missionStatusChanged:
      'Trạng thái nhiệm vụ đã thay đổi. Vui lòng tải lại kết quả.',
    concurrentUpdate:
      'Kết quả đã được cập nhật. Vui lòng tải lại trước khi tiếp tục.',
    fallbackError: 'Không thể duyệt hoặc từ chối kết quả. Vui lòng thử lại.',
  },
  en: {
    reasons: {
      MEDIA_APPROVAL_REQUIRED:
        'All media must be approved before approving the result.',
      MEDIA_REJECTED: 'Media was rejected. Add suitable evidence.',
      MEDIA_NOT_VALIDATED:
        'Media is being checked. Please wait before approving the result.',
      INSUFFICIENT_EVIDENCE:
        'The checklist does not have enough evidence. Add more before approving the result.',
      EXECUTION_NOT_TERMINAL:
        'The checklist is not complete. Complete all items before approving the result.',
      EXECUTION_NOT_COMPLETED:
        'The checklist is not complete. Complete all items before approving the result.',
      UNABLE_REASON_REQUIRED:
        'Add a reason for checklist items that could not be verified.',
      CHECKLIST_INTEGRITY_INVALID:
        'Unable to verify the checklist. Please reload.',
      EVIDENCE_SOURCE_NOT_ELIGIBLE:
        'The evidence is not suitable. Add suitable photos/videos.',
      EVIDENCE_TYPE_NOT_ELIGIBLE:
        'The media type is not suitable. Add photos/videos of the required type.',
    },
    checking: 'Checking approval conditions…',
    unknown:
      'Unable to confirm approval conditions. Please reload the checklist.',
    missionNotComplete:
      'The mission is not complete. Only approve the result after the mission is complete.',
    checklistNotReady:
      'The checklist is not ready. Check the items and evidence before approving the result.',
    sessionExpired: 'Your session has expired. Please sign in again.',
    forbidden: 'You do not have permission to review this result.',
    notPending: 'This result is no longer awaiting review. Please reload.',
    checklistNotReadyError:
      'The checklist or media is not ready. Please check again before approving the result.',
    missionStatusChanged:
      'The mission status has changed. Please reload the result.',
    concurrentUpdate:
      'The result has been updated. Please reload before continuing.',
    fallbackError: 'Unable to approve or reject the result. Please try again.',
  },
})
