<script setup>
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { createLeafletMap } from './leafletMap';

const props = defineProps({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  placeName: { type: String, default: '' },
});

const PLACE_ZOOM = 17;
const container = ref(null);
let map = null;
let marker = null;

function coordinates() {
  return [props.latitude, props.longitude];
}

function drawMarker() {
  if (!map) return;

  marker?.remove();
  const icon = L.divIcon({
    className: 'place-location-marker',
    html: '<span aria-hidden="true"></span>',
    iconSize: [30, 38],
    iconAnchor: [15, 36],
  });
  marker = L.marker(coordinates(), {
    icon,
    title: props.placeName,
  }).addTo(map);

  if (props.placeName) {
    marker.bindTooltip(props.placeName, {
      direction: 'top',
      offset: [0, -8],
    });
  }
}

onMounted(async () => {
  map = createLeafletMap(container.value, {
    center: coordinates(),
    zoom: PLACE_ZOOM,
  });
  drawMarker();
  await nextTick();
  map.invalidateSize();
});

onBeforeUnmount(() => {
  map?.remove();
  map = null;
  marker = null;
});

watch(
  () => [props.latitude, props.longitude, props.placeName],
  () => {
    if (!map) return;
    map.setView(coordinates(), PLACE_ZOOM);
    drawMarker();
  },
);
</script>

<template>
  <div
    ref="container"
    class="place-location-map"
    role="application"
    :aria-label="`${placeName || '관광지'} 위치 지도`"
  ></div>
</template>

<style scoped>
.place-location-map {
  position: relative;
  z-index: 0;
  isolation: isolate;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: var(--team-border-default);
  border-radius: 16px;
  background: var(--team-color-gray-200);
}
.place-location-map :deep(.place-location-marker) {
  border: 0;
  background: transparent;
}
.place-location-map :deep(.place-location-marker span) {
  position: relative;
  display: block;
  width: 28px;
  height: 28px;
  transform: rotate(-45deg);
  border: 3px solid var(--team-color-white);
  border-radius: 50% 50% 50% 0;
  background: var(--team-color-primary);
  box-shadow: 0 3px 8px rgb(23 33 31 / 30%);
}
.place-location-map :deep(.place-location-marker span::after) {
  content: '';
  position: absolute;
  top: 7px;
  left: 7px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--team-color-white);
}
</style>
