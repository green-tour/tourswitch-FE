<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import myAxios from '../../api/myAxios';
import AppState from '../../components/common/AppState.vue';
import BottomNav from '../../components/BottomNav.vue';
import { useActiveRoom } from '../../composables/useActiveRoom';
import { useAuthStore } from '../../store/auth/useAuthStore';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const roomId = route.params.roomId;

const course = ref(null);
const placeDetails = ref({});
const isLoading = ref(true);
const errorMessage = ref('');
const isConfirming = ref(false);
const editNotice = ref('');
const { fetchActiveRoom } = useActiveRoom();

const isConfirmed = computed(() => course.value?.status === 'CONFIRMED');
const isHost = computed(() => readActiveRoom()?.hostMemberId === authStore.user?.id);
const hasReplacement = computed(() => course.value?.stops?.some((stop) => stop.isReplaced));
const attractionCount = computed(() => course.value?.stops?.filter((stop) => stop.spotRole === 'ATTRACTION').length ?? 0);
const pageTitle = computed(() => isConfirmed.value ? '오늘의 코스' : '추천 코스');
const dateLabel = computed(() => course.value?.travelDate?.replaceAll('-', '. ') ?? '');
const courseMeta = computed(() => `${dateLabel.value} | 관광지 ${attractionCount.value}곳`);

const ROLE_LABELS = { FOOD: '음식점', LODGING: '숙박', SHOPPING: '쇼핑' };
const selectedExtrasByStopId = computed(() => {
  const grouped = {};
  for (const extra of course.value?.extraCandidates ?? []) {
    if (!extra.isSelected) continue;
    (grouped[extra.anchorCourseSpotId] ??= []).push(extra);
  }
  return grouped;
});

const courseCards = computed(() => {
  const cards = [];
  const stops = [...(course.value?.stops ?? [])].sort((a, b) => a.visitOrder - b.visitOrder);
  for (const stop of stops) {
    const detail = placeDetails.value[stop.contentId] ?? {};
    cards.push({
      key: `spot-${stop.id}`,
      kind: 'attraction',
      id: stop.id,
      contentId: stop.contentId,
      title: stop.spotTitleSnapshot ?? '제공 정보 없음',
      regionName: detail.regionName ?? '서울',
      imageUrl: detail.imageUrl ?? '',
      crowd: crowdMeta(stop.concentrationRateSnapshot),
      voteCount: stop.voteCountSnapshot,
      isReplaced: stop.isReplaced,
    });
    const extras = [...(selectedExtrasByStopId.value[stop.id] ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);
    for (const extra of extras) {
      const extraDetail = placeDetails.value[extra.contentId] ?? {};
      cards.push({
        key: `extra-${extra.id}`,
        kind: 'extra',
        contentId: extra.contentId,
        title: extra.titleSnapshot ?? '제공 정보 없음',
        regionName: extraDetail.regionName ?? '서울',
        imageUrl: extra.imageUrlSnapshot ?? extraDetail.imageUrl ?? '',
        roleLabel: ROLE_LABELS[extra.spotRole] ?? extra.spotRole,
        distanceMeters: extra.distanceMeters,
      });
    }
  }
  return cards;
});

function crowdMeta(rate) {
  if (rate == null) return null;
  if (Number(rate) < 25) return { label: '여유', tone: 'relaxed' };
  if (Number(rate) < 50) return { label: '보통', tone: 'normal' };
  if (Number(rate) < 75) return { label: '약간 붐빔', tone: 'crowded' };
  return { label: '붐빔', tone: 'busy' };
}

function readActiveRoom() {
  try {
    return JSON.parse(localStorage.getItem(`activeTravelRoom:${authStore.user?.id}`) ?? 'null');
  } catch {
    return null;
  }
}

async function loadPlaceDetails(contentIds) {
  const uniqueIds = [...new Set(contentIds.filter(Boolean))];
  const loaded = await Promise.all(uniqueIds.map(async (contentId) => {
    try {
      const { data } = await myAxios.get(`/places/${contentId}`);
      return [contentId, data.data];
    } catch {
      return [contentId, null];
    }
  }));
  placeDetails.value = Object.fromEntries(loaded.filter(([, detail]) => detail));
}

async function fetchCourse() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    if (!authStore.user?.id) throw new Error('로그인 정보를 확인하지 못했습니다.');
    const { data } = await myAxios.get(`/rooms/${roomId}/course`);
    course.value = data.data;
    await loadPlaceDetails([
      ...(course.value.stops ?? []).map((stop) => stop.contentId),
      ...(course.value.extraCandidates ?? []).filter((extra) => extra.isSelected).map((extra) => extra.contentId),
    ]);
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? error.message ?? '코스 정보를 불러오지 못했습니다.';
  } finally {
    isLoading.value = false;
  }
}

async function confirmCourse() {
  if (!course.value || isConfirming.value) return;
  isConfirming.value = true;
  try {
    const { data } = await myAxios.patch(`/courses/${course.value.id}/status`, null);
    course.value = data.data;
    await fetchActiveRoom({ force: true });
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? '코스 확정에 실패했습니다.';
  } finally {
    isConfirming.value = false;
  }
}

function openDirections(card) {
  window.open(`https://map.kakao.com/link/search/${encodeURIComponent(card.title)}`, '_blank', 'noopener,noreferrer');
}

function openReplacement(card) {
  if ((card.kind && card.kind !== 'attraction') || hasReplacement.value) return;
  router.push({
    name: 'course-spot-change',
    params: { courseId: course.value.id, courseSpotId: card.id },
    query: { roomId, originalTitle: card.title, returnTo: route.fullPath },
  });
}

function showEditNotice() {
  editNotice.value = '코스를 확정한 뒤 오늘의 코스에서 대체 장소를 선택할 수 있어요.';
}

onMounted(fetchCourse);
</script>

<template>
  <main class="course-page" :class="{ 'today-course-page': isConfirmed }">
    <AppState v-if="isLoading" type="loading" message="추천 코스를 구성하고 있습니다." />
    <AppState v-else-if="errorMessage" type="error" :message="errorMessage" @retry="fetchCourse" />
    <template v-else>
      <header class="course-header">
        <h1>{{ pageTitle }}</h1>
        <p>{{ courseMeta }}</p>
      </header>

      <section class="course-list" aria-label="여행 코스">
        <article v-for="card in courseCards" :key="card.key" class="course-card" :class="card.kind">
          <img v-if="card.imageUrl" :src="card.imageUrl" :alt="card.title" class="course-image" />
          <div v-else class="course-image placeholder" :aria-label="card.roleLabel ?? `${card.title} 이미지 없음`">
            <span v-if="card.roleLabel">{{ card.roleLabel }}</span>
          </div>
          <span v-if="card.crowd" class="crowd-pill" :class="card.crowd.tone">{{ card.crowd.label }}</span>
          <span v-else-if="card.roleLabel" class="role-pill">{{ card.roleLabel }}</span>
          <div class="card-copy">
            <strong>{{ card.title }}</strong>
            <small>{{ card.regionName }}</small>
            <em v-if="!isConfirmed && card.voteCount != null">{{ card.voteCount }}표</em>
            <em v-else-if="card.distanceMeters != null">{{ card.distanceMeters }}m</em>
          </div>
          <div v-if="isConfirmed" class="card-actions">
            <button type="button" @click="openDirections(card)">길찾기</button>
            <button
              v-if="card.kind === 'attraction'"
              type="button"
              :disabled="hasReplacement || card.isReplaced"
              @click="openReplacement(card)"
            >{{ card.isReplaced ? '교체됨' : '대체 장소 찾기' }}</button>
          </div>
        </article>
      </section>

      <p v-if="!courseCards.length" class="empty-course">표시할 코스가 없습니다.</p>

      <div v-if="!isConfirmed" class="recommendation-actions">
        <button type="button" class="edit-button" @click="showEditNotice">수정하기</button>
        <button v-if="isHost" type="button" class="confirm-button" :disabled="isConfirming" @click="confirmCourse">
          {{ isConfirming ? '확정 중' : '확정하기' }}
        </button>
      </div>
      <p v-if="editNotice" class="edit-notice">{{ editNotice }}</p>
      <p v-else-if="!isConfirmed && !isHost" class="host-hint">방장이 코스를 확정하면 오늘의 코스로 바뀝니다.</p>
    </template>
    <BottomNav />
  </main>
</template>

<style scoped>
.course-page{min-height:100vh;padding:31px 40px 108px;background:#fff}
.course-header{margin-bottom:26px}.course-header h1{font-size:18px;font-weight:800;line-height:1.3}.course-header p{margin-top:3px;color:#00bfc4;font-size:10px;font-weight:700}
.course-list{display:grid;gap:22px}.course-card{position:relative;overflow:hidden;border-radius:15px;background:#fff;box-shadow:0 8px 18px rgb(23 33 31 / 6%)}
.course-image{display:block;width:100%;height:96px;object-fit:cover;background:#ddd}.course-image.placeholder{display:grid;place-items:center;background:#ddd;color:#111;font-size:14px;font-weight:800}
.crowd-pill,.role-pill{position:absolute;top:10px;right:11px;padding:5px 14px;border-radius:999px;color:#fff;font-size:9px;font-weight:800}.crowd-pill.relaxed{background:#20b878}.crowd-pill.normal{background:#f5bd36}.crowd-pill.crowded{background:#f2994a}.crowd-pill.busy{background:#f04452}.role-pill{background:#67706d}
.card-copy{position:relative;min-height:57px;padding:12px 18px}.card-copy strong{font-size:14px}.card-copy small{margin-left:7px;font-size:8px}.card-copy em{position:absolute;right:18px;bottom:13px;color:#00bfc4;font-size:9px;font-style:normal;font-weight:800}
.card-actions{display:grid;grid-template-columns:1fr 1.25fr;gap:12px;padding:0 14px 16px}.card-actions button,.recommendation-actions button{height:30px;border:1px solid #00bfc4;border-radius:999px;background:#fff;color:#00aeb3;font-size:10px;font-weight:800}.card-actions button:last-child,.confirm-button{border:0!important;background:#00bfc4!important;color:#fff!important}.card-actions button:disabled{background:#e6eeee!important;color:#8b9694!important}
.recommendation-actions{display:flex;justify-content:center;gap:9px;margin:44px auto 0}.recommendation-actions button{width:106px}.edit-notice,.host-hint{margin:14px auto 0;color:#71807d;font-size:11px;text-align:center}.empty-course{padding:60px 0;color:#89928f;font-size:13px;text-align:center}
.course-page :deep(.bottom-nav){position:fixed;left:50%;bottom:0;width:min(100%,390px);margin:0;transform:translateX(-50%)}
.today-course-page{padding:31px 40px 92px}
@media(max-width:340px){.course-page{padding-inline:24px}.course-list{gap:16px}}
</style>
