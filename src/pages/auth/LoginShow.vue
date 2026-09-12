<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { preserveReturnTo } from '../../util/oauth';

const route = useRoute();
// 일반 로그인은 홈으로 이동하고, 보호된 화면에서 진입한 경우에만 원래 경로로 복귀한다.
const returnTo = computed(() => route.query.returnTo ?? '/');
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

const startKakaoLogin = () => {
  preserveReturnTo(returnTo.value);
  window.location.assign(`${apiBaseUrl}/auth/login`);
};
</script>

<template>
  <main class="login-page">
    <div class="brand">투어 스위치</div>
    <section><div class="symbol">🌍</div><h1>여행의 선택을<br />더 즐겁게</h1><p>친구들과 서울 여행지를 고르고<br />우리만의 코스를 만들어보세요.</p></section>
    <div class="login-actions">
      <button class="kakao" type="button" aria-label="카카오 로그인" @click="startKakaoLogin">
        <img src="/kakao/kakao_login_medium_wide.png" alt="카카오 로그인" width="300" height="45" />
      </button>
    </div>
  </main>
</template>

<style scoped>
.login-page{min-height:100vh;padding:24px;display:flex;flex-direction:column}.brand{font-size:21px;font-weight:800}.login-page section{margin:auto 0;text-align:center}.symbol{font-size:88px;margin-bottom:24px}.login-page h1{font-size:32px;line-height:1.3}.login-page section p{margin-top:16px;color:var(--team-color-gray-600)}.login-actions{display:grid;justify-items:center;gap:8px;padding-bottom:40px}.kakao{width:300px;height:45px;padding:0;border:0;border-radius:6px;background:none;overflow:hidden;cursor:pointer}.kakao img{display:block;width:300px;height:45px}.kakao:focus-visible{outline:2px solid #191919;outline-offset:3px}.login-actions p{text-align:center;color:var(--team-color-danger);font-size:12px}
</style>
