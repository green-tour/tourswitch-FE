<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'danger', 'ghost'].includes(value),
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value),
  },
  block: Boolean,
  loading: Boolean,
  disabled: Boolean,
  type: {
    type: String,
    default: 'button',
  },
});

const emit = defineEmits(['click']);
</script>

<template>
  <button
    class="app-button"
    :class="[`app-button--${props.variant}`, `app-button--${props.size}`, { 'app-button--block': props.block }]"
    :type="props.type"
    :disabled="props.disabled || props.loading"
    :aria-busy="props.loading"
    @click="emit('click', $event)"
  >
    <span v-if="props.loading" class="spinner" aria-hidden="true"></span>
    <span><slot>{{ props.loading ? '처리 중...' : '' }}</slot></span>
  </button>
</template>

<style scoped>
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--team-space-2);
  min-width: 80px;
  padding: 0 var(--team-space-4);
  border: 1px solid transparent;
  border-radius: var(--team-radius);
  font-weight: var(--team-font-weight-bold);
  transition: background-color 160ms ease, border-color 160ms ease, opacity 160ms ease;
}

.app-button--small { height: var(--team-control-height-sm); font-size: var(--team-font-size-sm); }
.app-button--medium { height: var(--team-control-height-md); font-size: var(--team-font-size-md); }
.app-button--large { height: var(--team-control-height-lg); font-size: var(--team-font-size-lg); }
.app-button--block { width: 100%; }
.app-button--primary { background: var(--team-color-primary); color: var(--team-color-white); }
.app-button--primary:hover:not(:disabled) { background: var(--team-color-primary-dark); }
.app-button--secondary { border-color: var(--team-color-primary); background: var(--team-color-white); color: var(--team-color-primary-dark); }
.app-button--danger { background: var(--team-color-danger); color: var(--team-color-white); }
.app-button--ghost { background: transparent; color: var(--team-color-gray-800); }
.app-button:disabled { opacity: 0.5; }

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 700ms linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  .app-button { transition: none; }
  .spinner { animation-duration: 1400ms; }
}
</style>
