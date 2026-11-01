import { isLocalizedText, pickLocalizedText, type Language } from '../../../../shared/i18n'
import { normalizeKey } from './normalize'

type Names = { vi: string; en: string }

/**
 * BE service names are Vietnamese. Ids differ between environments, so the
 * same entry is reachable by id (mock / seed ids) and by normalized name.
 */
const SERVICES: Array<{ ids: string[]; names: Names }> = [
  { ids: [], names: { vi: 'Kiểm tra mái nhà', en: 'Roof inspection' } },
  { ids: [], names: { vi: 'Giám sát công trình', en: 'Construction site monitoring' } },
  { ids: [], names: { vi: 'Khảo sát nông nghiệp', en: 'Agricultural survey' } },
  {
    ids: ['svc-construction'],
    names: { vi: 'Giám sát tiến độ công trình', en: 'Construction progress monitoring' },
  },
  {
    ids: ['svc-thermal'],
    names: { vi: 'Kiểm tra nhiệt mái và tấm pin', en: 'Roof and solar panel thermal inspection' },
  },
  { ids: ['svc-security'], names: { vi: 'Tuần tra an ninh khu vực', en: 'Area security patrol' } },
  { ids: ['svc-mapping'], names: { vi: 'Bản đồ 2D/3D', en: '2D/3D mapping' } },
  { ids: ['svc-ndvi'], names: { vi: 'Giám sát cây trồng (NDVI)', en: 'Crop monitoring (NDVI)' } },
  { ids: [], names: { vi: 'GS cây trồng', en: 'Crop monitoring' } },
  { ids: [], names: { vi: 'GS giao thông và sự kiện', en: 'Traffic and event monitoring' } },
  {
    ids: [],
    names: {
      vi: 'Kiểm tra nhiệt mái nhà xưởng KCN Hiệp Phước',
      en: 'Factory roof thermal inspection, Hiep Phuoc Industrial Park',
    },
  },
  // Real BE services (ServiceCatalogSeedDataInitializer.seedServices). BE ids are
  // random UUIDs, so these are matched by normalized name too.
  { ids: ['svc-construction'], names: { vi: 'Giám sát công trình', en: 'Construction monitoring' } },
  { ids: ['svc-factory'], names: { vi: 'Kiểm tra nhà xưởng', en: 'Factory inspection' } },
  { ids: ['svc-area'], names: { vi: 'Giám sát khu vực', en: 'Area monitoring' } },
  { ids: ['svc-forest'], names: { vi: 'Giám sát rừng', en: 'Forest monitoring' } },
]

const BY_ID = new Map<string, Names>()
const BY_NAME = new Map<string, Names>()
for (const entry of SERVICES) {
  entry.ids.forEach((id) => BY_ID.set(id, entry.names))
  BY_NAME.set(normalizeKey(entry.names.vi), entry.names)
}

/**
 * Localized service name for a BE service id or Vietnamese name. Unknown
 * services return `fallback` (default: the input), i.e. the BE name unchanged.
 * Vietnamese always shows the BE text as given.
 */
export function localizeServiceName(
  nameOrId: string | null | undefined,
  lang: Language,
  fallback?: string,
): string {
  // Admin-entered names are bilingual JSON; show the active language directly.
  if (isLocalizedText(fallback)) return pickLocalizedText(fallback, lang)
  if (isLocalizedText(nameOrId)) return pickLocalizedText(nameOrId, lang)
  const input = nameOrId?.trim() ?? ''
  const shown = fallback ?? input
  if (!input) return shown
  if (lang !== 'en') return shown
  // Real BE ids are random UUIDs, so also try the BE name passed as `fallback`.
  const hit =
    BY_ID.get(input) ??
    BY_NAME.get(normalizeKey(input)) ??
    (fallback ? BY_NAME.get(normalizeKey(fallback)) : undefined)
  return hit ? hit.en : shown
}

/** Every Vietnamese service name that has an English translation. */
export function translatedServiceNames(): string[] {
  return SERVICES.map((entry) => entry.names.vi)
}
