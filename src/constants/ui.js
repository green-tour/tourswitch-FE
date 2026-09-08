export const UI_MESSAGE = Object.freeze({
  loading: '불러오는 중...',
  empty: '표시할 정보가 없습니다.',
  unknown: '제공 정보 없음',
  requestFailed: '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
});

export const ROOM_STATUS = Object.freeze({
  VOTING: 'VOTING',
  CLOSED: 'CLOSED',
  VOTING_CLOSED: 'VOTING_CLOSED',
  COURSE_CONFIRMED: 'COURSE_CONFIRMED',
});

export const ROOM_STATUS_LABEL = Object.freeze({
  [ROOM_STATUS.VOTING]: '투표 진행 중',
  [ROOM_STATUS.CLOSED]: '투표 종료',
  [ROOM_STATUS.VOTING_CLOSED]: '투표 종료',
  [ROOM_STATUS.COURSE_CONFIRMED]: '코스 확정',
});
