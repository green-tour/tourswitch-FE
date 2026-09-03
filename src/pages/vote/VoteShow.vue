<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import myAxios from '../../api/myAxios';
import BottomNav from '../../components/BottomNav.vue';
import AppButton from '../../components/common/AppButton.vue';
import AppHeader from '../../components/common/AppHeader.vue';
import AppState from '../../components/common/AppState.vue';

// memberId는 회원 도메인 JWT 인증이 붙기 전까지 쿼리 파라미터로 임시 수신한다
// (백엔드 VoteController와 동일한 사유 - SecurityContext 연동 시 교체).
const route = useRoute();
const router = useRouter();
const roomId = route.params.roomId;

const isLoading = ref(true);
const errorMessage = ref('');
const candidateGroups = ref([]);
const activeGroupIndex = ref(0);
const activeCardIndex = ref(0);
const isSubmitting = ref(false);

const activeGroup = computed(() => candidateGroups.value[activeGroupIndex.value] ?? null);
const activeCard = computed(() => activeGroup.value?.items[activeCardIndex.value] ?? null);
const totalSelectedCount = computed(() =>
  candidateGroups.value.reduce(
    (count, group) => count + group.items.filter((item) => item.myVote).length,
    0,
  ),
);

const fetchCandidates = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const res = await myAxios.get(`/vote-sessions/${roomId}/candidates`, { params: { includeMyVote: true } });
    candidateGroups.value = res.data.data.candidateGroups.map((group) => ({
      ...group,
      keywordId: group.keywordId ?? group.keywordCode,
      keywordName: group.keywordName ?? group.keywordCode,
      items: group.items.map((item) => ({
        ...item.place,
        ...item,
        candidateId: item.candidateId ?? item.place?.id,
        title: item.title ?? item.place?.name,
        overview: item.overview ?? item.place?.summary,
        imageUrl: item.imageUrl ?? item.place?.imageUrl,
        concentrationGrade: item.concentrationGrade ?? item.place?.congestion?.level,
        hasWheelchairAccess: item.hasWheelchairAccess ?? item.place?.accessibility?.wheelchair === 'AVAILABLE',
        hasStrollerAccess: item.hasStrollerAccess ?? item.place?.accessibility?.stroller === 'AVAILABLE',
      })),
    }));
  } catch {
    errorMessage.value = '후보 카드를 불러오지 못했습니다.';
  } finally {
    isLoading.value = false;
  }
};

const selectGroup = (index) => {
  activeGroupIndex.value = index;
  activeCardIndex.value = 0;
};

const showPrevCard = () => {
  if (activeCardIndex.value > 0) activeCardIndex.value -= 1;
};

const showNextCard = () => {
  if (activeGroup.value && activeCardIndex.value < activeGroup.value.items.length - 1) {
    activeCardIndex.value += 1;
  }
};

const toggleVote = async () => {
  if (!activeCard.value || isSubmitting.value) return;
  isSubmitting.value = true;
  const card = activeCard.value;
  try {
    if (card.myVote) {
      await myAxios.delete(`/vote-sessions/${roomId}/votes/${card.candidateId}`);
    } else {
      await myAxios.put(`/vote-sessions/${roomId}/votes/${card.candidateId}`);
    }
    card.myVote = !card.myVote;
  } catch {
    errorMessage.value = '투표 처리에 실패했습니다.';
  } finally {
    isSubmitting.value = false;
  }
};

const completeVoting = async () => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    await myAxios.patch(`/vote-sessions/${roomId}/participants/me/completion`, { completed: true });
    router.push({ name: 'vote-status-show', params: { roomId } });
  } catch {
    errorMessage.value = '선택 완료 처리에 실패했습니다.';
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(fetchCandidates);
</script>

<template>
  <div class="page">
    <AppHeader @back="router.back()" />

    <AppState v-if="isLoading" type="loading" message="후보 카드를 불러오는 중입니다." />
    <AppState v-else-if="errorMessage" type="error" :message="errorMessage" @retry="fetchCandidates" />
    <AppState v-else-if="candidateGroups.length === 0" message="아직 준비된 후보 카드가 없습니다." />

    <template v-else>
      <div class="intro">
        <p class="room-label">투표방(여행방) 이름</p>
        <h1>마음에 드는 장소를 골라주세요.</h1>
      </div>

      <div class="keyword-chips" role="tablist">
        <button
          v-for="(group, index) in candidateGroups"
          :key="group.keywordId"
          type="button"
          role="tab"
          class="chip"
          :class="{ active: index === activeGroupIndex }"
          :aria-selected="index === activeGroupIndex"
          @click="selectGroup(index)"
        >
          {{ group.keywordName }}
        </button>
      </div>

      <p v-if="activeGroup" class="progress">{{ activeCardIndex + 1 }} / {{ activeGroup.items.length }}</p>

      <div v-if="activeCard" class="card-area">
        <button
          class="nav-arrow left"
          type="button"
          aria-label="이전 카드"
          :disabled="activeCardIndex === 0"
          @click="showPrevCard"
        >
          ‹
        </button>

        <article class="candidate-card">
          <img v-if="activeCard.imageUrl" :src="activeCard.imageUrl" :alt="activeCard.title" class="card-image" />
          <div v-else class="card-image placeholder" aria-hidden="true"></div>

          <div class="card-body">
            <h2>{{ activeCard.title }}</h2>
            <p v-if="activeCard.overview" class="overview">{{ activeCard.overview }}</p>
            <p v-if="activeCard.hasWheelchairAccess || activeCard.hasStrollerAccess" class="accessibility">
              ♿ 유모차, 휠체어 가능
            </p>
            <p v-if="activeCard.concentrationGrade" class="congestion">혼잡도 {{ activeCard.concentrationGrade }}</p>
          </div>
        </article>

        <button
          class="nav-arrow right"
          type="button"
          aria-label="다음 카드"
          :disabled="!activeGroup || activeCardIndex === activeGroup.items.length - 1"
          @click="showNextCard"
        >
          ›
        </button>
      </div>

      <div class="select-area">
        <button
          class="heart-button"
          type="button"
          :class="{ selected: activeCard?.myVote }"
          :aria-pressed="activeCard?.myVote"
          :disabled="isSubmitting"
          @click="toggleVote"
        >
          ♥
        </button>
        <p class="select-count">{{ totalSelectedCount }}장 선택</p>
      </div>

      <AppButton size="large" block :loading="isSubmitting" @click="completeVoting">
        투표완료
      </AppButton>
    </template>

    <BottomNav />
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 16px 20px 24px;
  gap: 12px;
}


.intro .room-label {
  color: var(--team-color-primary);
  font-size: 0.8125rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.intro h1 {
  font-size: 1.25rem;
  line-height: 1.4;
}

.keyword-chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.chip {
  flex-shrink: 0;
  padding: 8px 16px;
  border-radius: var(--team-radius-pill);
  border: 1px solid var(--team-color-gray-200);
  background: var(--team-color-white);
  color: var(--team-color-gray-600);
  font-size: 0.8125rem;
  font-weight: 600;
}

.chip.active {
  background: var(--team-color-primary);
  border-color: var(--team-color-primary);
  color: var(--team-color-white);
}

.progress {
  text-align: center;
  color: var(--team-color-danger);
  font-weight: 700;
}

.card-area {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.nav-arrow {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--team-color-gray-100);
  color: var(--team-color-gray-800);
  font-size: 1.25rem;
}

.nav-arrow:disabled {
  opacity: 0.3;
}

.candidate-card {
  flex: 1;
  border: 1px solid var(--team-color-gray-200);
  border-radius: var(--team-radius-card);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-image {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.card-image.placeholder {
  background: var(--team-color-gray-200);
}

.card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-body h2 {
  font-size: 1.125rem;
}

.overview {
  color: var(--team-color-gray-600);
  font-size: 0.875rem;
  line-height: 1.5;
}

.accessibility {
  font-size: 0.8125rem;
  color: var(--team-color-gray-600);
}

.congestion {
  font-size: 0.8125rem;
  color: var(--team-color-success);
  font-weight: 600;
}

.select-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.heart-button {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  background: var(--team-color-danger);
  color: var(--team-color-white);
  font-size: 1.75rem;
  opacity: 0.55;
}

.heart-button.selected {
  opacity: 1;
}

.select-count {
  color: var(--team-color-danger);
  font-weight: 700;
  font-size: 0.875rem;
}

</style>
