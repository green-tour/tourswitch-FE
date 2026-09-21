<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BottomNav from '../../components/BottomNav.vue';
import VoteRoomButton from '../../components/common/VoteRoomButton.vue';
import HomeCategoryBar from '../../components/home/HomeCategoryBar.vue';
import HomeMenuDrawer from '../../components/home/HomeMenuDrawer.vue';
import CongestionMap from '../../components/map/CongestionMap.vue';
import FilteredPlaceCard from '../../components/place/FilteredPlaceCard.vue';
import myAxios from '../../api/myAxios';
import { PLACE_CATEGORY_CODES } from '../../constants/placeCategories';
import { useAuthStore } from '../../store/auth/useAuthStore';
import { useActiveRoom } from '../../composables/useActiveRoom';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const menuOpen = ref(false);
const selectedCategory = ref(String(route.query.category || '전체'));
const displayedPlaces = ref([]);
const isPlacesLoading = ref(false);
const congestionAreas = ref([]);
const congestionLegend = ref([]);
const HOME_RELAXED_LEVEL = '여유';
const HOME_PLACE_SIZE = 20;
const isPreview = computed(() => route.query.preview === '1' || sessionStorage.getItem('previewMode') === 'true');
const isCategoryListing = computed(() => route.query.category !== undefined);
const isLoggedIn = computed(() => route.query.auth === 'guest' ? false : authStore.isAuthenticated || isPreview.value);
// 진행 중인 방은 서버가 판단한다. 초대로 참여한 사람도 같은 방을 돌려받는다.
const { activeRoom: activeTravelRoom, fetchActiveRoom } = useActiveRoom();
const hasActiveTravelRoom = computed(() => {
  const room = activeTravelRoom.value;
  return Boolean(isLoggedIn.value && room?.roomId && room?.roomName && room?.travelDate);
});
const ROOM_STATUS_LABELS = { VOTING: '투표 중', EXTRA_VOTING: '추가 투표 중', CLOSED: '코스 확정 대기', COURSE_CONFIRMED: '코스 확정' };
const hasConfirmedCourse = computed(() => activeTravelRoom.value?.status === 'COURSE_CONFIRMED');
const isTravelDay = computed(() => {
  const travelDate = activeTravelRoom.value?.travelDate;
  if (!travelDate) return false;
  const today = new Date();
  const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return travelDate === todayValue;
});
const showTodayTravelCard = computed(() => hasConfirmedCourse.value && isTravelDay.value);
// 투표가 끝난 방(CLOSED, COURSE_CONFIRMED)은 코스 화면으로 바로 보낸다.
// 투표 화면으로 보내면 투표 현황을 거쳐 코스로 두 번 리다이렉트된다.
const isVotingDone = computed(() => ['CLOSED', 'COURSE_CONFIRMED'].includes(activeTravelRoom.value?.status));
const openActiveTravel = () => {
  const roomId = activeTravelRoom.value?.roomId;
  if (!roomId) return;
  router.push({
    name: isVotingDone.value ? 'course-show' : 'vote-show',
    params: { roomId },
  });
};
const openTodayCourse = () => {
  const roomId = activeTravelRoom.value?.roomId;
  if (roomId) router.push({ name: 'course-show', params: { roomId } });
};
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
  if (authStore.isAuthenticated) fetchActiveRoom({ force: true });
  fetchPlaces();
  fetchCongestionIfVisible();
});

// 혼잡도 응답은 폴리곤까지 담겨 500KB에 가깝다. 지도를 그리지 않는
// 카테고리 목록 화면에서는 받지 않는다.
watch(isCategoryListing, fetchCongestionIfVisible);

function fetchCongestionIfVisible() {
  if (isCategoryListing.value || congestionAreas.value.length) return;
  fetchCongestion();
}

// 홈에서는 조작 없는 미리보기만 그린다. 상세 탐색은 지도 화면에서 한다.
async function fetchCongestion() {
  try {
    const { data } = await myAxios.get('/map/congestion');
    congestionAreas.value = data.data.areas ?? [];
    congestionLegend.value = data.data.legend ?? [];
  } catch {
    congestionAreas.value = [];
    congestionLegend.value = [];
  }
}

async function fetchPlaces() {
  const categoryCode = PLACE_CATEGORY_CODES[selectedCategory.value];
  // 카테고리 목록은 고른 카테고리 그대로, 기본 홈은 여유로운 관광지만 보여준다.
  const params = { page: 1, size: HOME_PLACE_SIZE };
  if (isCategoryListing.value) {
    if (categoryCode) params.keywordCodes = [categoryCode];
  } else {
    params.congestionLevel = HOME_RELAXED_LEVEL;
  }
  isPlacesLoading.value = true;
  try {
    const { data } = await myAxios.get('/places', { params });
    displayedPlaces.value = data.data.items ?? [];
  } catch {
    displayedPlaces.value = [];
  } finally {
    isPlacesLoading.value = false;
  }
}

</script>

<template>
  <main class="home-page">
    <header class="home-header"><button class="home-logo" type="button" aria-label="투어 스위치 메인으로 이동" @click="router.push({ name: 'home-show' })"><img src="/icons/tourswitch-wordmark.png" alt="" aria-hidden="true" /></button><div><button type="button" aria-label="메뉴" @click="menuOpen = true">☰</button></div></header>
    <HomeCategoryBar :selected="selectedCategory" @select="selectCategory" />
    <section v-if="!isCategoryListing && showTodayTravelCard" class="today-travel"><p>오늘의 여행,</p><strong><em>한 곳만 스위치</em> 하세요.</strong><button type="button" @click="openTodayCourse">일정 바꾸러 가기</button><img src="/figma-assets/place-placeholder.svg" alt="" aria-hidden="true" /></section>
    <section v-else-if="!isCategoryListing && hasActiveTravelRoom" class="ongoing"><span class="ongoing-dday">{{ getDday(activeTravelRoom.travelDate) }}</span><span class="ongoing-status">{{ ROOM_STATUS_LABELS[activeTravelRoom.status] ?? '진행 중' }}</span><strong>{{ activeTravelRoom.roomName }}</strong><span class="ongoing-date">{{ formatTravelDate(activeTravelRoom.travelDate) }}</span><small>지역&nbsp; {{ activeTravelRoom.regionName ?? '서울' }}</small><small>참여자&nbsp; {{ activeTravelRoom.completedParticipantCount }} / {{ activeTravelRoom.participantCount }}명 완료</small><button class="ongoing-action" type="button" @click="openActiveTravel">{{ isVotingDone ? '오늘의 코스' : '이어서 하기' }}</button></section>
    <section v-if="isCategoryListing" class="home-section relaxed-section"><h2>{{ selectedCategory === '전체' ? '전체 관광지' : `${selectedCategory} 관광지` }}</h2><div v-if="displayedPlaces.length" class="relaxed-list"><FilteredPlaceCard v-for="place in displayedPlaces" :key="place.id" :place="place" @open="router.push({ name: 'place-show', params: { placeId: place.id }, query: isPreview ? { preview: '1' } : {} })" /></div><p v-else-if="!isPlacesLoading" class="relaxed-empty">해당 카테고리의 관광지 정보가 없습니다.</p></section>
    <template v-else><section class="home-section"><h2>지금 서울은?</h2><button class="map-preview" type="button" aria-label="혼잡도 지도 크게 보기" @click="router.push({ name: 'map-show' })"><CongestionMap :areas="congestionAreas" :interactive="false" /><strong v-if="!congestionAreas.length">혼잡도 지도</strong></button><div v-if="congestionLegend.length" class="legend"><span>혼잡도 범례</span><template v-for="item in congestionLegend" :key="item.level"><i :style="{ background: item.color }"></i>{{ item.level }}</template></div></section><section class="home-section relaxed-section"><h2>여유로운 관광지</h2><div v-if="displayedPlaces.length" class="relaxed-list"><FilteredPlaceCard v-for="place in displayedPlaces" :key="place.id" :place="place" @open="router.push({ name: 'place-show', params: { placeId: place.id }, query: isPreview ? { preview: '1' } : {} })" /></div><p v-else-if="!isPlacesLoading" class="relaxed-empty">현재 여유로운 관광지 정보가 없습니다.</p></section></template>
    <VoteRoomButton class="create-fab" @click="go('room-create')" /><BottomNav />
    <Transition name="menu-drawer"><HomeMenuDrawer v-if="menuOpen" :logged-in="isLoggedIn" :nickname="authStore.user?.nickname" :avatar-url="authStore.user?.avatarUrl" @close="menuOpen = false" @navigate="go" @navigate-place="(placeId) => { menuOpen = false; router.push({ name: 'place-show', params: { placeId } }); }" @logout="logout" /></Transition>
  </main>
</template>

<style scoped>
.home-page{min-height:100vh;padding:0 0 92px;background:#fff}.home-header{height:58px;padding:0 25px;display:flex;align-items:center;justify-content:space-between}.home-logo{padding:8px 0;border:0;background:none;color:inherit;font-size:20px;font-weight:700;cursor:pointer}.home-header>div button{margin-left:12px;border:0;background:none;font-size:22px}.home-section h2{font-size:14px;margin:26px 25px 8px}.map-preview{position:relative;display:grid;place-items:center;width:calc(100% - 49px);height:250px;margin:0 auto;padding:0;border:0;border-radius:15px;background:#d9d9d9;overflow:hidden}.map-preview :deep(.congestion-map){position:absolute;inset:0;width:100%;height:100%}.map-preview strong{font-size:14px}.legend{width:calc(100% - 49px);height:22px;margin:12px auto 31px;padding:4px 14px;border-radius:10px;background:#eef1f0;color:#59615f;font-size:8px;display:flex;align-items:center;gap:6px}.legend span{margin-right:auto}.legend i{width:7px;height:7px;border-radius:50%}.featured-place{display:block;position:relative;width:calc(100% - 50px);height:213px;margin:14px auto 0;border:0;border-radius:15px;background:url('/figma-assets/seoul-forest.png') center -10px/381px auto;overflow:hidden}.featured-place:after{content:'';position:absolute;inset:50% 0 0;background:linear-gradient(transparent,#0007)}.featured-place .badge{position:absolute;z-index:1;left:13px;top:12px}.featured-place>b{position:absolute;z-index:1;right:12px;top:12px;padding:4px 10px;border-radius:14px;background:#fff;color:#4a4a4a;font-size:10px}.place-name{position:absolute;z-index:1;left:16px;bottom:14px;color:#fff;font-size:17px;font-weight:700}.ongoing{position:relative;width:calc(100% - 50px);min-height:132px;margin:16px auto 0;padding:16px 34px;border-radius:16px;background:linear-gradient(110deg,#32cbd4,#48c48e);box-shadow:0 6px 12px #1c9d832e;color:#fff;display:flex;flex-direction:column;align-items:flex-start}.ongoing-dday{color:#ffe500;font-size:10px;font-weight:800;letter-spacing:.08em}.ongoing-status{position:absolute;top:13px;right:17px;padding:4px 13px;border-radius:999px;background:#ffe500;color:#9b7100;font-size:10px;font-weight:800}.ongoing strong{margin-top:2px;font-size:17px;line-height:1.2}.ongoing-date{margin-top:3px;font-size:10px}.ongoing small{margin-top:8px;font-size:10px;line-height:1}.ongoing small+small{margin-top:6px}.ongoing-action{position:absolute;right:14px;bottom:14px;min-width:106px;height:36px;padding:0 15px;border:1px solid #fff;border-radius:999px;background:transparent;color:#fff;font-size:13px;font-weight:700}.today-travel{position:relative;width:calc(100% - 50px);height:120px;margin:16px auto 0;padding:21px 20px;border-radius:15px;background:#f0fbfb;overflow:hidden}.today-travel p{font-size:12px;font-weight:800}.today-travel strong{display:block;margin-top:1px;font-size:17px;line-height:1.2}.today-travel strong em{color:#00bfc4;font-style:normal}.today-travel button{position:absolute;left:20px;bottom:16px;height:29px;padding:0 20px;border:0;border-radius:999px;background:#72d8db;color:#17211f;font-size:10px;font-weight:800}.today-travel img{position:absolute;right:25px;top:22px;width:75px;height:75px;border-radius:50%;object-fit:cover}.relaxed-list{display:grid;gap:18px;width:calc(100% - 50px);margin:14px auto 0}.relaxed-empty{width:calc(100% - 50px);margin:14px auto;color:#89928f;font-size:12px;text-align:center}.create-fab{position:fixed;z-index:5;right:max(11px,calc((100vw - 390px)/2 + 11px));bottom:82px}.home-page :deep(.bottom-nav){position:fixed;width:min(100%,390px);margin:auto}.menu-drawer-enter-active,.menu-drawer-leave-active{transition:opacity .22s ease}.menu-drawer-enter-active :deep(.drawer),.menu-drawer-leave-active :deep(.drawer){transition:transform .28s cubic-bezier(.22,.8,.28,1)}.menu-drawer-enter-from,.menu-drawer-leave-to{opacity:0}.menu-drawer-enter-from :deep(.drawer),.menu-drawer-leave-to :deep(.drawer){transform:translateX(100%)}@media(prefers-reduced-motion:reduce){.menu-drawer-enter-active,.menu-drawer-leave-active,.menu-drawer-enter-active :deep(.drawer),.menu-drawer-leave-active :deep(.drawer){transition:none}}
.home-logo{width:132px;height:44px;padding:0}.home-logo img{display:block;width:100%;height:100%;object-fit:contain;object-position:left center}
</style>
