<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppState from '../../components/common/AppState.vue';
import { useAuthStore } from '../../store/auth/useAuthStore';
import { consumeReturnTo } from '../../util/oauth';

const route = useRoute(); const router = useRouter(); const authStore = useAuthStore();
const errorMessage = ref('');
const authenticate = async () => {
  const responseCode = String(route.query.code ?? '');
  if (responseCode === '26') { errorMessage.value = '탈퇴한 계정은 다시 로그인할 수 없습니다.'; return; }
  if (responseCode === '28') { errorMessage.value = '카카오 인증에 실패했습니다. 다시 시도해주세요.'; return; }
  if (responseCode !== '00') { errorMessage.value = '유효하지 않은 로그인 응답입니다.'; return; }
  try {
    await authStore.completeOAuthLogin();
    const returnTo = consumeReturnTo('/');
    router.replace(returnTo);
  } catch (error) {
    consumeReturnTo();
    errorMessage.value = error.response?.data?.message ?? '로그인하지 못했습니다.';
  }
};
onMounted(authenticate);
</script>

<template><main class="callback"><AppState v-if="!errorMessage" type="loading" message="카카오 로그인을 완료하고 있습니다." /><AppState v-else type="error" :message="errorMessage" @retry="router.replace('/login')" /></main></template>
<style scoped>.callback{min-height:100vh;display:flex}</style>
