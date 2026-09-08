<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import myAxios from '../../api/myAxios';
import BottomNav from '../../components/BottomNav.vue';
import AppButton from '../../components/common/AppButton.vue';
import AppHeader from '../../components/common/AppHeader.vue';
import AppState from '../../components/common/AppState.vue';
import StatusBadge from '../../components/common/StatusBadge.vue';
import SurfaceCard from '../../components/common/SurfaceCard.vue';
import { ROOM_STATUS, ROOM_STATUS_LABEL } from '../../constants/ui';

// memberId는 회원 도메인 JWT 인증이 붙기 전까지 쿼리 파라미터로 임시 수신한다.
const route = useRoute();
const router = useRouter();
const roomId = route.params.roomId;

const isLoading = ref(true);
const errorMessage = ref('');
const roomStatus = ref('');
const participants = ref([]);
const ranking = ref([]);
const isHost = ref(false);
const isClosing = ref(false);

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
    const tally = (await myAxios.get(`/vote-sessions/${roomId}/vote-status`)).data.data;
    roomStatus.value = tally.roomStatus;
    participants.value = tally.participants;
    isHost.value = Boolean(tally.isHost ?? tally.host);
    ranking.value = (tally.candidates ?? tally.items ?? [])
      .map((candidate) => ({
        ...candidate,
        candidateId: candidate.candidateId ?? candidate.place?.id,
        title: candidate.title ?? candidate.place?.name ?? '알 수 없는 장소',
        imageUrl: candidate.imageUrl ?? candidate.place?.imageUrl,
      }))
      .sort((a, b) => b.voteCount - a.voteCount);
  } catch {
    errorMessage.value = '투표 현황을 불러오지 못했습니다.';
  } finally {
    isLoading.value = false;
  }
};

const closeVoting = async () => {
  if (!window.confirm('미완료 참여자는 더 이상 투표할 수 없습니다. 투표를 종료할까요?')) return;
  isClosing.value = true;
  try {
    await myAxios.patch(`/vote-sessions/${roomId}/status`, {
      status: 'VOTING_CLOSED',
      reason: 'HOST_MANUAL_CLOSE',
    });
    await fetchStatus();
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? '투표를 종료하지 못했습니다.';
  } finally {
    isClosing.value = false;
  }
};

onMounted(fetchStatus);
</script>

<template>
  <div class="page">
    <AppHeader @back="router.back()" />

    <AppState v-if="isLoading" type="loading" message="투표 현황을 불러오는 중입니다." />
    <AppState v-else-if="errorMessage" type="error" :message="errorMessage" @retry="fetchStatus" />

    <template v-else>
      <h1>투표 현황</h1>

      <SurfaceCard>
        <div class="progress-head">
          <div>
            <p class="progress-label">진행률</p>
            <p class="progress-value">{{ completedCount }} / {{ participants.length }}명 완료</p>
          </div>
          <StatusBadge :tone="roomStatus === ROOM_STATUS.VOTING ? 'primary' : 'neutral'">
            {{ ROOM_STATUS_LABEL[roomStatus] ?? '상태 확인 필요' }}
          </StatusBadge>
        </div>
        <div class="progress-bar">
          <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </SurfaceCard>

      <SurfaceCard class="ranking-card">
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
      </SurfaceCard>

      <SurfaceCard class="participant-card">
        <h2>참여자</h2>
        <ul class="participant-list">
          <li v-for="participant in participants" :key="participant.memberId" class="participant-item">
            <div class="participant-avatar" aria-hidden="true"></div>
            <div class="participant-body">
              <p class="participant-name">{{ participantLabel(participant.memberId) }}</p>
            </div>
            <StatusBadge :tone="participant.completed ? 'success' : 'neutral'" small>
              {{ participant.completed ? '완료' : '투표중' }}
            </StatusBadge>
          </li>
        </ul>
      </SurfaceCard>
      <AppButton
        v-if="isHost && roomStatus === ROOM_STATUS.VOTING"
        class="close-button"
        :loading="isClosing"
        @click="closeVoting"
      >투표 종료하기</AppButton>
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

h1 {
  font-size: 1.25rem;
}

.close-button {
  margin: 12px auto 24px;
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
