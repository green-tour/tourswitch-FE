<script setup>
// 지도 구현(Leaflet)을 이 파일 안에만 둔다. 다른 지도 SDK로 바꾸더라도
// props(areas, selectedAreaId)와 emit(select) 계약만 지키면 이 파일만 교체하면 된다.
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps({
  areas: { type: Array, default: () => [] },
  selectedAreaId: { type: [Number, String], default: null },
  // 홈의 미리보기처럼 페이지 스크롤을 가로채면 안 되는 자리에서는 조작을 끈다.
  interactive: { type: Boolean, default: true },
});
const emit = defineEmits(['select']);

const SEOUL_CENTER = [37.5665, 126.978];
const SEOUL_ZOOM = 11;
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; OpenStreetMap contributors';

const container = ref(null);
let map = null;
let areaLayerGroup = null;
let placeLayerGroup = null;
const layerByAreaId = new Map();

const areaStyle = (area, selected) => ({
  color: selected ? '#1c1c1c' : area.color,
  weight: selected ? 2 : 1,
  fillColor: area.color,
  fillOpacity: selected ? 0.65 : 0.4,
});

function drawAreas() {
  if (!map) return;
  areaLayerGroup.clearLayers();
  layerByAreaId.clear();
  props.areas.forEach((area) => {
    if (!area.boundary) return;
    const layer = L.geoJSON(area.boundary, {
      style: () => areaStyle(area, area.areaId === props.selectedAreaId),
      interactive: props.interactive,
    });
    if (props.interactive) {
      layer.bindTooltip(`${area.areaName} · ${area.congestionLevel ?? '정보 없음'}`, { sticky: true });
      layer.on('click', () => emit('select', area));
    }
    layer.addTo(areaLayerGroup);
    layerByAreaId.set(area.areaId, layer);
  });
}

function restyleAreas() {
  props.areas.forEach((area) => {
    const layer = layerByAreaId.get(area.areaId);
    if (layer) layer.setStyle(areaStyle(area, area.areaId === props.selectedAreaId));
  });
}

// 전체 영역의 관광지를 한 번에 그리면 700개가 넘어 선택한 영역만 표시한다.
function drawPlacesOfSelectedArea() {
  if (!map) return;
  placeLayerGroup.clearLayers();
  const area = props.areas.find((item) => item.areaId === props.selectedAreaId);
  (area?.places ?? []).forEach((place) => {
    if (place.latitude == null || place.longitude == null) return;
    L.circleMarker([place.latitude, place.longitude], {
      radius: 5,
      color: '#1c1c1c',
      weight: 1,
      fillColor: '#ffffff',
      fillOpacity: 1,
    })
      .bindTooltip(place.name)
      .addTo(placeLayerGroup);
  });
}

onMounted(() => {
  map = L.map(container.value, {
    center: SEOUL_CENTER,
    zoom: SEOUL_ZOOM,
    zoomControl: props.interactive,
    dragging: props.interactive,
    scrollWheelZoom: props.interactive,
    doubleClickZoom: props.interactive,
    touchZoom: props.interactive,
    boxZoom: props.interactive,
    keyboard: props.interactive,
    tap: props.interactive,
    // 출처 표기는 OpenStreetMap 타일 이용 조건이라 미리보기에서도 끄지 않는다.
    attributionControl: true,
  });
  L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);
  areaLayerGroup = L.layerGroup().addTo(map);
  placeLayerGroup = L.layerGroup().addTo(map);
  drawAreas();
  drawPlacesOfSelectedArea();
});

onBeforeUnmount(() => {
  map?.remove();
  map = null;
});

watch(() => props.areas, () => {
  drawAreas();
  drawPlacesOfSelectedArea();
});

watch(() => props.selectedAreaId, () => {
  restyleAreas();
  drawPlacesOfSelectedArea();
});
</script>

<template>
  <div ref="container" class="congestion-map" role="application" aria-label="서울 혼잡도 지도"></div>
</template>

<style scoped>
.congestion-map{width:100%;height:100%;border-radius:15px;overflow:hidden;background:#d9d9d9}
</style>
