import { defineMessages } from '../../../../../shared/i18n'

export const locationPanelMessages = defineMessages({
  vi: {
    cardTitle: 'Xác định vị trí và phạm vi',
    addressLabel: 'Địa chỉ hoặc khu vực',
    addressPlaceholder: 'VD: Chợ Bến Thành, Quận 1, TP.HCM…',
    addressHint:
      'Nhập địa chỉ rồi tìm, hoặc chọn trực tiếp một điểm trên bản đồ.',
    locateAddress: 'Tìm vị trí',
    locatingAddress: 'Đang tìm…',
    addressNotFound:
      'Không tìm thấy địa chỉ. Hãy bổ sung quận, TP.HCM hoặc chọn trên bản đồ.',
    latitudeLabel: 'Vĩ độ WGS84',
    longitudeLabel: 'Kinh độ WGS84',
    advancedCoordinates: 'Tọa độ nâng cao',
    coordinatesHint:
      'Dành cho người dùng có tọa độ chính xác. Sau khi sửa, hãy xác nhận để đồng bộ marker.',
    confirmCoordinates: 'Xác nhận tọa độ này',
    statusUnconfirmed: 'Chưa chọn vị trí',
    statusResolving: 'Đang xác định vị trí…',
    statusConfirmed: 'Đã xác nhận vị trí',
    statusStale: 'Cần xác nhận lại',
    statusError: 'Không xác định được địa chỉ',
    statusConfirmedHint: 'Địa chỉ, tọa độ và điểm trên bản đồ đang đồng bộ.',
    statusGpsConfirmedHint:
      'Tọa độ đã được bạn xác nhận; địa chỉ mô tả chưa được hệ thống xác minh.',
    statusNeedsAction:
      'Tìm địa chỉ, chọn trên bản đồ hoặc xác nhận tọa độ để tiếp tục.',
    radiusTitle: 'Phạm vi giám sát',
    radiusHint: 'Bán kính được tính từ tâm đã chọn.',
    radiusInputLabel: 'Bán kính',
    radiusPresets: 'Bán kính thường dùng',
    resetRadius: 'Đặt lại',
    radiusMetric: 'Bán kính',
    diameterMetric: 'Đường kính',
    areaEstimate: 'Diện tích ước tính',
    areaHint:
      'Diện tích tính theo vùng tròn, không phải ranh giới địa chính thực tế.',
  },
  en: {
    cardTitle: 'Set location and coverage',
    addressLabel: 'Address or area',
    addressPlaceholder: 'E.g. Ben Thanh Market, District 1, Ho Chi Minh City…',
    addressHint: 'Search an address or select a point directly on the map.',
    locateAddress: 'Find location',
    locatingAddress: 'Searching…',
    addressNotFound:
      'Address not found. Add a district and Ho Chi Minh City, or select it on the map.',
    latitudeLabel: 'WGS84 latitude',
    longitudeLabel: 'WGS84 longitude',
    advancedCoordinates: 'Advanced coordinates',
    coordinatesHint:
      'For users with exact coordinates. Confirm after editing to synchronize the marker.',
    confirmCoordinates: 'Confirm these coordinates',
    statusUnconfirmed: 'No location selected',
    statusResolving: 'Resolving location…',
    statusConfirmed: 'Location confirmed',
    statusStale: 'Confirmation required',
    statusError: 'Address could not be resolved',
    statusConfirmedHint:
      'The address, coordinates, and map point are synchronized.',
    statusGpsConfirmedHint:
      'You confirmed these coordinates; the descriptive address has not been verified by the system.',
    statusNeedsAction:
      'Search, pick a map point, or confirm coordinates to continue.',
    radiusTitle: 'Monitoring coverage',
    radiusHint: 'Radius is measured from the selected centre.',
    radiusInputLabel: 'Radius',
    radiusPresets: 'Common radius presets',
    resetRadius: 'Reset',
    radiusMetric: 'Radius',
    diameterMetric: 'Diameter',
    areaEstimate: 'Estimated area',
    areaHint:
      'Area is estimated as a circle, not an official property boundary.',
  },
})
