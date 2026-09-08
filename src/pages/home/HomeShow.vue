<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BottomNav from '../../components/BottomNav.vue';
import AppButton from '../../components/common/AppButton.vue';
import VoteRoomButton from '../../components/common/VoteRoomButton.vue';
import CrowdBadge from '../../components/common/CrowdBadge.vue';
import HomeCategoryBar from '../../components/home/HomeCategoryBar.vue';
import { useAuthStore } from '../../store/auth/useAuthStore';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const menuOpen = ref(false);
const selectedCategory = ref('전체');
const isPreview = computed(() => route.query.preview === '1' || sessionStorage.getItem('previewMode') === 'true');
const isLoggedIn = computed(() => authStore.isAuthenticated || isPreview.value);
const go = (name) => { menuOpen.value = false; router.push({ name }); };
const selectCategory = (name) => {
  selectedCategory.value = name;
  if (name !== '전체') router.push({ name: 'place-index', query: { category: name, ...(isPreview.value ? { preview: '1' } : {}) } });
};
</script>

<template>
  <main class="home-page">
    <header class="home-header"><strong>투어 스위치</strong><div><button type="button" aria-label="검색">⌕</button><button type="button" aria-label="메뉴" @click="menuOpen = true">☰</button></div></header>
    <HomeCategoryBar :selected="selectedCategory" @select="selectCategory" />
    <section class="home-section"><h2>지금 서울은?</h2><button class="map-preview" type="button"><strong>혼잡도 지도</strong></button><div class="legend"><span>혼잡도 범례</span><i class="easy"></i>여유<i class="normal"></i>보통<i class="busy"></i>혼잡</div></section>
    <section class="home-section"><h2>여유로운 관광지</h2><button class="featured-place" type="button" @click="router.push({ name: 'place-show', params: { placeId: 'place-1' }, query: isPreview ? { preview: '1' } : {} })"><CrowdBadge class="badge" /><b>성동구</b><span class="place-name">서울숲</span></button></section>
    <section v-if="isLoggedIn" class="ongoing"><div><span>투표 진행 중</span><strong>8월 15일 · 종로구 여행</strong><small>2 / 4명 투표 완료</small></div><AppButton size="small" @click="router.push({ name: 'vote-status-show', params: { roomId: 'preview-room' } })">이어가기</AppButton></section>
    <VoteRoomButton class="create-fab" @click="go('room-create')" /><BottomNav />
    <div v-if="menuOpen" class="overlay" @click.self="menuOpen = false"><aside><header><button aria-label="닫기" @click="menuOpen = false">×</button><span>♧　⚙</span></header><div v-if="isLoggedIn" class="profile"><span>👤</span><strong>카카오톡 닉네임</strong></div><button v-else class="login" @click="go('login-show')">로그인</button><nav><small>여행</small><button @click="go('history-index')">여행 기록</button><button>오늘의 코스</button><button @click="go('room-create')">투표방(여행방) 만들기</button><template v-if="isLoggedIn"><small>계정</small><button @click="go('my-page-show')">회원 정보 수정</button></template></nav></aside></div>
  </main>
</template>

<style scoped>
.home-page{min-height:100vh;padding:0 0 92px;background:#fff}.home-header{height:58px;padding:0 25px;display:flex;align-items:center;justify-content:space-between}.home-header strong{font-size:20px}.home-header button{margin-left:12px;border:0;background:none;font-size:22px}.home-section h2{font-size:14px;margin:26px 25px 8px}.map-preview{display:grid;place-items:center;width:calc(100% - 49px);height:250px;margin:0 auto;border:0;border-radius:15px;background:#d9d9d9}.map-preview strong{font-size:14px}.legend{width:calc(100% - 49px);height:22px;margin:12px auto 31px;padding:4px 14px;border-radius:10px;background:#eef1f0;color:#59615f;font-size:8px;display:flex;align-items:center;gap:6px}.legend span{margin-right:auto}.legend i{width:7px;height:7px;border-radius:50%}.legend .easy{background:#20b878}.legend .normal{background:#ffcc3d}.legend .busy{background:#f04452}.featured-place{display:block;position:relative;width:calc(100% - 50px);height:213px;margin:14px auto 0;border:0;border-radius:15px;background:url('/figma-assets/seoul-forest.png') center -10px/381px auto;overflow:hidden}.featured-place:after{content:'';position:absolute;inset:50% 0 0;background:linear-gradient(transparent,#0007)}.featured-place .badge{position:absolute;z-index:1;left:13px;top:12px}.featured-place>b{position:absolute;z-index:1;right:12px;top:12px;padding:4px 10px;border-radius:14px;background:#fff;color:#4a4a4a;font-size:10px}.place-name{position:absolute;z-index:1;left:16px;bottom:14px;color:#fff;font-size:17px;font-weight:700}.ongoing{width:calc(100% - 50px);margin:18px auto 0;padding:14px;border:1px solid #a9e7e8;border-radius:15px;display:flex;align-items:center;justify-content:space-between}.ongoing div{display:grid;gap:3px}.ongoing span{color:var(--team-color-primary);font-size:10px}.ongoing strong{font-size:12px}.ongoing small{color:var(--team-color-gray-600);font-size:9px}.create-fab{position:fixed;z-index:5;right:max(11px,calc((100vw - 390px)/2 + 11px));bottom:82px}.home-page :deep(.bottom-nav){position:fixed;width:min(100%,390px);margin:auto}.overlay{position:fixed;z-index:20;inset:0;background:#0009}.overlay aside{margin-left:auto;width:70%;height:100%;background:#fff;padding:18px 26px}.overlay aside header{display:flex;justify-content:space-between;font-size:22px}.overlay button{border:0;background:none}.profile{display:grid;justify-items:center;gap:8px;margin:20px}.profile span{width:56px;height:56px;border-radius:50%;background:#ddd;display:grid;place-items:center}.login{display:block;margin:28px 0 28px auto;color:var(--team-color-primary);font-weight:700;font-size:17px}.overlay nav{display:grid;gap:18px;text-align:right}.overlay nav button{font-weight:700;font-size:16px}.overlay nav small{margin-top:12px;color:#999}
</style>
