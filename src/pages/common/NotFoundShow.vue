<script setup>
import { useRouter } from 'vue-router';
import BottomNav from '../../components/BottomNav.vue';

const router = useRouter();
</script>

<template>
  <main class="not-found">
    <p class="code">404</p>
    <h1>찾을 수 없는 페이지예요.</h1>
    <p class="hint">주소가 바뀌었거나 삭제된 화면일 수 있습니다.</p>
    <button type="button" @click="router.replace({ name: 'home-show' })">홈으로 가기</button>
    <BottomNav />
  </main>
</template>

<style scoped>
.not-found{min-height:100vh;padding:120px 24px 92px;text-align:center}
.code{color:var(--team-color-primary);font-size:40px;font-weight:800}
.not-found h1{margin-top:12px;font-size:17px}
.hint{margin-top:8px;color:var(--team-color-gray-600);font-size:12px}
.not-found button{margin-top:28px;padding:11px 26px;border:0;border-radius:999px;background:var(--team-color-primary);color:#fff;font-size:12px;font-weight:700}
</style>
