export const PLACE_CATEGORIES = [
  { name: '전체', code: null, image: '/icons/categories/all.png' },
  { name: '전시·박물관', code: 'EXHIBITION_MUSEUM', image: '/icons/categories/museum.png' },
  { name: '축제·행사', code: 'FESTIVAL_EVENT', image: '/icons/categories/festival.png' },
  { name: '도시공원', code: 'CITY_PARK', image: '/icons/categories/park.png' },
  { name: '역사유적', code: 'HISTORICAL_RELIC', image: '/icons/categories/history.png' },
  { name: '레저스포츠', code: 'LEISURE_SPORTS', image: '/icons/categories/sports.png' },
  { name: '체험', code: 'EXPERIENCE', image: '/icons/categories/experience.png' },
  { name: '공연', code: 'PERFORMANCE', image: '/icons/categories/performance.png' },
  { name: '자연·산', code: 'NATURE_MOUNTAIN', image: '/icons/categories/mountain.png' },
  { name: '종교성지', code: 'RELIGIOUS_SITE', image: '/icons/categories/religion.png' },
  { name: '골목·거리·둘레길', code: 'STREET_TRAIL', image: '/icons/categories/trail.png' },
  { name: '랜드마크·전망', code: 'LANDMARK_VIEW', image: '/icons/categories/landmark.png' },
  { name: '테마파크', code: 'THEME_PARK', image: '/icons/categories/theme-park.png' },
];

export const PLACE_CATEGORY_CODES = Object.fromEntries(
  PLACE_CATEGORIES.map(({ name, code }) => [name, code]),
);
