<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import myAxios from '../../api/myAxios';
import BottomNav from '../../components/BottomNav.vue';
import AppState from '../../components/common/AppState.vue';
import { useAuthStore } from '../../store/auth/useAuthStore';

// memberId는 회원 도메인 JWT 인증이 붙기 전까지 쿼리 파라미터로 임시 수신한다.
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const roomId = route.params.roomId;

const isLoading = ref(true);
const errorMessage = ref('');
const roomStatus = ref('');
const participants = ref([]);
const ranking = ref([]);

const completedCount = computed(() => participants.value.filter((p) => p.completed).length);
const maxVoteCount = computed(() => Math.max(1, ...ranking.value.map((r) => r.voteCount)));
const selectedRanking = computed(() => ranking.value.filter((item) => item.voteCount > 0));
const isHost = computed(() => readHostMemberId() === authStore.user?.id);
const progressPercent = computed(() =>
  participants.value.length === 0 ? 0 : Math.round((completedCount.value / participants.value.length) * 100),
);

// 회원 도메인이 아직 없어 참여자 닉네임을 못 받아온다 - memberId로 임시 표시한다.
const participantLabel = (memberId) => `참여자 ${memberId}`;

const readHostMemberId = () => {
  try {
    const room = JSON.parse(localStorage.getItem(`activeTravelRoom:${authStore.user?.id}`) ?? 'null');
    return room?.hostMemberId ?? null;
  } catch { return null; }
};

const fetchStatus = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    if (!authStore.user?.id) throw new Error('로그인 정보를 확인하지 못했습니다.');
    const tally = (await myAxios.get(`/rooms/${roomId}/votes/tally`, { params: { memberId: authStore.user.id } })).data.data;
    roomStatus.value = tally.roomStatus;
    participants.value = tally.participants;
    ranking.value = (tally.candidates ?? tally.items ?? [])
      .map((candidate) => ({
        ...candidate,
        candidateId: candidate.candidateId ?? candidate.place?.id,
        title: candidate.title ?? candidate.place?.name ?? '알 수 없는 장소',
        imageUrl: candidate.imageUrl ?? candidate.place?.imageUrl,
      }))
      .sort((a, b) => b.voteCount - a.voteCount);
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? error.message ?? '투표 현황을 불러오지 못했습니다.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchStatus);
</script>

<template>
  <div class="page">
    <AppState v-if="isLoading" type="loading" message="투표 현황을 불러오는 중입니다." />
    <AppState v-else-if="errorMessage" type="error" :message="errorMessage" @retry="fetchStatus" />
    <main v-else class="status-content">
      <button class="back" type="button" @click="router.back()">👈🏻 뒤로가기</button>
      <h1>투표 현황</h1>
      <section class="status-card">
        <div class="progress-head">
          <div>
            <p class="progress-label">진행률</p>
            <p class="progress-value">{{ completedCount }} / {{ participants.length }}명 완료</p>
          </div>
          <span class="status-pill">{{ roomStatus === 'VOTING' ? '투표 진행 중' : '투표 종료' }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </section>
      <section class="status-card ranking-card">
        <h2>실시간 순위</h2>
        <ol v-if="selectedRanking.length" class="ranking-list">
          <li v-for="(item, index) in selectedRanking" :key="item.candidateId" class="ranking-item">
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
        <p v-else class="empty-ranking">선택된 후보 카드가 없습니다.</p>
      </section>
      <section class="status-card participant-card">
        <h2>참여자</h2>
        <ul class="participant-list">
          <li v-for="participant in participants" :key="participant.memberId" class="participant-item">
            <div class="participant-avatar" aria-hidden="true"></div>
            <div class="participant-body">
              <p class="participant-name">{{ participantLabel(participant.memberId) }}</p>
              <small>참여 00:00</small>
            </div>
            <span class="participant-status" :class="{ completed: participant.completed }">{{ participant.completed ? '완료' : '투표 중' }}</span>
          </li>
        </ul>
      </section>
      <button v-if="isHost && roomStatus === 'VOTING'" class="close-button" type="button">투표 종료하기</button>
      <div v-if="roomStatus === 'VOTING'" class="action-buttons"><button type="button" @click="router.push({ name: 'vote-show', params: { roomId } })">재투표</button><button type="button" @click="router.push({ name: 'home-show' })">확인</button></div>
      <button v-else class="confirm-button" type="button" @click="router.push({ name: 'course-show', params: { roomId } })">확인</button>
    </main>

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

.ranking-list{gap:22px;padding:10px 7px;background:transparent}.ranking-item{gap:12px}.rank-thumb{width:60px;height:60px;border-radius:12px}.rank-body{gap:6px}.rank-title{font-size:14px}.rank-bar{height:7px}.rank-count{font-size:12px}

.page{min-height:100vh;padding:0}.status-content{padding:16px 20px 110px}.back{padding:0;margin:0;border:0;background:none;color:#c7c7c7;font-size:12px;font-weight:700}.status-content h1{margin:47px 0 12px;font-size:20px}.status-card{margin-top:20px;padding:20px 19px;border:1px solid #bdebed;border-radius:15px;background:#fff}.progress-value{font-size:24px;color:#00bfc4}.progress-value::first-letter{font-weight:800}.status-pill{padding:5px 12px;border-radius:999px;background:#20b878;color:#fff;font-size:9px;font-weight:700}.progress-bar{height:7px}.ranking-card h2,.participant-card h2{font-size:15px}.ranking-list{gap:9px;padding:10px 7px;background:#fdfbf7}.ranking-item{gap:7px}.rank-number{display:grid;place-items:center;width:18px;height:18px;border-radius:50%;background:#080808;color:#fff;font-size:9px}.rank-thumb{width:30px;height:30px;border-radius:6px}.rank-body{gap:2px}.rank-title{font-size:10px;font-weight:700}.rank-bar{height:4px;background:#eee5dd}.rank-count{font-size:9px;color:#111}.empty-ranking{padding:28px 0;color:#89928f;font-size:12px;text-align:center}.participant-list{gap:17px}.participant-avatar{width:40px;height:40px;background:#ddd}.participant-name{font-size:12px}.participant-body small{font-size:8px}.participant-status{padding:3px 10px;border:1px solid #bcbcbc;border-radius:999px;color:#999;font-size:9px}.participant-status.completed{border-color:#00bfc4;color:#00bfc4}.complete-button,.close-button{display:block;width:100px;height:32px;margin:28px auto 0;border:0;border-radius:999px;background:#00bfc4;color:#fff;font-size:11px;font-weight:800}.close-button{margin-top:16px}.page :deep(.bottom-nav){position:fixed;width:min(100%,390px);margin:auto}
.ranking-list{gap:22px;background:transparent}.ranking-item{gap:12px}.rank-thumb{width:60px;height:60px;border-radius:12px}.rank-body{gap:6px}.rank-title{font-size:14px}.rank-bar{height:7px}.rank-count{font-size:12px}.confirm-button{display:block;width:100px;height:32px;margin:28px auto 0;border:0;border-radius:999px;background:#00bfc4;color:#fff;font-size:11px;font-weight:800}.action-buttons{display:flex;justify-content:center;gap:12px;margin:28px auto 0}.action-buttons button{width:90px;height:32px;border:1px solid #00bfc4;border-radius:999px;background:#fff;color:#00bfc4;font-size:11px;font-weight:800}.action-buttons button:last-child{background:#00bfc4;color:#fff}
</style>
