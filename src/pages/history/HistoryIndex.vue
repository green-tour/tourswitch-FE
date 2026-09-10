<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import myAxios from '../../api/myAxios';
import AppHeader from '../../components/common/AppHeader.vue';
import AppState from '../../components/common/AppState.vue';
import BottomNav from '../../components/BottomNav.vue';
import { formatDate } from '../../util/date';

const router = useRouter();
const items = ref([]); const isLoading = ref(true); const errorMessage = ref('');
const fetchHistory = async () => { isLoading.value = true; errorMessage.value = ''; try { const { data } = await myAxios.get('/courses', { params: { page: 1, size: 20, status: 'CONFIRMED' } }); items.value = data.data.items ?? data.data ?? []; } catch { errorMessage.value = '여행 기록을 불러오지 못했습니다.'; } finally { isLoading.value = false; } };
onMounted(fetchHistory);
</script>
<template><main class="history-page"><AppHeader title="여행 기록" :show-back="false" /><AppState v-if="isLoading" type="loading" message="여행 기록을 불러오는 중입니다." /><AppState v-else-if="errorMessage" type="error" :message="errorMessage" @retry="fetchHistory" /><AppState v-else-if="!items.length" message="아직 완료한 여행이 없습니다." /><ul v-else><li v-for="item in items" :key="item.id"><button @click="router.push({ name: 'history-show', params: { courseId: item.id } })"><time>{{ formatDate(item.travelDate) }}</time><strong>{{ item.sessionName ?? item.title ?? '투표방(여행방)' }}</strong><span>관광지 {{ item.placeCount ?? item.stopCount ?? item.stops?.length ?? 0 }}곳 | 참여자 {{ item.participantCount ?? 0 }}명</span></button></li></ul><BottomNav /></main></template>
<style scoped>.history-page{min-height:100vh;padding:12px 20px 80px;display:flex;flex-direction:column}.history-page ul{list-style:none;display:grid;gap:16px;margin-top:24px}.history-page li button{width:100%;padding:20px;border:1px solid #a9e7e8;border-radius:16px;background:#fff;text-align:left;display:grid;gap:4px}.history-page time{font-size:12px}.history-page strong{font-size:19px;color:var(--team-color-primary)}.history-page span{font-size:14px}</style>
