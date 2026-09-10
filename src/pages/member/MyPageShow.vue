<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import myAxios from '../../api/myAxios';
import AppButton from '../../components/common/AppButton.vue';
import AppHeader from '../../components/common/AppHeader.vue';
import AppState from '../../components/common/AppState.vue';
import { useAuthStore } from '../../store/auth/useAuthStore';

const router = useRouter(); const authStore = useAuthStore();
const form = reactive({ nickname: '', avatarUrl: '' }); const isLoading = ref(true); const isSaving = ref(false); const errorMessage = ref(''); const showWithdraw = ref(false);
const load = async () => { isLoading.value = true; errorMessage.value = ''; try { const user = await authStore.fetchMe(); form.nickname = user.nickname; form.avatarUrl = user.avatarUrl ?? ''; } catch { errorMessage.value = '회원 정보를 불러오지 못했습니다.'; } finally { isLoading.value = false; } };
const save = async () => { isSaving.value = true; try { const { data } = await myAxios.patch('/users/me', { nickname: form.nickname, avatarUrl: form.avatarUrl || null }); authStore.user = data.data; } catch (error) { errorMessage.value = error.response?.data?.message ?? '회원 정보를 수정하지 못했습니다.'; } finally { isSaving.value = false; } };
const logout = async () => { await authStore.logout(); router.replace('/login'); };
const withdraw = async () => { await myAxios.delete('/users/me', { data: { confirmation: 'WITHDRAW' } }); authStore.clearSession(); router.replace('/login'); };
onMounted(load);
</script>

<template><main class="mypage"><AppHeader title="내 정보" @back="router.back()" /><AppState v-if="isLoading" type="loading" message="회원 정보를 불러오는 중입니다." /><AppState v-else-if="errorMessage" type="error" :message="errorMessage" @retry="load" /><form v-else @submit.prevent="save"><div class="avatar"><img v-if="form.avatarUrl" :src="form.avatarUrl" alt="프로필 이미지" /><span v-else>👤</span></div><label>닉네임<input v-model.trim="form.nickname" minlength="2" maxlength="20" required /></label><label>프로필 이미지 URL<input v-model.trim="form.avatarUrl" type="url" placeholder="https://" /></label><AppButton type="submit" block :loading="isSaving">회원 정보 수정</AppButton></form><div class="account-actions"><button @click="logout">로그아웃</button><button class="danger" @click="showWithdraw=true">회원 탈퇴</button></div><div v-if="showWithdraw" class="modal" @click.self="showWithdraw=false"><section role="dialog" aria-modal="true"><h2>정말 탈퇴하시겠어요?</h2><p>탈퇴 즉시 로그아웃되며 현재 정책상 계정을 복구할 수 없습니다.</p><div><AppButton variant="ghost" @click="showWithdraw=false">취소</AppButton><AppButton variant="danger" @click="withdraw">탈퇴하기</AppButton></div></section></div></main></template>
<style scoped>.mypage{min-height:100vh;padding:12px 20px}.mypage form{display:grid;gap:20px;padding-top:32px}.avatar{width:88px;height:88px;border-radius:50%;margin:auto;background:var(--team-color-gray-200);display:grid;place-items:center;font-size:42px;overflow:hidden}.avatar img{width:100%;height:100%;object-fit:cover}label{display:grid;gap:8px;font-weight:700}input{height:46px;border:var(--team-border-default);border-radius:10px;padding:0 14px}.account-actions{margin-top:40px;padding-top:20px;border-top:var(--team-border-default);display:flex;justify-content:center;gap:20px}.account-actions button{border:0;background:none}.danger{color:var(--team-color-danger)}.modal{position:fixed;inset:0;background:#0008;display:grid;place-items:center;padding:24px}.modal section{background:#fff;border-radius:20px;padding:24px;display:grid;gap:16px;max-width:340px}.modal section>div{display:flex;justify-content:flex-end;gap:8px}.modal p{color:var(--team-color-gray-600);font-size:14px}</style>
