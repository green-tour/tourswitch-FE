<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import myAxios from '../../api/myAxios';
import AppButton from '../../components/common/AppButton.vue';
import AppHeader from '../../components/common/AppHeader.vue';
import AppState from '../../components/common/AppState.vue';
import BottomNav from '../../components/BottomNav.vue';
import { useAuthStore } from '../../store/auth/useAuthStore';

// memberId는 회원 도메인 JWT 인증이 붙기 전까지 쿼리 파라미터로 임시 수신한다(다른 화면과 동일).
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const roomId = route.params.roomId;

const course = ref(null);
const isLoading = ref(true);
const errorMessage = ref('');
const isConfirming = ref(false);

const roomName = computed(() => readActiveRoom()?.roomName ?? '투표방(여행방)');
const isHost = computed(() => readActiveRoom()?.hostMemberId === authStore.user?.id);
const isConfirmed = computed(() => course.value?.status === 'CONFIRMED');

const readActiveRoom = () => {
  try {
    return JSON.parse(localStorage.getItem(`activeTravelRoom:${authStore.user?.id}`) ?? 'null');
  } catch { return null; }
};

const fetchCourse = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    if (!authStore.user?.id) throw new Error('로그인 정보를 확인하지 못했습니다.');
    const { data } = await myAxios.get(`/rooms/${roomId}/course`, { params: { memberId: authStore.user.id } });
    course.value = data.data;
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? error.message ?? '코스 정보를 불러오지 못했습니다.';
  } finally {
    isLoading.value = false;
  }
};

const confirmCourse = async () => {
  if (!course.value) return;
  isConfirming.value = true;
  try {
    const { data } = await myAxios.patch(`/courses/${course.value.id}/status`, null, {
      params: { memberId: authStore.user.id },
    });
    course.value = data.data;
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? '코스 확정에 실패했습니다.';
  } finally {
    isConfirming.value = false;
  }
};

onMounted(fetchCourse);
</script>

<template>
  <main class="course-page">
    <AppHeader :title="roomName" @back="router.push({ name: 'home-show' })" />
    <AppState v-if="isLoading" type="loading" message="코스 정보를 불러오는 중입니다." />
    <AppState v-else-if="errorMessage" type="error" :message="errorMessage" @retry="fetchCourse" />
    <template v-else>
      <p class="status-line">{{ isConfirmed ? '확정된 코스예요' : '아직 확정 전인 코스예요' }}</p>
      <ol class="stop-list">
        <li v-for="stop in course.stops" :key="stop.id">
          <span class="order">{{ stop.visitOrder }}</span>
          <strong>{{ stop.spotTitleSnapshot ?? '제공 정보 없음' }}</strong>
        </li>
      </ol>
      <AppButton
        v-if="isHost && !isConfirmed"
        block
        :loading="isConfirming"
        @click="confirmCourse"
      >코스 확정하기</AppButton>
      <p v-else-if="!isHost && !isConfirmed" class="host-hint">방장이 코스를 확정하면 알려드릴게요.</p>
    </template>
    <BottomNav />
  </main>
</template>

<style scoped>
.course-page{min-height:100vh;padding:12px 20px 92px;display:flex;flex-direction:column}
.status-line{margin:8px 4px 20px;color:var(--team-color-gray-600);font-size:13px}
.stop-list{list-style:none;display:grid;gap:10px;margin-bottom:24px}
.stop-list li{min-height:54px;padding:10px 18px;border:1px solid #a9e7e8;border-radius:16px;display:flex;align-items:center;gap:22px}
.stop-list .order{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:var(--team-color-primary);color:#fff;font-size:12px}
.stop-list strong{font-size:14px}
.host-hint{margin:auto auto 24px;color:var(--team-color-gray-600);font-size:13px;text-align:center}
.course-page :deep(.bottom-nav){position:fixed;width:min(100%,390px);margin:auto}
</style>
