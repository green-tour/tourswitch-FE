<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import myAxios from '../../api/myAxios';
import BottomNav from '../../components/BottomNav.vue';
import { useAuthStore } from '../../store/auth/useAuthStore';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const roomId = route.params.roomId;
const labels = { food: '음식점', stay: '숙박', shopping: '쇼핑' };
const options = readOptions();
const categories = Object.entries(labels).filter(([key]) => options[key]).map(([id, name]) => ({ id, name }));
const activeCategoryId = ref(categories[0]?.id ?? '');
const selected = ref({});
const isSubmitting = ref(false);
const activeCategory = computed(() => categories.find((category) => category.id === activeCategoryId.value));

function readOptions() {
  try { return JSON.parse(localStorage.getItem(`roomAdditionalOptions:${roomId}`) ?? '{}'); }
  catch { return {}; }
}

async function complete() {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    await myAxios.patch(`/rooms/${roomId}/participants/me/completion`, { completed: true }, { params: { memberId: authStore.user.id } });
    router.push({ name: 'vote-status-show', params: { roomId } });
  } finally { isSubmitting.value = false; }
}
</script>

<template>
  <main class="additional-vote-page">
    <button class="back" type="button" @click="router.back()">‹ 뒤로가기</button>
    <p class="room-label">투표방(여행방) 이름</p>
    <h1>마음에 드는 장소를 골라주세요.</h1>
    <div class="chips"><button v-for="category in categories" :key="category.id" type="button" :class="{ active: activeCategoryId === category.id }" @click="activeCategoryId = category.id">{{ category.name }}</button></div>
    <p class="progress">1 / 1</p>
    <section v-if="activeCategory" class="card-area">
      <div class="side left"></div><div class="side right"></div><button class="arrow left" type="button" disabled>‹</button><button class="arrow right" type="button" disabled>›</button>
      <article class="candidate-card"><div class="skeleton"></div><div class="card-body"><h2>{{ activeCategory.name }} 후보</h2><p>추천 후보 정보는 준비 중입니다.</p><button type="button" :class="{ selected: selected[activeCategory.id] }" @click="selected[activeCategory.id] = !selected[activeCategory.id]">이곳으로 할래요</button></div></article>
    </section>
    <button class="complete" type="button" :disabled="isSubmitting" @click="complete">{{ isSubmitting ? '처리 중' : '선택완료' }}</button>
    <BottomNav />
  </main>
</template>

<style scoped>
.additional-vote-page{min-height:100vh;padding-top:16px;overflow:hidden}.back{margin-left:22px;border:0;background:none;color:#aaa;font-size:10px}.room-label{margin:29px 22px 2px;color:#00bfc4;font-size:10px;font-weight:700}.additional-vote-page h1{margin:0 22px;font-size:16px;line-height:1.35}.chips{display:flex;gap:8px;margin:22px 22px 0}.chips button{padding:4px 12px;border:1px solid #00bfc4;border-radius:999px;background:#fff;color:#00bfc4;font-size:10px;font-weight:700}.chips button:hover,.chips button:active,.chips button.active{background:#00bfc4;color:#fff}.progress{margin-top:31px;color:#f04452;font-size:11px;font-weight:800;text-align:center}.card-area{position:relative;height:310px;margin-top:24px;display:flex;justify-content:center}.side{position:absolute;top:27px;width:60px;height:246px;border-radius:14px;background:#ddd}.side.left{left:-1px}.side.right{right:-1px}.arrow{position:absolute;z-index:2;top:108px;border:0;background:none;color:#202124;font-size:56px;line-height:.6}.arrow.left{left:42px}.arrow.right{right:42px}.candidate-card{position:relative;z-index:1;width:209px;height:309px;overflow:hidden;border-radius:15px;background:#fff;box-shadow:0 8px 15px rgb(23 33 31 / 8%)}.skeleton{height:170px;background:linear-gradient(110deg,#e7e7e7 25%,#f2f2f2 37%,#e7e7e7 63%);background-size:200% 100%;animation:skeleton 1.35s ease-in-out infinite}.card-body{padding:12px 14px}.card-body h2{font-size:14px}.card-body p{margin-top:5px;font-size:10px}.card-body button{display:block;width:110px;height:31px;margin:19px auto 0;border:1px solid #f04452;border-radius:999px;background:#fff;color:#f04452;font-size:10px;font-weight:700}.card-body button.selected,.card-body button:hover{background:#f04452;color:#fff}.complete{display:block;width:70px;height:30px;margin:48px auto 50px;border:0;border-radius:999px;background:#00bfc4;color:#fff;font-size:10px;font-weight:800}.additional-vote-page :deep(.bottom-nav){position:fixed;width:min(100%,390px);margin:auto}@keyframes skeleton{to{background-position:-200% 0}}@media(prefers-reduced-motion:reduce){.skeleton{animation:none}}
</style>
