const RETURN_TO_KEY = 'returnTo';
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

// 인가 요청은 반드시 FE 도메인에서 시작한다. 카카오 콜백이 FE 도메인으로 돌아오므로
// BE 도메인으로 리다이렉트되는 /auth/login을 거치면 인가 세션 쿠키가 없어 로그인이 실패한다.
export const startKakaoLogin = (returnTo) => {
  preserveReturnTo(returnTo);
  window.location.assign(`${apiBaseUrl}/auth/oauth2/authorization/kakao`);
};

export const preserveReturnTo = (returnTo) => {
  sessionStorage.setItem(RETURN_TO_KEY, returnTo);
};

export const consumeReturnTo = (fallback = '/') => {
  const storedPath = sessionStorage.getItem(RETURN_TO_KEY);
  sessionStorage.removeItem(RETURN_TO_KEY);
  return storedPath?.startsWith('/') && !storedPath.startsWith('//') ? storedPath : fallback;
};
