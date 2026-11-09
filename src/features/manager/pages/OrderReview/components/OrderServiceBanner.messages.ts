import { defineMessages } from '../../../../../shared/i18n'

/** Display names for raw deliverable tokens the backend may return (e.g. "PHOTO"). */
export const orderServiceBannerMessages = defineMessages({
  vi: {
    terms: {
      PHOTO: 'Ảnh',
      PHOTOS: 'Ảnh',
      IMAGE: 'Ảnh',
      IMAGES: 'Ảnh',
      VIDEO: 'Video',
      VIDEOS: 'Video',
      REPORT: 'Báo cáo',
      STREAMING: 'Phát trực tiếp',
      LIVESTREAM: 'Phát trực tiếp',
      ORTHOMOSAIC: 'Bản đồ trực giao',
      MODEL3D: 'Mô hình 3D',
      THERMAL: 'Ảnh nhiệt',
    } as Record<string, string>,
  },
  en: {
    terms: {
      PHOTO: 'Photo',
      PHOTOS: 'Photos',
      IMAGE: 'Image',
      IMAGES: 'Images',
      VIDEO: 'Video',
      VIDEOS: 'Videos',
      REPORT: 'Report',
      STREAMING: 'Live streaming',
      LIVESTREAM: 'Live streaming',
      ORTHOMOSAIC: 'Orthomosaic',
      MODEL3D: '3D model',
      THERMAL: 'Thermal',
    } as Record<string, string>,
  },
})
