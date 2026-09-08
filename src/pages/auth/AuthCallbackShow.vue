<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppState from '../../components/common/AppState.vue';
import { useAuthStore } from '../../store/auth/useAuthStore';

const route = useRoute(); const router = useRouter(); const authStore = useAuthStore();
const errorMessage = ref('');
const authenticate = async () => {
  if (!route.query.code) { errorMessage.value = '카카오 인증 정보가 없습니다.'; return; }
  try {
    await authStore.login(route.query.code, `${window.location.origin}/auth/callback`);
    const returnTo = sessionStorage.getItem('returnTo') ?? '/rooms/create';
    sessionStorage.removeItem('returnTo');
    router.replace(returnTo);
  } catch (error) { errorMessage.value = error.response?.data?.message ?? '로그인하지 못했습니다.'; }
};
onMounted(authenticate);
</script>

<template><main class="callback"><AppState v-if="!errorMessage" type="loading" message="카카오 로그인을 완료하고 있습니다." /><AppState v-else type="error" :message="errorMessage" @retry="router.replace('/login')" /></main></template>
<style scoped>.callback{min-height:100vh;display:flex}</style>
