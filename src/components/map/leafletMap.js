import L from 'leaflet';

export const SEOUL_CENTER = [37.5665, 126.978];
export const SEOUL_ZOOM = 11;

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; OpenStreetMap contributors';

export function createLeafletMap(container, {
  center = SEOUL_CENTER,
  zoom = SEOUL_ZOOM,
  interactive = true,
} = {}) {
  const map = L.map(container, {
    center,
    zoom,
    zoomControl: interactive,
    dragging: interactive,
    scrollWheelZoom: interactive,
    doubleClickZoom: interactive,
    touchZoom: interactive,
    boxZoom: interactive,
    keyboard: interactive,
    tap: interactive,
    attributionControl: true,
  });

  L.tileLayer(TILE_URL, {
    attribution: TILE_ATTRIBUTION,
    maxZoom: 19,
  }).addTo(map);

  return map;
}
