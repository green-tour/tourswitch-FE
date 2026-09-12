<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BottomNav from '../../components/BottomNav.vue';
import VoteRoomButton from '../../components/common/VoteRoomButton.vue';
import HomeCategoryBar from '../../components/home/HomeCategoryBar.vue';
import HomeMenuDrawer from '../../components/home/HomeMenuDrawer.vue';
import FilteredPlaceCard from '../../components/place/FilteredPlaceCard.vue';
import { PLACE_CATEGORY_CODES } from '../../constants/placeCategories';
import { useAuthStore } from '../../store/auth/useAuthStore';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const menuOpen = ref(false);
const selectedCategory = ref(String(route.query.category || '전체'));
const activeTravelRoom = ref(null);
const displayedPlaces = ref([]);
const isPlacesLoading = ref(false);
const homePlaces = [
  { id: 'place-1', name: '서울숲', regionName: '성동구', imageUrl: '/figma-assets/seoul-forest.png', congestion: { level: '여유' }, categoryCodes: ['CITY_PARK', 'NATURE_MOUNTAIN'] },
  { id: 'place-2', name: '북촌 한옥마을', regionName: '종로구', imageUrl: '/figma-assets/seoul-forest.png', congestion: { level: '여유' }, categoryCodes: ['HISTORICAL_RELIC', 'STREET_TRAIL'] },
  { id: 'place-3', name: '석촌호수', regionName: '송파구', imageUrl: '/figma-assets/seoul-forest.png', congestion: { level: '여유' }, categoryCodes: ['CITY_PARK', 'NATURE_MOUNTAIN', 'LEISURE_SPORTS'] },
  { id: 'place-4', name: '동대문 DDP', regionName: '중구', imageUrl: '/figma-assets/seoul-forest.png', congestion: { level: '보통' }, categoryCodes: ['EXHIBITION_MUSEUM', 'PERFORMANCE', 'FESTIVAL_EVENT'] },
  { id: 'place-5', name: '남산 서울타워', regionName: '용산구', imageUrl: '/figma-assets/seoul-forest.png', congestion: { level: '보통' }, categoryCodes: ['LANDMARK_VIEW', 'NATURE_MOUNTAIN'] },
  { id: 'place-6', name: '서울 어린이대공원', regionName: '광진구', imageUrl: '/figma-assets/seoul-forest.png', congestion: { level: '여유' }, categoryCodes: ['THEME_PARK', 'EXPERIENCE'] },
  { id: 'place-7', name: '조계사', regionName: '종로구', imageUrl: '/figma-assets/seoul-forest.png', congestion: { level: '여유' }, categoryCodes: ['RELIGIOUS_SITE'] },
];
const isPreview = computed(() => route.query.preview === '1' || sessionStorage.getItem('previewMode') === 'true');
const isCategoryListing = computed(() => route.query.category !== undefined);
const isLoggedIn = computed(() => route.query.auth === 'guest' ? false : authStore.isAuthenticated || isPreview.value);
const hasActiveVoteRoom = computed(() => {
  const room = activeTravelRoom.value;
  return Boolean(isLoggedIn.value && room?.roomId && room?.roomName && room?.travelDate);
});
const go = (name) => { menuOpen.value = false; router.push({ name }); };
const logout = async () => { await authStore.logout(); menuOpen.value = false; };
const selectCategory = (name) => {
  router.replace({ name: 'home-show', query: { ...route.query, category: name } });
};

watch(() => route.query.category, (category) => {
  selectedCategory.value = String(category || '전체');
  fetchPlaces();
});

const formatTravelDate = (date) => {
  if (!date) return '';
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][new Date(`${date}T00:00:00`).getDay()];
  return `${date.replaceAll('-', '. ')} (${weekday})`;
};
const getDday = (date) => {
  if (!date) return '';
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(`${date}T00:00:00`);
  const days = Math.round((target - startOfToday) / 86_400_000);
  if (days === 0) return 'D-Day';
  return days > 0 ? `D - ${days}` : `D + ${Math.abs(days)}`;
};

onMounted(async () => {
  if (!isPreview.value && !authStore.isInitialized) await authStore.restoreSession();
  activeTravelRoom.value = readActiveTravelRoom();
  fetchPlaces();
});

function fetchPlaces() {
  const categoryCode = PLACE_CATEGORY_CODES[selectedCategory.value];
  if (isCategoryListing.value && selectedCategory.value === '전체') {
    displayedPlaces.value = homePlaces;
    return;
  }
  displayedPlaces.value = categoryCode
    ? homePlaces.filter((place) => place.categoryCodes.includes(categoryCode))
    : homePlaces.filter((place) => place.congestion.level === '여유');
}

function readActiveTravelRoom() {
  try {
    if (!authStore.user?.id) return null;
    const storageKey = `activeTravelRoom:${authStore.user.id}`;
    const savedRoom = localStorage.getItem(storageKey);
    const room = JSON.parse(savedRoom ?? 'null');
    if (!room?.roomId || !room?.roomName || !room?.travelDate) {
      localStorage.removeItem(storageKey);
      return null;
    }
    return room;
  } catch {
    localStorage.removeItem(`activeTravelRoom:${authStore.user?.id}`);
    return null;
  }
}
</script>

<template>
  <main class="home-page">
    <header class="home-header"><button class="home-logo" type="button" aria-label="투어 스위치 메인으로 이동" @click="router.push({ name: 'home-show' })">투어 스위치</button><div><button type="button" aria-label="메뉴" @click="menuOpen = true">☰</button></div></header>
    <HomeCategoryBar :selected="selectedCategory" @select="selectCategory" />
    <section v-if="!isCategoryListing && hasActiveVoteRoom" class="ongoing"><span class="ongoing-dday">{{ getDday(activeTravelRoom.travelDate) }}</span><span class="ongoing-status">투표 중</span><strong>{{ activeTravelRoom.roomName }}</strong><span class="ongoing-date">{{ formatTravelDate(activeTravelRoom.travelDate) }}</span><small>지역&nbsp; 서울</small><small>참여자&nbsp; 1 / 1명 완료</small><button class="ongoing-action" type="button" @click="router.push({ name: 'vote-show', params: { roomId: activeTravelRoom.roomId } })">이어서 하기</button></section>
    <section v-if="isCategoryListing" class="home-section relaxed-section"><h2>{{ selectedCategory === '전체' ? '전체 관광지' : `${selectedCategory} 관광지` }}</h2><div v-if="displayedPlaces.length" class="relaxed-list"><FilteredPlaceCard v-for="place in displayedPlaces" :key="place.id" :place="place" @open="router.push({ name: 'place-show', params: { placeId: place.id }, query: isPreview ? { preview: '1' } : {} })" /></div><p v-else-if="!isPlacesLoading" class="relaxed-empty">해당 카테고리의 관광지 정보가 없습니다.</p></section>
    <template v-else><section class="home-section"><h2>지금 서울은?</h2><button class="map-preview" type="button"><strong>혼잡도 지도</strong></button><div class="legend"><span>혼잡도 범례</span><i class="easy"></i>여유<i class="normal"></i>보통<i class="busy"></i>혼잡</div></section><section class="home-section relaxed-section"><h2>여유로운 관광지</h2><div v-if="displayedPlaces.length" class="relaxed-list"><FilteredPlaceCard v-for="place in displayedPlaces" :key="place.id" :place="place" @open="router.push({ name: 'place-show', params: { placeId: place.id }, query: isPreview ? { preview: '1' } : {} })" /></div><p v-else-if="!isPlacesLoading" class="relaxed-empty">현재 여유로운 관광지 정보가 없습니다.</p></section></template>
    <VoteRoomButton class="create-fab" @click="go('room-create')" /><BottomNav />
    <Transition name="menu-drawer"><HomeMenuDrawer v-if="menuOpen" :logged-in="isLoggedIn" :nickname="authStore.user?.nickname" :avatar-url="authStore.user?.avatarUrl" @close="menuOpen = false" @navigate="go" @navigate-place="(placeId) => { menuOpen = false; router.push({ name: 'place-show', params: { placeId } }); }" @logout="logout" /></Transition>
  </main>
</template>

<style scoped>
.home-page{min-height:100vh;padding:0 0 92px;background:#fff}.home-header{height:58px;padding:0 25px;display:flex;align-items:center;justify-content:space-between}.home-logo{padding:8px 0;border:0;background:none;color:inherit;font-size:20px;font-weight:700;cursor:pointer}.home-header>div button{margin-left:12px;border:0;background:none;font-size:22px}.home-section h2{font-size:14px;margin:26px 25px 8px}.map-preview{display:grid;place-items:center;width:calc(100% - 49px);height:250px;margin:0 auto;border:0;border-radius:15px;background:#d9d9d9}.map-preview strong{font-size:14px}.legend{width:calc(100% - 49px);height:22px;margin:12px auto 31px;padding:4px 14px;border-radius:10px;background:#eef1f0;color:#59615f;font-size:8px;display:flex;align-items:center;gap:6px}.legend span{margin-right:auto}.legend i{width:7px;height:7px;border-radius:50%}.legend .easy{background:#20b878}.legend .normal{background:#ffcc3d}.legend .busy{background:#f04452}.featured-place{display:block;position:relative;width:calc(100% - 50px);height:213px;margin:14px auto 0;border:0;border-radius:15px;background:url('/figma-assets/seoul-forest.png') center -10px/381px auto;overflow:hidden}.featured-place:after{content:'';position:absolute;inset:50% 0 0;background:linear-gradient(transparent,#0007)}.featured-place .badge{position:absolute;z-index:1;left:13px;top:12px}.featured-place>b{position:absolute;z-index:1;right:12px;top:12px;padding:4px 10px;border-radius:14px;background:#fff;color:#4a4a4a;font-size:10px}.place-name{position:absolute;z-index:1;left:16px;bottom:14px;color:#fff;font-size:17px;font-weight:700}.ongoing{position:relative;width:calc(100% - 50px);min-height:132px;margin:16px auto 0;padding:16px 34px;border-radius:16px;background:linear-gradient(110deg,#32cbd4,#48c48e);box-shadow:0 6px 12px #1c9d832e;color:#fff;display:flex;flex-direction:column;align-items:flex-start}.ongoing-dday{color:#ffe500;font-size:10px;font-weight:800;letter-spacing:.08em}.ongoing-status{position:absolute;top:13px;right:17px;padding:4px 13px;border-radius:999px;background:#ffe500;color:#9b7100;font-size:10px;font-weight:800}.ongoing strong{margin-top:2px;font-size:17px;line-height:1.2}.ongoing-date{margin-top:3px;font-size:10px}.ongoing small{margin-top:8px;font-size:10px;line-height:1}.ongoing small+small{margin-top:6px}.ongoing-action{position:absolute;right:14px;bottom:14px;min-width:106px;height:36px;padding:0 15px;border:1px solid #fff;border-radius:999px;background:transparent;color:#fff;font-size:13px;font-weight:700}.relaxed-list{display:grid;gap:18px;width:calc(100% - 50px);margin:14px auto 0}.relaxed-empty{width:calc(100% - 50px);margin:14px auto;color:#89928f;font-size:12px;text-align:center}.create-fab{position:fixed;z-index:5;right:max(11px,calc((100vw - 390px)/2 + 11px));bottom:82px}.home-page :deep(.bottom-nav){position:fixed;width:min(100%,390px);margin:auto}.menu-drawer-enter-active,.menu-drawer-leave-active{transition:opacity .22s ease}.menu-drawer-enter-active :deep(.drawer),.menu-drawer-leave-active :deep(.drawer){transition:transform .28s cubic-bezier(.22,.8,.28,1)}.menu-drawer-enter-from,.menu-drawer-leave-to{opacity:0}.menu-drawer-enter-from :deep(.drawer),.menu-drawer-leave-to :deep(.drawer){transform:translateX(100%)}@media(prefers-reduced-motion:reduce){.menu-drawer-enter-active,.menu-drawer-leave-active,.menu-drawer-enter-active :deep(.drawer),.menu-drawer-leave-active :deep(.drawer){transition:none}}
</style>
