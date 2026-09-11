<script setup>
import { PLACE_CATEGORIES } from '../../constants/placeCategories';

const props = defineProps({ selected: { type: String, default: '전체' } });
const emit = defineEmits(['select']);
</script>

<template>
  <div class="category-bar" aria-label="관광지 카테고리">
    <button
      v-for="category in PLACE_CATEGORIES"
      :key="category.name"
      :class="{ selected: props.selected === category.name }"
      :aria-pressed="props.selected === category.name"
      @click="emit('select', category.name)"
    >
      <span><img :src="category.image" alt="" /></span>
      <small>{{ category.name }}</small>
    </button>
  </div>
</template>

<style scoped>
  .category-bar {
    height: 116px;
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding: 15px 20px;
    scrollbar-width: none
  }
  .category-bar::-webkit-scrollbar {
    display:none
  }
  .category-bar button {
    width: 64px;
    flex: 0 0 64px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--team-color-black)
  }
  .category-bar button > span {
    width: 50px;
    height: 50px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    background: #fff;box-shadow:3px 3px 10px #0000001a;
    transition: background .18s ease
    }
  .category-bar img {
    width: 34px;
    height: 34px;
    object-fit: contain
  }
  .category-bar small {
    display: block;
    margin-top: 5px;
    min-height: 30px;
    font-size: 11px;
    line-height: 1.3;
    white-space: normal;
    word-break: keep-all;
    overflow-wrap: anywhere;
  }
  .category-bar button.selected:not(:first-child) > span {
    background:#63d3d6
  }
</style>
