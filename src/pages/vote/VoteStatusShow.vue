<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import myAxios from '../../api/myAxios';
import BottomNav from '../../components/BottomNav.vue';
import AppState from '../../components/common/AppState.vue';
import { useAuthStore } from '../../store/auth/useAuthStore';
import { useActiveRoom } from '../../composables/useActiveRoom';

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
// 방장 판정은 서버가 준 hostMemberId로 한다. 로컬 기록에 기대면 방을 만든 기기에서만 맞다.
const { activeRoom, fetchActiveRoom } = useActiveRoom();
const isHost = computed(() => {
  const hostMemberId = activeRoom.value?.roomId === Number(roomId)
    ? activeRoom.value.hostMemberId
    : readHostMemberId();
  return hostMemberId != null && hostMemberId === authStore.user?.id;
});
const progressPercent = computed(() =>
  participants.value.length === 0 ? 0 : Math.round((completedCount.value / participants.value.length) * 100),
);

// 닉네임이 비어 있는 계정이 있을 수 있어 그때만 번호로 떨어진다.
const participantLabel = (participant) => participant.nickname || `참여자 ${participant.memberId}`;

const formatTime = (value) => {
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(at.getHours())}:${pad(at.getMinutes())}`;
};

const readHostMemberId = () => {
  try {
    const room = JSON.parse(localStorage.getItem(`activeTravelRoom:${authStore.user?.id}`) ?? 'null');
    return room?.hostMemberId ?? null;
  } catch { return null; }
};

const isClosing = ref(false);
const isStartingRevote = ref(false);

// 방장은 관광지 투표와 추가 투표 두 라운드 모두 강제로 끝낼 수 있다(서버도 두 상태를 받는다).
const OPEN_STATUSES = ['VOTING', 'EXTRA_VOTING'];
const STATUS_LABELS = { VOTING: '투표 진행 중', EXTRA_VOTING: '추가 투표 진행 중' };
const isRoundOpen = computed(() => OPEN_STATUSES.includes(roomStatus.value));
const canRevote = computed(() => ['VOTING', 'CLOSED'].includes(roomStatus.value));

// 추가 투표는 방장만 진행한다. 방장이 완료한 뒤에는 현황에서 수동으로 라운드를 종료한다.
const goToExtraVoteIfOpen = () => {
  const me = participants.value.find((participant) => participant.memberId === authStore.user?.id);
  if (roomStatus.value === 'EXTRA_VOTING' && isHost.value && !me?.extraCompleted) {
    router.replace({ name: 'additional-vote-show', params: { roomId } });
    return true;
  }
  return false;
};

// CLOSED 방은 서버에서 다시 VOTING으로 열고, VOTING 방은 내 완료 표시만 되돌린다.
// 재투표 버튼을 눌렀을 때는 항상 관광지 투표부터 시작한다.
const startRevote = async () => {
  if (isStartingRevote.value) return;
  isStartingRevote.value = true;
  errorMessage.value = '';
  try {
    // 아직 1차 투표가 열려 있으면 서버 상태를 바꿀 필요 없이 바로 다시 고르면 된다.
    // CLOSED인 경우에만 초안/추가 투표를 초기화하는 재투표 API를 호출한다.
    if (roomStatus.value === 'CLOSED') {
      await myAxios.patch(`/rooms/${roomId}/revote`, null);
    }
    router.replace({ name: 'vote-show', params: { roomId } });
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? '재투표를 시작하지 못했습니다.';
  } finally {
    isStartingRevote.value = false;
  }
};

const closeVoting = async () => {
  if (isClosing.value) return;
  isClosing.value = true;
  try {
    await myAxios.patch(`/rooms/${roomId}/close`, null);
    // 상태와 참여자 정보를 한꺼번에 다시 읽는다. fetchStatus가 다음 단계로 보낼지 판단한다.
    await fetchStatus();
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? '투표를 종료하지 못했습니다.';
  } finally {
    isClosing.value = false;
  }
};

const fetchStatus = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    if (!authStore.user?.id) throw new Error('로그인 정보를 확인하지 못했습니다.');
    await fetchActiveRoom({ force: true });
    const tally = (await myAxios.get(`/rooms/${roomId}/votes/tally`)).data.data;
    roomStatus.value = tally.roomStatus;
    participants.value = tally.participants;
    if (goToExtraVoteIfOpen()) return;
    // 라운드가 끝났다고 코스로 넘겨버리면 최종 결과를 볼 수 없다.
    // 여기는 현황 화면이므로 끝난 뒤에도 순위를 그대로 보여주고, 코스로는 버튼으로 넘어간다.
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
          <span class="status-pill">{{ STATUS_LABELS[roomStatus] ?? '투표 종료' }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </section>
      <section class="status-card ranking-card">
        <h2>{{ isRoundOpen ? '실시간 순위' : '최종 결과' }}</h2>
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
              <p class="participant-name">{{ participantLabel(participant) }}</p>
              <small v-if="participant.completedAt">투표 완료 {{ formatTime(participant.completedAt) }}</small>
              <small v-else>아직 고르는 중</small>
            </div>
            <span class="participant-status" :class="{ completed: participant.completed }">{{ participant.completed ? '완료' : '투표 중' }}</span>
          </li>
        </ul>
      </section>
      <button v-if="isHost && isRoundOpen" class="close-button" type="button" :disabled="isClosing" @click="closeVoting">{{ isClosing ? '종료 중' : '투표 종료하기' }}</button>
      <div v-if="canRevote" class="action-buttons"><button type="button" :disabled="isStartingRevote" @click="startRevote">{{ isStartingRevote ? '준비 중' : '재투표' }}</button><button type="button" @click="router.push({ name: 'home-show' })">확인</button></div>
      <button v-else class="confirm-button" type="button" @click="router.push({ name: 'course-show', params: { roomId } })">코스 보러 가기</button>
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

.page{min-height:100vh;padding:0}.status-content{padding:16px 20px 110px}.back{padding:0;margin:0;border:0;background:none;color:#c7c7c7;font-size:12px;font-weight:700}.status-content h1{margin:47px 0 12px;font-size:20px}.status-card{margin-top:20px;padding:20px 19px;border:1px solid #bdebed;border-radius:15px;background:#fff}.progress-value{font-size:24px;color:#00bfc4}.progress-value::first-letter{font-weight:800}.status-pill{padding:5px 12px;border-radius:999px;background:#20b878;color:#fff;font-size:9px;font-weight:700}.progress-bar{height:7px}.ranking-card h2,.participant-card h2{font-size:15px}.ranking-list{gap:9px;padding:10px 7px;background:#fdfbf7}.ranking-item{gap:7px}.rank-number{display:grid;place-items:center;width:18px;height:18px;border-radius:50%;background:#080808;color:#fff;font-size:9px}.rank-thumb{width:30px;height:30px;border-radius:6px}.rank-body{gap:2px}.rank-title{font-size:10px;font-weight:700}.rank-bar{height:4px;background:#eee5dd}.rank-count{font-size:9px;color:#111}.empty-ranking{padding:28px 0;color:#89928f;font-size:12px;text-align:center}.extra-heading{margin-top:18px;padding-top:14px;border-top:1px dashed #e7ded6;font-size:13px}.extra-role{display:inline-block;margin-right:5px;padding:1px 6px;border-radius:999px;background:#e6f7f7;color:#0c8f93;font-size:9px;vertical-align:middle}.participant-list{gap:17px}.participant-avatar{width:40px;height:40px;background:#ddd}.participant-name{font-size:12px}.participant-body small{font-size:8px}.participant-status{padding:3px 10px;border:1px solid #bcbcbc;border-radius:999px;color:#999;font-size:9px}.participant-status.completed{border-color:#00bfc4;color:#00bfc4}.complete-button,.close-button{display:block;width:100px;height:32px;margin:28px auto 0;border:0;border-radius:999px;background:#00bfc4;color:#fff;font-size:11px;font-weight:800}.close-button{margin-top:16px}.page :deep(.bottom-nav){position:fixed;width:min(100%,390px);margin:auto}
.ranking-list{gap:22px;background:transparent}.ranking-item{gap:12px}.rank-thumb{width:60px;height:60px;border-radius:12px}.rank-body{gap:6px}.rank-title{font-size:14px}.rank-bar{height:7px}.rank-count{font-size:12px}.confirm-button{display:block;width:100px;height:32px;margin:28px auto 0;border:0;border-radius:999px;background:#00bfc4;color:#fff;font-size:11px;font-weight:800}.action-buttons{display:flex;justify-content:center;gap:12px;margin:28px auto 0}.action-buttons button{width:90px;height:32px;border:1px solid #00bfc4;border-radius:999px;background:#fff;color:#00bfc4;font-size:11px;font-weight:800}.action-buttons button:last-child{background:#00bfc4;color:#fff}
</style>
