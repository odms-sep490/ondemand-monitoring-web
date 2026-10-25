import { defineMessages } from '../../../../../shared/i18n'

/** Labels reused by several media components (kind names, empty values). */
export const mediaUiMessages = defineMessages({
  vi: {
    kind: { image: 'Ảnh', video: 'Video', other: 'Tệp' },
    unknown: '—',
    source: {
      DRONE_CAMERA: 'Camera drone',
      SATELLITE_SNAPSHOT: 'Ảnh vệ tinh',
      MANUAL_UPLOAD: 'Tải lên thủ công',
    },
  },
  en: {
    kind: { image: 'Photo', video: 'Video', other: 'File' },
    unknown: '—',
    source: {
      DRONE_CAMERA: 'Drone camera',
      SATELLITE_SNAPSHOT: 'Satellite snapshot',
      MANUAL_UPLOAD: 'Manual upload',
    },
  },
})
