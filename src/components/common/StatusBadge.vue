<script setup>
const props = defineProps({
  tone: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'success', 'warning', 'danger', 'neutral'].includes(value),
  },
  small: Boolean,
});
</script>

<template>
  <span class="status-badge" :class="[`status-badge--${props.tone}`, { 'status-badge--small': props.small }]">
    <slot></slot>
  </span>
</template>

<style scoped>
.status-badge { display: inline-flex; align-items: center; border-radius: var(--team-radius-pill); padding: var(--team-badge-padding); font-size: var(--team-badge-font-size); font-weight: var(--team-font-weight-bold); white-space: nowrap; }
.status-badge--small { padding: 3px 10px; font-size: var(--team-font-size-xs); }
.status-badge--primary { background: var(--team-color-primary); color: var(--team-color-white); }
.status-badge--success { background: var(--team-color-success-bg); color: var(--team-color-success); }
.status-badge--warning { background: var(--team-color-warning); color: var(--team-color-black); }
.status-badge--danger { background: var(--team-color-danger-bg); color: var(--team-color-danger); }
.status-badge--neutral { background: var(--team-color-gray-200); color: var(--team-color-gray-600); }
</style>
