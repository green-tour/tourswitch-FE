<script setup>
const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  showBack: {
    type: Boolean,
    default: true,
  },
  backLabel: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['back']);
</script>

<template>
  <header class="app-header" :class="{ 'has-back-label': props.backLabel }">
    <button v-if="props.showBack" class="back-button" type="button" aria-label="뒤로가기" @click="emit('back')">
      <span aria-hidden="true">{{ props.backLabel || '‹' }}</span>
    </button>
    <span v-else class="side-space" aria-hidden="true"></span>
    <h1 v-if="props.title" class="title">{{ props.title }}</h1>
    <div class="actions"><slot name="actions"></slot></div>
  </header>
</template>

<style scoped>
.app-header {
  min-height: var(--team-control-height-md);
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
}

.app-header.has-back-label {
  grid-template-columns: 116px 1fr 116px;
}

.back-button {
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  font-size: 1.75rem;
  line-height: 1;
}

.back-button:hover { background: var(--team-color-gray-100); }
.has-back-label .back-button {
  width: 60px;
  height: auto;
  min-height: 0;
  margin: 0;
  padding: 0;
  border-radius: 0;
  color: #c7c7c7;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}
.has-back-label .back-button:hover { background: transparent; }
.title { font-size: var(--team-font-size-lg); text-align: center; }
.actions { display: flex; justify-content: flex-end; }
</style>
