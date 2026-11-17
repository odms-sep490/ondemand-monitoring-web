import { defineMessages } from '../../../../../shared/i18n'

export const scheduleStepMessages = defineMessages({
  vi: {
    summaryTitle: 'Tóm tắt lịch bay',
    service: 'Dịch vụ',
    location: 'Địa điểm',
    altitude: 'Độ cao giám sát',
    area: 'Khu vực',
    dates: 'Ngày bay mong muốn',
    timeWindow: 'Khung giờ',
    notSelected: 'Chưa chọn',
    weather: 'Khi có sự cố',
    weatherValues: { AUTO_RESCHEDULE: 'Tự dời lịch', CONTACT_CUSTOMER: 'Liên hệ tôi', CANCEL_ORDER: 'Hủy yêu cầu' },
    noAddress: 'Chưa chọn địa điểm',
    days: (n: number) => `${n} ngày`,
    radius: (m: number, ha: string) => `Bán kính ${m} m · ${ha} ha`,
  },
  en: {
    summaryTitle: 'Flight schedule summary',
    service: 'Service',
    location: 'Location',
    altitude: 'Monitoring altitude',
    area: 'Area',
    dates: 'Preferred dates',
    timeWindow: 'Time window',
    notSelected: 'Not selected',
    weather: 'If the flight cannot go ahead',
    weatherValues: { AUTO_RESCHEDULE: 'Reschedule automatically', CONTACT_CUSTOMER: 'Contact me', CANCEL_ORDER: 'Cancel the request' },
    noAddress: 'No location selected',
    days: (n: number) => `${n} day${n === 1 ? '' : 's'}`,
    radius: (m: number, ha: string) => `Radius ${m} m · ${ha} ha`,
  },
})
