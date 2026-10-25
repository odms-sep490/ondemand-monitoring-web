import type { ServiceDeliverableOption } from '../../features/customer/api/customerApi'

type CategoryService = { id: string; name: string; description?: string }

// Local mock seed data for BE-shaped endpoints. AI recommendation logic does not
// read this list directly; the create-order flow sends the active service catalog
// in requestContext, same as when it talks to the real backend.
export const mockServiceDeliverables: ServiceDeliverableOption[] = [
  { id: 'sd-construction-photo', serviceId: 'svc-construction', serviceName: 'Giám sát công trình', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Ảnh chụp' },
  { id: 'sd-construction-video', serviceId: 'svc-construction', serviceName: 'Giám sát công trình', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video' },
  { id: 'sd-construction-report', serviceId: 'svc-construction', serviceName: 'Giám sát công trình', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo kết quả' },
  { id: 'sd-factory-photo', serviceId: 'svc-factory', serviceName: 'Kiểm tra nhà xưởng', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Ảnh chụp' },
  { id: 'sd-factory-video', serviceId: 'svc-factory', serviceName: 'Kiểm tra nhà xưởng', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video' },
  { id: 'sd-factory-report', serviceId: 'svc-factory', serviceName: 'Kiểm tra nhà xưởng', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo kết quả' },
  { id: 'sd-area-photo', serviceId: 'svc-area', serviceName: 'Giám sát khu vực', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Ảnh chụp' },
  { id: 'sd-area-video', serviceId: 'svc-area', serviceName: 'Giám sát khu vực', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video' },
  { id: 'sd-forest-photo', serviceId: 'svc-forest', serviceName: 'Giám sát rừng', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Ảnh chụp' },
  { id: 'sd-forest-video', serviceId: 'svc-forest', serviceName: 'Giám sát rừng', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video' },
  { id: 'sd-forest-report', serviceId: 'svc-forest', serviceName: 'Giám sát rừng', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo kết quả' },
]

export const mockCategoryServices: CategoryService[] = [
  { id: 'cat-1', name: 'Giám sát công trình', description: 'Theo dõi tiến độ, chụp định kỳ, so sánh theo tuần/tháng và phát hiện khu vực thi công chậm.' },
  { id: 'cat-2', name: 'Kiểm tra nhà xưởng', description: 'Quan sát mái, bề mặt và các khu vực khó tiếp cận của nhà xưởng.' },
  { id: 'cat-3', name: 'Giám sát khu vực', description: 'Chụp ảnh và video tổng quan một khu vực theo phạm vi yêu cầu.' },
  { id: 'cat-4', name: 'Giám sát rừng', description: 'Ghi nhận hiện trạng khu vực rừng và các dấu hiệu bất thường.' },
]
