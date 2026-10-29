import { defineMessages } from '../../../shared/i18n'

export const flightTelemetryHudMessages = defineMessages({
  vi: {
    uploadError: (msg: string) => `Lỗi tải lên ảnh: ${msg}`,
    stationTitle: (deviceId: string, missionId: string) =>
      `Trạm điều khiển chuyến bay - thiết bị ${deviceId} (nhiệm vụ ${missionId})`,
    altitudeLabel: 'ĐỘ CAO (ALTITUDE)',
    relativeAlt: 'Relative Alt (AGL)',
    speedLabel: 'VẬN TỐC (GROUND SPEED)',
    batteryLabel: 'MỨC PIN THIẾT BỊ',
    uploadTitle: 'Tải lên hình ảnh / video từ thiết bị (Amazon S3 Direct)',
    uploadSuccess: 'Đã lưu tập tin lên S3 thành công!',
    chooseFile: 'Chọn ảnh/video...',
    uploading: '⏳ Đang tải lên...',
    uploadToS3: 'Tải lên S3 Cloud',
    returnToBase: '🚁 HẠ CÁNH / BAY VỀ TRẠM (RETURN TO BASE)',
  },
  en: {
    uploadError: (msg: string) => `Image upload error: ${msg}`,
    stationTitle: (deviceId: string, missionId: string) =>
      `Flight Control Station - device ${deviceId} (Mission ${missionId})`,
    altitudeLabel: 'ALTITUDE',
    relativeAlt: 'Relative Alt (AGL)',
    speedLabel: 'GROUND SPEED',
    batteryLabel: 'DEVICE BATTERY LEVEL',
    uploadTitle: 'Upload device image / video (Amazon S3 Direct)',
    uploadSuccess: 'File saved to S3 successfully!',
    chooseFile: 'Choose image/video...',
    uploading: '⏳ Uploading...',
    uploadToS3: 'Upload to S3 Cloud',
    returnToBase: '🚁 RETURN TO BASE',
  },
})
