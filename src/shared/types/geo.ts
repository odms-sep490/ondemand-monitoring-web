/** GeoJSON Polygon in WGS84, with coordinates ordered [longitude, latitude]. */
export type GeoJsonPolygon = {
  type: 'Polygon'
  coordinates: number[][][]
}
