<script setup>
defineProps({
  type: { type: String, default: 'button' },
});

const emit = defineEmits(['click']);
</script>

<template>
  <button class="vote-room-button" :type="type" @click="emit('click', $event)">
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M6 2v3M18 2v3M3 8h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="m8 15 2.5 2.5L16 12" />
    </svg>
    <span>투표방 만들기</span>
  </button>
</template>

<style scoped>
.vote-room-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 145px;
  height: 51px;
  gap: 11px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(100deg, #25cbd1 0%, #43d293 100%);
  box-shadow: none;
  color: #fff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
}

.vote-room-button svg {
  width: 23px;
  height: 23px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.35;
}

.vote-room-button:active { transform: translateY(1px); }
.vote-room-button:focus-visible { outline: 2px solid #087d80; outline-offset: 2px; }
</style>
