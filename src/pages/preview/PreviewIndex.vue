<script setup>
import { onMounted } from 'vue';
const pages = [{ label:'메인',to:'/?preview=1'},{label:'로그인',to:'/login?preview=1'},{label:'여행방 생성',to:'/rooms/create?preview=1'},{label:'초대 참여',to:'/invite/preview?preview=1'},{label:'관광지 투표',to:'/rooms/preview-room/vote?preview=1'},{label:'투표 현황',to:'/rooms/preview-room/vote/status?preview=1'},{label:'여행 기록',to:'/history?preview=1'},{label:'여행 기록 상세',to:'/history/preview-course?preview=1'},{label:'마이페이지',to:'/me?preview=1'}];
onMounted(()=>sessionStorage.setItem('previewMode','true'));
</script>
<template><main><h1>화면 미리보기</h1><p>백엔드 없이 디자인과 동작을 확인할 수 있습니다.</p><nav><a v-for="page in pages" :key="page.to" :href="page.to">{{ page.label }}<span>›</span></a></nav></main></template>
<style scoped>main{min-height:100vh;padding:40px 24px}h1{font-size:25px}p{margin:8px 0 28px;color:var(--team-color-gray-600)}nav{display:grid;gap:10px}a{padding:16px 18px;border:var(--team-border-default);border-radius:14px;display:flex;justify-content:space-between;font-weight:700}a:hover{border-color:var(--team-color-primary);color:var(--team-color-primary-dark)}</style>
