<script setup>
import { nextTick, onBeforeUnmount, ref, useId, watch } from "vue";
import AppButton from "./AppButton.vue";

const props = defineProps({
  open: Boolean,
  title: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["close"]);
const closeButton = ref(null);
const titleId = useId();

const close = () => emit("close");

const handleKeydown = (event) => {
  if (event.key === "Escape") close();
};

watch(
  () => props.open,
  async (open) => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      document.addEventListener("keydown", handleKeydown);
      await nextTick();
      closeButton.value?.$el?.focus();
      return;
    }
    document.removeEventListener("keydown", handleKeydown);
  },
);

onBeforeUnmount(() => {
  document.body.style.overflow = "";
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="close">
      <section
        class="modal-panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <h2 :id="titleId">{{ title }}</h2>
        <div class="modal-content">
          <slot></slot>
        </div>
        <AppButton ref="closeButton" block @click="close">닫기</AppButton>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  z-index: 3000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgb(23 33 31 / 58%);
}
.modal-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 18px;
  width: min(100%, 350px);
  height: min(78dvh, 680px);
  overflow: hidden;
  padding: 24px;
  border-radius: var(--team-radius-card);
  background: var(--team-color-white);
  box-shadow: var(--team-shadow-card);
}
.modal-panel h2 {
  color: var(--team-color-black);
  font-size: var(--team-font-size-xl);
  line-height: 1.35;
}
.modal-content {
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}
</style>
