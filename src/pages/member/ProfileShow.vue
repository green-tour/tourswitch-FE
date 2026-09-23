<script setup>
import { computed, onMounted, ref } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import {
  faChevronRight,
  faClockRotateLeft,
  faHeart,
  faUserPen,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "vue-router";
import AppHeader from "../../components/common/AppHeader.vue";
import AppState from "../../components/common/AppState.vue";
import BottomNav from "../../components/BottomNav.vue";
import { useAuthStore } from "../../store/auth/useAuthStore";

const router = useRouter();
const authStore = useAuthStore();
const isLoading = ref(!authStore.user);
const errorMessage = ref("");
const initial = computed(() => authStore.user?.nickname?.trim().charAt(0) || "투");

const loadProfile = async () => {
  if (authStore.user) return;
  isLoading.value = true;
  errorMessage.value = "";
  try {
    await authStore.fetchMe();
  } catch {
    errorMessage.value = "프로필 정보를 불러오지 못했습니다.";
  } finally {
    isLoading.value = false;
  }
};

const logout = async () => {
  await authStore.logout();
  await router.replace({ name: "login-show" });
};

onMounted(loadProfile);
</script>

<template>
  <main class="profile-page">
    <AppHeader title="프로필" :show-back="false" />
    <AppState
      v-if="isLoading"
      type="loading"
      message="프로필을 불러오는 중입니다."
    />
    <AppState
      v-else-if="errorMessage"
      type="error"
      :message="errorMessage"
      @retry="loadProfile"
    />
    <template v-else>
      <section class="profile-summary">
        <div class="avatar" aria-hidden="true">{{ initial }}</div>
        <h2>{{ authStore.user?.nickname }}</h2>
        <p>투어스위치와 즐거운 서울 여행을 만들어 보세요.</p>
      </section>

      <section class="quick-menu" aria-label="프로필 주요 메뉴">
        <button type="button" @click="router.push({ name: 'favorite-place-index' })">
          <span class="menu-icon favorite"><FontAwesomeIcon :icon="faHeart" /></span>
          <strong>찜 목록</strong>
          <small>저장한 관광지</small>
        </button>
        <button type="button" @click="router.push({ name: 'history-index' })">
          <span class="menu-icon history"><FontAwesomeIcon :icon="faClockRotateLeft" /></span>
          <strong>여행 기록</strong>
          <small>완료한 여행</small>
        </button>
      </section>

      <section class="settings-menu" aria-label="프로필 설정">
        <button type="button" @click="router.push({ name: 'my-page-show' })">
          <FontAwesomeIcon class="setting-icon" :icon="faUserPen" />
          <span>회원 정보 수정</span>
          <FontAwesomeIcon class="chevron" :icon="faChevronRight" />
        </button>
      </section>

      <button class="logout-button" type="button" @click="logout">로그아웃</button>
    </template>
    <BottomNav />
  </main>
</template>

<style scoped>
.profile-page { min-height: 100vh; padding: 12px 20px 92px; display: flex; flex-direction: column; }
.profile-summary { padding: 28px 0 24px; text-align: center; }
.avatar { width: 88px; height: 88px; margin: 0 auto 13px; display: grid; place-items: center; border-radius: 50%; background: linear-gradient(145deg, var(--team-color-info-bg), #c8f2e2); color: var(--team-color-primary-dark); font-size: 32px; font-weight: 800; }
.profile-summary h2 { font-size: 20px; }
.profile-summary p { margin-top: 5px; color: var(--team-color-gray-600); font-size: 12px; }
.quick-menu { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.quick-menu button { min-height: 130px; padding: 18px 12px; display: flex; flex-direction: column; align-items: center; border: var(--team-border-default); border-radius: 18px; background: #fff; box-shadow: var(--team-shadow-card); }
.menu-icon { width: 42px; height: 42px; margin-bottom: 10px; display: grid; place-items: center; border-radius: 14px; font-size: 18px; }
.menu-icon.favorite { background: var(--team-color-danger-bg); color: var(--team-color-danger); }
.menu-icon.history { background: var(--team-color-info-bg); color: var(--team-color-primary-dark); }
.quick-menu strong { font-size: 14px; }
.quick-menu small { margin-top: 3px; color: var(--team-color-gray-600); font-size: 10px; }
.settings-menu { margin-top: 20px; overflow: hidden; border: var(--team-border-default); border-radius: 16px; box-shadow: var(--team-shadow-card); }
.settings-menu button { width: 100%; min-height: 58px; padding: 0 17px; display: grid; grid-template-columns: 24px 1fr 16px; align-items: center; gap: 10px; border: 0; background: #fff; text-align: left; }
.setting-icon { color: var(--team-color-primary-dark); }
.settings-menu span { font-size: 14px; font-weight: 700; }
.chevron { color: var(--team-color-gray-400); font-size: 11px; }
.logout-button { margin: 30px auto 0; padding: 8px 16px; border: 0; background: transparent; color: var(--team-color-gray-600); font-size: 12px; text-decoration: underline; }
.profile-page :deep(.bottom-nav) { position: fixed; width: min(100%, 390px); margin: auto; }
</style>
