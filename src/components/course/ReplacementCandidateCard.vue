<script setup>
defineProps({
  candidate: { type: Object, required: true },
  selected: { type: Boolean, default: false },
});

defineEmits(['select']);

const gradeClass = (grade) => {
  if (grade === '여유') return 'low';
  if (grade === '보통') return 'normal';
  if (grade === '약간 붐빔') return 'busy';
  return 'very-busy';
};
</script>

<template>
  <button class="candidate-card" :class="{ selected }" type="button" @click="$emit('select')">
    <img v-if="candidate.imageUrl" class="candidate-image" :src="candidate.imageUrl" :alt="candidate.title" />
    <div v-else class="image-placeholder" aria-hidden="true">관광지 이미지 없음</div>
    <div class="card-body">
      <div class="title-row">
        <h3>{{ candidate.title }}</h3>
        <span v-if="candidate.crowdGrade" class="badge" :class="gradeClass(candidate.crowdGrade)">
          {{ candidate.crowdGrade }}
        </span>
      </div>
      <p class="address">{{ candidate.address || '주소 정보 없음' }}</p>
      <p class="distance">현재 선택 지역 중심에서 {{ (candidate.distanceMeters / 1000).toFixed(1) }}km</p>
      <div v-if="candidate.matchedKeywords?.length" class="keywords">
        <span v-for="keyword in candidate.matchedKeywords" :key="keyword">{{ keyword }}</span>
      </div>
    </div>
  </button>
</template>

<style scoped>
.candidate-card { width: 100%; overflow: hidden; border: 2px solid transparent; border-radius: var(--team-radius-card); background: var(--team-color-white); box-shadow: 0 5px 18px rgb(23 33 31 / 8%); text-align: left; }
.candidate-card.selected { border-color: var(--team-color-primary); }
.candidate-image, .image-placeholder { width: 100%; height: 118px; }
.candidate-image { display: block; object-fit: cover; }
.image-placeholder { display: grid; place-items: center; background: var(--team-color-gray-200); color: var(--team-color-gray-600); font-size: .75rem; }
.card-body { padding: 14px; }
.title-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
h3 { font-size: 1rem; }
.badge { flex-shrink: 0; padding: 4px 10px; border-radius: var(--team-radius-pill); color: white; font-size: .68rem; font-weight: 700; }
.badge.low { background: var(--team-color-success); }
.badge.normal { background: var(--team-color-warning); color: var(--team-color-gray-800); }
.badge.busy, .badge.very-busy { background: var(--team-color-danger); }
.address, .distance { margin-top: 6px; color: var(--team-color-gray-600); font-size: .75rem; line-height: 1.45; }
.keywords { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }
.keywords span { padding: 4px 8px; border-radius: var(--team-radius-pill); background: #eafafa; color: var(--team-color-primary-dark); font-size: .68rem; }
</style>
