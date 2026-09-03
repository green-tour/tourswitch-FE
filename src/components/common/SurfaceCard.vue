<script setup>
const props = defineProps({
  as: {
    type: String,
    default: 'section',
  },
  elevated: Boolean,
});
</script>

<template>
  <component :is="props.as" class="surface-card" :class="{ 'surface-card--elevated': props.elevated }">
    <slot></slot>
  </component>
</template>

<style scoped>
.surface-card { border: var(--team-border-default); border-radius: var(--team-radius-card); padding: var(--team-space-4); background: var(--team-color-white); }
.surface-card--elevated { border-color: transparent; box-shadow: var(--team-shadow-card); }
</style>
