<script setup>
defineProps({
  regions: { type: Array, required: true },
  dongs: { type: Array, required: true },
  regionId: { type: [String, Number], default: '' },
  dongId: { type: [String, Number], default: '' },
  isLoadingDongs: { type: Boolean, default: false },
});

const emit = defineEmits(['update:regionId', 'update:dongId']);

const changeRegion = (event) => emit('update:regionId', event.target.value);
const changeDong = (event) => emit('update:dongId', event.target.value);
</script>

<template>
  <section class="filter-card">
    <h2>지역 필터</h2>
    <div class="fields">
      <label>
        <span>구</span>
        <select :value="regionId" @change="changeRegion">
          <option value="">전체 구</option>
          <option v-for="region in regions" :key="region.id" :value="region.id">
            {{ region.districtName }}
          </option>
        </select>
      </label>
      <label>
        <span>동</span>
        <select :value="dongId" :disabled="!regionId || isLoadingDongs" @change="changeDong">
          <option value="">{{ isLoadingDongs ? '불러오는 중' : '전체 동' }}</option>
          <option v-for="dong in dongs" :key="dong.id" :value="dong.id">
            {{ dong.dongName }}
          </option>
        </select>
      </label>
    </div>
  </section>
</template>

<style scoped>
.filter-card { padding: 18px; border: 1px solid var(--team-color-gray-200); border-radius: var(--team-radius-card); background: var(--team-color-white); }
h2 { margin-bottom: 16px; font-size: .95rem; }
.fields { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
label { display: flex; flex-direction: column; gap: 7px; }
label span { padding-left: 4px; color: var(--team-color-gray-600); font-size: .75rem; }
select { width: 100%; padding: 12px; border: 1px solid var(--team-color-gray-200); border-radius: var(--team-radius-pill); background: var(--team-color-gray-100); font-size: .82rem; outline: none; }
select:focus { border-color: var(--team-color-primary); }
select:disabled { color: var(--team-color-gray-400); }
</style>
