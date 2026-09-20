<script setup>
import { computed } from 'vue';

const props = defineProps({ level: { type: String, default: '여유' } });

// 서버 legend와 같은 4단계다. 값에 공백이 있어("약간 붐빔") 레벨을 클래스명에 그대로 쓰면
// 클래스가 두 개로 쪼개져 어떤 규칙에도 걸리지 않는다. 영문 키로 바꿔서 붙인다.
const LEVEL_KEYS = {
  '여유': 'easy',
  '보통': 'normal',
  '약간 붐빔': 'busy',
  '붐빔': 'crowded',
};

const levelKey = computed(() => LEVEL_KEYS[props.level?.trim()] ?? 'unknown');
</script>

<template>
  <span class="crowd-badge" :class="`level-${levelKey}`"><i aria-hidden="true"></i>{{ props.level }}</span>
</template>

<style scoped>
.crowd-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
}

.crowd-badge i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* 서버 legend 색상(#2EBD85/#F2C94C/#F2994A/#EB5757)을 기준으로 배경은 옅게, 글자는 진하게 둔다. */
.level-easy { background: #dffff4; color: #1f7a58; }
.level-normal { background: #fff6da; color: #8a6d0b; }
.level-busy { background: #fff0e0; color: #a35a12; }
.level-crowded { background: #fff0f1; color: #b3272f; }
.level-unknown { background: var(--team-color-gray-200); color: var(--team-color-gray-600); }
</style>
