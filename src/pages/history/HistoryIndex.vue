<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import myAxios from '../../api/myAxios';
import AppState from '../../components/common/AppState.vue';
import BottomNav from '../../components/BottomNav.vue';
import { useAuthStore } from '../../store/auth/useAuthStore';
import { formatDate } from '../../util/date';

const router = useRouter();
const authStore = useAuthStore();
const items = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');
const closedStatuses = new Set(['CLOSED', 'VOTING_CLOSED', 'COURSE_CONFIRMED', 'CONFIRMED', 'COMPLETED', 'FINISHED']);

const isPastTravel = (travelDate) => {
  if (!travelDate) return false;
  const today = new Date();
  const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return travelDate < todayValue;
};

const fetchHistory = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    if (!authStore.user?.id) throw new Error('로그인 정보를 확인하지 못했습니다.');
    // 과거 여행만 기록으로 남긴다. 오늘과 미래의 확정 코스는 코스 탭에서 본다.
    const { data } = await myAxios.get('/courses', {
      params: { page: 1, size: 20 },
    });
    const records = Array.isArray(data.data?.items)
      ? data.data.items
      : Array.isArray(data.data)
        ? data.data
        : [];
    items.value = records.filter((item) => {
      const status = item.status ?? item.roomStatus ?? item.sessionStatus;
      return (!status || closedStatuses.has(status)) && isPastTravel(item.travelDate);
    });
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? error.message ?? '여행 기록을 불러오지 못했습니다.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchHistory);

const openHistory = (item) => {
  router.push({
    name: 'history-show',
    params: { courseId: item.courseId ?? item.id },
    query: {
      roomName: item.roomName ?? item.sessionName ?? item.title ?? '',
      participantCount: item.participantCount ?? '',
    },
  });
};
</script>

<template>
  <main class="history-page">
    <h1>여행 기록</h1>

    <AppState v-if="isLoading" type="loading" message="여행 기록을 불러오는 중입니다." />
    <AppState v-else-if="errorMessage" type="error" :message="errorMessage" @retry="fetchHistory" />
    <p v-else-if="!items.length" class="empty-history">지난 여행 기록이 없습니다.</p>

    <ul v-else class="history-list">
      <li v-for="item in items" :key="item.courseId ?? item.id">
        <button type="button" @click="openHistory(item)">
          <time>{{ formatDate(item.travelDate) }}</time>
          <strong>{{ item.roomName ?? item.sessionName ?? item.title ?? '투표방(여행방) 이름' }}</strong>
          <span>관광지 {{ item.placeCount ?? item.stopCount ?? item.stops?.length ?? 0 }}곳 | 참여자 {{ item.participantCount ?? 0 }}명</span>
        </button>
      </li>
    </ul>

    <BottomNav />
  </main>
</template>

<style scoped>
.history-page {
  min-height: 100vh;
  padding: 0 20px 92px;
  display: flex;
  flex-direction: column;
}

h1 {
  margin: 31px 8px 38px;
  font-size: 18px;
  line-height: 1.25;
}

.history-list {
  display: grid;
  gap: 16px;
  list-style: none;
}

.history-list button {
  width: 100%;
  min-height: 110px;
  padding: 20px 19px;
  border: 1px solid #bdebed;
  border-radius: 16px;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.history-list time {
  margin-bottom: 3px;
  color: #17211f;
  font-size: 11px;
  line-height: 1.25;
}

.history-list strong {
  color: #00bfc4;
  font-size: 18px;
  line-height: 1.3;
}

.history-list span {
  margin-top: 1px;
  color: #17211f;
  font-size: 13px;
  line-height: 1.4;
}

.empty-history {
  margin: 80px 0 auto;
  color: #89928f;
  font-size: 14px;
  text-align: center;
}

.history-page :deep(.bottom-nav) {
  position: fixed;
  left: 50%;
  bottom: 0;
  width: min(100%, 390px);
  margin: 0;
  transform: translateX(-50%);
}
</style>
