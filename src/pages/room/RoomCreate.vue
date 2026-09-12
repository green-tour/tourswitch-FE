<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import myAxios from '../../api/myAxios';
import AppButton from '../../components/common/AppButton.vue';
import AppHeader from '../../components/common/AppHeader.vue';
import AppState from '../../components/common/AppState.vue';
import { useAuthStore } from '../../store/auth/useAuthStore';

const router = useRouter();
const authStore = useAuthStore();
const step = ref(1);
const isLoading = ref(false);
const errorMessage = ref('');
const result = ref(null);
const form = reactive({ regionId: null, travelDate: '', keywordIds: [], placeCount: 3, options: { food: true, stay: true, shopping: false } });
const today = new Date();
const calendarMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1));
const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
const kakaoSdkUrl = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.3/kakao.min.js';

// 현재 백엔드에는 메타데이터 조회 API가 없어, DB 기준 데이터를 숫자 ID와 함께 관리한다.
const regions = [
  { id: 1, name: '종로구' }, { id: 2, name: '중구' }, { id: 3, name: '용산구' }, { id: 4, name: '성동구' },
  { id: 5, name: '광진구' }, { id: 6, name: '동대문구' }, { id: 7, name: '중랑구' }, { id: 8, name: '성북구' },
  { id: 9, name: '강북구' }, { id: 10, name: '도봉구' }, { id: 11, name: '노원구' }, { id: 12, name: '은평구' },
  { id: 13, name: '서대문구' }, { id: 14, name: '마포구' }, { id: 15, name: '양천구' }, { id: 16, name: '강서구' },
  { id: 17, name: '구로구' }, { id: 18, name: '금천구' }, { id: 19, name: '영등포구' }, { id: 20, name: '동작구' },
  { id: 21, name: '관악구' }, { id: 22, name: '서초구' }, { id: 23, name: '강남구' }, { id: 24, name: '송파구' },
  { id: 25, name: '강동구' },
];
const keywords = [
  { id: 1, name: '전시·박물관' }, { id: 2, name: '축제·행사' }, { id: 3, name: '도시공원' },
  { id: 4, name: '역사유적' }, { id: 5, name: '레저스포츠' }, { id: 6, name: '체험' },
  { id: 7, name: '공연' }, { id: 8, name: '자연·산' }, { id: 9, name: '종교성지' },
  { id: 10, name: '골목·거리·둘레길' }, { id: 11, name: '랜드마크·전망' }, { id: 12, name: '테마파크' },
];

const canContinue = computed(() => {
  if (step.value === 1) return Boolean(form.regionId);
  if (step.value === 2) return Boolean(form.travelDate);
  return form.keywordIds.length >= 1 && form.keywordIds.length <= 4;
});

const calendarTitle = computed(() => `${calendarMonth.value.getFullYear()}년 ${calendarMonth.value.getMonth() + 1}월`);
const calendarDays = computed(() => {
  const year = calendarMonth.value.getFullYear();
  const month = calendarMonth.value.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: firstWeekday + lastDay }, (_, index) => {
    if (index < firstWeekday) return null;
    const day = index - firstWeekday + 1;
    const date = new Date(year, month, day);
    return { day, value: toDateValue(date), disabled: date < startOfDay(today) };
  });
});

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const moveMonth = (amount) => {
  calendarMonth.value = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth() + amount, 1);
};

const selectDate = (date) => {
  if (!date.disabled) form.travelDate = date.value;
};

const toggleKeyword = (id) => {
  const index = form.keywordIds.indexOf(id);
  if (index >= 0) form.keywordIds.splice(index, 1);
  else if (form.keywordIds.length < 4) form.keywordIds.push(id);
};

const next = async () => {
  if (!canContinue.value) return;
  if (step.value < 3) { step.value += 1; return; }
  if (!authStore.user?.id) { errorMessage.value = '로그인 정보를 확인하지 못했습니다. 다시 로그인해주세요.'; return; }
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const region = regions.find((item) => item.id === form.regionId);
    const response = await myAxios.post('/rooms', {
      roomName: `${region?.name ?? '서울'} 여행`,
      travelDate: form.travelDate,
      regionId: form.regionId,
      keywordIds: form.keywordIds,
      courseSpotCount: form.placeCount,
      includesFood: form.options.food,
      includesLodging: form.options.stay,
      includesShopping: form.options.shopping,
    }, { params: { memberId: authStore.user.id } });
    const room = response.data.data;
    const selectedCategories = keywords
      .filter((keyword) => form.keywordIds.includes(keyword.id))
      .map(({ id, name }) => ({ id, name }));
    const categoryNames = selectedCategories.map((keyword) => keyword.name);
    result.value = { ...room, inviteUrl: `${window.location.origin}/invite/${room.inviteToken}` };
    localStorage.setItem(`activeTravelRoom:${authStore.user.id}`, JSON.stringify({
      roomId: room.roomId,
      roomName: room.roomName,
      travelDate: room.travelDate,
      categoryNames,
      hostMemberId: authStore.user.id,
    }));
    localStorage.setItem(
      `roomCategories:${room.roomId}`,
      JSON.stringify(selectedCategories),
    );
    localStorage.setItem(`roomAdditionalOptions:${room.roomId}`, JSON.stringify(form.options));
    step.value = 4;
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? '여행방을 만들지 못했습니다.';
  } finally { isLoading.value = false; }
};

const copyInvite = async () => {
  const url = result.value?.inviteUrl;
  if (url) await navigator.clipboard.writeText(url);
};

const loadKakaoSdk = () => new Promise((resolve, reject) => {
  if (window.Kakao) { resolve(window.Kakao); return; }
  const existingScript = document.querySelector('script[data-kakao-sdk]');
  if (existingScript) {
    existingScript.addEventListener('load', () => resolve(window.Kakao), { once: true });
    existingScript.addEventListener('error', reject, { once: true });
    return;
  }
  const script = document.createElement('script');
  script.src = kakaoSdkUrl;
  script.async = true;
  script.dataset.kakaoSdk = 'true';
  script.onload = () => resolve(window.Kakao);
  script.onerror = () => reject(new Error('카카오 SDK를 불러오지 못했습니다.'));
  document.head.appendChild(script);
});

const shareInvite = async () => {
  const url = result.value?.inviteUrl;
  const javascriptKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;
  if (!url) return;
  if (!javascriptKey) {
    await copyInvite();
    errorMessage.value = '카카오 공유 설정이 아직 없어 초대 링크를 복사했습니다.';
    return;
  }
  try {
    const Kakao = await loadKakaoSdk();
    if (!Kakao?.isInitialized()) Kakao.init(javascriptKey);
    Kakao.Share.sendDefault({
      objectType: 'text',
      text: `${result.value?.roomName ?? '투어 스위치 여행방'}에 초대합니다. 함께 관광지를 골라보세요!`,
      link: { mobileWebUrl: url, webUrl: url },
      buttonTitle: '여행방 참여하기',
    });
  } catch (error) {
    await copyInvite();
    errorMessage.value = error.message ?? '카카오톡 공유를 열지 못해 초대 링크를 복사했습니다.';
  }
};
</script>

<template>
  <main class="create-page">
    <AppHeader back-label="👈🏻 뒤로가기" @back="step > 1 && step < 4 ? step-- : router.back()" />
    <span class="step">{{ step }} / 4</span>
    <h1 class="create-title">{{ step < 4 ? '여행방 생성' : '초대 링크 생성' }}</h1>

    <AppState v-if="isLoading" type="loading" message="후보 카드를 구성하고 있습니다." />
    <section v-else-if="step === 1" class="step-content">
      <div class="symbol symbol-1" role="img" aria-label="지구본"></div><h2>어디로 떠나볼까요?</h2><p>서울 자치구</p>
      <div class="chips"><button v-for="region in regions" :key="region.id" class="chip" :class="{ selected: form.regionId === region.id }" @click="form.regionId = region.id">{{ region.name }}</button></div>
    </section>
    <section v-else-if="step === 2" class="step-content">
      <div class="symbol symbol-2" role="img" aria-label="달력"></div><h2>언제 떠나시나요?</h2>
      <section class="calendar" aria-label="여행 날짜 선택">
        <div class="calendar-header"><button type="button" aria-label="이전 달" @click="moveMonth(-1)">‹</button><strong>{{ calendarTitle }}</strong><button type="button" aria-label="다음 달" @click="moveMonth(1)">›</button></div>
        <div class="calendar-weekdays"><span v-for="weekday in weekdays" :key="weekday">{{ weekday }}</span></div>
        <div class="calendar-days"><span v-for="(date, index) in calendarDays" :key="date?.value ?? `empty-${index}`" class="calendar-day" :class="{ empty: !date, selected: date?.value === form.travelDate, disabled: date?.disabled }"><button v-if="date" type="button" :disabled="date.disabled" @click="selectDate(date)">{{ date.day }}</button></span></div>
      </section>
      <p class="selected-date">{{ form.travelDate ? `${form.travelDate} 출발` : '출발 날짜를 선택해주세요.' }}</p>
    </section>
    <section v-else-if="step === 3" class="step-content compact">
      <div class="symbol symbol-3" role="img" aria-label="하트"></div><h2>어떤 여행을 하고 싶나요?</h2><p class="count">{{ form.keywordIds.length }} / 최대 4개</p>
      <div class="chips"><button v-for="keyword in keywords" :key="keyword.id" class="chip" :class="{ selected: form.keywordIds.includes(keyword.id) }" @click="toggleKeyword(keyword.id)">{{ keyword.name }}</button></div>
      <h3>목표 관광지 수</h3><div class="chips centered"><button v-for="count in [1, 2, 3]" :key="count" class="chip" :class="{ selected: form.placeCount === count }" @click="form.placeCount = count">{{ count }}곳</button></div>
      <h3>추가 선택 사항</h3><label v-for="(label, key) in { food: '음식점 추천 받기', stay: '숙박 추천 받기', shopping: '쇼핑 추천 받기' }" :key="key" class="switch-row"><span>{{ label }}</span><input v-model="form.options[key]" type="checkbox" :aria-label="label" /></label>
    </section>
    <section v-else class="result-content">
      <div class="success">✓</div><h2>{{ form.travelDate }} · {{ regions.find((item) => item.id === form.regionId)?.name }} 여행</h2>
      <p>키워드 {{ form.keywordIds.length }}개 · 후보 카드 {{ result?.candidateCount ?? '—' }}개 구성 완료</p>
      <div class="invite-card"><strong>초대 링크</strong><div class="invite-url"><span>{{ result?.inviteUrl }}</span><button @click="copyInvite">복사</button></div><AppButton variant="secondary" block @click="shareInvite">메신저로 공유</AppButton></div>
      <AppButton class="go-vote" @click="router.push(`/rooms/${result?.roomId}/vote`)">투표하러 가기</AppButton>
    </section>

    <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
    <div v-if="step < 4 && !isLoading" class="next-spacer" aria-hidden="true"></div>
    <AppButton v-if="step < 4 && !isLoading" class="next" :disabled="!canContinue" @click="next">다음</AppButton>
  </main>
</template>

<style scoped>
.create-page{min-height:100vh;padding:12px 20px 88px;position:relative;display:flex;flex-direction:column}.step{position:absolute;right:20px;top:25px;color:var(--team-color-primary);font-size:var(--team-font-size-sm);font-weight:700}.step-content,.result-content{display:flex;flex-direction:column;align-items:center;gap:18px;padding-top:44px}.symbol{width:70px;height:70px;object-fit:cover;object-position:50% 22%;border-radius:12px}.step-content h2,.result-content h2{font-size:18px}.step-content p{font-size:12px;font-weight:700}.chips{width:100%;display:flex;flex-wrap:wrap;gap:9px;justify-content:center}.chip{padding:5px 13px;border:1px solid var(--team-color-primary);border-radius:999px;background:#fff;color:var(--team-color-primary-dark);font-size:12px}.chip.selected{background:var(--team-color-primary);color:#fff}.calendar{width:min(100%,330px);padding:18px 16px;border:var(--team-border-default);border-radius:16px;background:#fff;box-shadow:0 8px 24px #203d3510}.calendar-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.calendar-header button{width:32px;height:32px;border:0;border-radius:50%;background:#f3f5f4;font-size:28px;line-height:1;color:var(--team-color-gray-700)}.calendar-weekdays,.calendar-days{display:grid;grid-template-columns:repeat(7,1fr);text-align:center}.calendar-weekdays{margin-bottom:7px;color:var(--team-color-gray-600);font-size:11px}.calendar-weekdays span:first-child{color:var(--team-color-danger)}.calendar-days{row-gap:5px}.calendar-day{height:36px;display:grid;place-items:center}.calendar-day button{width:32px;height:32px;border:0;border-radius:50%;background:transparent;font-size:13px}.calendar-day.selected button{background:var(--team-color-primary);color:#fff;font-weight:700}.calendar-day.disabled button{color:#c8cfcc}.selected-date{color:var(--team-color-primary-dark)}.compact{padding-top:20px}.compact h3{margin-top:28px;font-size:14px}.count{color:var(--team-color-primary)}.switch-row{width:240px;padding:10px 16px;border-radius:999px;background:#fafafa;display:flex;align-items:center;justify-content:space-between;color:#111;font-size:12px;box-shadow:0 3px 12px #203d3510;cursor:pointer}.switch-row input{width:48px;height:26px;margin:0;appearance:none;border:0;border-radius:999px;background:#caefeb;cursor:pointer;position:relative;transition:background .2s ease}.switch-row input::before{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 2px #00000012;transition:transform .2s ease}.switch-row input:checked{background:linear-gradient(135deg,#00bdd0,#20ba75)}.switch-row input:checked::before{transform:translateX(22px)}.switch-row input:focus-visible{outline:2px solid var(--team-color-primary);outline-offset:3px}.next{margin:48px auto 8px}.error{color:var(--team-color-danger);text-align:center}.result-content{width:100%;min-width:0;text-align:center;padding-top:20px}.success{width:62px;height:62px;border-radius:50%;display:grid;place-items:center;background:#cef2e4;font-size:36px}.result-content>p{color:var(--team-color-gray-600);font-size:13px}.invite-card{width:100%;max-width:350px;min-width:0;padding:16px;background:#fbfaf7;text-align:left;display:grid;gap:12px}.invite-url{min-width:0;padding:12px;border-radius:999px;background:#fff;display:flex;align-items:center;gap:8px;font-size:12px}.invite-url span{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.invite-url button{flex:0 0 auto;border:0;background:none;color:var(--team-color-primary-dark)}
.symbol{background-size:390px 844px;background-position:-160px -164px;border-radius:0}.symbol-1{background-image:url('/figma-assets/room-create-1.png')}.symbol-2{background-image:url('/figma-assets/room-create-2.png')}.symbol-3{background-image:url('/figma-assets/room-create-3.png')}
.create-page{padding-top:16px}.create-page :deep(.app-header){min-height:12px;height:12px;align-items:start}.create-page :deep(.has-back-label .back-button){font-size:9px}.step{top:17px;font-size:10px}.create-title{position:absolute;top:108px;left:0;right:0;font-size:18px;text-align:center}.step-content,.result-content{padding-top:137px}.compact{padding-top:137px}.next-spacer{flex:1 0 80px}.next{margin:0 auto 52px;min-width:70px!important;width:70px!important;height:31px!important;padding:0!important;border-radius:999px!important;font-size:11px!important}.go-vote{min-width:110px!important;width:110px!important;height:32px!important;margin-top:14px!important;padding:0!important;border-radius:999px!important;font-size:11px!important}
</style>
