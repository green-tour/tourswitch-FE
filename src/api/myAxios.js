import axios from 'axios';

// 회원 도메인의 JWT 인증이 아직 배선되지 않아, 토큰 재발급/Authorization 헤더 로직은
// 넣지 않는다(F5 관례의 인터셉터는 인증이 실제로 붙는 시점에 추가한다 - 아직 없는 걸
// 미리 만들어두지 않는다).
const myAxios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

export default myAxios;
