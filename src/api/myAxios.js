import axios from 'axios';
import { isMockMode, mockAdapter } from './mockAdapter';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const myAxios = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// 재발급 요청은 인터셉터를 타지 않는 별도 인스턴스로 보낸다. 같은 인스턴스를 쓰면
// 재발급이 401일 때 인터셉터가 다시 재발급을 시도해 무한히 반복된다.
const refreshAxios = axios.create({ baseURL, withCredentials: true });

let accessToken = '';
let onSessionExpired = null;
let refreshPromise = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

// 순환 import를 피하려고 스토어가 만료 처리를 등록해 넘긴다.
export const setSessionExpiredHandler = (handler) => {
  onSessionExpired = handler;
};

myAxios.interceptors.request.use((config) => {
  if (isMockMode()) config.adapter = mockAdapter;
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// 액세스 토큰은 1시간짜리라 방을 열어두고 기다리는 동안 만료될 수 있다.
// 401을 만나면 한 번만 재발급하고 원래 요청을 다시 보낸다.
const AUTH_PATHS = ['/auth/refresh', '/auth/logout'];

const refreshAccessToken = async () => {
  // 동시에 여러 요청이 401을 받아도 재발급은 한 번만 돈다.
  refreshPromise ??= refreshAxios.post('/auth/refresh')
    .then(({ data }) => {
      const token = data?.data?.accessToken;
      if (!token) throw new Error('재발급 응답에 토큰이 없습니다.');
      setAccessToken(token);
      return token;
    })
    .finally(() => { refreshPromise = null; });
  return refreshPromise;
};

myAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const isUnauthorized = error.response?.status === 401;
    const isAuthCall = AUTH_PATHS.some((path) => (config?.url ?? '').includes(path));

    if (!isUnauthorized || !config || config.hasRetriedAfterRefresh || isAuthCall || isMockMode()) {
      return Promise.reject(error);
    }

    // 재발급 실패만 세션 만료로 본다. 재시도한 요청이 다른 이유로 실패한 것까지
    // 여기서 잡으면 500이나 네트워크 오류에도 로그아웃시키게 된다.
    let token;
    try {
      token = await refreshAccessToken();
    } catch {
      setAccessToken('');
      onSessionExpired?.();
      return Promise.reject(error);
    }

    config.hasRetriedAfterRefresh = true;
    // axios의 AxiosHeaders 인스턴스를 그대로 두고 값만 바꾼다. 평범한 객체로 펼치면
    // 인스턴스가 들고 있던 정규화 동작을 잃는다.
    config.headers.Authorization = `Bearer ${token}`;
    return myAxios(config);
  },
);

export default myAxios;
