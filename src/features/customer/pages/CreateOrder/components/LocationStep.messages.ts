import { defineMessages } from '../../../../../shared/i18n'

export const locationStepMessages = defineMessages({
  vi: {
    invalidCoordinates: 'Vĩ độ phải từ -90 đến 90, kinh độ từ -180 đến 180.',
    outsideServiceArea: 'Hiện chỉ phục vụ trong khu vực TP.HCM. Vui lòng chọn điểm trong vùng xanh.',
    addressLookupFailed: 'Không thể tìm địa chỉ.',
    reverseLookupFailed: 'Không thể tìm địa chỉ tại vị trí này.',
    mapLabel: 'Bản đồ chọn vị trí giám sát',
    layerStreet: 'Bản đồ',
    layerSatellite: 'Vệ tinh',
    mapInstructions:
      'Nhấp vào bản đồ để chọn tâm giám sát. Kéo và thu phóng để kiểm tra khu vực.',
    recenter: 'Về vùng đã chọn',
    resetLocation: 'Đặt lại vị trí',
    legendTitle: 'Chú giải bản đồ',
    legendMonitoring: 'Vùng giám sát',
    legendService: 'Vùng cung cấp dịch vụ',
    legendUnknown: 'Vùng bay chưa xác minh',
    flightTitle: 'Kiểm tra vùng bay',
    flightNotVerified: 'Chưa được hệ thống xác minh',
    flightBody:
      'Vùng cung cấp dịch vụ không đồng nghĩa với khu vực được phép bay. Bộ phận vận hành sẽ rà soát trước khi chốt lịch.',
    flightLink: 'Mở cổng tra cứu vùng bay',
    flightNote:
      'Kết quả trên cổng bên ngoài không được tự động đồng bộ về yêu cầu này.',
  },
  en: {
    invalidCoordinates: 'Latitude must be between -90 and 90, longitude between -180 and 180.',
    outsideServiceArea: 'We currently only serve the Ho Chi Minh City area. Please pick a point inside the green zone.',
    addressLookupFailed: 'Could not find that address.',
    reverseLookupFailed: 'Could not find an address at this location.',
    mapLabel: 'Monitoring location map',
    layerStreet: 'Map',
    layerSatellite: 'Satellite',
    mapInstructions:
      'Click the map to choose the monitoring centre. Pan and zoom to inspect the area.',
    recenter: 'Recenter selection',
    resetLocation: 'Reset location',
    legendTitle: 'Map legend',
    legendMonitoring: 'Monitoring area',
    legendService: 'Service area',
    legendUnknown: 'Flight status not verified',
    flightTitle: 'Flight-zone check',
    flightNotVerified: 'Not verified by the system',
    flightBody:
      'Being inside the service area does not mean a flight is permitted. Operations will review the location before confirming the schedule.',
    flightLink: 'Open the flight-zone lookup portal',
    flightNote:
      'Results from the external portal are not synchronized with this request.',
  },
})
