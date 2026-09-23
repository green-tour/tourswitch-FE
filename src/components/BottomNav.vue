<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faHouse, faMapLocationDot, faRoute, faSquareCheck, faCircleUser } from '@fortawesome/free-solid-svg-icons';
import { useAuthStore } from '../store/auth/useAuthStore';
import { useActiveRoom } from '../composables/useActiveRoom';

// 투표와 코스는 현재 여행방이 있을 때만 열 수 있다.
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const { activeRoom, fetchActiveRoom } = useActiveRoom();
const navigationNotice = ref('');
let navigationNoticeTimer;

const isVoteActive = computed(() => ['vote-show', 'additional-vote-show', 'vote-status-show'].includes(route.name));
const activeVoteRoomId = computed(() =>
  ['VOTING', 'EXTRA_VOTING'].includes(activeRoom.value?.status) ? activeRoom.value.roomId : null,
);
const activeCourseRoomId = computed(() =>
  activeRoom.value?.status === 'COURSE_CONFIRMED' ? activeRoom.value.roomId : null,
);

// 초대로 참여한 사람은 방을 직접 만들지 않아 로컬에 기록이 없다. 서버에 물어본다.
onMounted(() => {
  if (authStore.isAuthenticated) fetchActiveRoom();
});

onBeforeUnmount(() => clearTimeout(navigationNoticeTimer));

const items = [
  { key: 'home', label: '홈', icon: faHouse, routeName: 'home-show' },
  { key: 'map', label: '지도', icon: faMapLocationDot, routeName: 'map-show' },
  { key: 'course', label: '코스', icon: faRoute },
  { key: 'vote', label: '투표', icon: faSquareCheck },
  { key: 'profile', label: '프로필', icon: faCircleUser, routeName: 'my-page-show' },
];

const isActive = (item) =>
  (item.key === 'vote' && isVoteActive.value) ||
  (item.key === 'course' && route.name === 'course-show') ||
  route.name === item.routeName;

const showNavigationNotice = (message) => {
  navigationNotice.value = message;
  clearTimeout(navigationNoticeTimer);
  navigationNoticeTimer = setTimeout(() => {
    navigationNotice.value = '';
  }, 3500);
};

const navigate = async (item) => {
  if (item.key === 'vote') {
    // 네비게이션을 누를 때 최신 방 상태를 다시 확인한다.
    await fetchActiveRoom({ force: true });
    if (activeVoteRoomId.value) {
      router.push({ name: 'vote-show', params: { roomId: activeVoteRoomId.value } });
      return;
    }
    showNavigationNotice('진행 중인 투표방이 없어요. 먼저 만들어 주세요.');
    return;
  }
  if (item.key === 'course') {
    // 코스 확정 직후에도 바로 열 수 있도록 최신 방 상태를 확인한다.
    await fetchActiveRoom({ force: true });
    if (activeCourseRoomId.value) {
      router.push({ name: 'course-show', params: { roomId: activeCourseRoomId.value } });
      return;
    }
    showNavigationNotice('코스는 투표를 마친 뒤 이용할 수 있어요.');
    return;
  }
  if (item.routeName) router.push({ name: item.routeName });
};

const isUnavailable = (item) =>
  (item.key === 'vote' && !activeVoteRoomId.value) ||
  (item.key === 'course' && !activeCourseRoomId.value);
</script>

<template>
  <nav class="bottom-nav" aria-label="주요 메뉴">
    <Transition name="navigation-notice">
      <p v-if="navigationNotice" class="navigation-notice" role="status" aria-live="polite">
        {{ navigationNotice }}
      </p>
    </Transition>
    <button
      v-for="item in items"
      :key="item.key"
      class="nav-item"
      :class="{ active: isActive(item), unavailable: isUnavailable(item) }"
      :aria-disabled="isUnavailable(item)"
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

.nav-item.unavailable {
  color: var(--team-color-gray-400);
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

.navigation-notice {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 10px);
  max-width: min(330px, calc(100vw - 32px));
  margin: 0;
  padding: 11px 14px;
  border-radius: 10px;
  background: #24352e;
  box-shadow: 0 4px 12px #0002;
  color: #fff;
  font-size: 0.75rem;
  line-height: 1.4;
  text-align: center;
  transform: translateX(-50%);
  white-space: nowrap;
}

.navigation-notice-enter-active,
.navigation-notice-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.navigation-notice-enter-from,
.navigation-notice-leave-to {
  opacity: 0;
  transform: translate(-50%, 4px);
}

@media (prefers-reduced-motion: reduce) {
  .navigation-notice-enter-active,
  .navigation-notice-leave-active {
    transition: none;
  }
}
</style>
