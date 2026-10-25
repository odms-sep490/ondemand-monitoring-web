import { defineMessages } from '../../../../shared/i18n'

export const planningPresentationMessages = defineMessages({
  vi: {
    title: 'Kế hoạch thực thi',
    draftBadge: 'Đang lập kế hoạch',
    finalizedBadge: 'Đã chốt',
    subtitle:
      'Chia Order thành nhiều Mission, phân công checklist và tài nguyên thực thi.',
    version: (revision: number) => `Phiên bản ${revision}`,
    loading: 'Đang tải kế hoạch…',
    unverified: 'Chưa xác minh',
    back: 'Xem kế hoạch Order',
    createTitle: 'Tạo Mission mới',
    createDescription:
      'Mỗi Mission đại diện cho một phần công việc của Order. Đặt tên rõ ràng để dễ phân biệt khi phân công checklist và nhân sự.',
    scopeLabel: 'Tên / phạm vi công việc của Mission',
    scopePlaceholder: 'Ví dụ: Khu A - ca sáng, Tuyến sông, Khu vực phía Bắc…',
    scopeDefault: 'Toàn bộ phạm vi đơn hàng',
    scopeHint:
      'Tên giúp phân biệt các Mission, không thay đổi phạm vi địa lý của Order.',
    scopeRequired: 'Nhập tên / phạm vi công việc của Mission.',
    geography: 'Phạm vi địa lý',
    geographyOrder: 'Mission sẽ sử dụng phạm vi địa lý hiện có của Order.',
    geographyCustom:
      'Hiện chưa hỗ trợ chọn target point/area riêng cho từng Mission.',
    geographyChecklist: 'Bạn sẽ phân công checklist cho Mission sau khi tạo.',
    retry: 'Tải lại kế hoạch',
    finalized: 'Kế hoạch đã chốt. Có thể tạo Mission thay thế và chốt riêng Mission đó.',
    replacement: (id: string) =>
      `Mission thay thế cho ${id}. Chỉ sao chép kế hoạch bạn nhập; không kế thừa bằng chứng hoặc kết quả.`,
    empty: 'Chưa có Mission nào trong kế hoạch.',
    emptyHint:
      'Bắt đầu bằng một Mission, sau đó phân công checklist và tài nguyên thực thi.',
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
