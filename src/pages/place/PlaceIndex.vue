<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import myAxios from '../../api/myAxios';
import BottomNav from '../../components/BottomNav.vue';
import VoteRoomButton from '../../components/common/VoteRoomButton.vue';
import AppState from '../../components/common/AppState.vue';
import HomeCategoryBar from '../../components/home/HomeCategoryBar.vue';
import FilteredPlaceCard from '../../components/place/FilteredPlaceCard.vue';

const route = useRoute();
const router = useRouter();
const places = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');
const category = computed(() => String(route.query.category || '전체'));
const categoryCode = { 역사: 'HISTORY', '문화·예술': 'CULTURE', 자연: 'NATURE', 산책: 'WALK', 야경: 'NIGHT' };

const selectCategory = (name) => {
  if (name === '전체') router.push({ name: 'home-show', query: route.query.preview ? { preview: '1' } : {} });
  else router.replace({ name: 'place-index', query: { ...route.query, category: name } });
};

const fetchPlaces = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const { data } = await myAxios.get('/places', { params: { keywordCodes: [categoryCode[category.value]], page: 1, size: 20 } });
    places.value = data.data.items ?? [];
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? '관광지 목록을 불러오지 못했습니다.';
  } finally { isLoading.value = false; }
};

watch(category, fetchPlaces);
onMounted(fetchPlaces);
</script>

<template>
  <main class="place-index">
    <header><strong>투어 스위치</strong><div><button aria-label="검색">⌕</button><button aria-label="메뉴">☰</button></div></header>
    <HomeCategoryBar :selected="category" @select="selectCategory" />
    <AppState v-if="isLoading" type="loading" message="관광지를 불러오는 중입니다." />
    <AppState v-else-if="errorMessage" type="error" :message="errorMessage" @retry="fetchPlaces" />
    <AppState v-else-if="places.length === 0" :message="`${category} 카테고리의 관광지가 없습니다.`" />
    <section v-else class="place-list"><FilteredPlaceCard v-for="place in places" :key="place.id" :place="place" @open="router.push({ name: 'place-show', params: { placeId: place.id }, query: route.query.preview ? { preview: '1' } : {} })" /></section>
    <VoteRoomButton class="create-fab" @click="router.push({ name: 'room-create' })" />
    <BottomNav />
  </main>
</template>

<style scoped>
.place-index{min-height:100vh;padding:0 0 84px;background:#fff}.place-index>header{height:58px;padding:0 25px;display:flex;align-items:center;justify-content:space-between}.place-index>header strong{font-size:20px}.place-index>header button{margin-left:12px;border:0;background:none;font-size:22px}.place-list{padding:30px 41px;display:grid;gap:31px}.create-fab{position:fixed;z-index:5;right:max(11px,calc((100vw - 390px)/2 + 11px));bottom:92px}.place-index :deep(.bottom-nav){position:fixed;width:min(100%,390px);margin:auto}@media(max-width:390px){.place-list{padding-inline:10.5%}}
</style>
