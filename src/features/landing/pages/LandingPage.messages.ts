import { defineMessages } from '../../../shared/i18n'

export const landingPageMessages = defineMessages({
  vi: {
    brandName: 'OnDemand Monitor',
    pageTitle: 'OnDemand Monitor — Giám sát bằng drone, bàn giao chuẩn xác',
    pageDescription:
      'Gửi yêu cầu giám sát hiện trường theo nhu cầu, kiểm soát kế hoạch bay và điều kiện an toàn, nghiệm thu chứng cứ và tải bản gốc tại một nơi.',
    skipLink: 'Bỏ qua tới nội dung',
    mainNavAriaLabel: 'Điều hướng chính',
    footerNavAriaLabel: 'Liên kết chân trang',
    navLinks: [
      { label: 'DỊCH VỤ', href: '#services' },
      { label: 'VỀ CHÚNG TÔI', href: '#about' },
      { label: 'QUY TRÌNH', href: '#how-it-works' },
    ],
    signIn: 'Đăng nhập',
    signUp: 'Đăng ký',
    createRequestCta: 'Tạo yêu cầu giám sát',
    seeHowItWorks: 'Xem quy trình',
    heroTitleLine1: 'Giám sát bằng drone,',
    heroTitleLine2: 'bàn giao đúng chuẩn.',
    heroSubtitle:
      'Gửi yêu cầu giám sát chỉ trong vài phút, kiểm tra đầy đủ điều kiện bay trước khi xuất phát và nhận ảnh, video cùng báo cáo checklist minh bạch.',
    heroImageAlt: 'Sân đỗ drone và trạm điều hành nhiệm vụ lúc hoàng hôn',
    servicesEyebrow: 'CHÚNG TÔI LÀM GÌ',
    servicesHeading: 'Kiểm tra chính xác. Quy trình minh bạch.',
    servicesItems: [
      {
        index: '01',
        title: 'Tiếp nhận & lập kế hoạch bay',
        description:
          'Khách hàng gửi mục tiêu, tọa độ và danh sách kiểm tra. Quản lý duyệt phạm vi, lên lịch và phân công phi công, thiết bị.',
      },
      {
        index: '02',
        title: 'Khóa an toàn & giấy phép bay',
        description:
          'Nhân sự xác nhận nhận nhiệm vụ trước khi hoàn tất giấy phép bay và quy trình kiểm tra an toàn preflight.',
      },
      {
        index: '03',
        title: 'Đối chiếu chứng cứ từng hạng mục',
        description:
          'Ảnh và video hiện trường gắn thẳng vào từng đầu việc checklist để kiểm định viên rà soát và bổ sung kịp thời.',
      },
      {
        index: '04',
        title: 'Nghiệm thu & mở khóa bản gốc',
        description:
          'Khách hàng xem trước kết quả, chấp nhận bàn giao theo từng nhiệm vụ và tải toàn bộ dữ liệu gốc kèm lịch sử đối soát.',
      },
    ],
    aboutEyebrow: 'VỀ CHÚNG TÔI & QUY TRÌNH',
    aboutHeadingLine1: 'Công nghệ hỗ trợ.',
    aboutHeadingLine2: 'Con người kiểm chứng.',
    aboutBody:
      'Thay vì đưa nhân sự tiếp cận thủ công những công trình cao, rộng hoặc tiềm ẩn rủi ro, OnDemand Monitor hợp nhất điều phối bay, kiểm soát preflight, kiểm định chứng cứ và bàn giao kết quả trên một hệ thống thống nhất.',
    aboutSteps: [
      { code: '01', label: 'Đặt yêu cầu & phạm vi' },
      { code: '02', label: 'Duyệt phép & bay thu thập' },
      { code: '03', label: 'Kiểm định & bàn giao gốc' },
    ],
    aboutImageAlt: 'Hệ thống tuabin gió và hạ tầng năng lượng được giám sát từ trên cao',
    aboutOverlayTag: 'MỤC TIÊU KIỂM TRA · CHECKLIST',
    aboutOverlayCaption:
      'Minh họa trực quan vùng kiểm tra hiện trường và chứng cứ theo từng hạng mục',
    footerTagline:
      'Nền tảng điều phối giám sát hiện trường bằng drone theo yêu cầu — minh bạch từ lập kế hoạch đến bàn giao bản gốc.',
    footerNavHeading: 'NỀN TẢNG',
    footerAccountHeading: 'TÀI KHOẢN',
    footerSupportHeading: 'HỖ TRỢ',
    footerHelpCenter: 'Trung tâm trợ giúp',
    footerCopyright: '© 2026 OnDemand Monitor. Bảo lưu mọi quyền.',
    footerNote: 'Điều phối bay & kiểm định hiện trường',
    footerSupport: 'support@odms.vn',
  },
  en: {
    brandName: 'OnDemand Monitor',
    pageTitle: 'OnDemand Monitor — Drone inspection, delivered on record',
    pageDescription:
      'Submit on-demand field monitoring requests, verify flight plans and safety compliance, review checklist evidence, and download original deliverables in one place.',
    skipLink: 'Skip to content',
    mainNavAriaLabel: 'Main navigation',
    footerNavAriaLabel: 'Footer navigation',
    navLinks: [
      { label: 'SERVICES', href: '#services' },
      { label: 'ABOUT US', href: '#about' },
      { label: 'HOW IT WORKS', href: '#how-it-works' },
    ],
    signIn: 'Sign in',
    signUp: 'Sign up',
    createRequestCta: 'Create monitoring request',
    seeHowItWorks: 'See how it works',
    heroTitleLine1: 'Inspection by drone,',
    heroTitleLine2: 'delivered on record.',
    heroSubtitle:
      'Submit a field monitoring request in minutes, clear permits and preflight checks before takeoff, and receive checklist-backed media and reports in one workspace.',
    heroImageAlt: 'Drone landing apron and mission operations center at dusk',
    servicesEyebrow: 'WHAT WE DO',
    servicesHeading: 'Precise field checks. Transparent workflow.',
    servicesItems: [
      {
        index: '01',
        title: 'Scope intake & mission dispatch',
        description:
          'Clients specify sites, goals, and checklists. Managers finalize schedules and assign qualified pilots, inspectors, and hardware.',
      },
      {
        index: '02',
        title: 'Permit & preflight readiness',
        description:
          'Assigned staff formally accept missions before flight permits are processed and preflight safety checklists are cleared.',
      },
      {
        index: '03',
        title: 'Checklist-linked evidence review',
        description:
          'Field photos and footage map directly to each checklist item so inspectors can approve quality or request targeted recaptures.',
      },
      {
        index: '04',
        title: 'Approval & original delivery',
        description:
          'Clients preview mission deliverables, confirm sign-off per mission, and unlock original media backed by a clear audit trail.',
      },
    ],
    aboutEyebrow: 'ABOUT US & WORKFLOW',
    aboutHeadingLine1: 'Structured tooling.',
    aboutHeadingLine2: 'Verified by people.',
    aboutBody:
      'Instead of sending manual crews into high, expansive, or hard-to-reach sites, OnDemand Monitor connects flight dispatch, preflight clearance, inspector verification, and client handover into one dependable workflow.',
    aboutSteps: [
      { code: '01', label: 'Request & scope sign-off' },
      { code: '02', label: 'Permits & field capture' },
      { code: '03', label: 'Verification & delivery' },
    ],
    aboutImageAlt: 'Aerial view of wind turbines and energy infrastructure during inspection',
    aboutOverlayTag: 'TARGET ZONE · CHECKLIST LINKED',
    aboutOverlayCaption:
      'Illustrative view of field target framing and checklist-mapped inspection evidence',
    footerTagline:
      'On-demand drone field inspection platform — built for transparent dispatch, verification, and original media delivery.',
    footerNavHeading: 'PLATFORM',
    footerAccountHeading: 'ACCOUNT',
    footerSupportHeading: 'SUPPORT',
    footerHelpCenter: 'Help center',
    footerCopyright: '© 2026 OnDemand Monitor. All rights reserved.',
    footerNote: 'Field flight dispatch & evidence verification',
    footerSupport: 'support@odms.vn',
  },
})
