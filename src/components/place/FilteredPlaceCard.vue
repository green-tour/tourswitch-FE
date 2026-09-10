<script setup>
import CrowdBadge from '../common/CrowdBadge.vue';
const props = defineProps({ place: { type: Object, required: true } });
const emit = defineEmits(['open']);
</script>

<template>
  <button class="place-card" type="button" @click="emit('open', props.place)">
    <span class="photo" :style="{ backgroundImage: `url(${props.place.imageUrl || '/figma-assets/seoul-forest.png'})` }" role="img" :aria-label="props.place.name"></span>
    <span class="copy"><strong>{{ props.place.name }}</strong><small>{{ props.place.regionName || '성동구' }}</small><CrowdBadge :level="props.place.congestion?.level || '여유'" /></span>
  </button>
</template>

<style scoped>
.place-card{display:block;width:100%;padding:0;border:0;border-radius:15px;background:#fff;overflow:hidden;box-shadow:0 5px 12px #173c3210;text-align:left}.photo{display:block;width:100%;height:158px;background-position:center;background-size:cover}.copy{height:41px;position:relative;padding:10px 15px;display:block}.copy strong{font-size:14px}.copy small{margin-left:6px;font-size:8px}.copy :deep(.crowd-badge){position:absolute;right:13px;top:8px;min-width:45px;justify-content:center;background:#20b878;color:#fff;font-size:8px}
</style>
