<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppButton from '../../components/common/AppButton.vue';

const route = useRoute();
const returnTo = computed(() => route.query.returnTo ?? '/rooms/create');
const kakaoClientId = import.meta.env.VITE_KAKAO_CLIENT_ID;
const redirectUri = `${window.location.origin}/auth/callback`;

const startKakaoLogin = () => {
  sessionStorage.setItem('returnTo', returnTo.value);
  if (!kakaoClientId) return;
  const query = new URLSearchParams({ client_id: kakaoClientId, redirect_uri: redirectUri, response_type: 'code' });
  window.location.assign(`https://kauth.kakao.com/oauth/authorize?${query}`);
};
</script>

<template>
  <main class="login-page">
    <div class="brand">투어 스위치</div>
    <section><div class="symbol">🌍</div><h1>여행의 선택을<br />더 즐겁게</h1><p>친구들과 서울 여행지를 고르고<br />우리만의 코스를 만들어보세요.</p></section>
    <div class="login-actions"><AppButton class="kakao" size="large" block @click="startKakaoLogin">● 카카오 로그인</AppButton><p v-if="!kakaoClientId">카카오 앱 키 설정이 필요합니다.</p></div>
  </main>
</template>

<style scoped>
.login-page{min-height:100vh;padding:24px;display:flex;flex-direction:column}.brand{font-size:21px;font-weight:800}.login-page section{margin:auto 0;text-align:center}.symbol{font-size:88px;margin-bottom:24px}.login-page h1{font-size:32px;line-height:1.3}.login-page section p{margin-top:16px;color:var(--team-color-gray-600)}.login-actions{display:grid;gap:8px}.kakao{background:#feefee;color:#191919}.login-actions p{text-align:center;color:var(--team-color-danger);font-size:12px}
</style>
