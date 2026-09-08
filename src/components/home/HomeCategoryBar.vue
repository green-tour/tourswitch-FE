<script setup>
const props = defineProps({ selected: { type: String, default: '전체' } });
const emit = defineEmits(['select']);
const categories = [
  { name: '전체', image: '/figma-assets/category-all.png' },
  { name: '역사', image: '/figma-assets/category-history.png' },
  { name: '문화·예술', image: '/figma-assets/category-culture.png' },
  { name: '자연', image: '/figma-assets/category-nature.png' },
  { name: '산책', image: '/figma-assets/category-walk.png' },
  { name: '야경', image: '/figma-assets/category-culture.png' },
]
</script>

<template>
  <div class="category-bar" aria-label="관광지 카테고리">
    <button
      v-for="category in categories"
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
    height: 100px;
    display: flex;
    gap: 18px;
    overflow-x: auto;
    padding: 15px 25px;
    scrollbar-width: none
  }
  .category-bar::-webkit-scrollbar {
    display:none
  }
  .category-bar button {
    width: 50px;
    flex: 0 0 50px;
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
    font-size: 12px;
    white-space: nowrap
  }
  .category-bar button.selected:not(:first-child) > span {
    background:#63d3d6
  }
</style>
