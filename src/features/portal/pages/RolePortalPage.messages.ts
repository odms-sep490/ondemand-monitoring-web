import { defineMessages } from '../../../shared/i18n'
import type { UserRole } from '../../auth/types'

type PortalMetric = {
  label: string
  value: string
  detail: string
  icon: 'chart' | 'ticket' | 'clock' | 'shield' | 'radio'
}

type RoleContent = {
  title: string
  subtitle: string
  eyebrow: string
  metrics: PortalMetric[]
  activities: string[]
  primary: string
}

export const rolePortalPageMessages = defineMessages({
  vi: {
    heroTitle: 'Đưa ra quyết định tiếp theo một cách tự tin.',
    heroCopy:
      'Fieldwise gắn kết yêu cầu, con người, thiết bị và bằng chứng vào một chỗ để mọi đội đều hành động trên cùng một bức tranh vận hành.',
    metricsAriaLabel: 'Chỉ số chính',
    recentActivityEyebrow: 'Hoạt động gần đây',
    recentActivityTitle: 'Việc cần chú ý',
    updatedJustNow: 'Vừa cập nhật',
    hoursAgo: (n: number) => `${n} giờ trước`,
    nextActionEyebrow: 'Việc nên làm tiếp theo',
    nextActionTitle: 'Giữ quy trình luôn trôi chảy.',
    nextActionCopy:
      'Dùng thanh điều hướng khu vực làm việc để xem hàng chờ, kiểm tra bằng chứng hoặc xử lý bàn giao vận hành tiếp theo.',
    nextActionLink: 'Xem hướng dẫn khu vực làm việc',
    roleContent: {
      CUSTOMER: {
        title: 'Khu vực giám sát của bạn',
        subtitle:
          'Tạo yêu cầu, theo dõi tiến độ và xem lại kết quả kiểm tra ở cùng một nơi.',
        eyebrow: 'Trung tâm điều hành khách hàng',
        primary: 'Tạo yêu cầu giám sát',
        metrics: [
          {
            label: 'Yêu cầu đang mở',
            value: '04',
            detail: '1 yêu cầu cần bạn xem lại',
            icon: 'ticket',
          },
          {
            label: 'Đang thực hiện',
            value: '02',
            detail: 'Cập nhật gần nhất 12 phút trước',
            icon: 'clock',
          },
          {
            label: 'Báo cáo đã sẵn sàng',
            value: '08',
            detail: '3 báo cáo mới trong tháng này',
            icon: 'chart',
          },
          {
            label: 'Tình trạng an toàn',
            value: 'Tốt',
            detail: 'Không có phát hiện nghiêm trọng',
            icon: 'shield',
          },
        ],
        activities: [
          'Đang kiểm tra tháp giải nhiệt B',
          'Báo cáo RPT-1048 đã sẵn sàng để xem lại',
          'Yêu cầu MON-2481 đã được giao cho đội vận hành',
        ],
      },
      MANAGER: {
        title: 'Tổng quan vận hành',
        subtitle:
          'Xem lại các yêu cầu mới, phân công đúng đội và giữ tiến độ dịch vụ.',
        eyebrow: 'Vận hành dịch vụ',
        primary: 'Xem hàng chờ yêu cầu',
        metrics: [
          {
            label: 'Yêu cầu mới',
            value: '12',
            detail: '5 yêu cầu nhận trong hôm nay',
            icon: 'ticket',
          },
          {
            label: 'Đang phân công',
            value: '07',
            detail: '2 yêu cầu cần người vận hành',
            icon: 'clock',
          },
          {
            label: 'Nhiệm vụ đang hoạt động',
            value: '04',
            detail: 'Trải rộng 3 địa điểm',
            icon: 'chart',
          },
          {
            label: 'Tình trạng SLA',
            value: '96%',
            detail: 'Đạt mục tiêu',
            icon: 'shield',
          },
        ],
        activities: [
          'MON-2492 đang chờ phân công',
          'Kiểm tra khu vực phía Đông theo lịch lúc 14:00',
          'Đội Alpha đã hoàn tất kiểm tra trước bay',
        ],
      },
      STAFF: {
        title: 'Bảng điều khiển nhiệm vụ',
        subtitle:
          'Quản lý các nhiệm vụ được giao, từ khi nhận đến khi kiểm tra sau bay.',
        eyebrow: 'Thực thi hiện trường',
        primary: 'Mở bảng điều khiển nhiệm vụ',
        metrics: [
          {
            label: 'Nhiệm vụ được giao',
            value: '03',
            detail: '1 nhiệm vụ sẵn sàng nhận',
            icon: 'ticket',
          },
          {
            label: 'Sẵn sàng trước bay',
            value: '02',
            detail: 'Không có kiểm tra bị chặn',
            icon: 'shield',
          },
          {
            label: 'Nhiệm vụ trực tiếp',
            value: '01',
            detail: 'Telemetry đã kết nối',
            icon: 'chart',
          },
          {
            label: 'Tình trạng thiết bị',
            value: 'Tốt',
            detail: 'Mọi thiết bị được giao đều trực tuyến',
            icon: 'clock',
          },
        ],
        activities: [
          'Nhiệm vụ M-001 sẵn sàng để người vận hành nhận',
          'Luồng telemetry của DRONE-01 đã kết nối',
          'M-0008 đang chờ kiểm tra sau bay',
        ],
      },
      ADMIN: {
        title: 'Tổng quan quản trị',
        subtitle:
          'Quản lý quyền truy cập, quản trị hệ thống và tình trạng nền tảng Fieldwise.',
        eyebrow: 'Quản trị hệ thống',
        primary: 'Quản lý tài khoản người dùng',
        metrics: [
          {
            label: 'Tổng số người dùng',
            value: '148',
            detail: '+12 trong tháng này',
            icon: 'ticket',
          },
          {
            label: 'Khách hàng đang hoạt động',
            value: '86',
            detail: '58% tổng số người dùng',
            icon: 'chart',
          },
          {
            label: 'Sự cố đang mở',
            value: '02',
            detail: 'Không có sự cố nghiêm trọng',
            icon: 'shield',
          },
          {
            label: 'Sự kiện nhật ký',
            value: '324',
            detail: '24 giờ gần nhất',
            icon: 'clock',
          },
        ],
        activities: [
          'Tài khoản khách hàng mới được tạo hôm nay',
          'Quyền vai trò Staff đã được cập nhật',
          'Bản xuất nhật ký hàng tuần đã sẵn sàng',
        ],
      },
    } satisfies Record<UserRole, RoleContent>,
  },
  en: {
    heroTitle: 'Make the next decision with confidence.',
    heroCopy:
      'Fieldwise keeps the request, people, devices, and evidence connected so every team can act from the same operational picture.',
    metricsAriaLabel: 'Key metrics',
    recentActivityEyebrow: 'Recent activity',
    recentActivityTitle: 'What needs attention',
    updatedJustNow: 'Updated just now',
    hoursAgo: (n: number) => `${n} hours ago`,
    nextActionEyebrow: 'Next best action',
    nextActionTitle: 'Keep the workflow moving.',
    nextActionCopy:
      'Use the workspace navigation to review the queue, inspect evidence, or resolve the next operational handoff.',
    nextActionLink: 'View workspace guidance',
    roleContent: {
      CUSTOMER: {
        title: 'Your monitoring workspace',
        subtitle:
          'Create requests, follow progress, and review inspection outcomes in one place.',
        eyebrow: 'Customer command center',
        primary: 'Create monitoring request',
        metrics: [
          {
            label: 'Open requests',
            value: '04',
            detail: '1 needs your review',
            icon: 'ticket',
          },
          {
            label: 'In progress',
            value: '02',
            detail: 'Latest update 12 min ago',
            icon: 'clock',
          },
          {
            label: 'Reports ready',
            value: '08',
            detail: '3 new this month',
            icon: 'chart',
          },
          {
            label: 'Safety status',
            value: 'Good',
            detail: 'No critical findings',
            icon: 'shield',
          },
        ],
        activities: [
          'Cooling tower B inspection is in progress',
          'Report RPT-1048 is ready to review',
          'Request MON-2481 was assigned to an operations team',
        ],
      },
      MANAGER: {
        title: 'Operations overview',
        subtitle:
          'Review incoming requests, assign the right team, and keep service delivery on track.',
        eyebrow: 'Service operations',
        primary: 'Review request queue',
        metrics: [
          {
            label: 'New requests',
            value: '12',
            detail: '5 received today',
            icon: 'ticket',
          },
          {
            label: 'In assignment',
            value: '07',
            detail: '2 need an operator',
            icon: 'clock',
          },
          {
            label: 'Active missions',
            value: '04',
            detail: 'Across 3 sites',
            icon: 'chart',
          },
          {
            label: 'SLA health',
            value: '96%',
            detail: 'Within target',
            icon: 'shield',
          },
        ],
        activities: [
          'MON-2492 is waiting for assignment',
          'East site inspection scheduled for 14:00',
          'Team Alpha completed preflight checks',
        ],
      },
      STAFF: {
        title: 'Mission console',
        subtitle:
          'Manage assigned inspections from acceptance through post-flight review.',
        eyebrow: 'Field execution',
        primary: 'Open mission console',
        metrics: [
          {
            label: 'Assigned missions',
            value: '03',
            detail: '1 ready to accept',
            icon: 'ticket',
          },
          {
            label: 'Preflight ready',
            value: '02',
            detail: 'No blocking checks',
            icon: 'shield',
          },
          {
            label: 'Live missions',
            value: '01',
            detail: 'Telemetry connected',
            icon: 'chart',
          },
          {
            label: 'Device status',
            value: 'Good',
            detail: 'All assigned devices online',
            icon: 'clock',
          },
        ],
        activities: [
          'Mission M-001 is ready for operator acceptance',
          'DRONE-01 telemetry stream is connected',
          'Post-flight review pending for M-0008',
        ],
      },
      ADMIN: {
        title: 'Administration overview',
        subtitle:
          'Manage access, system governance, and the health of the Fieldwise platform.',
        eyebrow: 'System administration',
        primary: 'Manage user accounts',
        metrics: [
          {
            label: 'Total users',
            value: '148',
            detail: '+12 this month',
            icon: 'ticket',
          },
          {
            label: 'Active customers',
            value: '86',
            detail: '58% of all users',
            icon: 'chart',
          },
          {
            label: 'Open incidents',
            value: '02',
            detail: 'No critical incidents',
            icon: 'shield',
          },
          {
            label: 'Audit events',
            value: '324',
            detail: 'Last 24 hours',
            icon: 'clock',
          },
        ],
        activities: [
          'New customer account created today',
          'Staff role permissions were updated',
          'Weekly audit export is ready',
        ],
      },
    } satisfies Record<UserRole, RoleContent>,
  },
})
