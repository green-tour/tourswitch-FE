export const PLACE_CATEGORIES = [
  { name: '전체', code: null, image: '/figma-assets/category-all.png' },
  { name: '전시·박물관', code: 'EXHIBITION_MUSEUM', image: '/figma-assets/category-culture.png' },
  { name: '축제·행사', code: 'FESTIVAL_EVENT', image: '/figma-assets/category-culture.png' },
  { name: '도시공원', code: 'CITY_PARK', image: '/figma-assets/category-nature.png' },
  { name: '역사유적', code: 'HISTORICAL_RELIC', image: '/figma-assets/category-history.png' },
  { name: '레저스포츠', code: 'LEISURE_SPORTS', image: '/figma-assets/category-nature.png' },
  { name: '체험', code: 'EXPERIENCE', image: '/figma-assets/category-culture.png' },
  { name: '공연', code: 'PERFORMANCE', image: '/figma-assets/category-culture.png' },
  { name: '자연·산', code: 'NATURE_MOUNTAIN', image: '/figma-assets/category-nature.png' },
  { name: '종교성지', code: 'RELIGIOUS_SITE', image: '/figma-assets/category-history.png' },
  { name: '골목·거리·둘레길', code: 'STREET_TRAIL', image: '/figma-assets/category-walk.png' },
  { name: '랜드마크·전망', code: 'LANDMARK_VIEW', image: '/figma-assets/category-walk.png' },
  { name: '테마파크', code: 'THEME_PARK', image: '/figma-assets/category-culture.png' },
];

export const PLACE_CATEGORY_CODES = Object.fromEntries(
  PLACE_CATEGORIES.map(({ name, code }) => [name, code]),
);
