<script setup>
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import BottomNav from "../../components/BottomNav.vue";
import AppButton from "../../components/common/AppButton.vue";
import AppModal from "../../components/common/AppModal.vue";
import VoteRoomButton from "../../components/common/VoteRoomButton.vue";
import AppState from "../../components/common/AppState.vue";
import CrowdBadge from "../../components/common/CrowdBadge.vue";
import PlaceLocationMap from "../../components/map/PlaceLocationMap.vue";
import PlaceCrowdForecastChart from "../../components/place/PlaceCrowdForecastChart.vue";
import { usePlaceStore } from "../../store/place/usePlaceStore";

const route = useRoute();
const router = useRouter();
const placeStore = usePlaceStore();
const { place, isLoading, errorMessage } = storeToRefs(placeStore);
const showSummaryModal = ref(false);

const hasDetailedSummary = computed(
  () => (place.value?.summary?.trim().length ?? 0) > 80,
);

const hasLocation = computed(() => {
  const latitude = Number(place.value?.latitude);
  const longitude = Number(place.value?.longitude);
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180
    && !(latitude === 0 && longitude === 0);
});

const openKakaoMapSearch = () => {
  const placeName = place.value?.name?.trim();
  if (!placeName) return;

  window.open(
    `https://map.kakao.com/link/search/${encodeURIComponent(placeName)}`,
    "_blank",
    "noopener,noreferrer",
  );
};

const fetchPlace = async () => {
  const regionId = Number(route.query.regionId);
  const detail = await placeStore.fetchPlaceDetail(
    route.params.placeId,
    Number.isSafeInteger(regionId) ? regionId : null,
  );
  if (!detail) return;

  localStorage.setItem(
    "recentViewedPlace",
    JSON.stringify({
      id: detail.id,
      name: detail.name,
      imageUrl: detail.imageUrl ?? "/figma-assets/place-placeholder.svg",
      regionName: detail.regionName ?? "",
    }),
  );
};

onMounted(fetchPlace);
</script>

<template>
  <main class="place-show">
    <AppState
      v-if="isLoading"
      type="loading"
      message="관광지 정보를 불러오는 중입니다."
    />
    <AppState
      v-else-if="errorMessage"
      type="error"
      :message="errorMessage"
      @retry="fetchPlace"
    />
    <template v-else>
      <section
        class="hero"
        :style="{
          backgroundImage: `url(${place.imageUrl || '/figma-assets/place-placeholder.svg'})`,
        }"
      >
        <button class="back" aria-label="뒤로가기" @click="router.back()">
          ‹
        </button>
        <div class="actions">
          <button aria-label="공유">⌯</button
          ><button aria-label="관심 관광지">♡</button>
        </div>
        <div class="title">
          <h1>{{ place.name }}</h1>
          <span v-if="place.regionName">{{ place.regionName }}</span>
        </div>
        <CrowdBadge
          v-if="place.congestion?.level"
          class="badge"
          :level="place.congestion.level"
        />
      </section>
      <section class="details">
        <div class="summary-preview">
          <p>{{ place.summary || "제공 정보 없음" }}</p>
          <button
            v-if="hasDetailedSummary"
            type="button"
            @click="showSummaryModal = true"
          >
            자세히 보기
          </button>
        </div>
        <h2>혼잡도 예측</h2>
        <PlaceCrowdForecastChart :forecasts="place.weeklyForecast" />
        <h2>주소</h2>
        <p class="address">{{ place.address || "-" }}</p>
        <div
          v-if="hasLocation"
          class="location-map-wrapper"
        >
          <PlaceLocationMap
            class="location-map"
            :latitude="Number(place.latitude)"
            :longitude="Number(place.longitude)"
            :place-name="place.name"
          />
          <AppButton
            class="kakao-map-button"
            variant="secondary"
            size="small"
            :aria-label="`${place.name} 카카오맵에서 검색`"
            @click="openKakaoMapSearch"
          >
            카카오맵에서 보기 <span aria-hidden="true">↗</span>
          </AppButton>
        </div>
        <p v-else class="location-unavailable">위치 정보가 제공되지 않았습니다.</p>
        <h2>접근성</h2>
        <small
          >♿
          {{
            place.accessibility?.wheelchair === "AVAILABLE"
              ? "유모차, 휠체어 가능"
              : "제공 정보 없음"
          }}</small
        >
      </section>
      <VoteRoomButton
        class="create-fab"
        @click="router.push({ name: 'room-create' })"
      /><BottomNav />
      <AppModal
        :open="showSummaryModal"
        :title="`${place.name} 상세 설명`"
        @close="showSummaryModal = false"
      >
        <p class="summary-modal-content">{{ place.summary }}</p>
      </AppModal>
    </template>
  </main>
</template>

<style scoped>
.place-show {
  min-height: 100vh;
  padding-bottom: 76px;
  background: #fff;
}
.hero {
  position: relative;
  height: 300px;
  background-position: center;
  background-size: cover;
  color: #fff;
}
.hero:after {
  content: "";
  position: absolute;
  inset: 52% 0 0;
  background: linear-gradient(transparent, #0009);
}
.back,
.actions button {
  position: relative;
  z-index: 2;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: #24352e99;
  color: #fff;
  font-size: 24px;
}
.back {
  position: absolute;
  left: 8px;
  top: 8px;
}
.actions {
  position: absolute;
  z-index: 2;
  right: 8px;
  top: 8px;
  display: flex;
  gap: 4px;
}
.actions button {
  position: static;
  font-size: 19px;
}
.title {
  position: absolute;
  z-index: 2;
  left: 22px;
  bottom: 10px;
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.title h1 {
  font-size: 28px;
}
.title span {
  color: #ddd;
  font-size: 13px;
}
.badge {
  position: absolute;
  z-index: 2;
  right: 14px;
  bottom: 14px;
}
.details {
  padding: 25px 23px 98px;
}
.summary-preview {
  margin-bottom: 19px;
}
.summary-preview p {
  display: -webkit-box;
  overflow: hidden;
  color: var(--team-color-gray-800);
  font-size: 15px;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.summary-preview button {
  display: block;
  margin: 8px 0 0 auto;
  padding: 2px 0;
  border: 0;
  background: transparent;
  color: var(--team-color-primary-dark);
  font-size: 13px;
  font-weight: var(--team-font-weight-bold);
}
.summary-modal-content {
  color: var(--team-color-gray-800);
  font-size: 16px;
  line-height: 1.7;
  overflow-wrap: anywhere;
  word-break: keep-all;
  white-space: pre-line;
}
.details h2 {
  margin: 0 0 8px;
  color: var(--team-color-primary);
  font-size: 14px;
}
.details > p {
  height: 28px;
  margin-bottom: 9px;
  font-size: 12px;
}
.details > p.address {
  height: auto;
  min-height: 28px;
  margin-bottom: 10px;
}
.location-map-wrapper {
  position: relative;
  isolation: isolate;
  width: 100%;
  aspect-ratio: 1;
  margin-bottom: 22px;
  border-radius: 16px;
}
.location-map {
  width: 100%;
  height: 100%;
}
.kakao-map-button {
  position: absolute;
  z-index: 1;
  top: 12px;
  right: 12px;
  box-shadow: 0 4px 12px rgb(23 33 31 / 18%);
}
.details > p.location-unavailable {
  display: grid;
  place-items: center;
  height: 120px;
  margin-bottom: 22px;
  border: var(--team-border-default);
  border-radius: 16px;
  background: var(--team-color-gray-100);
  color: var(--team-color-gray-600);
}
.details > small {
  display: block;
  font-size: 8px;
}
.create-fab {
  position: fixed;
  z-index: 5;
  right: max(11px, calc((100vw - 390px) / 2 + 11px));
  bottom: 92px;
}
.place-show :deep(.bottom-nav) {
  position: fixed;
  width: min(100%, 390px);
  margin: auto;
}
</style>

