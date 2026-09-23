<script setup>
import { ref } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

defineProps({
  loggedIn: Boolean,
  nickname: { type: String, default: '카카오톡 닉네임' },
  avatarUrl: { type: String, default: '' },
});

const emit = defineEmits(['close', 'navigate', 'navigate-place', 'open-today-course', 'logout']);

const recentPlace = ref(readRecentPlace());

function readRecentPlace() {
  try {
    const place = JSON.parse(localStorage.getItem('recentViewedPlace') ?? 'null');
    return place?.id && place?.name ? place : null;
  } catch {
    localStorage.removeItem('recentViewedPlace');
    return null;
  }
}
</script>

<template>
  <div class="drawer-overlay" @click.self="emit('close')">
    <aside class="drawer" aria-label="전체 메뉴">
      <header>
        <button type="button" aria-label="닫기" @click="emit('close')"><FontAwesomeIcon :icon="faXmark" /></button>
      </header>

      <div v-if="loggedIn" class="profile">
        <strong>{{ nickname }}</strong>
      </div>
      <nav v-else class="auth-menu">
        <button class="login" type="button" @click="emit('navigate', 'login-show')">로그인</button>
        <button type="button" @click="emit('navigate', 'login-show')">회원가입</button>
      </nav>

      <nav class="main-menu">
        <small>여행</small>
        <button type="button" @click="emit('navigate', 'history-index')">여행 기록</button>
        <button type="button" @click="emit('open-today-course')">오늘의 코스</button>
        <button type="button" @click="emit('navigate', 'room-create')">투표방 만들기</button>
        <template v-if="loggedIn">
          <small class="account-label">계정</small>
          <button type="button" @click="emit('navigate', 'my-page-show')">회원 정보 수정</button>
          <button type="button" @click="emit('logout')">로그 아웃</button>
        </template>
      </nav>

      <section class="recent">
        <small>최근 본 항목</small>
        <button
          v-if="recentPlace"
          class="recent-card"
          type="button"
          :aria-label="`${recentPlace.name} 상세 보기`"
          @click="emit('navigate-place', recentPlace.id)"
        >
          <img :src="recentPlace.imageUrl" :alt="recentPlace.name" />
          <span>{{ recentPlace.name }}</span>
        </button>
        <div v-else class="recent-empty">최근 본 관광지가 없습니다.</div>
      </section>
    </aside>
  </div>
</template>

<style scoped>
.drawer-overlay{position:fixed;z-index:20;top:0;bottom:0;left:50%;width:min(100%,390px);transform:translateX(-50%);background:#0009}.drawer{position:absolute;top:0;right:0;width:268px;height:100%;display:flex;flex-direction:column;overflow-y:auto;scrollbar-width:none;background:#fff;color:#050505;-webkit-overflow-scrolling:touch}.drawer::-webkit-scrollbar{display:none}.drawer button{padding:0;border:0;background:none;color:inherit;font-family:inherit;cursor:pointer}.drawer header{height:58px;flex-shrink:0;padding:0 27px 0 17px;display:flex;align-items:center}.drawer header>button{font-size:20px}.profile{height:120px;padding-right:27px;display:flex;flex-direction:column;align-items:flex-end;justify-content:flex-end}.profile strong{min-width:122px;margin-bottom:32px;padding-bottom:40px;border-bottom:1px solid #e5e5e5;font-size:21px;line-height:26px;text-align:right}.auth-menu{height:136px;padding:18px 29px 0;display:grid;align-content:start;justify-items:end;gap:20px}.auth-menu button{font-size:16px;font-weight:700}.auth-menu .login{color:#00bfc4}.main-menu{padding:8px 29px 0;display:flex;flex-direction:column;align-items:flex-end;gap:23px}.main-menu small,.recent small{color:#aaa;font-size:12px}.main-menu button{font-size:17px;font-weight:700;line-height:1.15}.main-menu .account-label{margin-top:14px}.recent{padding:36px 28px 30px;display:flex;flex-direction:column;align-items:flex-end;gap:15px}.recent-card{position:relative;width:145px;height:145px;border-radius:11px;overflow:hidden;background:#d9d9d9}.recent-card img{width:100%;height:100%;object-fit:cover}.recent-card:after{content:'';position:absolute;inset:50% 0 0;background:linear-gradient(transparent,#0009)}.recent-card span{position:absolute;z-index:1;right:9px;bottom:8px;max-width:125px;overflow:hidden;color:#fff;font-size:11px;font-weight:700;text-overflow:ellipsis;white-space:nowrap}.recent-empty{display:grid;place-items:center;width:145px;height:145px;border-radius:11px;background:#f1f3f2;color:#89928f;font-size:10px;text-align:center}
@media(max-height:720px){.auth-menu{height:112px}.main-menu{gap:16px}.recent{padding-top:22px}.recent-card,.recent-empty{width:120px;height:120px}}
</style>
