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
    heroBadge: 'Managed Drone-as-a-Service · Việt Nam',
    scrollHint: 'Khám phá dịch vụ',
    catalogEyebrow: 'DANH MỤC DỊCH VỤ HIỆN CÓ',
    catalogHeading: 'Bốn nhóm nhiệm vụ giám sát chuyên sâu.',
    catalogSubtitle:
      'Chọn đúng nhóm dịch vụ theo hiện trường thực tế, tùy chỉnh danh mục checklist và theo dõi tiến độ bàn giao trên cùng một nền tảng.',
    catalogCta: 'Bắt đầu với dịch vụ này',
    catalogItems: [
      {
        id: 'factory',
        code: '01 · NHÀ XƯỞNG',
        name: 'Kiểm tra nhà xưởng',
        summary:
          'Kiểm tra mái tôn, kết cấu bên ngoài, hệ thống năng lượng áp mái và các vị trí trên cao khó tiếp cận an toàn bằng drone.',
        deliverables: 'Đầu ra: Ảnh/video theo từng hạng mục checklist và báo cáo kiểm định.',
        image: '/assets/landing/services/factory-inspection.jpg',
        imageAlt: 'Góc nhìn từ trên cao khu nhà xưởng và hạ tầng công nghiệp',
      },
      {
        id: 'area',
        code: '02 · KHU VỰC',
        name: 'Giám sát khu vực',
        summary:
          'Quan sát tổng thể mặt bằng rộng, ghi nhận hiện trạng định kỳ và theo dõi các điểm cần lưu ý trong vùng khoanh trên bản đồ.',
        deliverables: 'Đầu ra: Toàn cảnh vùng giám sát, ảnh chi tiết theo tọa độ yêu cầu.',
        image: '/images/landing/bridge-inspection.webp',
        imageAlt: 'Góc nhìn tổng thể khu vực hạ tầng từ drone',
      },
      {
        id: 'forest',
        code: '03 · LÂM NGHIỆP',
        name: 'Giám sát rừng',
        summary:
          'Theo dõi hiện trạng rừng, biến động thảm thực vật và ghi nhận sớm khu vực bất thường trên địa hình đồi núi rộng lớn.',
        deliverables: 'Đầu ra: Dữ liệu ảnh/video theo tuyến bay và khu vực ưu tiên.',
        image: '/assets/landing/services/forest-monitoring.jpg',
        imageAlt: 'Toàn cảnh khu vực rừng và địa hình cao nguyên nhìn từ trên cao',
      },
      {
        id: 'construction',
        code: '04 · XÂY DỰNG',
        name: 'Giám sát công trình',
        summary:
          'Ghi nhận hiện trạng và tiến độ thi công định kỳ bằng hình ảnh, video sắc nét phục vụ đối chiếu và nghiệm thu.',
        deliverables: 'Đầu ra: Bộ ảnh/video tiến độ theo checklist kèm lịch sử đối soát.',
        image: '/images/landing/construction-1280.webp',
        imageAlt: 'Công trường xây dựng nhìn từ góc quay drone trên cao',
      },
    ],
    aiEyebrow: 'TRỢ LÝ AI TƯ VẤN YÊU CẦU',
    aiHeading: 'Chưa quen lập phạm vi bay? Trợ lý AI đồng hành từng bước.',
    aiBody:
      'Ngay trong màn hình tạo yêu cầu, trợ lý AI của OnDemand Monitor lắng nghe nhu cầu bằng văn bản hoặc giọng nói tiếng Việt, đặt câu hỏi làm rõ từng điểm thiếu và tự động điền vào bản nháp trước khi bạn xác nhận.',
    aiStatusBadge: 'Hỗ trợ tiếng Việt & giọng nói',
    aiBullets: [
      'Gợi ý chọn đúng dịch vụ trong 4 nhóm đang hoạt động',
      'Đánh giá mô tả nhiệm vụ và hỏi làm rõ mục tiêu, góc chụp, lưu ý hiện trường',
      'Tổng hợp bản mô tả chuyên nghiệp để bạn kiểm tra trước khi áp dụng vào đơn',
    ],
    aiCta: 'Tư vấn với AI ngay',
    finalHeading: 'Sẵn sàng khởi tạo nhiệm vụ giám sát đầu tiên?',
    finalSub:
      'Gửi yêu cầu trực tuyến, nhận kế hoạch bay minh bạch và kiểm soát toàn bộ dữ liệu bàn giao tại một nơi.',
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
    heroBadge: 'Managed Drone-as-a-Service',
    scrollHint: 'Explore services',
    catalogEyebrow: 'ACTIVE SERVICE CATALOG',
    catalogHeading: 'Four focused aerial monitoring workflows.',
    catalogSubtitle:
      'Select the service that fits your site, tailor checklist items and media counts, and track verified handover in one workspace.',
    catalogCta: 'Start with this service',
    catalogItems: [
      {
        id: 'factory',
        code: '01 · INDUSTRIAL',
        name: 'Factory & roof inspection',
        summary:
          'Inspect roofs, exterior structures, rooftop assets, and hard-to-reach elevated areas safely by drone.',
        deliverables: 'Deliverables: Checklist-mapped photos, video, and verified inspection record.',
        image: '/assets/landing/services/factory-inspection.jpg',
        imageAlt: 'Aerial view of industrial factory roofs and port facilities',
      },
      {
        id: 'area',
        code: '02 · AREA',
        name: 'Area monitoring',
        summary:
          'Capture broad site overviews, track recurring conditions, and monitor target zones drawn directly on the map.',
        deliverables: 'Deliverables: Full-zone coverage and detailed imagery per target.',
        image: '/images/landing/bridge-inspection.webp',
        imageAlt: 'Aerial infrastructure overview captured from above',
      },
      {
        id: 'forest',
        code: '03 · FORESTRY',
        name: 'Forest monitoring',
        summary:
          'Observe forest canopy conditions, vegetation changes, and priority zones across expansive highland terrain.',
        deliverables: 'Deliverables: Route-aligned aerial photo and video evidence.',
        image: '/assets/landing/services/forest-monitoring.jpg',
        imageAlt: 'Aerial overview of forested highland terrain',
      },
      {
        id: 'construction',
        code: '04 · CONSTRUCTION',
        name: 'Construction progress',
        summary:
          'Document site status and construction milestones with repeatable aerial photography and video.',
        deliverables: 'Deliverables: Checklist-backed progress media with audit trail.',
        image: '/images/landing/construction-1280.webp',
        imageAlt: 'Aerial view of an active construction site',
      },
    ],
    aiEyebrow: 'AI REQUEST CONSULTANT',
    aiHeading: 'Unsure how to scope a flight? Our AI consultant guides every step.',
    aiBody:
      'Built directly into the Create Request workspace, the OnDemand Monitor AI consultant supports text and voice input, asks targeted clarification questions, and drafts a structured mission brief for your review.',
    aiStatusBadge: 'Guided text & voice assistant',
    aiBullets: [
      'Helps choose the right service from active monitoring offerings',
      'Evaluates your mission description and clarifies goals, angles, and site constraints',
      'Generates a clean draft description you review before applying to the order',
    ],
    aiCta: 'Try AI consultation',
    finalHeading: 'Ready to launch your next monitoring mission?',
    finalSub:
      'Submit your request online, track safety and flight readiness, and unlock verified original deliverables in one place.',
  },
})
