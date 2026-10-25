// Single satellite imagery source shared by the main flight map and the drone camera view,
// so both always show the same picture.
export const SATELLITE_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
export const SATELLITE_MAX_NATIVE_ZOOM = 18
export const SATELLITE_ATTRIBUTION =
  'Imagery © Esri, Maxar, Earthstar Geographics'
