<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BottomNav from '../../components/BottomNav.vue';
import AppButton from '../../components/common/AppButton.vue';
import VoteRoomButton from '../../components/common/VoteRoomButton.vue';
import CrowdBadge from '../../components/common/CrowdBadge.vue';
import HomeCategoryBar from '../../components/home/HomeCategoryBar.vue';
import HomeMenuDrawer from '../../components/home/HomeMenuDrawer.vue';
import { useAuthStore } from '../../store/auth/useAuthStore';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const menuOpen = ref(false);
const selectedCategory = ref('전체');
const activeTravelRoom = ref(null);
const isPreview = computed(() => route.query.preview === '1' || sessionStorage.getItem('previewMode') === 'true');
const isLoggedIn = computed(() => route.query.auth === 'guest' ? false : authStore.isAuthenticated || isPreview.value);
const go = (name) => { menuOpen.value = false; router.push({ name }); };
const logout = async () => { await authStore.logout(); menuOpen.value = false; };
const selectCategory = (name) => {
  selectedCategory.value = name;
  if (name !== '전체') router.push({ name: 'place-index', query: { category: name, ...(isPreview.value ? { preview: '1' } : {}) } });
};

onMounted(async () => {
  if (!isPreview.value && !authStore.isInitialized) await authStore.restoreSession();
  activeTravelRoom.value = readActiveTravelRoom();
});

function readActiveTravelRoom() {
  try {
    const storageKey = authStore.user?.id ? `activeTravelRoom:${authStore.user.id}` : 'activeTravelRoom';
    const savedRoom = localStorage.getItem(storageKey) ?? sessionStorage.getItem('activeTravelRoom');
    const room = JSON.parse(savedRoom ?? 'null');
    if (room && authStore.user?.id && !localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, JSON.stringify(room));
      sessionStorage.removeItem('activeTravelRoom');
    }
    return room;
  } catch {
    localStorage.removeItem(`activeTravelRoom:${authStore.user?.id}`);
    sessionStorage.removeItem('activeTravelRoom');
    return null;
  }
}
</script>

<template>
  <main class="home-page">
    <header class="home-header"><button class="home-logo" type="button" aria-label="투어 스위치 메인으로 이동" @click="router.push({ name: 'home-show' })">투어 스위치</button><div><button type="button" aria-label="검색">⌕</button><button type="button" aria-label="메뉴" @click="menuOpen = true">☰</button></div></header>
    <HomeCategoryBar :selected="selectedCategory" @select="selectCategory" />
    <section v-if="isLoggedIn && activeTravelRoom" class="ongoing"><div><span>투표 진행 중</span><strong>{{ activeTravelRoom.travelDate }} · {{ activeTravelRoom.roomName }}</strong><small>생성한 여행방의 후보를 선택해보세요.</small></div><AppButton size="small" @click="router.push({ name: 'vote-show', params: { roomId: activeTravelRoom.roomId } })">이어가기</AppButton></section>
    <section class="home-section"><h2>지금 서울은?</h2><button class="map-preview" type="button"><strong>혼잡도 지도</strong></button><div class="legend"><span>혼잡도 범례</span><i class="easy"></i>여유<i class="normal"></i>보통<i class="busy"></i>혼잡</div></section>
    <section class="home-section"><h2>여유로운 관광지</h2><button class="featured-place" type="button" @click="router.push({ name: 'place-show', params: { placeId: 'place-1' }, query: isPreview ? { preview: '1' } : {} })"><CrowdBadge class="badge" /><b>성동구</b><span class="place-name">서울숲</span></button></section>
    <VoteRoomButton class="create-fab" @click="go('room-create')" /><BottomNav />
    <HomeMenuDrawer v-if="menuOpen" :logged-in="isLoggedIn" :nickname="authStore.user?.nickname" :avatar-url="authStore.user?.avatarUrl" @close="menuOpen = false" @navigate="go" @logout="logout" />
  </main>
</template>

<style scoped>
.home-page{min-height:100vh;padding:0 0 92px;background:#fff}.home-header{height:58px;padding:0 25px;display:flex;align-items:center;justify-content:space-between}.home-logo{padding:8px 0;border:0;background:none;color:inherit;font-size:20px;font-weight:700;cursor:pointer}.home-header>div button{margin-left:12px;border:0;background:none;font-size:22px}.home-section h2{font-size:14px;margin:26px 25px 8px}.map-preview{display:grid;place-items:center;width:calc(100% - 49px);height:250px;margin:0 auto;border:0;border-radius:15px;background:#d9d9d9}.map-preview strong{font-size:14px}.legend{width:calc(100% - 49px);height:22px;margin:12px auto 31px;padding:4px 14px;border-radius:10px;background:#eef1f0;color:#59615f;font-size:8px;display:flex;align-items:center;gap:6px}.legend span{margin-right:auto}.legend i{width:7px;height:7px;border-radius:50%}.legend .easy{background:#20b878}.legend .normal{background:#ffcc3d}.legend .busy{background:#f04452}.featured-place{display:block;position:relative;width:calc(100% - 50px);height:213px;margin:14px auto 0;border:0;border-radius:15px;background:url('/figma-assets/seoul-forest.png') center -10px/381px auto;overflow:hidden}.featured-place:after{content:'';position:absolute;inset:50% 0 0;background:linear-gradient(transparent,#0007)}.featured-place .badge{position:absolute;z-index:1;left:13px;top:12px}.featured-place>b{position:absolute;z-index:1;right:12px;top:12px;padding:4px 10px;border-radius:14px;background:#fff;color:#4a4a4a;font-size:10px}.place-name{position:absolute;z-index:1;left:16px;bottom:14px;color:#fff;font-size:17px;font-weight:700}.ongoing{width:calc(100% - 50px);margin:18px auto 0;padding:14px;border:1px solid #a9e7e8;border-radius:15px;display:flex;align-items:center;justify-content:space-between}.ongoing div{display:grid;gap:3px}.ongoing span{color:var(--team-color-primary);font-size:10px}.ongoing strong{font-size:12px}.ongoing small{color:var(--team-color-gray-600);font-size:9px}.create-fab{position:fixed;z-index:5;right:max(11px,calc((100vw - 390px)/2 + 11px));bottom:82px}.home-page :deep(.bottom-nav){position:fixed;width:min(100%,390px);margin:auto}
</style>
