<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import myAxios from '../../api/myAxios';
import BottomNav from '../../components/BottomNav.vue';
import AppState from '../../components/common/AppState.vue';
import { useAuthStore } from '../../store/auth/useAuthStore';

// memberId는 회원 도메인 JWT 인증이 붙기 전까지 쿼리 파라미터로 임시 수신한다
// (백엔드 VoteController와 동일한 사유 - SecurityContext 연동 시 교체).
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const roomId = route.params.roomId;

const isLoading = ref(true);
const errorMessage = ref('');
const candidateGroups = ref([]);
const activeGroupIndex = ref(0);
const activeCardIndex = ref(0);
const isSubmitting = ref(false);
const selectedCandidateIds = ref(readSelectedCandidateIds());
const roomCategories = ref(readRoomCategories());

const activeGroup = computed(() => candidateGroups.value[activeGroupIndex.value] ?? null);
const activeCard = computed(() => activeGroup.value?.items[activeCardIndex.value] ?? null);
const cardTrackStyle = computed(() => ({ transform: `translateX(${-activeCardIndex.value * 245}px)` }));
const displayedCategories = computed(() => roomCategories.value.length ? roomCategories.value : ['관광지']);
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
    if (!authStore.user?.id) throw new Error('로그인 정보를 확인하지 못했습니다.');
    const tally = (await myAxios.get(`/rooms/${roomId}/votes/tally`, { params: { memberId: authStore.user.id } })).data.data;
    const candidates = tally.candidates ?? [];
    candidateGroups.value = candidates.length ? [{
      keywordId: 'all',
      keywordName: '관광지',
      items: candidates.map((candidate) => ({
        ...candidate,
        candidateId: candidate.candidateId ?? candidate.place?.id,
        title: candidate.title ?? candidate.place?.name ?? `관광지 후보 ${candidate.displayOrder}`,
        overview: candidate.overview ?? candidate.place?.overview ?? '',
        imageUrl: candidate.imageUrl ?? candidate.place?.imageUrl,
        myVote: selectedCandidateIds.value.includes(candidate.candidateId ?? candidate.place?.id),
      })),
    }] : [];
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? error.message ?? '후보 카드를 불러오지 못했습니다.';
  } finally {
    isLoading.value = false;
  }
};

const showPrevCard = () => {
  if (activeCardIndex.value > 0) {
    activeCardIndex.value -= 1;
  }
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
      await myAxios.delete(`/rooms/${roomId}/votes/${card.candidateId}`, { params: { memberId: authStore.user.id } });
    } else {
      await myAxios.put(`/rooms/${roomId}/votes/${card.candidateId}`, null, { params: { memberId: authStore.user.id } });
    }
    card.myVote = !card.myVote;
    selectedCandidateIds.value = card.myVote
      ? [...selectedCandidateIds.value, card.candidateId]
      : selectedCandidateIds.value.filter((id) => id !== card.candidateId);
    sessionStorage.setItem(`selectedCandidates:${roomId}`, JSON.stringify(selectedCandidateIds.value));
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
    await myAxios.patch(`/rooms/${roomId}/participants/me/completion`, { completed: true }, { params: { memberId: authStore.user.id } });
    router.push({ name: 'vote-status-show', params: { roomId } });
  } catch {
    errorMessage.value = '선택 완료 처리에 실패했습니다.';
  } finally {
    isSubmitting.value = false;
  }
};

function readSelectedCandidateIds() {
  try {
    return JSON.parse(sessionStorage.getItem(`selectedCandidates:${roomId}`) ?? '[]');
  } catch {
    return [];
  }
}

function readRoomCategories() {
  try {
    const categories = JSON.parse(localStorage.getItem(`roomCategories:${roomId}`) ?? '[]');
    return Array.isArray(categories) ? categories : [];
  } catch {
    return [];
  }
}

onMounted(fetchCandidates);
</script>

<template>
  <div class="page">
    <AppState v-if="isLoading" type="loading" message="후보 카드를 불러오는 중입니다." />
    <AppState v-else-if="errorMessage" type="error" :message="errorMessage" @retry="fetchCandidates" />
    <AppState v-else-if="candidateGroups.length === 0" message="아직 생성된 후보 카드가 없습니다. 여행방 생성 데이터를 확인해주세요." />

    <main v-else class="vote-content">
      <div class="intro">
        <p class="room-label">투표방(여행방) 이름</p>
        <h1>마음에 드는 장소를 골라주세요.</h1>
      </div>

      <div class="keyword-chips" aria-label="선택한 여행 카테고리">
        <span v-for="category in displayedCategories" :key="category" class="chip active">{{ category }}</span>
      </div>

      <p v-if="activeGroup" class="progress">{{ activeCardIndex + 1 }} / {{ activeGroup.items.length }}</p>

      <div v-if="activeCard" class="card-area">
        <div class="card-viewport" aria-live="polite">
          <div class="card-track" :style="cardTrackStyle">
            <article v-for="card in activeGroup.items" :key="card.candidateId" class="candidate-card">
              <img v-if="card.imageUrl" :src="card.imageUrl" :alt="card.title" class="card-image" />
              <img v-else src="/figma-assets/seoul-forest.png" alt="" class="card-image" aria-hidden="true" />

              <div class="card-body">
                <h2>{{ card.title }}</h2>
                <p v-if="card.overview" class="overview">{{ card.overview }}</p>
                <p v-if="card.hasWheelchairAccess || card.hasStrollerAccess" class="accessibility">
                  ♿ 유모차, 휠체어 가능
                </p>
                <p v-if="card.concentrationGrade" class="congestion">혼잡도 {{ card.concentrationGrade }}</p>
              </div>
            </article>
          </div>
        </div>
        <button
          class="nav-arrow left"
          type="button"
          aria-label="이전 카드"
          :disabled="activeCardIndex === 0"
          @click="showPrevCard"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <button
          class="nav-arrow right"
          type="button"
          aria-label="다음 카드"
          :disabled="!activeGroup || activeCardIndex === activeGroup.items.length - 1"
          @click="showNextCard"
        >
          <span aria-hidden="true">›</span>
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

      <button class="complete-button" type="button" :disabled="isSubmitting" @click="completeVoting">
        {{ isSubmitting ? '처리 중' : '투표완료' }}
      </button>
    </main>

    <BottomNav />
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 100vh;
  overflow: hidden;
}

.vote-content {
  padding-top: 46px;
}

.intro .room-label {
  color: var(--team-color-primary);
  font-size: 0.625rem;
  font-weight: 700;
  margin: 0 22px 2px;
}

.intro h1 {
  margin: 0 22px;
  font-size: 1rem;
  line-height: 1.35;
  font-weight: 800;
}

.keyword-chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin: 48px 22px 0;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.keyword-chips::-webkit-scrollbar {
  display: none;
}

.chip {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: var(--team-radius-pill);
  border: 1px solid var(--team-color-primary);
  background: var(--team-color-white);
  color: var(--team-color-primary);
  font-size: 0.5625rem;
  font-weight: 700;
}

.chip.active {
  background: var(--team-color-primary);
  border-color: var(--team-color-primary);
  color: var(--team-color-white);
}

.progress {
  margin-top: 30px;
  text-align: center;
  color: var(--team-color-danger);
  font-size: 0.6875rem;
  font-weight: 800;
}

.card-area {
  position: relative;
  height: 310px;
  margin-top: 24px;
}

.card-viewport {
  width: 100%;
  height: 310px;
  overflow: hidden;
}

.card-track {
  display: flex;
  gap: 36px;
  width: max-content;
  padding-left: calc((min(100vw, 390px) - 209px) / 2);
  transition: transform .42s cubic-bezier(.22,.72,.24,1);
  will-change: transform;
}

.nav-arrow {
  position: absolute;
  z-index: 2;
  top: 108px;
  width: 24px;
  height: 56px;
  border: none;
  background: transparent;
  color: #202124;
  font-size: 3.5rem;
  line-height: .6;
  font-weight: 300;
}

.nav-arrow.left { left: 42px; }
.nav-arrow.right { right: 42px; }

.nav-arrow:disabled {
  opacity: 0;
}

.candidate-card {
  position: relative;
  z-index: 1;
  flex: 0 0 209px;
  width: 209px;
  height: 309px;
  border: 0;
  border-radius: 15px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #fff;
  box-shadow: 0 8px 15px rgb(23 33 31 / 8%);
}

.card-image {
  width: 100%;
  height: 170px;
  object-fit: cover;
}

.card-body {
  padding: 11px 13px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.card-body h2 {
  font-size: 0.875rem;
  line-height: 1.25;
}

.overview {
  display: -webkit-box;
  overflow: hidden;
  color: #202124;
  font-size: 0.625rem;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.accessibility {
  margin-top: 11px;
  font-size: 0.5625rem;
  color: #202124;
}

.congestion {
  font-size: 0.5625rem;
  color: var(--team-color-primary);
  font-weight: 700;
}

.select-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  margin-top: 48px;
}

.heart-button {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: none;
  background: var(--team-color-danger);
  color: var(--team-color-white);
  font-size: 2rem;
  line-height: 1;
  opacity: .95;
}

.heart-button.selected {
  opacity: 1;
}

.select-count {
  color: var(--team-color-danger);
  font-weight: 800;
  font-size: 0.6875rem;
}

.complete-button {
  display: block;
  width: 70px;
  height: 30px;
  margin: 39px auto 50px;
  border: none;
  border-radius: 999px;
  background: var(--team-color-primary);
  color: #fff;
  font-size: 0.625rem;
  font-weight: 800;
}

.complete-button:disabled,
.heart-button:disabled {
  opacity: .55;
}

@media (max-width: 340px) {
  .nav-arrow.left { left: 30px; }
  .nav-arrow.right { right: 30px; }
}

@media (prefers-reduced-motion: reduce) {
  .card-track { transition: none; }
}
</style>
