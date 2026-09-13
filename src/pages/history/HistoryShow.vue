<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import myAxios from '../../api/myAxios';
import AppButton from '../../components/common/AppButton.vue';
import AppHeader from '../../components/common/AppHeader.vue';
import AppState from '../../components/common/AppState.vue';
import BottomNav from '../../components/BottomNav.vue';
import { useAuthStore } from '../../store/auth/useAuthStore';
import { formatDate } from '../../util/date';

const route = useRoute(); const router = useRouter();
const authStore = useAuthStore();
const course = ref(null); const isLoading = ref(true); const errorMessage = ref('');
const fetchDetail = async () => { isLoading.value = true; errorMessage.value = ''; try { course.value = (await myAxios.get(`/courses/${route.params.courseId}`, { params: { memberId: authStore.user.id } })).data.data; } catch { errorMessage.value = '여행 기록 상세를 불러오지 못했습니다.'; } finally { isLoading.value = false; } };
onMounted(fetchDetail);
</script>
<template><main class="detail-page"><AppHeader @back="router.back()" /><AppState v-if="isLoading" type="loading" message="여행 기록을 불러오는 중입니다." /><AppState v-else-if="errorMessage" type="error" :message="errorMessage" @retry="fetchDetail" /><template v-else><header><h1>{{ course.sessionName ?? '투표방(여행방)' }}</h1><p>{{ formatDate(course.travelDate) }} | 참여자 {{ course.participantCount ?? 0 }}명</p></header><section><h2>여행 코스</h2><ol><li v-for="(stop,index) in course.stops" :key="stop.id"><span>{{ stop.order ?? index + 1 }}</span><strong>{{ stop.place?.name ?? stop.name ?? '제공 정보 없음' }}</strong></li></ol></section><AppButton class="remake" @click="router.push({ name: 'room-create', query: { sourceCourseId: course.id } })">같은 조건으로 방 만들기</AppButton></template><BottomNav /></main></template>
<style scoped>.detail-page{min-height:100vh;padding:12px 20px 80px;display:flex;flex-direction:column}.detail-page>header{margin:22px 4px 28px}.detail-page h1{font-size:20px}.detail-page header p{margin-top:8px;font-size:12px}.detail-page h2{font-size:15px;margin:0 4px 12px}.detail-page ol{list-style:none;display:grid;gap:10px}.detail-page li{min-height:54px;padding:10px 18px;border:1px solid #a9e7e8;border-radius:16px;display:flex;align-items:center;gap:22px}.detail-page li span{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:var(--team-color-primary);color:#fff;font-size:12px}.detail-page li strong{font-size:14px}.remake{margin:auto auto 24px}</style>
