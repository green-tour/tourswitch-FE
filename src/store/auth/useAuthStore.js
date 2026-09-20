import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import myAxios, { setAccessToken, setSessionExpiredHandler } from '../../api/myAxios';

export const useAuthStore = defineStore('authStore', () => {
  const user = ref(null);
  const accessToken = ref('');
  const isInitialized = ref(false);
  const isAuthenticated = computed(() => Boolean(accessToken.value));

  const applySession = (data) => {
    if (!data?.accessToken) throw new Error('인증 토큰이 응답에 없습니다.');
    accessToken.value = data.accessToken;
    if (data.user) user.value = data.user;
    setAccessToken(data.accessToken);
    isInitialized.value = true;
  };

  const completeOAuthLogin = async () => {
    const { data } = await myAxios.post('/auth/refresh');
    applySession(data.data);
    await fetchMe();
    return data.data;
  };

  const restoreSession = async () => {
    try {
      const { data } = await myAxios.post('/auth/refresh');
      applySession(data.data);
      await fetchMe();
      return true;
    } catch { clearSession(); return false; }
    finally { isInitialized.value = true; }
  };

  const fetchMe = async () => {
    const { data } = await myAxios.get('/users/me');
    user.value = data.data;
    return user.value;
  };

  const clearSession = () => { accessToken.value = ''; user.value = null; setAccessToken(''); };

  // 재발급까지 실패하면 인터셉터가 이 스토어의 상태도 비워야 가드가 로그인으로 보낸다.
  // isInitialized도 되돌려, 일시적 실패였다면 다음 화면 이동 때 가드가 복원을 한 번 더 시도한다.
  setSessionExpiredHandler(() => { accessToken.value = ''; user.value = null; isInitialized.value = false; });

  const logout = async () => { try { await myAxios.post('/auth/logout'); } finally { clearSession(); } };

  return { user, accessToken, isAuthenticated, isInitialized, completeOAuthLogin, restoreSession, fetchMe, logout, clearSession };
});
