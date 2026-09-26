<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import myAxios from '../../api/myAxios';
import AppButton from '../../components/common/AppButton.vue';
import AppHeader from '../../components/common/AppHeader.vue';
import AppState from '../../components/common/AppState.vue';
import BottomNav from '../../components/BottomNav.vue';
import { formatDate } from '../../util/date';

const route = useRoute();
const router = useRouter();
const course = ref(null);
const isLoading = ref(true);
const errorMessage = ref('');

const roomName = computed(() => String(route.query.roomName || '투표방(여행방) 이름'));
const participantText = computed(() => {
  const count = Number(route.query.participantCount);
  return Number.isFinite(count) && count > 0 ? `참여자 ${count}명` : '참여자 정보 없음';
});

const fetchDetail = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    course.value = (await myAxios.get(`/courses/${route.params.courseId}`)).data.data;
  } catch {
    errorMessage.value = '여행 기록 상세를 불러오지 못했습니다.';
  } finally {
    isLoading.value = false;
  }
};

const remakeRoom = () => {
  router.push({ name: 'room-create', query: { sourceCourseId: course.value.id } });
};

onMounted(fetchDetail);
</script>
<template>
  <main class="detail-page">
    <AppHeader back-label="👈🏻 뒤로가기" @back="router.back()" />

    <AppState v-if="isLoading" type="loading" message="여행 기록을 불러오는 중입니다." />
    <AppState v-else-if="errorMessage" type="error" :message="errorMessage" @retry="fetchDetail" />

    <template v-else>
      <header class="record-heading">
        <h1>{{ roomName }}</h1>
        <p>{{ formatDate(course.travelDate) }} | {{ participantText }}</p>
      </header>

      <section class="course-section" aria-labelledby="course-title">
        <h2 id="course-title">여행 코스</h2>
        <ol class="course-list">
          <li v-for="(stop, index) in course.stops" :key="stop.id">
            <span>{{ stop.visitOrder ?? index + 1 }}</span>
            <strong>{{ stop.spotTitleSnapshot ?? '제공 정보 없음' }}</strong>
          </li>
        </ol>
      </section>

      <AppButton class="remake" size="small" @click="remakeRoom">같은 조건으로 방 만들기</AppButton>
    </template>

    <BottomNav />
  </main>
</template>

<style scoped>
.detail-page { min-height: 100vh; padding: 16px 20px 80px; display: flex; flex-direction: column; }
.detail-page :deep(.app-header) { min-height: 12px; height: 12px; align-items: start; }
.detail-page :deep(.has-back-label .back-button) { font-size: 9px; }
.record-heading { margin: 39px 4px 30px; }
.record-heading h1 { color: #111; font-size: 18px; font-weight: 800; line-height: 1.25; }
.record-heading p { margin-top: 8px; color: #111; font-size: 11px; line-height: 1.25; }
.course-section h2 { margin: 0 4px 12px; color: #111; font-size: 14px; font-weight: 800; }
.course-list { display: grid; gap: 11px; margin: 0; padding: 0; list-style: none; }
.course-list li { min-height: 55px; padding: 10px 18px; border: 1px solid #bdebed; border-radius: 15px; background: #fff; display: flex; align-items: center; gap: 20px; }
.course-list span { width: 25px; height: 25px; border-radius: 50%; display: grid; flex: 0 0 auto; place-items: center; background: #00bfc4; color: #fff; font-size: 11px; font-weight: 800; }
.course-list strong { color: #111; font-size: 14px; font-weight: 700; }
.remake { width: 170px; min-width: 170px; height: 29px; margin: 59px auto auto; padding: 0; border-radius: 999px; font-size: 10px; }
</style>
