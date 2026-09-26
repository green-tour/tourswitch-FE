<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppState from '../../components/common/AppState.vue';
import { useAuthStore } from '../../store/auth/useAuthStore';
import { consumeReturnTo } from '../../util/oauth';

const route = useRoute(); const router = useRouter(); const authStore = useAuthStore();
const errorMessage = ref('');
// 실패해도 원래 가려던 곳(초대 링크 등)은 유지해 다시 로그인하면 그리로 돌아가게 한다.
const retryReturnTo = ref('/');
const fail = (message) => {
  retryReturnTo.value = consumeReturnTo('/');
  errorMessage.value = message;
};
const authenticate = async () => {
  const responseCode = String(route.query.code ?? '');
  if (responseCode === '26') { fail('탈퇴한 계정입니다. 다시 로그인하면 재가입할 수 있습니다.'); return; }
  if (responseCode === '28') { fail('카카오 인증에 실패했습니다. 다시 시도해주세요.'); return; }
  if (responseCode !== '00') { fail('유효하지 않은 로그인 응답입니다.'); return; }
  try {
    await authStore.completeOAuthLogin();
    const returnTo = consumeReturnTo('/');
    router.replace(returnTo);
  } catch (error) {
    fail(error.response?.data?.message ?? '로그인하지 못했습니다.');
  }
};
const retryLogin = () => router.replace({ name: 'login-show', query: { returnTo: retryReturnTo.value } });
onMounted(authenticate);
</script>

<template><main class="callback"><AppState v-if="!errorMessage" type="loading" message="카카오 로그인을 완료하고 있습니다." /><AppState v-else type="error" :message="errorMessage" @retry="retryLogin" /></main></template>
<style scoped>.callback{min-height:100vh;display:flex}</style>
