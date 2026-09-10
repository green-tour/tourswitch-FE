<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faBell, faGear, faXmark } from '@fortawesome/free-solid-svg-icons';

defineProps({
  loggedIn: Boolean,
  nickname: { type: String, default: '카카오톡 닉네임' },
  avatarUrl: { type: String, default: '' },
});

const emit = defineEmits(['close', 'navigate', 'logout']);
</script>

<template>
  <div class="drawer-overlay" @click.self="emit('close')">
    <aside class="drawer" aria-label="전체 메뉴">
      <header>
        <button type="button" aria-label="닫기" @click="emit('close')"><FontAwesomeIcon :icon="faXmark" /></button>
        <div>
          <button type="button" aria-label="알림"><FontAwesomeIcon :icon="faBell" /></button>
          <button type="button" aria-label="설정"><FontAwesomeIcon :icon="faGear" /></button>
        </div>
      </header>

      <div v-if="loggedIn" class="profile">
        <span class="avatar"><img v-if="avatarUrl" :src="avatarUrl" alt="프로필 이미지" /></span>
        <strong>{{ nickname }}</strong>
        <small>프로필 편집</small>
      </div>
      <nav v-else class="auth-menu">
        <button class="login" type="button" @click="emit('navigate', 'login-show')">로그인</button>
        <button type="button" @click="emit('navigate', 'login-show')">회원가입</button>
      </nav>

      <nav class="main-menu">
        <small>여행</small>
        <button type="button" @click="emit('navigate', 'history-index')">여행 기록</button>
        <button type="button">오늘의 코스</button>
        <button type="button" @click="emit('navigate', 'room-create')">투표방( 여행방) 만들기</button>
        <template v-if="loggedIn">
          <small class="account-label">계정</small>
          <button type="button" @click="emit('navigate', 'my-page-show')">회원 정보 수정</button>
          <button type="button" @click="emit('logout')">로그 아웃</button>
        </template>
      </nav>

      <section class="recent">
        <small>최근 본 항목</small>
        <div aria-label="최근 본 항목 이미지"></div>
      </section>

      <footer>
        <button type="button">공지사항</button>
        <i></i>
        <button type="button">고객센터</button>
      </footer>
    </aside>
  </div>
</template>

<style scoped>
.drawer-overlay{position:fixed;z-index:20;top:0;bottom:0;left:50%;width:min(100%,390px);transform:translateX(-50%);background:#0009}.drawer{position:absolute;top:0;right:0;width:268px;height:100%;min-height:640px;background:#fff;color:#050505}.drawer button{padding:0;border:0;background:none;color:inherit;font-family:inherit;cursor:pointer}.drawer header{height:58px;padding:0 27px 0 17px;display:flex;align-items:center;justify-content:space-between}.drawer header>button{font-size:20px}.drawer header div{display:flex;gap:22px}.drawer header div button{font-size:18px}.profile{height:136px;padding-right:27px;display:flex;flex-direction:column;align-items:flex-end}.avatar{width:55px;height:55px;margin:6px 0 12px;border-radius:50%;overflow:hidden;background:#d9d9d9}.avatar img{width:100%;height:100%;object-fit:cover}.profile strong{font-size:15px;line-height:18px}.profile small{margin-top:2px;color:#aaa;font-size:8px}.auth-menu{height:136px;padding:18px 29px 0;display:grid;align-content:start;justify-items:end;gap:20px}.auth-menu button{font-size:16px;font-weight:700}.auth-menu .login{color:#00bfc4}.main-menu{padding:8px 29px 0;display:flex;flex-direction:column;align-items:flex-end;gap:23px}.main-menu small,.recent small{color:#aaa;font-size:12px}.main-menu button{font-size:17px;font-weight:700;line-height:1.15}.main-menu .account-label{margin-top:14px}.recent{padding:36px 28px 90px;display:flex;flex-direction:column;align-items:flex-end;gap:15px}.recent div{width:145px;height:145px;border-radius:11px;background:#d9d9d9}.drawer footer{position:absolute;right:0;bottom:0;width:100%;height:90px;border-top:1px solid #eee;display:flex;align-items:center;justify-content:center;gap:29px;background:#fff}.drawer footer button{font-size:16px}.drawer footer i{width:1px;height:20px;background:#ddd}
@media(max-height:720px){.profile,.auth-menu{height:112px}.main-menu{gap:16px}.recent{padding-top:22px}.recent div{width:120px;height:120px}}
</style>
