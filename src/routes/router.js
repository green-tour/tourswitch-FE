import { createRouter, createWebHistory } from 'vue-router';

// 회원/세션 도메인이 아직 없어 홈 화면 라우트는 이 골격에 포함하지 않는다.
// 투표·코스 화면만 먼저 연결한다(계획 문서 3절 결정사항 4 - FE 공통 기반은 골격만).
const routes = [
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
  },
  {
    path: '/rooms/:roomId/vote/status',
    name: 'vote-status-show',
    component: () => import('../pages/vote/VoteStatusShow.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.onError((error) => {
  if (/Loading chunk|Failed to fetch dynamically imported module/.test(error.message)) {
    window.location.reload();
  }
});

export default router;
