import { defineMessages } from '../../../../shared/i18n'

export const planningPresentationMessages = defineMessages({
  vi: {
    title: 'Kế hoạch thực thi',
    draftBadge: 'Đang lập kế hoạch',
    finalizedBadge: 'Đã chốt',
    subtitle:
      'Chia đơn hàng thành nhiều nhiệm vụ, phân công danh mục kiểm tra và tài nguyên thực thi.',
    version: (revision: number) => `Phiên bản ${revision}`,
    loading: 'Đang tải kế hoạch…',
    unverified: 'Chưa xác minh',
    back: 'Xem kế hoạch đơn hàng',
    createTitle: 'Tạo nhiệm vụ mới',
    createDescription:
      'Mỗi nhiệm vụ đại diện cho một phần công việc của đơn hàng. Đặt tên rõ ràng để dễ phân biệt khi phân công danh mục kiểm tra và nhân sự.',
    scopeLabel: 'Tên / phạm vi công việc của nhiệm vụ',
    scopePlaceholder: 'Ví dụ: Khu A - ca sáng, Tuyến sông, Khu vực phía Bắc…',
    scopeDefault: 'Toàn bộ phạm vi đơn hàng',
    scopeHint:
      'Tên giúp phân biệt các nhiệm vụ, không thay đổi phạm vi địa lý của đơn hàng.',
    scopeRequired: 'Nhập tên / phạm vi công việc của nhiệm vụ.',
    geography: 'Phạm vi địa lý',
    geographyOrder: 'Nhiệm vụ sẽ sử dụng phạm vi địa lý hiện có của đơn hàng.',
    geographyCustom:
      'Hiện chưa hỗ trợ chọn target point/area riêng cho từng nhiệm vụ.',
    geographyChecklist: 'Bạn sẽ phân công danh mục kiểm tra cho nhiệm vụ sau khi tạo.',
    retry: 'Tải lại kế hoạch',
    finalized: 'Kế hoạch đã chốt. Có thể tạo nhiệm vụ thay thế và chốt riêng nhiệm vụ đó.',
    replacement: (id: string) =>
      `Nhiệm vụ thay thế cho ${id}. Chỉ sao chép kế hoạch bạn nhập; không kế thừa bằng chứng hoặc kết quả.`,
    empty: 'Chưa có nhiệm vụ nào trong kế hoạch.',
    emptyHint:
      'Bắt đầu bằng một nhiệm vụ, sau đó phân công danh mục kiểm tra và tài nguyên thực thi.',
  },
  en: {
    title: 'Order execution plan',
    draftBadge: 'Planning',
    finalizedBadge: 'Finalized',
    subtitle:
      'Split the Order into Missions, assign checklists and execution resources.',
    version: (revision: number) => `Version ${revision}`,
    loading: 'Loading execution plan…',
    unverified: 'Not verified',
    back: 'View Order plan',
    createTitle: 'Create new Mission',
    createDescription:
      'Each Mission represents part of the Order work. Choose a clear name to distinguish checklist and crew assignments.',
    scopeLabel: 'Mission name / work scope',
    scopePlaceholder:
      'For example: Area A - morning shift, River route, Northern area…',
    scopeDefault: 'Entire Order scope',
    scopeHint:
      'The name distinguishes Missions; it does not change the Order geographic scope.',
    scopeRequired: 'Enter the Mission name / work scope.',
    geography: 'Geographic scope',
    geographyOrder:
      "This Mission will use the Order's existing geographic scope.",
    geographyCustom: 'Custom target point/area is not supported yet.',
    geographyChecklist:
      'Checklist assignments can be configured after the Mission is created.',
    retry: 'Reload plan',
    finalized: 'The plan is finalized. Replacement Missions can be created and finalized individually.',
    replacement: (id: string) =>
      `Replacement for ${id}. Only your entered planning is copied; evidence and results are not inherited.`,
    empty: 'No Missions in this plan yet.',
    emptyHint:
      'Start with a Mission, then assign checklists and execution resources.',
  },
})
