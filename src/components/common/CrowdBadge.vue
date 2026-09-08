<script setup>const props = defineProps({ level: { type: String, default: '여유' } });</script>
<template><span class="crowd-badge" :class="`level-${props.level}`"><i aria-hidden="true"></i>{{ props.level }}</span></template>
<style scoped>.crowd-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;background:#dffff4;color:#287863;font-size:10px;font-weight:700}.crowd-badge i{width:6px;height:6px;border-radius:50%;background:currentColor}.level-혼잡,.level-매우혼잡{background:#fff0f1;color:var(--team-color-danger)}</style>
