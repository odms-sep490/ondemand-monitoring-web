import { defineMessages } from '../../../../shared/i18n'

/** Page-level texts: header, step names, field validation and readiness notes. */
export const createOrderPageMessages = defineMessages({
  vi: {
    pageTitle: 'Tạo yêu cầu giám sát',
    pageSubtitle:
      'Chọn dịch vụ, xác định vùng giám sát, chốt nội dung giám sát, chọn thời gian rồi xác nhận kết quả bàn giao.',
    cancel: 'Hủy',
    cancelConfirm:
      'Thoát khỏi trang tạo yêu cầu? Bản nháp của bạn được lưu tự động.',
    blockedChecklist: 'Hãy sửa nội dung giám sát chưa hợp lệ để tiếp tục.',
    blockedLoading: 'Đang tải dữ liệu…',
    stepLabels: {
      1: 'Dịch vụ & mục tiêu',
      2: 'Vị trí & vùng giám sát',
      3: 'Nội dung giám sát',
      4: 'Chi tiết & quyền giám sát',
      5: 'Thời gian',
      6: 'Kết quả bàn giao & xác nhận',
    } as Record<1 | 2 | 3 | 4 | 5 | 6, string>,
    metaErrorTitle: 'Không tải được dữ liệu tạo yêu cầu',
    validation: {
      address: 'Nhập địa chỉ/khu vực cần giám sát.',
      latitude: 'Latitude không hợp lệ.',
      longitude: 'Longitude không hợp lệ.',
      locationUnconfirmed:
        'Xác nhận lại vị trí để đồng bộ địa chỉ, tọa độ và điểm trên bản đồ.',
      outsideZone:
        'Hiện chỉ phục vụ trong khu vực TP.HCM. Vui lòng chọn lại điểm trong vùng phục vụ.',
      blockedZone: (zoneNames: string) =>
        `Vùng giám sát chạm vùng cấm: ${zoneNames}. Vui lòng chọn điểm hoặc giảm bán kính.`,
      serviceId: 'Chọn dịch vụ giám sát.',
      title: 'Nhập tiêu đề yêu cầu.',
      otherFlightPurpose: 'Nhập mục đích chuyến bay cụ thể.',
      otherUsagePurpose: 'Nhập cách bạn sẽ sử dụng kết quả.',
      preferredDateFrom: 'Chọn ngày bắt đầu.',
      preferredDateTooSoon:
        'Ngày bay sớm nhất phải cách ngày tạo yêu cầu ít nhất 7 ngày để ODMS chuẩn bị thủ tục giấy phép bay.',
      preferredDateTo: 'Chọn ngày kết thúc.',
      preferredDateOrder: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
      preferredTimeId: 'Chọn khung giờ.',
      resultDeadline:
        'Hạn chót nhận kết quả không được trước ngày bay muộn nhất.',
      recurrenceOccurrences: 'Số lần lặp phải từ 2 đến 52.',
      deliverableTypeId: 'Chọn kết quả bàn giao.',
      resultFormats: 'Chọn ít nhất một định dạng kết quả.',
      deliveryMethods: 'Chọn ít nhất một phương thức nhận kết quả.',
      termsAccepted:
        'Bạn cần đồng ý điều khoản và cam kết bảo mật để gửi yêu cầu.',
      altitudeM: 'Độ cao giám sát mong muốn phải từ 10 đến 120 m.',
      estimatedLengthM:
        'Chiều dài ước tính phải lớn hơn 0 và không quá 100.000 m.',
      siteContactPhone: 'Số điện thoại liên hệ không hợp lệ.',
      siteContactName: 'Nhập tên người liên hệ tại hiện trường.',
      siteContactPhoneRequired: 'Nhập số điện thoại liên hệ tại hiện trường.',
      accessNotes: 'Nhập điều kiện ra vào khu vực.',
      permitStatus: (zoneName: string) =>
        `Khu vực nằm trong vùng cần xin phép bay (${zoneName}). Hãy cho biết bạn đã có giấy phép hay cần hỗ trợ.`,
      permitNumber: 'Nhập số giấy phép bay.',
      permitDocuments: 'Đính kèm tệp giấy phép bay (PDF hoặc ảnh).',
      permitExpiresOn: 'Chọn ngày hết hạn của giấy phép.',
      permitExpired:
        'Giấy phép hết hạn trước ngày bay. Hãy dùng giấy phép còn hiệu lực đến hết ngày bay.',
      monitoringRelationship: 'Chọn quan hệ của bạn với khu vực giám sát.',
      otherMonitoringRelationship: 'Nhập quan hệ cụ thể của bạn với khu vực.',
      monitoringAuthorizationConfirmed:
        'Bạn cần xác nhận quyền yêu cầu giám sát trước khi gửi.',
      monitoringAuthorizationDocuments:
        'Hoàn tất tên và tệp đính kèm cho từng tài liệu đã thêm.',
    },
    scoreNotes: {
      missingAddress: 'Thiếu địa chỉ mô tả khu vực giám sát.',
      missingService: 'Chưa chọn dịch vụ giám sát.',
      missingDeliverable: 'Chưa chọn kết quả bàn giao.',
      missingSchedule: 'Thiếu ngày hoặc khung giờ bay.',
      largeRadius: 'Bán kính lớn, nên chia khu vực thành nhiều lượt bay.',
      allGood: 'Thông tin đủ để gửi yêu cầu cho bộ phận vận hành kiểm tra.',
    },
  },
  en: {
    pageTitle: 'Create Monitoring Request',
    pageSubtitle:
      'Choose a service, define the monitoring area, confirm the monitoring content, pick a schedule, then confirm deliverables.',
    cancel: 'Cancel',
    cancelConfirm: 'Leave the request page? Your draft is saved automatically.',
    blockedChecklist: 'Fix the invalid monitoring content to continue.',
    blockedLoading: 'Loading data…',
    stepLabels: {
      1: 'Service & target',
      2: 'Location & monitoring area',
      3: 'Monitoring content',
      4: 'Site details & authorization',
      5: 'Schedule',
      6: 'Deliverables & confirmation',
    } as Record<1 | 2 | 3 | 4 | 5 | 6, string>,
    metaErrorTitle: 'Unable to load data for creating this request',
    validation: {
      address: 'Enter the address/area to monitor.',
      latitude: 'Invalid latitude.',
      longitude: 'Invalid longitude.',
      locationUnconfirmed:
        'Confirm this location so the address, coordinates, and map point stay in sync.',
      outsideZone:
        'Service is currently limited to Ho Chi Minh City. Please pick a point inside the service area.',
      blockedZone: (zoneNames: string) =>
        `The monitoring area touches a no-fly zone: ${zoneNames}. Please pick another point or reduce the radius.`,
      serviceId: 'Select a monitoring service.',
      title: 'Enter a request title.',
      otherFlightPurpose: 'Enter the specific flight purpose.',
      otherUsagePurpose: 'Enter how you will use the results.',
      preferredDateFrom: 'Select a start date.',
      preferredDateTooSoon:
        'The earliest flight date must be at least 7 days after the request date so ODMS can prepare the flight permit procedures.',
      preferredDateTo: 'Select an end date.',
      preferredDateOrder: 'End date must be on or after the start date.',
      preferredTimeId: 'Select a time window.',
      resultDeadline:
        'The result deadline cannot be before the latest flight date.',
      recurrenceOccurrences: 'Number of flights must be between 2 and 52.',
      deliverableTypeId: 'Select a deliverable.',
      resultFormats: 'Select at least one result format.',
      deliveryMethods: 'Select at least one delivery method.',
      termsAccepted:
        'You must accept the terms and the security commitment to submit.',
      altitudeM: 'Flight altitude must be between 10 and 120 m.',
      estimatedLengthM:
        'Estimated length must be above 0 and at most 100,000 m.',
      siteContactPhone: 'Invalid contact phone number.',
      siteContactName: 'Enter the on-site contact name.',
      siteContactPhoneRequired: 'Enter the on-site contact phone number.',
      accessNotes: 'Enter the access conditions.',
      permitStatus: (zoneName: string) =>
        `The area is inside airspace that needs a flight permit (${zoneName}). Tell us whether you hold a permit or need support.`,
      permitNumber: 'Enter the flight permit number.',
      permitDocuments: 'Attach the flight permit file (PDF or image).',
      permitExpiresOn: 'Choose the permit expiry date.',
      permitExpired:
        'The permit expires before the flight date. Use a permit valid through the flight date.',
      monitoringRelationship:
        'Select your relationship to the monitoring area.',
      otherMonitoringRelationship:
        'Enter your specific relationship to the monitoring area.',
      monitoringAuthorizationConfirmed:
        'Confirm your right to request monitoring before submitting.',
      monitoringAuthorizationDocuments:
        'Complete the name and attachment for every added document.',
    },
    scoreNotes: {
      missingAddress: 'Missing an address describing the monitoring area.',
      missingService: 'No monitoring service selected.',
      missingDeliverable: 'No deliverable selected.',
      missingSchedule: 'Missing flight date or time window.',
      largeRadius:
        'Large radius: consider splitting the area into multiple flights.',
      allGood:
        'Enough information to submit this request for operations review.',
    },
  },
})
