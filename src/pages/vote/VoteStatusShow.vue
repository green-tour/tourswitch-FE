<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import myAxios from '../../api/myAxios';
import BottomNav from '../../components/BottomNav.vue';

// memberId는 회원 도메인 JWT 인증이 붙기 전까지 쿼리 파라미터로 임시 수신한다.
const route = useRoute();
const router = useRouter();
const roomId = route.params.roomId;
const memberId = route.query.memberId;

const isLoading = ref(true);
const errorMessage = ref('');
const roomStatus = ref('');
const participants = ref([]);
const ranking = ref([]);

const completedCount = computed(() => participants.value.filter((p) => p.completed).length);
const maxVoteCount = computed(() => Math.max(1, ...ranking.value.map((r) => r.voteCount)));
const progressPercent = computed(() =>
  participants.value.length === 0 ? 0 : Math.round((completedCount.value / participants.value.length) * 100),
);

// 회원 도메인이 아직 없어 참여자 닉네임을 못 받아온다 - memberId로 임시 표시한다.
const participantLabel = (memberId) => `참여자 ${memberId}`;

const fetchStatus = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const [tallyRes, candidatesRes] = await Promise.all([
      myAxios.get(`/rooms/${roomId}/votes/tally`, { params: { memberId } }),
      myAxios.get(`/rooms/${roomId}/candidates`, { params: { memberId } }),
    ]);

    const tally = tallyRes.data.data;
    roomStatus.value = tally.roomStatus;
    participants.value = tally.participants;

    const titleByCandidateId = new Map();
    for (const group of candidatesRes.data.data.candidateGroups) {
      for (const item of group.items) {
        titleByCandidateId.set(item.candidateId, { title: item.title, imageUrl: item.imageUrl });
      }
    }

    ranking.value = tally.candidates
      .map((candidate) => ({
        ...candidate,
        ...(titleByCandidateId.get(candidate.candidateId) ?? { title: '알 수 없는 장소', imageUrl: null }),
      }))
      .sort((a, b) => b.voteCount - a.voteCount);
  } catch {
    errorMessage.value = '투표 현황을 불러오지 못했습니다.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchStatus);
</script>

<template>
  <div class="page">
    <header class="page-header">
      <button class="back-button" type="button" aria-label="뒤로가기" @click="router.back()">‹</button>
    </header>

    <div v-if="isLoading" class="state-message">불러오는 중...</div>
    <div v-else-if="errorMessage" class="state-message error">{{ errorMessage }}</div>

    <template v-else>
      <h1>투표 현황</h1>

      <section class="progress-card">
        <div class="progress-head">
          <div>
            <p class="progress-label">진행률</p>
            <p class="progress-value">{{ completedCount }} / {{ participants.length }}명 완료</p>
          </div>
          <span class="status-badge" :class="{ closed: roomStatus !== 'VOTING' }">
            {{ roomStatus === 'VOTING' ? '투표 진행 중' : '투표 종료' }}
          </span>
        </div>
        <div class="progress-bar">
          <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </section>

      <section class="ranking-card">
        <h2>실시간 순위</h2>
        <ol class="ranking-list">
          <li v-for="(item, index) in ranking" :key="item.candidateId" class="ranking-item">
            <span class="rank-number">{{ index + 1 }}</span>
            <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.title" class="rank-thumb" />
            <div v-else class="rank-thumb placeholder" aria-hidden="true"></div>
            <div class="rank-body">
              <p class="rank-title">{{ item.title }}</p>
              <div class="rank-bar">
                <div class="rank-bar-fill" :style="{ width: (item.voteCount / maxVoteCount) * 100 + '%' }"></div>
              </div>
            </div>
            <span class="rank-count">{{ item.voteCount }}표</span>
          </li>
        </ol>
      </section>

      <section class="participant-card">
        <h2>참여자</h2>
        <ul class="participant-list">
          <li v-for="participant in participants" :key="participant.memberId" class="participant-item">
            <div class="participant-avatar" aria-hidden="true"></div>
            <div class="participant-body">
              <p class="participant-name">{{ participantLabel(participant.memberId) }}</p>
            </div>
            <span class="status-badge small" :class="{ closed: !participant.completed }">
              {{ participant.completed ? '완료' : '투표중' }}
            </span>
          </li>
        </ul>
      </section>
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
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
}

.back-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
}

.state-message {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--team-color-gray-600);
}

.state-message.error {
  color: var(--team-color-danger);
}

h1 {
  font-size: 1.25rem;
}

.progress-card,
.ranking-card,
.participant-card {
  border: 1px solid var(--team-color-gray-200);
  border-radius: var(--team-radius-card);
  padding: 16px;
}

.progress-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.progress-label {
  font-size: 0.8125rem;
  color: var(--team-color-gray-600);
}

.progress-value {
  font-size: 1.375rem;
  font-weight: 700;
}

.status-badge {
  background: var(--team-color-primary);
  color: var(--team-color-white);
  border-radius: var(--team-radius-pill);
  padding: var(--team-badge-padding);
  font-size: var(--team-badge-font-size);
  font-weight: 700;
  white-space: nowrap;
}

.status-badge.closed {
  background: var(--team-color-gray-200);
  color: var(--team-color-gray-600);
}

.status-badge.small {
  font-size: 0.6875rem;
  padding: 3px 10px;
}

.progress-bar {
  height: 8px;
  border-radius: var(--team-radius-pill);
  background: var(--team-color-gray-200);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--team-color-primary);
}

.ranking-card h2,
.participant-card h2 {
  font-size: 1rem;
  margin-bottom: 12px;
}

.ranking-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rank-number {
  width: 20px;
  flex-shrink: 0;
  font-weight: 700;
  color: var(--team-color-gray-600);
  text-align: center;
}

.rank-thumb {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.rank-thumb.placeholder {
  background: var(--team-color-gray-200);
}

.rank-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rank-title {
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-bar {
  height: 5px;
  border-radius: var(--team-radius-pill);
  background: var(--team-color-gray-200);
  overflow: hidden;
}

.rank-bar-fill {
  height: 100%;
  background: var(--team-color-primary);
}

.rank-count {
  flex-shrink: 0;
  font-size: 0.8125rem;
  color: var(--team-color-gray-600);
}

.participant-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.participant-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--team-color-gray-200);
  flex-shrink: 0;
}

.participant-body {
  flex: 1;
}

.participant-name {
  font-size: 0.875rem;
  font-weight: 600;
}
</style>
