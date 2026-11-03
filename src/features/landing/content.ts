import { defineMessages } from '../../shared/i18n'

// Landing copy follows the capabilities verified in the order and mission flows.
export const landingMessages = defineMessages({
  vi: {
    brandName: 'OnDemand Monitor',
    navLinks: [
      { label: 'Quy trình', href: '#how-it-works' },
      { label: 'Ứng dụng', href: '#mission-solar' },
      { label: 'Kết quả', href: '#mission-results' },
    ],
    workflowSteps: [
      {
        no: 'request',
        title: 'Gửi yêu cầu',
        detail:
          'Cung cấp dịch vụ, khu vực, thời gian mong muốn và nội dung cần kiểm tra.',
      },
      {
        no: 'review',
        title: 'Rà soát phạm vi',
        detail:
          'Manager xem xét điều kiện và thông tin liên quan trước khi lập kế hoạch.',
      },
      {
        no: 'prepare',
        title: 'Chuẩn bị nhiệm vụ',
        detail:
          'Nhân sự kết nối thiết bị, hoàn tất kiểm tra trước bay và bàn giao quyền điều khiển.',
      },
      {
        no: 'results',
        title: 'Rà soát kết quả',
        detail: 'Checklist, ảnh/video và hậu kiểm được gửi để Manager xem xét.',
      },
    ],
    hero: {
      title: 'Theo dõi nhiệm vụ drone, từ yêu cầu đến kết quả',
      lead: 'OnDemand Monitor kết nối yêu cầu hiện trường với khâu lập kế hoạch, chuẩn bị trước chuyến bay và rà soát kết quả sau chuyến bay.',
      supporting:
        'Một quy trình có thể theo dõi cho khách hàng, Manager và nhân sự vận hành.',
      visualLabel: 'Giao diện minh họa',
      visualTitle: 'Hồ sơ nhiệm vụ',
      stages: [
        'Tiếp nhận yêu cầu',
        'Lập kế hoạch & phân công',
        'Kiểm tra trước bay',
        'Rà soát kết quả',
      ],
      animationAlt:
        'Hoạt ảnh drone bay minh họa cho giao diện OnDemand Monitor.',
      imageNote:
        'Hoạt ảnh minh họa, không thể hiện dữ liệu của nhiệm vụ thực tế.',
    },
    journey: {
      label: 'Một nhiệm vụ, các mốc rõ ràng',
      title: 'Theo dõi việc cần làm ở từng giai đoạn',
      lead: 'Yêu cầu, phân công, kiểm tra trước bay và hồ sơ sau bay được trình bày theo cùng một luồng.',
      visualLabel: 'Ảnh hiện trường minh họa và tiến trình nhiệm vụ',
      currentStageLabel: 'Giai đoạn đang xem',
      imageNote: 'Ảnh chỉ minh họa bối cảnh, không khẳng định phạm vi dịch vụ.',
      stages: [
        {
          id: 'request-review',
          title: 'Tiếp nhận và rà soát yêu cầu',
          detail:
            'Khách hàng gửi dịch vụ, khu vực, thời gian mong muốn và nội dung cần kiểm tra. Manager rà soát phạm vi cùng các điều kiện liên quan.',
          status: 'Yêu cầu được rà soát',
          image: '/images/landing/site-construction.jpg',
          imageAlt: 'Khu vực công trình nhìn từ trên cao, ảnh minh họa.',
        },
        {
          id: 'mission-planning',
          title: 'Lập kế hoạch và phân công',
          detail:
            'Manager tạo nhiệm vụ, gán thiết bị và nhân sự để đội ngũ biết rõ phần việc được giao.',
          status: 'Nhiệm vụ được chuẩn bị',
          image: '/images/landing/solar-field.jpg',
          imageAlt: 'Khu vực trang trại năng lượng mặt trời, ảnh minh họa.',
        },
        {
          id: 'preflight',
          title: 'Kiểm tra trước bay và bàn giao',
          detail:
            'Nhân sự vận hành nhận nhiệm vụ, kết nối GCS và thiết bị, hoàn tất preflight, xem điều kiện thời tiết rồi bàn giao quyền điều khiển.',
          status: 'Thiết bị được kiểm tra',
          image: '/images/landing/transmission-tower.jpg',
          imageAlt: 'Trụ truyền tải điện giữa khu vực cây xanh, ảnh minh họa.',
        },
        {
          id: 'postflight-review',
          title: 'Thực hiện, hậu kiểm và gửi Manager',
          detail:
            'Sau khi nhiệm vụ bắt đầu, nhân sự ghi nhận hậu kiểm, checklist và ảnh/video rồi gửi hồ sơ để Manager xem xét.',
          status: 'Hồ sơ chờ rà soát',
          image: '/images/landing/rail-yard.jpg',
          imageAlt: 'Khu đường ray và nhà ga nhìn từ trên cao, ảnh minh họa.',
        },
      ],
    },
    capabilities: {
      label: 'Công cụ gắn với quy trình',
      title: 'Thông tin quan trọng nằm cùng hồ sơ nhiệm vụ',
      lead: 'Các bước chuẩn bị và kết quả được ghi nhận để người phụ trách tiếp theo có thể rà soát.',
      items: [
        {
          title: 'Phạm vi và điều kiện',
          detail:
            'Thông tin yêu cầu, khu vực bay và hồ sơ liên quan được rà soát trước khi triển khai.',
        },
        {
          title: 'Checklist và thời tiết',
          detail:
            'Kết quả preflight cùng thông tin thời tiết hỗ trợ nhân sự đánh giá điều kiện trước chuyến bay.',
        },
        {
          title: 'Bằng chứng và hậu kiểm',
          detail:
            'Checklist, ảnh/video và kết quả sau bay được gửi để Manager xem xét.',
        },
      ],
    },
    faq: {
      title: 'Thông tin cần biết',
      items: [
        {
          question: 'Tôi cần cung cấp gì khi tạo yêu cầu?',
          answer:
            'Hãy cung cấp dịch vụ cần thực hiện, vị trí hoặc khu vực, thời gian mong muốn và nội dung cần kiểm tra. Đội ngũ có thể yêu cầu bổ sung thông tin khi rà soát.',
        },
        {
          question: 'Khi nào nhiệm vụ sẵn sàng để bắt đầu?',
          answer:
            'Nhân sự vận hành cần hoàn tất kết nối và preflight, đánh giá điều kiện thời tiết, sau đó bàn giao quyền điều khiển. Nghiệm thu chỉ bắt đầu nhiệm vụ khi các điều kiện của quy trình đã đạt.',
        },
        {
          question: 'Ai xem xét kết quả sau chuyến bay?',
          answer:
            'Nhân sự gửi checklist, ảnh/video và kết quả hậu kiểm để Manager rà soát trước bước bàn giao kết quả theo quy trình đơn hàng.',
        },
        {
          question: 'Nền tảng có tự động điều khiển drone không?',
          answer:
            'Quy trình hiện tại có nhân sự vận hành kết nối GCS/thiết bị, thực hiện kiểm tra trước bay và bàn giao quyền điều khiển. Trang này không mô tả chuyến bay tự động.',
        },
      ],
    },
    final: {
      title: 'Bắt đầu bằng khu vực bạn cần giám sát',
      lead: 'Gửi thông tin yêu cầu để đội ngũ có thể rà soát phạm vi và bước tiếp theo.',
      imageCreditsTitle: 'Nguồn ảnh minh họa',
      imageCredits: [
        {
          label: 'Hoạt ảnh drone — LottieFiles',
          href: 'https://app.lottiefiles.com/animation/34c3a645-f17a-4607-bd21-8d43b0644457?channel=web&from=download&panel=embed&source=public-animation',
        },
        {
          label: 'Công trình — NOIRLab/NSF/AURA, CC BY 4.0',
          href: 'https://commons.wikimedia.org/wiki/File:Giant_Magellan_Telescope_Construction_Site_(GMT_Construction_Site_Aerial_20200226-0599-CC).tif',
        },
        {
          label: 'Trang trại năng lượng — Wikideas1, CC0',
          href: 'https://commons.wikimedia.org/wiki/File:Solar_farm_in_Wisconsin_01.jpg',
        },
        {
          label: 'Trụ truyền tải — Foto3821, CC0',
          href: 'https://commons.wikimedia.org/wiki/File:Electric_transmission_power_tower.jpg',
        },
        {
          label: 'Đường ray — Zottelorre, CC0',
          href: 'https://commons.wikimedia.org/wiki/File:Railway_yard_of_the_Antwerpen-Oost_train_station.jpg',
        },
      ],
      copyright: '© 2026 OnDemand Monitor.',
    },
  },
  en: {
    brandName: 'OnDemand Monitor',
    navLinks: [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Use cases', href: '#mission-solar' },
      { label: 'Results', href: '#mission-results' },
    ],
    workflowSteps: [
      {
        no: 'request',
        title: 'Send a request',
        detail:
          'Provide the service, area, preferred timing, and what needs to be checked.',
      },
      {
        no: 'review',
        title: 'Review the scope',
        detail:
          'A Manager reviews requirements and related information before planning.',
      },
      {
        no: 'prepare',
        title: 'Prepare the mission',
        detail:
          'Staff connect the equipment, complete pre-flight checks, and hand over control.',
      },
      {
        no: 'results',
        title: 'Review results',
        detail:
          'Checklist items, photos or video, and post-flight records are sent to the Manager.',
      },
    ],
    hero: {
      title: 'Track drone missions from request to result',
      lead: 'OnDemand Monitor connects site requests with planning, pre-flight preparation, and post-flight review.',
      supporting:
        'One traceable workflow for customers, Managers, and field staff.',
      visualLabel: 'Illustrative interface',
      visualTitle: 'Mission record',
      stages: [
        'Request received',
        'Plan & assign',
        'Pre-flight check',
        'Review results',
      ],
      animationAlt:
        'Illustrative drone animation for the OnDemand Monitor interface.',
      imageNote:
        'Illustrative animation; it does not show data from a real mission.',
    },
    journey: {
      label: 'One mission, clear milestones',
      title: 'See what happens at each stage',
      lead: 'Requests, assignments, pre-flight checks, and post-flight records follow one workflow.',
      visualLabel: 'Illustrative site image and mission progress',
      currentStageLabel: 'Stage in view',
      imageNote:
        'Images illustrate locations; they do not imply service coverage.',
      stages: [
        {
          id: 'request-review',
          title: 'Receive and review a request',
          detail:
            'Customers provide the service, area, preferred timing, and inspection scope. A Manager reviews the scope and related requirements.',
          status: 'Request under review',
          image: '/images/landing/site-construction.jpg',
          imageAlt: 'Construction site viewed from above, illustrative image.',
        },
        {
          id: 'mission-planning',
          title: 'Plan and assign resources',
          detail:
            'A Manager creates the mission and assigns staff and equipment so the team can see its responsibilities.',
          status: 'Mission being prepared',
          image: '/images/landing/solar-field.jpg',
          imageAlt: 'Solar farm, illustrative image.',
        },
        {
          id: 'preflight',
          title: 'Complete pre-flight checks and handover',
          detail:
            'Field staff accept the mission, connect the GCS and device, complete preflight checks, assess weather, and hand over control.',
          status: 'Equipment checked',
          image: '/images/landing/transmission-tower.jpg',
          imageAlt: 'Power transmission tower among trees, illustrative image.',
        },
        {
          id: 'postflight-review',
          title: 'Fly, complete post-flight checks, and send to Manager',
          detail:
            'After the mission starts, staff record post-flight checks, checklist items, and photos or video, then submit the record for Manager review.',
          status: 'Record awaiting review',
          image: '/images/landing/rail-yard.jpg',
          imageAlt:
            'Railway tracks and station viewed from above, illustrative image.',
        },
      ],
    },
    capabilities: {
      label: 'Tools tied to the workflow',
      title: 'Key information stays with the mission record',
      lead: 'Preparation and results are recorded so the next person responsible can review them.',
      items: [
        {
          title: 'Scope and conditions',
          detail:
            'Request details, flight area, and related documents are reviewed before operations.',
        },
        {
          title: 'Checklist and weather',
          detail:
            'Preflight results and weather information help staff assess conditions before flight.',
        },
        {
          title: 'Evidence and post-flight review',
          detail:
            'Checklist items, photos or video, and post-flight results are sent for Manager review.',
        },
      ],
    },
    faq: {
      title: 'What to know',
      items: [
        {
          question: 'What should I include in a request?',
          answer:
            'Provide the service, location or area, preferred timing, and what needs to be checked. The team may request more information during review.',
        },
        {
          question: 'When is a mission ready to start?',
          answer:
            'Field staff need to connect the equipment and complete preflight checks, assess weather, and hand over control. Acceptance starts the mission only when the workflow conditions are met.',
        },
        {
          question: 'Who reviews the results after a flight?',
          answer:
            'Staff submit checklist items, photos or video, and post-flight results for Manager review before the order’s result handoff.',
        },
        {
          question: 'Does the platform control drones automatically?',
          answer:
            'The current workflow has field staff connect the GCS/device, complete pre-flight checks, and hand over control. This page does not describe autonomous flights.',
        },
      ],
    },
    final: {
      title: 'Start with the site you want monitored',
      lead: 'Send a request so the team can review the scope and next steps.',
      imageCreditsTitle: 'Illustrative image credits',
      imageCredits: [
        {
          label: 'Drone animation — LottieFiles',
          href: 'https://app.lottiefiles.com/animation/34c3a645-f17a-4607-bd21-8d43b0644457?channel=web&from=download&panel=embed&source=public-animation',
        },
        {
          label: 'Construction site — NOIRLab/NSF/AURA, CC BY 4.0',
          href: 'https://commons.wikimedia.org/wiki/File:Giant_Magellan_Telescope_Construction_Site_(GMT_Construction_Site_Aerial_20200226-0599-CC).tif',
        },
        {
          label: 'Solar farm — Wikideas1, CC0',
          href: 'https://commons.wikimedia.org/wiki/File:Solar_farm_in_Wisconsin_01.jpg',
        },
        {
          label: 'Transmission tower — Foto3821, CC0',
          href: 'https://commons.wikimedia.org/wiki/File:Electric_transmission_power_tower.jpg',
        },
        {
          label: 'Rail yard — Zottelorre, CC0',
          href: 'https://commons.wikimedia.org/wiki/File:Railway_yard_of_the_Antwerpen-Oost_train_station.jpg',
        },
      ],
      copyright: '© 2026 OnDemand Monitor.',
    },
  },
})
