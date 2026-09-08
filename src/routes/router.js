import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth/useAuthStore';

// 회원/세션 도메인이 아직 없어 홈 화면 라우트는 이 골격에 포함하지 않는다.
// 투표·코스 화면만 먼저 연결한다(계획 문서 3절 결정사항 4 - FE 공통 기반은 골격만).
const routes = [
  {
    path: '/',
    name: 'home-show',
    component: () => import('../pages/home/HomeShow.vue'),
  },
  {
    path: '/preview',
    name: 'preview-index',
    component: () => import('../pages/preview/PreviewIndex.vue'),
  },
  {
    path: '/places',
    name: 'place-index',
    component: () => import('../pages/place/PlaceIndex.vue'),
  },
  {
    path: '/places/:placeId',
    name: 'place-show',
    component: () => import('../pages/place/PlaceShow.vue'),
  },
  { 
    path: '/login', 
    name: 'login-show', 
    component: () => import('../pages/auth/LoginShow.vue') 
  },
  { 
    path: '/auth/callback', 
    name: 'auth-callback-show', 
    component: () => import('../pages/auth/AuthCallbackShow.vue') 
  },
  { 
    path: '/me', 
    name: 'my-page-show', 
    component: () => import('../pages/member/MyPageShow.vue'), 
    meta: { requiresAuth: true } 
  },
  {
    path: '/history',
    name: 'history-index',
    component: () => import('../pages/history/HistoryIndex.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/history/:courseId',
    name: 'history-show',
    component: () => import('../pages/history/HistoryShow.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/rooms/create',
    name: 'room-create',
    component: () => import('../pages/room/RoomCreate.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/invite/:inviteCode',
    name: 'invite-show',
    component: () => import('../pages/invite/InviteShow.vue'),
  },
  {
    path: '/rooms/:roomId/vote',
    name: 'vote-show',
    component: () => import('../pages/vote/VoteShow.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/rooms/:roomId/vote/status',
    name: 'vote-status-show',
    component: () => import('../pages/vote/VoteStatusShow.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  if (import.meta.env.DEV && (to.query.preview === '1' || sessionStorage.getItem('previewMode') === 'true')) {
    sessionStorage.setItem('previewMode', 'true');
    return true;
  }
  if (!to.meta.requiresAuth) return true;
  const authStore = useAuthStore();
  if (!authStore.isInitialized && !authStore.isAuthenticated) await authStore.restoreSession();
  if (authStore.isAuthenticated) return true;
  return { name: 'login-show', query: { returnTo: to.fullPath } };
});

router.onError((error) => {
  if (/Loading chunk|Failed to fetch dynamically imported module/.test(error.message)) {
    window.location.reload();
  }
});

export default router;
