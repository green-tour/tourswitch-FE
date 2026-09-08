<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import myAxios from '../../api/myAxios';
import AppButton from '../../components/common/AppButton.vue';
import AppHeader from '../../components/common/AppHeader.vue';
import AppState from '../../components/common/AppState.vue';

const router = useRouter();
const step = ref(1);
const regions = ref([]);
const keywords = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');
const result = ref(null);
const form = reactive({ regionCode: '', travelDate: '', keywordCodes: [], placeCount: 1, options: { food: true, stay: true, shopping: false } });

const canContinue = computed(() => {
  if (step.value === 1) return Boolean(form.regionCode);
  if (step.value === 2) return Boolean(form.travelDate);
  return form.keywordCodes.length >= 1 && form.keywordCodes.length <= 4;
});

const fallbackRegions = [
  ['SEOUL-GANGNAM', '강남구'], ['SEOUL-GANGDONG', '강동구'], ['SEOUL-GANGBUK', '강북구'],
  ['SEOUL-GANGSEO', '강서구'], ['SEOUL-GWANAK', '관악구'], ['SEOUL-GWANGJIN', '광진구'],
  ['SEOUL-GURO', '구로구'], ['SEOUL-GEUMCHEON', '금천구'], ['SEOUL-DOBONG', '도봉구'],
];
const fallbackKeywords = [
  ['HISTORY', '역사문화'], ['CULTURE', '문화예술'], ['NATURE', '숲체험'], ['CITY', '도시공원'],
  ['LEISURE', '레저스포츠'], ['EXPERIENCE', '체험'], ['WALK', '걷기'], ['PHOTO', '사진'], ['ANIMAL', '동물'],
];

const normalizeOptions = (data, fallback) => {
  const items = data?.items ?? data ?? [];
  return items.length ? items.map((item) => ({ code: item.code, name: item.name })) : fallback.map(([code, name]) => ({ code, name }));
};

const fetchMetadata = async () => {
  try {
    const [regionRes, keywordRes] = await Promise.all([myAxios.get('/metadata/regions'), myAxios.get('/metadata/keywords')]);
    regions.value = normalizeOptions(regionRes.data.data, fallbackRegions);
    keywords.value = normalizeOptions(keywordRes.data.data, fallbackKeywords);
  } catch {
    regions.value = normalizeOptions([], fallbackRegions);
    keywords.value = normalizeOptions([], fallbackKeywords);
  }
};

const toggleKeyword = (code) => {
  const index = form.keywordCodes.indexOf(code);
  if (index >= 0) form.keywordCodes.splice(index, 1);
  else if (form.keywordCodes.length < 4) form.keywordCodes.push(code);
};

const next = async () => {
  if (!canContinue.value) return;
  if (step.value < 3) { step.value += 1; return; }
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await myAxios.post('/vote-sessions', {
      travelDate: form.travelDate,
      regionCodes: [form.regionCode],
      keywordCodes: form.keywordCodes,
      targetPlaceCount: form.placeCount,
    });
    result.value = response.data.data;
    step.value = 4;
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? '여행방을 만들지 못했습니다.';
  } finally { isLoading.value = false; }
};

const copyInvite = async () => {
  const url = result.value?.invite?.url;
  if (url) await navigator.clipboard.writeText(url);
};

onMounted(fetchMetadata);
</script>

<template>
  <main class="create-page">
    <AppHeader :title="step < 4 ? '여행방 생성' : '초대 링크 생성'" @back="step > 1 && step < 4 ? step-- : router.back()" />
    <span class="step">{{ step }} / 4</span>

    <AppState v-if="isLoading" type="loading" message="후보 카드를 구성하고 있습니다." />
    <section v-else-if="step === 1" class="step-content">
      <div class="symbol symbol-1" role="img" aria-label="지구본"></div><h2>어디로 떠나볼까요?</h2><p>서울 자치구</p>
      <div class="chips"><button v-for="region in regions" :key="region.code" class="chip" :class="{ selected: form.regionCode === region.code }" @click="form.regionCode = region.code">{{ region.name }}</button></div>
    </section>
    <section v-else-if="step === 2" class="step-content">
      <div class="symbol symbol-2" role="img" aria-label="달력"></div><h2>언제 떠나시나요?</h2>
      <label class="date-box">여행 날짜<input v-model="form.travelDate" type="date" :min="new Date().toISOString().slice(0, 10)" /></label>
    </section>
    <section v-else-if="step === 3" class="step-content compact">
      <div class="symbol symbol-3" role="img" aria-label="하트"></div><h2>어떤 여행을 하고 싶나요?</h2><p class="count">{{ form.keywordCodes.length }} / 최대 4개</p>
      <div class="chips"><button v-for="keyword in keywords" :key="keyword.code" class="chip" :class="{ selected: form.keywordCodes.includes(keyword.code) }" @click="toggleKeyword(keyword.code)">{{ keyword.name }}</button></div>
      <h3>목표 관광지 수</h3><div class="chips centered"><button v-for="count in 3" :key="count" class="chip" :class="{ selected: form.placeCount === count }" @click="form.placeCount = count">{{ count }}곳</button></div>
      <h3>추가 선택 사항</h3><label v-for="(label, key) in { food: '음식점 추천 받기', stay: '숙박 추천 받기', shopping: '쇼핑 추천 받기' }" :key="key" class="switch-row">{{ label }}<input v-model="form.options[key]" type="checkbox" /></label>
    </section>
    <section v-else class="result-content">
      <div class="success">✓</div><h2>{{ form.travelDate }} · {{ regions.find((item) => item.code === form.regionCode)?.name }} 여행</h2>
      <p>키워드 {{ form.keywordCodes.length }}개 · 후보 카드 {{ result?.candidateCount ?? '—' }}개 구성 완료</p>
      <div class="invite-card"><strong>초대 링크</strong><div class="invite-url"><span>{{ result?.invite?.url }}</span><button @click="copyInvite">복사</button></div><AppButton variant="secondary" block @click="copyInvite">메신저로 공유</AppButton></div>
      <AppButton @click="router.push(`/rooms/${result?.session?.id}/vote`)">투표하러 가기</AppButton>
    </section>

    <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
    <AppButton v-if="step < 4 && !isLoading" class="next" :disabled="!canContinue" @click="next">다음</AppButton>
  </main>
</template>

<style scoped>
.create-page{min-height:100vh;padding:12px 20px 88px;position:relative;display:flex;flex-direction:column}.step{position:absolute;right:20px;top:25px;color:var(--team-color-primary);font-size:var(--team-font-size-sm);font-weight:700}.step-content,.result-content{display:flex;flex-direction:column;align-items:center;gap:18px;padding-top:44px}.symbol{width:70px;height:70px;object-fit:cover;object-position:50% 22%;border-radius:12px}.step-content h2,.result-content h2{font-size:18px}.step-content p{font-size:12px;font-weight:700}.chips{width:100%;display:flex;flex-wrap:wrap;gap:9px;justify-content:center}.chip{padding:5px 13px;border:1px solid var(--team-color-primary);border-radius:999px;background:#fff;color:var(--team-color-primary-dark);font-size:12px}.chip.selected{background:var(--team-color-primary);color:#fff}.date-box{width:300px;height:300px;background:#d9d9d9;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:16px}.date-box input{padding:12px;border:var(--team-border-default);border-radius:10px}.compact{padding-top:20px}.compact h3{margin-top:28px;font-size:14px}.count{color:var(--team-color-primary)}.switch-row{width:240px;padding:10px 16px;border-radius:999px;background:#fafafa;display:flex;justify-content:space-between;font-size:12px;box-shadow:0 3px 12px #203d3510}.switch-row input{accent-color:var(--team-color-primary)}.next{margin:auto auto 8px}.error{color:var(--team-color-danger);text-align:center}.result-content{text-align:center;padding-top:20px}.success{width:62px;height:62px;border-radius:50%;display:grid;place-items:center;background:#cef2e4;font-size:36px}.result-content>p{color:var(--team-color-gray-600);font-size:13px}.invite-card{width:100%;padding:16px;background:#fbfaf7;text-align:left;display:grid;gap:12px}.invite-url{padding:12px;border-radius:999px;background:#fff;display:flex;justify-content:space-between;gap:8px;font-size:12px}.invite-url span{overflow:hidden;text-overflow:ellipsis}.invite-url button{border:0;background:none;color:var(--team-color-primary-dark)}
.symbol{background-size:390px 844px;background-position:-160px -164px;border-radius:0}.symbol-1{background-image:url('/figma-assets/room-create-1.png')}.symbol-2{background-image:url('/figma-assets/room-create-2.png')}.symbol-3{background-image:url('/figma-assets/room-create-3.png')}
</style>
