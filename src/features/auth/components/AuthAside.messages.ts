import { defineMessages } from '../../../shared/i18n'

// Copy sourced from evd/design/SYS-01.dc.html / SYS-02.dc.html aside card
// (brand subtitle + 3 value-prop bullets). `vi` is unchanged from the
// original Vietnamese copy; `en` is a natural translation for Phase 2.
export const authAsideMessages = defineMessages({
  vi: {
    asideLabel: 'OnDemand Monitor - dịch vụ giám sát bằng drone theo yêu cầu',
    brandSubtitle: 'Dịch vụ giám sát bằng drone theo yêu cầu',
    heroTitle: 'Giám sát thông minh',
    heroAccent: 'vươn xa tầm nhìn',
    heroDescription:
      'Drone và AI giúp bạn giám sát, phân tích và bảo vệ những gì quan trọng.',
    valueProps: [
      {
        icon: 'map-pin',
        text: 'Chọn vùng giám sát trên bản đồ',
      },
      {
        icon: 'zap',
        text: 'AI kiểm tra điều kiện bay',
      },
      {
        icon: 'radio',
        text: 'Theo dõi trực tiếp, nhận ảnh và video',
      },
    ] as {
      icon: 'map-pin' | 'zap' | 'radio'
      text: string
    }[],
  },
  en: {
    asideLabel: 'OnDemand Monitor - on-demand drone monitoring service',
    brandSubtitle: 'On-demand drone monitoring service',
    heroTitle: 'Smarter monitoring',
    heroAccent: 'a wider perspective',
    heroDescription:
      'Use drones and AI to monitor, analyze, and protect what matters.',
    valueProps: [
      {
        icon: 'map-pin',
        text: 'Choose a monitoring area on the map',
      },
      {
        icon: 'zap',
        text: 'AI checks flight conditions',
      },
      {
        icon: 'radio',
        text: 'Watch live and receive photos and video',
      },
    ] as {
      icon: 'map-pin' | 'zap' | 'radio'
      text: string
    }[],
  },
})
