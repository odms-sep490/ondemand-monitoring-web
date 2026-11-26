import { defineMessages } from '../../../shared/i18n'

export type TourChapter = {
  id: string
  label: string
  prompt: string
  speech: string
  audioUrl?: string
}

/** Pre-generated ZeroTTS (Mai Chi) WAV files matching the Create Order cute voice. */
export const landingSeedAudioByText: Record<string, string> = {
  greeting: '/assets/ai/audio/landing_greeting.wav',
  intro: '/assets/ai/audio/landing_intro.wav',
  overview: '/assets/ai/audio/landing_overview.wav',
  workflow: '/assets/ai/audio/landing_workflow.wav',
  ai: '/assets/ai/audio/landing_ai.wav',
  report: '/assets/ai/audio/landing_report.wav',
  create: '/assets/ai/audio/landing_create.wav',
  cost: '/assets/ai/audio/landing_cost.wav',
  status: '/assets/ai/audio/landing_status.wav',
  safety: '/assets/ai/audio/landing_safety.wav',
  default: '/assets/ai/audio/landing_default.wav',
}

export const kbSeedAudioUrls: Array<string | null> = [
  '/assets/ai/audio/landing_overview.wav',
  '/assets/ai/audio/landing_workflow.wav',
  '/assets/ai/audio/landing_ai.wav',
  '/assets/ai/audio/landing_cost.wav',
  '/assets/ai/audio/landing_status.wav',
  '/assets/ai/audio/landing_report.wav',
  '/assets/ai/audio/landing_safety.wav',
  '/assets/ai/audio/landing_create.wav',
]

// Patterns accept common Vietnamese and English keywords. Replies are always
// selected from the active locale, never borrowed from the other dictionary.
export const kbPatterns: RegExp[] = [
  /gi[oớ]i thi[eệ]u|h[eệ] th[oố]ng|l[aà] g[iì]|t[oổ]ng quan|overview|about|what is|introduce/i,
  /quy tr[iì]nh|ho[aạ]t [đd][ộo]ng|4 b[uư][oớ]c|c[aá]ch th[uứ]c|workflow|how it works|process/i,
  /ai|tr[ií] tu[eệ]|c[oô]ng ngh[eệ]|t[uự] [đd][ộo]ng|technology|artificial|smart/i,
  /chi ph[ií]|gi[aá]|thanh to[aá]n|cost|price|pricing|payment/i,
  /tr[aạ]ng th[aá]i|ti[eế]n [đd][ộo]|ticket|status|progress/i,
  /b[aá]o c[aá]o|k[eế]t qu[aả]|nghi[eệ]m thu|report|result|finding|deliverable/i,
  /an to[aà]n|nguy hi[eể]m|drone|b[aả]o tr[iì]|safety|hazard|maintenance/i,
  /t[aạ]o|[đd][ăa]ng k[yý]|y[eê]u c[aầ]u|create|request|submit/i,
]

export const chatbotWidgetMessages = defineMessages({
  vi: {
    introScript:
      'Xin chào anh chị! Em là trợ lý AI của OnDemand Monitor — nền tảng giám sát hiện trường bằng drone theo yêu cầu. Hệ thống giúp anh chị đặt lịch bay kiểm tra công trình, hạ tầng hoặc khu vực khó tiếp cận chỉ trong vài phút, theo dõi tiến độ trực tiếp, kiểm duyệt ảnh bằng AI và nhận báo cáo nghiệm thu minh bạch.',
    tourChapters: [
      {
        id: 'overview',
        label: 'Tổng quan hệ thống',
        prompt: 'Giới thiệu tổng quan về OnDemand Monitor',
        speech:
          'OnDemand Monitor là nền tảng giám sát bằng drone theo yêu cầu. Anh chị chỉ cần chọn khu vực trên bản đồ và mục tiêu kiểm tra; đội ngũ vận hành sẽ lập kế hoạch bay, điều phối phi công, kỹ thuật viên và drone đạt chuẩn để thu thập hình ảnh chính xác và an toàn.',
        audioUrl: '/assets/ai/audio/landing_overview.wav',
      },
      {
        id: 'workflow',
        label: 'Quy trình 4 bước',
        prompt: 'Quy trình 4 bước hoạt động như thế nào?',
        speech:
          'Quy trình gồm 4 bước khép kín: Bước 1, anh chị tạo yêu cầu và khoanh vùng trên bản đồ. Bước 2, quản lý duyệt phạm vi, báo giá và phân công đội bay. Bước 3, phi công thực hiện nhiệm vụ bay và kiểm tra sau bay. Bước 4, hệ thống kiểm duyệt ảnh, xuất báo cáo để anh chị nghiệm thu và tải toàn bộ dữ liệu gốc.',
        audioUrl: '/assets/ai/audio/landing_workflow.wav',
      },
      {
        id: 'ai',
        label: 'Công nghệ Drone & AI',
        prompt: 'AI hỗ trợ những gì trong hệ thống?',
        speech:
          'AI đồng hành xuyên suốt quy trình: trợ lý giọng nói giúp tạo yêu cầu nhanh chóng, AI kiểm duyệt độ nét và chất lượng ảnh chụp hiện trường, phân tích thay đổi giữa các đợt giám sát, đồng thời theo dõi vòng đời bảo trì drone và tải công việc của đội ngũ.',
        audioUrl: '/assets/ai/audio/landing_ai.wav',
      },
      {
        id: 'report',
        label: 'Báo cáo & Minh bạch',
        prompt: 'Báo cáo bàn giao gồm những gì?',
        speech:
          'Sau khi hoàn thành nhiệm vụ, anh chị nhận được báo cáo tổng hợp kèm bộ ảnh và video đã qua kiểm duyệt, ghi chú hiện trường và tệp báo cáo chuẩn hóa. Mọi mốc tiến độ và thanh toán đều minh bạch ngay trên cổng khách hàng.',
        audioUrl: '/assets/ai/audio/landing_report.wav',
      },
    ] as TourChapter[],
    responses: [
      'OnDemand Monitor là nền tảng giám sát hiện trường bằng drone theo yêu cầu, giúp kết nối nhanh từ khâu tạo yêu cầu trên bản đồ, điều phối đội bay an toàn, kiểm duyệt ảnh bằng AI đến bàn giao báo cáo nghiệm thu minh bạch.',
      'Quy trình gồm 4 bước rõ ràng: Tạo yêu cầu & chọn vị trí → Xác nhận phạm vi & lập kế hoạch bay → Thực hiện giám sát & kiểm tra sau bay → Nghiệm thu, xem báo cáo PDF và mở khóa bộ dữ liệu gốc.',
      'Hệ thống tích hợp AI ở nhiều bước: trợ lý tạo yêu cầu bằng giọng nói, kiểm duyệt chất lượng ảnh tự động, hỗ trợ phát hiện thay đổi hiện trường và quản lý lịch bảo trì drone cùng tải công việc đội ngũ.',
      'Chi phí được xác định minh bạch theo phạm vi, diện tích và nội dung kiểm tra. Bạn chỉ cần tạo yêu cầu để đội ngũ xác nhận báo giá cụ thể trước khi triển khai.',
      'Bạn có thể theo dõi tiến độ từng mốc và trao đổi trực tiếp ngay trong ticket gắn với yêu cầu. Mọi cập nhật từ tiếp nhận, bay chụp đến bàn giao đều được lưu lại.',
      'Báo cáo hiển thị trực tiếp trong dashboard sau khi hoàn tất, gồm hồ sơ ảnh/video đã kiểm duyệt, ghi chú hiện trường và bản xuất PDF để đối chiếu hoặc lưu trữ.',
      'An toàn bay là ưu tiên hàng đầu: mỗi drone đều được theo dõi giờ bay, chu kỳ bảo trì định kỳ và kiểm tra kỹ thuật trước — sau bay; đội ngũ chỉ triển khai khi đủ điều kiện an toàn.',
      'Bạn có thể bấm “Tạo yêu cầu giám sát” hoặc đăng nhập để chọn khu vực trên bản đồ, mô tả mục tiêu kiểm tra và thời gian mong muốn — trợ lý AI cũng có thể hướng dẫn bạn từng bước.',
    ],
    chips: [
      'Cách tạo yêu cầu?',
      'Chi phí thế nào?',
      'An toàn & bảo trì drone?',
    ],
    defaultMessage:
      'Mình chưa có câu trả lời khớp chính xác. Bạn có thể bấm “Nghe giới thiệu hệ thống”, chọn một chủ đề phía trên hoặc hỏi về quy trình 4 bước, AI, chi phí hay báo cáo nhé.',
    greeting:
      'Xin chào! Mình là trợ lý giọng nói AI của OnDemand Monitor. Bấm “Nghe giới thiệu” để mình thuyết minh nhanh về hệ thống, hoặc bấm micro để hỏi trực tiếp nhé!',
    assistantName: 'Trợ lý giọng nói AI',
    stageSubtitle: 'Thuyết minh nhanh về OnDemand Monitor bằng giọng nói',
    onlineStatus: 'Sẵn sàng giới thiệu',
    speakingStatus: 'Đang thuyết minh...',
    listeningStatus: 'Đang lắng nghe bạn...',
    thinkingStatus: 'Đang chuẩn bị câu trả lời...',
    playIntro: 'Nghe giới thiệu hệ thống',
    stopSpeaking: 'Dừng đọc',
    voiceOn: 'Đang bật giọng nói (bấm để tắt)',
    voiceOff: 'Đang tắt giọng nói (bấm để bật)',
    micStart: 'Hỏi bằng giọng nói',
    micStop: 'Dừng ghi âm',
    replay: 'Nghe lại tin nhắn này',
    close: 'Đóng trợ lý',
    inputPlaceholder: 'Hỏi về hệ thống hoặc bấm micro để nói...',
    send: 'Gửi',
    hint: 'Nghe AI giới thiệu hệ thống',
    fabAriaLabel: 'Trợ lý OnDemand Monitor',
  },
  en: {
    introScript:
      'Hello! I am the OnDemand Monitor AI voice guide — an on-demand drone inspection platform. Request a site or infrastructure inspection in minutes, track mission progress in real time, verify imagery quality with AI, and receive structured handover reports.',
    tourChapters: [
      {
        id: 'overview',
        label: 'System overview',
        prompt: 'Give me an overview of OnDemand Monitor',
        speech:
          'OnDemand Monitor is an on-demand drone monitoring platform. Pin your site on the map and describe your inspection goal; our operations team plans the flight, assigns certified pilots, technicians, and healthy drones to capture accurate visual evidence safely.',
      },
      {
        id: 'workflow',
        label: '4-step workflow',
        prompt: 'How does the 4-step workflow work?',
        speech:
          'Our workflow has 4 transparent steps: Step 1, create a request and mark your area on the map. Step 2, managers confirm scope, quote, and assign the crew. Step 3, pilots execute the flight and complete post-flight checks. Step 4, AI assists image review and delivers a finalized PDF report with full source media.',
      },
      {
        id: 'ai',
        label: 'Drone & AI tech',
        prompt: 'How does AI help in the platform?',
        speech:
          'AI supports every stage: a voice assistant speeds up request creation, automated quality checks screen field imagery, change analysis compares inspection runs, and lifecycle rules track drone maintenance and staff workload.',
      },
      {
        id: 'report',
        label: 'Reports & clarity',
        prompt: 'What is included in the report?',
        speech:
          'Once a mission finishes, your dashboard unlocks approved photos and videos, field findings, and a ready-to-share PDF report, with clear milestones and transparent payment tracking.',
      },
    ] as TourChapter[],
    responses: [
      'OnDemand Monitor is an on-demand drone inspection platform connecting map-based request creation, safe crew dispatch, AI-assisted image quality checks, and transparent PDF handover reports.',
      'The workflow runs in 4 clear steps: Create request & pin area → Confirm scope & flight plan → Execute mission & post-flight check → Review deliverables, PDF report, and unlock original media.',
      'AI assists across the lifecycle: voice-guided order intake, automated image quality checks, change analysis between runs, and proactive drone maintenance & workforce workload tracking.',
      'Cost is based on inspection scope, coverage area, and requested deliverables. Submit a request and our team confirms a clear quote before takeoff.',
      'You can track every milestone and message the team directly inside the ticket linked to your request, with a full audit trail from intake to delivery.',
      'Completed reports appear directly in your dashboard with approved photos/videos, field notes, and a structured PDF export.',
      'Flight safety comes first: every drone has tracked flight hours, scheduled maintenance cycles, and mandatory pre- and post-flight checks before dispatch.',
      'Click “Create monitoring request” or sign in to mark your site on the map, describe your goals, and pick a preferred time — our AI assistant can also guide you step by step.',
    ],
    chips: [
      'How do I create a request?',
      'How is pricing calculated?',
      'Drone safety & maintenance?',
    ],
    defaultMessage:
      "I don't have an exact match yet. Tap “Listen to system tour”, pick a topic above, or ask about the 4-step workflow, AI features, pricing, or reports.",
    greeting:
      "Hi! I'm the OnDemand Monitor AI voice guide. Tap “Listen to system tour” for a quick voice introduction, or use the mic to ask anything!",
    assistantName: 'AI Voice Guide',
    stageSubtitle: 'Quick spoken walkthrough of OnDemand Monitor',
    onlineStatus: 'Ready to guide',
    speakingStatus: 'Speaking...',
    listeningStatus: 'Listening...',
    thinkingStatus: 'Preparing answer...',
    playIntro: 'Listen to system tour',
    stopSpeaking: 'Stop voice',
    voiceOn: 'Voice is on (click to mute)',
    voiceOff: 'Voice is muted (click to enable)',
    micStart: 'Ask by voice',
    micStop: 'Stop listening',
    replay: 'Replay this message',
    close: 'Close assistant',
    inputPlaceholder: 'Ask about the system or tap the mic...',
    send: 'Send',
    hint: 'Listen to AI system tour',
    fabAriaLabel: 'OnDemand Monitor assistant',
  },
})
