<script setup>
const props = defineProps({
  type: {
    type: String,
    default: 'empty',
    validator: (value) => ['loading', 'empty', 'error'].includes(value),
  },
  message: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['retry']);
</script>

<template>
  <div class="app-state" :class="`app-state--${props.type}`" :role="props.type === 'error' ? 'alert' : 'status'">
    <span v-if="props.type === 'loading'" class="spinner" aria-hidden="true"></span>
    <span v-else class="icon" aria-hidden="true">{{ props.type === 'error' ? '!' : '–' }}</span>
    <p>{{ props.message }}</p>
    <button v-if="props.type === 'error'" type="button" @click="emit('retry')">다시 시도</button>
  </div>
</template>

<style scoped>
.app-state {
  flex: 1;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--team-space-3);
  padding: var(--team-space-6);
  color: var(--team-color-gray-600);
  text-align: center;
}

.icon, .spinner { width: 32px; height: 32px; }
.icon { display: grid; place-items: center; border-radius: 50%; background: var(--team-color-gray-100); font-weight: var(--team-font-weight-bold); }
.app-state--error { color: var(--team-color-danger); }
.app-state--error .icon { background: var(--team-color-danger-bg); }
.app-state button { border: 0; background: transparent; color: var(--team-color-primary-dark); font-weight: var(--team-font-weight-bold); text-decoration: underline; }
.spinner { border: 3px solid var(--team-color-gray-200); border-top-color: var(--team-color-primary); border-radius: 50%; animation: spin 700ms linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
