<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import BottomNav from '../../components/BottomNav.vue';
import AppState from '../../components/common/AppState.vue';
import CrowdBadge from '../../components/common/CrowdBadge.vue';
import CongestionMap from '../../components/map/CongestionMap.vue';
import myAxios from '../../api/myAxios';

const router = useRouter();
const areas = ref([]);
const legend = ref([]);
const generatedAt = ref('');
const delayedAreaCount = ref(0);
const selectedAreaId = ref(null);
const isLoading = ref(true);
const errorMessage = ref('');

const selectedArea = computed(() => areas.value.find((area) => area.areaId === selectedAreaId.value) ?? null);
const updatedAtLabel = computed(() => {
  if (!generatedAt.value) return '';
  const at = new Date(generatedAt.value);
  if (Number.isNaN(at.getTime())) return '';
  const pad = (value) => String(value).padStart(2, '0');
  return `${pad(at.getMonth() + 1)}.${pad(at.getDate())} ${pad(at.getHours())}:${pad(at.getMinutes())} 기준`;
});

async function fetchCongestion() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const { data } = await myAxios.get('/map/congestion');
    areas.value = data.data.areas ?? [];
    legend.value = data.data.legend ?? [];
    generatedAt.value = data.data.generatedAt ?? '';
    delayedAreaCount.value = data.data.delayedAreaCount ?? 0;
    if (selectedAreaId.value && !areas.value.some((area) => area.areaId === selectedAreaId.value)) {
      selectedAreaId.value = null;
    }
  } catch {
    errorMessage.value = '혼잡도 정보를 불러오지 못했습니다.';
    areas.value = [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(fetchCongestion);
</script>

<template>
  <main class="map-page">
    <header class="map-header">
      <div>
        <h1>지금 서울은</h1>
        <p class="updated-at">{{ updatedAtLabel }}</p>
      </div>
      <button class="refresh" type="button" :disabled="isLoading" @click="fetchCongestion">새로고침</button>
    </header>

    <AppState v-if="isLoading" message="혼잡도 정보를 불러오는 중입니다." />
    <AppState v-else-if="errorMessage" :message="errorMessage" />
    <template v-else>
      <section class="map-area">
        <CongestionMap :areas="areas" :selected-area-id="selectedAreaId" @select="(area) => (selectedAreaId = area.areaId)" />
      </section>

      <div class="legend">
        <span>혼잡도 범례</span>
        <template v-for="item in legend" :key="item.level">
          <i :style="{ background: item.color }"></i>{{ item.level }}
        </template>
      </div>
      <p v-if="delayedAreaCount" class="delayed">{{ delayedAreaCount }}개 영역은 최신 관측값이 지연되고 있습니다.</p>

      <section class="place-section">
        <h2>관광지 목록</h2>
        <p v-if="!selectedArea" class="place-empty">지도에서 영역을 선택하면 관광지가 표시됩니다.</p>
        <template v-else>
          <p class="selected-area"><strong>{{ selectedArea.areaName }}</strong><CrowdBadge v-if="selectedArea.congestionLevel" :level="selectedArea.congestionLevel" /></p>
          <p v-if="!selectedArea.places?.length" class="place-empty">이 영역에 표시할 관광지가 없습니다.</p>
          <ul v-else class="place-list">
            <li v-for="place in selectedArea.places" :key="place.contentId">
              <button type="button" @click="router.push({ name: 'place-show', params: { placeId: place.contentId } })">
                <span class="photo" :style="{ backgroundImage: `url(${place.imageUrl || '/figma-assets/place-placeholder.svg'})` }" role="img" :aria-label="place.name"></span>
                <span class="copy"><strong>{{ place.name }}</strong><small>{{ selectedArea.areaName }}</small></span>
              </button>
            </li>
          </ul>
        </template>
      </section>
    </template>
    <BottomNav />
  </main>
</template>

<style scoped>
.map-page{min-height:100vh;padding:0 0 92px;background:#fff}
.map-header{padding:18px 25px 8px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.map-header h1{font-size:20px;font-weight:700}
.updated-at{margin-top:4px;color:#89928f;font-size:10px}
.refresh{height:28px;padding:0 14px;border:0;border-radius:999px;background:#20b878;color:#fff;font-size:11px;font-weight:700}
.refresh:disabled{opacity:.5}
.map-area{width:calc(100% - 50px);height:360px;margin:8px auto 0}
.legend{width:calc(100% - 50px);min-height:22px;margin:12px auto 0;padding:4px 14px;border-radius:10px;background:#eef1f0;color:#59615f;font-size:8px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.legend span{margin-right:auto}
.legend i{width:7px;height:7px;border-radius:50%}
.delayed{width:calc(100% - 50px);margin:8px auto 0;color:#89928f;font-size:10px}
.place-section h2{font-size:14px;margin:26px 25px 8px}
.selected-area{width:calc(100% - 50px);margin:0 auto 10px;display:flex;align-items:center;gap:8px;font-size:13px}
.place-empty{width:calc(100% - 50px);margin:14px auto;color:#89928f;font-size:12px;text-align:center}
.place-list{display:grid;gap:18px;width:calc(100% - 50px);margin:0 auto;list-style:none;padding:0}
.place-list button{display:block;width:100%;padding:0;border:0;border-radius:15px;background:#fff;overflow:hidden;box-shadow:0 5px 12px #173c3210;text-align:left}
.place-list .photo{display:block;width:100%;height:158px;background-position:center;background-size:cover}
.place-list .copy{height:41px;padding:10px 15px;display:block}
.place-list .copy strong{font-size:14px}
.place-list .copy small{margin-left:6px;color:#89928f;font-size:8px}
</style>
