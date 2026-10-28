import { defineMessages } from '../../../../../shared/i18n'

export const areaAssessmentBodyMessages = defineMessages({
  vi: {
    zonesToCheck: 'Vùng cần đối chiếu',
    openMapTitle: (zone: string) =>
      `Mở cambay.mod.gov.vn và sao chép mã ${zone}`,
    viewOnMap: 'Xem trên bản đồ',
    openMinistryMap: 'Mở bản đồ cấm bay của Bộ Quốc phòng',
  },
  en: {
    zonesToCheck: 'Zones to check',
    openMapTitle: (zone: string) =>
      `Open cambay.mod.gov.vn and copy code ${zone}`,
    viewOnMap: 'View on map',
    openMinistryMap: 'Open the Ministry of Defence no-fly map',
  },
})
