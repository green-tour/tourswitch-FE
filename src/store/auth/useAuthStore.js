import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import myAxios, { setAccessToken } from '../../api/myAxios';

export const useAuthStore = defineStore('authStore', () => {
  const user = ref(null);
  const accessToken = ref('');
  const isInitialized = ref(false);
  const isAuthenticated = computed(() => Boolean(accessToken.value));

  const applySession = (data) => {
    accessToken.value = data.accessToken;
    user.value = data.user;
    setAccessToken(data.accessToken);
  };

  const login = async (oauthCode, redirectUri) => {
    const { data } = await myAxios.post('/auth/login', { oauthCode, redirectUri });
    applySession(data.data);
    return data.data;
  };

  const restoreSession = async () => {
    try {
      const { data } = await myAxios.post('/auth/refresh');
      applySession(data.data);
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
  const logout = async () => { try { await myAxios.post('/auth/logout'); } finally { clearSession(); } };

  return { user, accessToken, isAuthenticated, isInitialized, login, restoreSession, fetchMe, logout, clearSession };
});
