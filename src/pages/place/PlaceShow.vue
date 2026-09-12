<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BottomNav from '../../components/BottomNav.vue';
import VoteRoomButton from '../../components/common/VoteRoomButton.vue';
import AppState from '../../components/common/AppState.vue';
import CrowdBadge from '../../components/common/CrowdBadge.vue';

const route = useRoute();
const router = useRouter();
const place = ref(null);
const isLoading = ref(true);
const errorMessage = ref('');
const placeDetails = {
  'place-1': { name: '서울숲', regionName: '성동구', summary: '35만 평 도심 속 숲, 사슴 방사장과 나비 정원을 지나 서울숲 카페거리까지 이어져요.', imageUrl: '/figma-assets/seoul-forest.png', address: '서울특별시 성동구 뚝섬로 273', congestion: { level: '여유' }, accessibility: { wheelchair: 'AVAILABLE', stroller: 'AVAILABLE' } },
  'place-2': { name: '북촌 한옥마을', regionName: '종로구', summary: '서울의 오래된 골목을 천천히 걸어보세요.', imageUrl: '/figma-assets/seoul-forest.png', address: '서울특별시 종로구 북촌로 11길', congestion: { level: '여유' }, accessibility: { wheelchair: 'UNAVAILABLE', stroller: 'UNAVAILABLE' } },
  'place-3': { name: '석촌호수', regionName: '송파구', summary: '호수를 따라 걷기 좋은 산책 명소예요.', imageUrl: '/figma-assets/seoul-forest.png', address: '서울특별시 송파구 잠실로 148', congestion: { level: '여유' }, accessibility: { wheelchair: 'AVAILABLE', stroller: 'AVAILABLE' } },
  'place-4': { name: '동대문 DDP', regionName: '중구', summary: '전시와 공연을 함께 즐길 수 있는 복합 문화 공간이에요.', imageUrl: '/figma-assets/seoul-forest.png', address: '서울특별시 중구 을지로 281', congestion: { level: '보통' }, accessibility: { wheelchair: 'AVAILABLE', stroller: 'AVAILABLE' } },
  'place-5': { name: '남산 서울타워', regionName: '용산구', summary: '서울 도심을 한눈에 바라볼 수 있는 전망 명소예요.', imageUrl: '/figma-assets/seoul-forest.png', address: '서울특별시 용산구 남산공원길 105', congestion: { level: '보통' }, accessibility: { wheelchair: 'AVAILABLE', stroller: 'AVAILABLE' } },
  'place-6': { name: '서울 어린이대공원', regionName: '광진구', summary: '가족과 함께 즐기기 좋은 넓은 공원이에요.', imageUrl: '/figma-assets/seoul-forest.png', address: '서울특별시 광진구 능동로 216', congestion: { level: '여유' }, accessibility: { wheelchair: 'AVAILABLE', stroller: 'AVAILABLE' } },
  'place-7': { name: '조계사', regionName: '종로구', summary: '도심 속에서 고즈넉한 시간을 보낼 수 있는 사찰입니다.', imageUrl: '/figma-assets/seoul-forest.png', address: '서울특별시 종로구 우정국로 55', congestion: { level: '여유' }, accessibility: { wheelchair: 'AVAILABLE', stroller: 'AVAILABLE' } },
};

const fetchPlace = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    place.value = placeDetails[route.params.placeId];
    if (!place.value) throw new Error('관광지 정보를 찾을 수 없습니다.');
    localStorage.setItem('recentViewedPlace', JSON.stringify({
      id: route.params.placeId,
      name: place.value.name,
      imageUrl: place.value.imageUrl ?? '/figma-assets/seoul-forest.png',
      regionName: place.value.regionName ?? '',
    }));
  }
  catch (error) { errorMessage.value = error.message ?? '관광지 정보를 불러오지 못했습니다.'; }
  finally { isLoading.value = false; }
};

onMounted(fetchPlace);
</script>

<template>
  <main class="place-show">
    <AppState v-if="isLoading" type="loading" message="관광지 정보를 불러오는 중입니다." />
    <AppState v-else-if="errorMessage" type="error" :message="errorMessage" @retry="fetchPlace" />
    <template v-else>
      <section class="hero">
        <button class="back" aria-label="뒤로가기" @click="router.back()">‹</button><div class="actions"><button aria-label="공유">⌯</button><button aria-label="관심 관광지">♡</button></div>
        <div class="title"><h1>{{ place.name }}</h1><span>{{ place.regionName || '성동구' }}</span></div><CrowdBadge class="badge" :level="place.congestion?.level || '여유'" />
      </section>
      <section class="details">
        <p class="summary">{{ place.summary || '제공 정보 없음' }}</p>
        <h2>혼잡도 예측</h2><div class="chart"><strong>혼잡도 차트 (실시간 예측치 7일)</strong></div>
        <h2>주소</h2><p>{{ place.address || '-' }}</p>
        <h2>접근성</h2><small>♿ {{ place.accessibility?.wheelchair === 'AVAILABLE' ? '유모차, 휠체어 가능' : '제공 정보 없음' }}</small>
      </section>
      <VoteRoomButton class="create-fab" @click="router.push({ name: 'room-create' })" /><BottomNav />
    </template>
  </main>
</template>

<style scoped>
.place-show{min-height:100vh;padding-bottom:76px;background:#fff}.hero{position:relative;height:300px;background-position:center;background-size:cover;color:#fff}.hero:after{content:'';position:absolute;inset:52% 0 0;background:linear-gradient(transparent,#0009)}.back,.actions button{position:relative;z-index:2;width:32px;height:32px;border:0;border-radius:50%;background:#24352e99;color:#fff;font-size:24px}.back{position:absolute;left:8px;top:8px}.actions{position:absolute;z-index:2;right:8px;top:8px;display:flex;gap:4px}.actions button{position:static;font-size:19px}.title{position:absolute;z-index:2;left:22px;bottom:10px;display:flex;align-items:baseline;gap:10px}.title h1{font-size:28px}.title span{color:#ddd;font-size:13px}.badge{position:absolute;z-index:2;right:14px;bottom:14px;background:#20b878;color:#fff}.details{padding:25px 23px 98px}.summary{min-height:45px;margin-bottom:19px;font-size:12px;line-height:1.25}.details h2{margin:0 0 8px;color:var(--team-color-primary);font-size:14px}.chart{height:204px;margin-bottom:30px;display:grid;place-items:center;background:#d9d9d9;font-size:12px}.details>p:not(.summary){height:28px;margin-bottom:9px;font-size:12px}.details>small{display:block;font-size:8px}.create-fab{position:fixed;z-index:5;right:max(11px,calc((100vw - 390px)/2 + 11px));bottom:92px}.place-show :deep(.bottom-nav){position:fixed;width:min(100%,390px);margin:auto}
.hero{background:url('/figma-assets/detail-reference.png') center top/390px 844px no-repeat}
.hero:after{display:none}.hero .title,.hero .badge,.hero .actions{visibility:hidden}.hero .back{opacity:0}
</style>
