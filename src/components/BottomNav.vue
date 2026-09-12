<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faHouse, faMapLocationDot, faClock, faSquareCheck, faCircleUser } from '@fortawesome/free-solid-svg-icons';
import { useAuthStore } from '../store/auth/useAuthStore';

// 홈/지도/프로필 화면은 아직 다른 담당자 몫이라 라우트가 없다. 지금은 다섯 아이콘을
// 전부 보여주되 실제로 이동 가능한 건 "투표" 탭뿐이다 - 나머지는 그 화면이 생기면 연결한다.
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isVoteActive = computed(() => ['vote-show', 'additional-vote-show', 'vote-status-show'].includes(route.name));
const activeVoteRoomId = computed(() => {
  try {
    const memberId = authStore.user?.id;
    if (!memberId) return null;
    const room = JSON.parse(localStorage.getItem(`activeTravelRoom:${memberId}`) ?? 'null');
    return room?.roomId ?? null;
  } catch {
    return null;
  }
});

const items = [
  { key: 'home', label: '홈', icon: faHouse, routeName: 'home-show' },
  { key: 'map', label: '지도', icon: faMapLocationDot },
  { key: 'schedule', label: '기록', icon: faClock, routeName: 'history-index' },
  { key: 'vote', label: '투표', icon: faSquareCheck },
  { key: 'profile', label: '프로필', icon: faCircleUser, routeName: 'my-page-show' },
];

const isActive = (item) =>
  (item.key === 'vote' && isVoteActive.value) ||
  (item.key === 'schedule' && String(route.name).startsWith('history-')) ||
  route.name === item.routeName;

const navigate = (item) => {
  if (item.key === 'vote' && activeVoteRoomId.value) {
    router.push({ name: 'vote-show', params: { roomId: activeVoteRoomId.value } });
    return;
  }
  if (item.routeName) router.push({ name: item.routeName });
};
</script>

<template>
  <nav class="bottom-nav" aria-label="주요 메뉴">
    <button
      v-for="item in items"
      :key="item.key"
      class="nav-item"
      :class="{ active: isActive(item) }"
      :disabled="(!item.routeName && item.key !== 'vote') || (item.key === 'vote' && !activeVoteRoomId)"
      type="button"
      @click="navigate(item)"
    >
      <FontAwesomeIcon class="icon" :icon="item.icon" fixed-width aria-hidden="true" />
      <span class="label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: sticky;
  z-index: 10;
  bottom: 0;
  left: 0;
  right: 0;
  width: min(100%, 390px);
  height: 74px;
  display: flex;
  align-items: stretch;
  background: var(--team-color-white);
  border-top: 1px solid var(--team-color-gray-200);
  margin-top: auto;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--team-color-gray-400);
}

.nav-item:disabled {
  cursor: default;
}

.nav-item.active {
  color: var(--team-color-primary);
}

.icon {
  font-size: 1.3rem;
  line-height: 1;
}

.label {
  font-size: 0.625rem;
}
</style>
