<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

// 홈/지도/프로필 화면은 아직 다른 담당자 몫이라 라우트가 없다. 지금은 다섯 아이콘을
// 전부 보여주되 실제로 이동 가능한 건 "투표" 탭뿐이다 - 나머지는 그 화면이 생기면 연결한다.
const route = useRoute();

const isVoteActive = computed(() => route.name === 'vote-show' || route.name === 'vote-status-show');

const items = [
  { key: 'home', label: '홈', icon: '⌂' },
  { key: 'map', label: '지도', icon: '⌗' },
  { key: 'schedule', label: '일정', icon: '◷' },
  { key: 'vote', label: '투표', icon: '☑' },
  { key: 'profile', label: '프로필', icon: '◎' },
];
</script>

<template>
  <nav class="bottom-nav" aria-label="주요 메뉴">
    <button
      v-for="item in items"
      :key="item.key"
      class="nav-item"
      :class="{ active: item.key === 'vote' && isVoteActive }"
      :disabled="item.key !== 'vote'"
      type="button"
    >
      <span class="icon" aria-hidden="true">{{ item.icon }}</span>
      <span class="label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--team-nav-height);
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
  gap: 2px;
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
  font-size: 1.25rem;
  line-height: 1;
}

.label {
  font-size: 0.6875rem;
}
</style>
