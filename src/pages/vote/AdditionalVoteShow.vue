<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import myAxios from '../../api/myAxios';
import AppState from '../../components/common/AppState.vue';
import BottomNav from '../../components/BottomNav.vue';
import { useAuthStore } from '../../store/auth/useAuthStore';
import { useActiveRoom } from '../../composables/useActiveRoom';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const roomId = route.params.roomId;
const { fetchActiveRoom } = useActiveRoom();

// 서버의 spot_role과 화면 라벨을 잇는다.
const ROLE_LABELS = { FOOD: '음식점', LODGING: '숙박', SHOPPING: '쇼핑' };

const candidatesByRole = ref({});
const roomStatus = ref('');
const activeRole = ref('');
const activeIndex = ref(0);
const overviewByContentId = ref({});
const isLoading = ref(true);
const isSubmitting = ref(false);
const errorMessage = ref('');

const roles = computed(() => Object.keys(candidatesByRole.value)
  .filter((role) => (candidatesByRole.value[role] ?? []).length > 0));
const activeCandidates = computed(() => candidatesByRole.value[activeRole.value] ?? []);
const activeCard = computed(() => activeCandidates.value[activeIndex.value] ?? null);
const selectedCount = computed(() => Object.values(candidatesByRole.value)
  .flat()
  .filter((candidate) => candidate.myVote).length);

const applyResponse = (data) => {
  candidatesByRole.value = data.candidatesByRole ?? {};
  roomStatus.value = data.roomStatus;
  if (!roles.value.includes(activeRole.value)) {
    activeRole.value = roles.value[0] ?? '';
    activeIndex.value = 0;
  }
};

const fetchCandidates = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    if (!authStore.user?.id) throw new Error('로그인 정보를 확인하지 못했습니다.');
    const activeRoom = await fetchActiveRoom({ force: true });
    if (String(activeRoom?.roomId) !== String(roomId) || activeRoom?.hostMemberId !== authStore.user.id) {
      router.replace({ name: 'vote-status-show', params: { roomId } });
      return;
    }
    const { data } = await myAxios.get(`/rooms/${roomId}/extra-votes`);
    applyResponse(data.data);
    if (roomStatus.value !== 'EXTRA_VOTING') {
      router.replace({ name: 'vote-status-show', params: { roomId } });
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? error.message ?? '추가 후보를 불러오지 못했습니다.';
  } finally {
    isLoading.value = false;
  }
};

const selectRole = (role) => {
  activeRole.value = role;
  activeIndex.value = 0;
};

const move = (step) => {
  const next = activeIndex.value + step;
  if (next < 0 || next >= activeCandidates.value.length) return;
  activeIndex.value = next;
};

const toggleVote = async (candidate) => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    const { data } = candidate.myVote
      ? await myAxios.delete(`/rooms/${roomId}/extra-votes/${candidate.candidateId}`)
      : await myAxios.post(`/rooms/${roomId}/extra-votes/${candidate.candidateId}`, null);
    applyResponse(data.data);
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? '선택을 반영하지 못했습니다.';
  } finally {
    isSubmitting.value = false;
  }
};

// 설명은 목록 응답에 없어 카드를 볼 때 한 건씩만 상세로 채운다.
const loadOverview = async (candidate) => {
  if (!candidate || overviewByContentId.value[candidate.contentId] !== undefined) return;
  try {
    const { data } = await myAxios.get(`/places/${candidate.contentId}`);
    overviewByContentId.value = { ...overviewByContentId.value, [candidate.contentId]: data.data.summary ?? '' };
  } catch {
    overviewByContentId.value = { ...overviewByContentId.value, [candidate.contentId]: '' };
  }
};

const complete = async () => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    await myAxios.patch(`/rooms/${roomId}/extra-votes/completion`, null);
    router.push({ name: 'vote-status-show', params: { roomId } });
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? '선택 완료 처리에 실패했습니다.';
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(fetchCandidates);
</script>

<template>
  <main class="additional-vote-page">
    <button class="back" type="button" @click="router.back()">‹ 뒤로가기</button>
    <p class="room-label">추가 투표</p>
    <h1>마음에 드는 장소를 골라주세요.</h1>

    <AppState v-if="isLoading" message="추가 후보를 불러오는 중입니다." />
    <AppState v-else-if="errorMessage" :message="errorMessage" />
    <template v-else>
      <div class="chips">
        <button v-for="role in roles" :key="role" type="button" :class="{ active: activeRole === role }" @click="selectRole(role)">{{ ROLE_LABELS[role] ?? role }}</button>
      </div>
      <p v-if="activeCandidates.length" class="progress">{{ activeIndex + 1 }} / {{ activeCandidates.length }}</p>

      <p v-if="!activeCandidates.length" class="empty">이 카테고리에 추천할 장소가 없습니다.</p>
      <section v-else class="card-area">
        <button class="arrow left" type="button" :disabled="activeIndex === 0" @click="move(-1)">‹</button>
        <button class="arrow right" type="button" :disabled="activeIndex >= activeCandidates.length - 1" @click="move(1)">›</button>
        <article v-if="activeCard" class="candidate-card">
          <span class="photo" :style="{ backgroundImage: `url(${activeCard.imageUrl || '/figma-assets/place-placeholder.svg'})` }" role="img" :aria-label="activeCard.title"></span>
          <div class="card-body">
            <h2>{{ activeCard.title }}</h2>
            <p class="distance">경유지에서 {{ activeCard.distanceMeters }}m</p>
            <p v-if="overviewByContentId[activeCard.contentId] === undefined" class="overview link" @click="loadOverview(activeCard)">설명 보기</p>
            <p v-else-if="overviewByContentId[activeCard.contentId]" class="overview">{{ overviewByContentId[activeCard.contentId] }}</p>
            <p v-else class="overview muted">등록된 설명이 없습니다.</p>
            <button type="button" :class="{ selected: activeCard.myVote }" :disabled="isSubmitting" @click="toggleVote(activeCard)">{{ activeCard.myVote ? '선택 취소' : '이곳으로 할게요' }}</button>
          </div>
        </article>
      </section>

      <p class="select-count">{{ selectedCount }}곳 선택</p>
      <button class="complete" type="button" :disabled="isSubmitting" @click="complete">{{ isSubmitting ? '처리 중' : '선택완료' }}</button>
    </template>
    <BottomNav />
  </main>
</template>

<style scoped>
.additional-vote-page{min-height:100vh;padding-top:16px;padding-bottom:92px;overflow:hidden}
.back{margin-left:22px;border:0;background:none;color:#aaa;font-size:10px}
.room-label{margin:29px 22px 2px;color:#00bfc4;font-size:10px;font-weight:700}
.additional-vote-page h1{margin:0 22px;font-size:16px;line-height:1.35}
.chips{display:flex;gap:8px;margin:22px 22px 0;flex-wrap:wrap}
.chips button{padding:4px 12px;border:1px solid #00bfc4;border-radius:999px;background:#fff;color:#00bfc4;font-size:10px;font-weight:700}
.chips button:hover,.chips button.active{background:#00bfc4;color:#fff}
.progress{margin-top:24px;color:#f04452;font-size:11px;font-weight:800;text-align:center}
.empty{margin-top:40px;color:#89928f;font-size:12px;text-align:center}
.card-area{position:relative;margin-top:18px;display:flex;justify-content:center}
.arrow{position:absolute;z-index:2;top:120px;border:0;background:none;color:#202124;font-size:44px;line-height:.6}
.arrow:disabled{color:#ddd}
.arrow.left{left:28px}
.arrow.right{right:28px}
.candidate-card{position:relative;z-index:1;width:209px;overflow:hidden;border-radius:15px;background:#fff;box-shadow:0 8px 15px rgb(23 33 31 / 8%)}
.candidate-card .photo{display:block;width:100%;height:170px;background-position:center;background-size:cover;background-color:#e7e7e7}
.card-body{padding:12px 14px}
.card-body h2{font-size:14px}
.distance{margin-top:4px;color:#89928f;font-size:10px}
.overview{margin-top:6px;min-height:28px;color:#4a4a4a;font-size:10px;line-height:1.4}
.overview.link{color:#00bfc4;cursor:pointer;text-decoration:underline}
.overview.muted{color:#89928f}
.card-body button{display:block;width:110px;height:31px;margin:14px auto 0;border:1px solid #f04452;border-radius:999px;background:#fff;color:#f04452;font-size:10px;font-weight:700}
.card-body button.selected,.card-body button:hover{background:#f04452;color:#fff}
.select-count{margin-top:18px;color:#4a4a4a;font-size:11px;text-align:center}
.complete{display:block;width:80px;height:30px;margin:16px auto 0;border:0;border-radius:999px;background:#00bfc4;color:#fff;font-size:10px;font-weight:800}
.additional-vote-page :deep(.bottom-nav){position:fixed;width:min(100%,390px);margin:auto}
</style>
