const places = [
  { id: 'place-1', name: '서울숲', summary: '35만 평 도심 속 숲, 사슴 방사장과 나비 정원을 지나 서울숲 카페거리까지 이어져요.', imageUrl: '/figma-assets/seoul-forest.png', categoryCodes: ['CITY_PARK', 'NATURE_MOUNTAIN'], accessibility: { wheelchair: 'AVAILABLE', stroller: 'AVAILABLE' }, congestion: { level: '여유' } },
  { id: 'place-2', name: '북촌 한옥마을', summary: '서울의 오래된 골목을 천천히 걸어보세요.', imageUrl: null, categoryCodes: ['HISTORICAL_RELIC', 'STREET_TRAIL'], accessibility: {}, congestion: { level: '보통' } },
  { id: 'place-3', name: '석촌호수', summary: '호수를 따라 걷기 좋은 산책 명소예요.', imageUrl: null, categoryCodes: ['CITY_PARK', 'NATURE_MOUNTAIN'], accessibility: {}, congestion: { level: '여유' } },
  { id: 'place-4', name: '동대문 DDP', summary: '전시와 공연을 함께 즐길 수 있어요.', imageUrl: null, categoryCodes: ['EXHIBITION_MUSEUM', 'PERFORMANCE'], accessibility: {}, congestion: { level: '보통' } },
  { id: 'place-5', name: '남산 서울타워', summary: '서울 도심을 한눈에 바라보세요.', imageUrl: null, categoryCodes: ['LANDMARK_VIEW', 'NATURE_MOUNTAIN'], accessibility: {}, congestion: { level: '혼잡' } },
];

const response = (config, data) => Promise.resolve({ data: { code: '00', message: '정상 처리되었습니다.', data }, status: 200, statusText: 'OK', headers: {}, config });

export const isMockMode = () => import.meta.env.DEV && sessionStorage.getItem('previewMode') === 'true';

export const mockAdapter = (config) => {
  const url = config.url ?? '';
  if (url === '/auth/login') return response(config, { user: { id: 'preview-user', nickname: '카카오톡 닉네임' }, newUser: false, accessToken: 'preview-access-token', expiresIn: 3600 });
  if (url === '/auth/refresh') return response(config, { user: { id: 'preview-user', nickname: '카카오톡 닉네임' }, accessToken: 'preview-access-token', expiresIn: 3600 });
  if (url === '/auth/logout') return response(config, null);
  if (url === '/rooms' && config.method === 'post') return response(config, { roomId: 'preview-room', inviteToken: 'preview', roomName: config.data?.roomName, travelDate: config.data?.travelDate, regionId: config.data?.regionId, keywordIds: config.data?.keywordIds, candidateCount: 14, status: 'VOTING' });
  if (url === '/places') {
    const requestedCodes = Array.isArray(config.params?.keywordCodes)
      ? config.params.keywordCodes
      : config.params?.keywordCodes ? [config.params.keywordCodes] : [];
    const filteredPlaces = requestedCodes.length
      ? places.filter((place) => requestedCodes.some((code) => place.categoryCodes.includes(code)))
      : places;
    return response(config, { items: filteredPlaces.map((place) => ({ ...place, regionName: '성동구' })), totalCount: filteredPlaces.length, page: 1, size: 20, hasNext: false });
  }
  if (url.startsWith('/places/')) return response(config, { ...(places.find((place) => place.id === url.split('/').pop()) ?? places[0]), regionName: '성동구', address: '-' });
  if (url === '/metadata/regions') return response(config, [{ code: 'SEOUL-GANGNAM', name: '강남구' }, { code: 'SEOUL-GANGDONG', name: '강동구' }, { code: 'SEOUL-JONGNO', name: '종로구' }, { code: 'SEOUL-SEONGDONG', name: '성동구' }, { code: 'SEOUL-MAPO', name: '마포구' }]);
  if (url === '/metadata/keywords') return response(config, [{ code: 'HISTORY', name: '역사문화' }, { code: 'CULTURE', name: '문화예술' }, { code: 'NATURE', name: '숲체험' }, { code: 'CITY', name: '도시공원' }, { code: 'LEISURE', name: '레저스포츠' }, { code: 'WALK', name: '걷기' }]);
  if (url === '/users/me') return response(config, { id: 'preview-user', nickname: '카카오톡 닉네임', avatarUrl: null });
  if (url === '/vote-sessions' && config.method === 'post') return response(config, { session: { id: 'preview-room', status: 'VOTING' }, invite: { code: 'preview', url: `${location.origin}/invite/preview?preview=1` }, candidateCount: 14 });
  if (url.startsWith('/invites/')) return response(config, { valid: true, sessionId: 'preview-room', travelDate: '2026-08-15', status: 'VOTING', requiresAuthentication: true });
  if (url.includes('/participants') && config.method === 'post') return response(config, { sessionId: 'preview-room' });
  if (url.endsWith('/candidates')) return response(config, { candidateGroups: ['HISTORY', 'CULTURE', 'CITY'].map((keywordCode) => ({ keywordCode, items: places.map((place, index) => ({ place, myVote: index === 0, displayOrder: index + 1 })) })) });
  if (url.endsWith('/vote-status')) return response(config, { roomStatus: 'VOTING', isHost: true, participants: [{ memberId: '1', nickname: '지현', completed: true }, { memberId: '2', nickname: '민재', completed: false }, { memberId: '3', nickname: '수아', completed: true }, { memberId: '4', nickname: '태오', completed: false }], candidates: places.map((place, index) => ({ place, voteCount: Math.max(1, 5 - index) })) });
  if (url.endsWith('/votes/tally')) return response(config, { roomStatus: 'VOTING', participants: [{ memberId: 'preview-user', completed: false }], candidates: places.map((place, index) => ({ candidateId: index + 1, touristSpotId: index + 1, displayOrder: index + 1, voteCount: Math.max(1, 5 - index) })) });
  if (url === '/courses') return response(config, { items: [{ id: 'preview-course', travelDate: '2026-08-15', sessionName: '여름 서울 여행', stopCount: 5, participantCount: 4 }, { id: 'preview-course-2', travelDate: '2026-05-03', sessionName: '친구들과 봄나들이', stopCount: 3, participantCount: 3 }] });
  if (url.startsWith('/courses/')) return response(config, { id: 'preview-course', travelDate: '2026-08-15', sessionName: '여름 서울 여행', participantCount: 4, stops: places.map((place, index) => ({ id: place.id, order: index + 1, place })) });
  return response(config, {});
};
