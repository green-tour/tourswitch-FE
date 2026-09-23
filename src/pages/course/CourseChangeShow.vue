<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import myAxios from '../../api/myAxios';
import BottomNav from '../../components/BottomNav.vue';
import RegionFilter from '../../components/course/RegionFilter.vue';
import ReplacementCandidateCard from '../../components/course/ReplacementCandidateCard.vue';

const route = useRoute();
const router = useRouter();
const courseId = route.params.courseId;
const courseSpotId = route.params.courseSpotId;
const roomId = route.query.roomId;

const step = ref('region');
const regions = ref([]);
const dongs = ref([]);
const regionId = ref('');
const dongId = ref('');
const candidates = ref([]);
const selectedCandidate = ref(null);
const replacedCandidate = ref(null);
const changedCourse = ref(null);
const radiusMeters = ref(3000);
const isLoading = ref(false);
const isLoadingDongs = ref(false);
const errorMessage = ref('');

const originalTitle = computed(() => route.query.originalTitle || '기존 관광지');
const canSearch = computed(() => Boolean(regionId.value && dongId.value) && !isLoading.value);

const fetchRegions = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await myAxios.get('/regions');
    regions.value = response.data.data;
  } catch {
    errorMessage.value = '지역 목록을 불러오지 못했습니다.';
  } finally {
    isLoading.value = false;
  }
};

watch(regionId, async (value) => {
  dongId.value = '';
  dongs.value = [];
  if (!value) return;
  isLoadingDongs.value = true;
  errorMessage.value = '';
  try {
    const response = await myAxios.get(`/regions/${value}/administrative-dongs`);
    dongs.value = response.data.data;
  } catch {
    errorMessage.value = '동 목록을 불러오지 못했습니다.';
  } finally {
    isLoadingDongs.value = false;
  }
});

const fetchCandidates = async () => {
  if (!canSearch.value) return;
  isLoading.value = true;
  errorMessage.value = '';
  selectedCandidate.value = null;
  try {
    const response = await myAxios.get(`/courses/${courseId}/replacement-candidates`, {
      params: { administrativeDongId: dongId.value },
    });
    radiusMeters.value = response.data.data.radiusMeters;
    candidates.value = response.data.data.candidates;
    step.value = 'candidate';
  } catch (error) {
    errorMessage.value = error.response?.data?.message || '대체 후보를 불러오지 못했습니다.';
  } finally {
    isLoading.value = false;
  }
};

const replaceSpot = async () => {
  if (!selectedCandidate.value || isLoading.value) return;
  isLoading.value = true;
  errorMessage.value = '';
  try {
    await myAxios.patch(
      `/courses/${courseId}/spots/${courseSpotId}/replacement`,
      {
        administrativeDongId: Number(dongId.value),
        replacementContentId: selectedCandidate.value.contentId,
      },
    );
    replacedCandidate.value = selectedCandidate.value;
    if (roomId) {
      const response = await myAxios.get(`/rooms/${roomId}/course`);
      changedCourse.value = response.data.data;
    }
    step.value = 'complete';
  } catch (error) {
    errorMessage.value = error.response?.data?.message || '장소를 교체하지 못했습니다.';
  } finally {
    isLoading.value = false;
  }
};

const goBack = () => {
  if (step.value === 'candidate') {
    step.value = 'region';
    errorMessage.value = '';
    return;
  }
  router.back();
};

const goTodayCourse = () => {
  const returnTo = route.query.returnTo;
  if (typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    router.replace(returnTo);
    return;
  }
  router.back();
};

onMounted(fetchRegions);
</script>

<template>
  <div class="page">
    <header class="page-header">
      <button v-if="step !== 'complete'" class="back-button" type="button" aria-label="뒤로가기" @click="goBack">‹ 뒤로</button>
      <div>
        <h1>{{ step === 'complete' ? '변경 완료' : '대체 관광지' }}</h1>
        <p>{{ step === 'complete' ? '선택한 장소로 코스를 변경했습니다.' : '교체 대상: ' + originalTitle }}</p>
      </div>
    </header>

    <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>

    <template v-if="step === 'region'">
      <RegionFilter
        v-model:region-id="regionId"
        v-model:dong-id="dongId"
        :regions="regions"
        :dongs="dongs"
        :is-loading-dongs="isLoadingDongs"
      />
      <button class="primary-button" type="button" :disabled="!canSearch" @click="fetchCandidates">
        {{ isLoading ? '후보를 찾는 중...' : '이 지역으로 후보 찾기' }}
      </button>
    </template>

    <template v-else-if="step === 'candidate'">
      <div class="candidate-heading">
        <h2>추천 후보</h2>
        <span>{{ radiusMeters / 1000 }}km 이내 · 최대 20곳</span>
      </div>
      <div v-if="candidates.length" class="candidate-list">
        <ReplacementCandidateCard
          v-for="candidate in candidates"
          :key="candidate.contentId"
          :candidate="candidate"
          :selected="selectedCandidate?.contentId === candidate.contentId"
          @select="selectedCandidate = candidate"
        />
      </div>
      <div v-else class="empty-state">
        <strong>조건에 맞는 후보가 없습니다.</strong>
        <p>다른 지역을 선택해 다시 찾아보세요.</p>
      </div>
      <aside class="notice">실시간 데이터가 없는 장소도 후보에 포함될 수 있으며, 여행방에서 선택한 키워드 조건을 함께 반영합니다.</aside>
      <button class="primary-button" type="button" :disabled="!selectedCandidate || isLoading" @click="replaceSpot">
        {{ isLoading ? '교체하는 중...' : '이 장소로 교체하기' }}
      </button>
    </template>

    <template v-else>
      <section class="complete-card">
        <div class="check" aria-hidden="true">✓</div>
        <h2>한 곳이 교체되었습니다.</h2>
        <div class="change-summary">
          <span>{{ originalTitle }}</span><strong>→</strong><span>{{ replacedCandidate?.title }}</span>
        </div>
      </section>
      <section v-if="changedCourse" class="changed-course">
        <h2>변경된 방문 순서</h2>
        <ol>
          <li v-for="stop in changedCourse.stops" :key="stop.id">
            <span class="order">{{ stop.visitOrder }}</span>
            <strong>{{ stop.spotTitleSnapshot }}</strong>
            <span v-if="stop.isReplaced" class="replaced-label">교체됨</span>
          </li>
        </ol>
      </section>
      <button class="primary-button" type="button" @click="goTodayCourse">오늘의 코스로 돌아가기</button>
    </template>

    <BottomNav />
  </div>
</template>

<style scoped>
.page { display: flex; flex: 1; flex-direction: column; gap: 16px; min-height: 100vh; padding: 18px 16px 0; background: #fff; }
.page-header { display: flex; flex-direction: column; gap: 10px; }
.back-button { align-self: flex-start; border: 0; background: transparent; color: var(--team-color-gray-600); font-size: .78rem; }
.page-header h1 { font-size: 1.25rem; }
.page-header p { margin-top: 4px; color: var(--team-color-gray-600); font-size: .75rem; }
.error-message { padding: 11px 13px; border-radius: var(--team-radius); background: #fff0f1; color: var(--team-color-danger); font-size: .78rem; line-height: 1.4; }
.primary-button { width: 100%; padding: 14px 16px; border: 0; border-radius: var(--team-radius-pill); background: #4b8f8e; color: white; font-size: .84rem; font-weight: 700; }
.primary-button:disabled { cursor: default; opacity: .45; }
.candidate-heading { display: flex; align-items: center; justify-content: space-between; }
.candidate-heading h2 { font-size: .9rem; }
.candidate-heading span { color: var(--team-color-gray-600); font-size: .7rem; }
.candidate-list { display: flex; flex-direction: column; gap: 14px; }
.notice { padding: 14px; border-radius: var(--team-radius-card); background: #f2f4ec; color: var(--team-color-gray-600); font-size: .72rem; line-height: 1.55; }
.empty-state { padding: 48px 16px; border-radius: var(--team-radius-card); background: white; text-align: center; }
.empty-state p { margin-top: 8px; color: var(--team-color-gray-600); font-size: .78rem; }
.complete-card { margin: auto 0; padding: 28px 20px; border-radius: var(--team-radius-card); background: white; box-shadow: 0 8px 30px rgb(23 33 31 / 8%); text-align: center; }
.check { width: 48px; height: 48px; display: grid; place-items: center; margin: 0 auto 16px; border-radius: 50%; background: #dff5ec; color: var(--team-color-success); font-size: 1.4rem; font-weight: 800; }
.complete-card h2 { font-size: 1.05rem; }
.change-summary { display: flex; align-items: center; justify-content: center; gap: 9px; margin: 22px 0; color: var(--team-color-gray-600); font-size: .78rem; }
.change-summary span:last-child { color: var(--team-color-primary-dark); font-weight: 700; }
.changed-course h2 { margin-bottom: 12px; font-size: .9rem; }
.changed-course ol { display: grid; gap: 12px; list-style: none; }
.changed-course li { display: grid; grid-template-columns: 28px 1fr auto; align-items: center; gap: 10px; padding: 14px; border-radius: var(--team-radius-card); background: white; box-shadow: 0 5px 18px rgb(23 33 31 / 7%); }
.changed-course .order { width: 26px; height: 26px; display: grid; place-items: center; border-radius: 50%; background: var(--team-color-primary); color: white; font-size: .72rem; }
.changed-course strong { font-size: .82rem; }
.replaced-label { padding: 6px 9px; border-radius: var(--team-radius-pill); background: #dff5ec; color: var(--team-color-primary-dark); font-size: .68rem; font-weight: 700; }
.bottom-nav { margin-right: -16px; margin-left: -16px; }
</style>
