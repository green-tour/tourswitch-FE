<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import myAxios from '../../api/myAxios';
import AppButton from '../../components/common/AppButton.vue';
import AppHeader from '../../components/common/AppHeader.vue';
import AppState from '../../components/common/AppState.vue';
import { useAuthStore } from '../../store/auth/useAuthStore';
import { isMockMode } from '../../api/mockAdapter';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const invite = ref(null);
const isLoading = ref(true);
const isJoining = ref(false);
const errorMessage = ref('');
const isAuthenticated = computed(() => authStore.isAuthenticated || isMockMode());

const fetchInvite = async () => {
  isLoading.value = true; errorMessage.value = '';
  try { invite.value = (await myAxios.get(`/invites/${route.params.inviteCode}`)).data.data; }
  catch (error) { errorMessage.value = error.response?.data?.message ?? '유효하지 않거나 종료된 초대 링크입니다.'; }
  finally { isLoading.value = false; }
};

const continueInvite = async () => {
  if (!isAuthenticated.value) {
    sessionStorage.setItem('returnTo', route.fullPath);
    router.push({ name: 'login-show', query: { returnTo: route.fullPath } });
    return;
  }
  isJoining.value = true;
  try {
    const data = (await myAxios.post(`/invites/${route.params.inviteCode}/participants`)).data.data;
    router.replace({ name: 'vote-show', params: { roomId: data.sessionId ?? invite.value.sessionId } });
  } catch (error) { errorMessage.value = error.response?.data?.message ?? '여행방에 참여하지 못했습니다.'; }
  finally { isJoining.value = false; }
};

onMounted(fetchInvite);
</script>

<template>
  <main class="invite-page">
    <AppHeader :show-back="false" />
    <AppState v-if="isLoading" type="loading" message="초대 정보를 확인하고 있습니다." />
    <AppState v-else-if="errorMessage" type="error" :message="errorMessage" @retry="fetchInvite" />
    <section v-else class="invite-content">
      <p class="eyebrow">투표방(여행방) 초대</p><h1>함께 여행지를 골라볼까요?</h1><p>여행 투표에 초대받았어요.</p>
      <article><strong>{{ invite.travelDate }}</strong><span>서울 여행 · 후보 카드를 골라주세요</span></article>
      <AppButton class="kakao" size="large" block :loading="isJoining" @click="continueInvite">{{ isAuthenticated ? '여행방 참여하기' : '카카오 로그인' }}</AppButton>
    </section>
  </main>
</template>

<style scoped>
.invite-page{min-height:100vh;padding:12px 20px}.invite-content{padding-top:64px;display:flex;flex-direction:column;gap:16px}.eyebrow{color:var(--team-color-primary);font-weight:700}.invite-content h1{font-size:24px}.invite-content>p{color:var(--team-color-gray-600)}article{margin:2px 0 14px;padding:22px;border:1px solid #a9e7e8;border-radius:16px;display:grid;gap:12px}article span{font-size:13px;color:var(--team-color-gray-600)}.kakao{background:#fee500;color:#191919}
</style>
