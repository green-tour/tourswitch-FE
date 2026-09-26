<script setup>
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import AppHeader from "../../components/common/AppHeader.vue";
import AppState from "../../components/common/AppState.vue";
import BottomNav from "../../components/BottomNav.vue";
import FilteredPlaceCard from "../../components/place/FilteredPlaceCard.vue";
import { useFavoritePlaceStore } from "../../store/place/useFavoritePlaceStore";

const router = useRouter();
const favoritePlaceStore = useFavoritePlaceStore();
const { favorites, isLoading, errorMessage } = storeToRefs(favoritePlaceStore);

const openPlace = (place) => {
  router.push({ name: "place-show", params: { placeId: place.id } });
};

onMounted(favoritePlaceStore.fetchFavorites);
</script>

<template>
  <main class="favorite-page">
    <AppHeader title="찜 목록" @back="router.back()" />
    <AppState
      v-if="isLoading"
      type="loading"
      message="찜한 관광지를 불러오는 중입니다."
    />
    <AppState
      v-else-if="errorMessage"
      type="error"
      :message="errorMessage"
      @retry="favoritePlaceStore.fetchFavorites"
    />
    <AppState
      v-else-if="favorites.length === 0"
      type="empty"
      message="아직 찜한 관광지가 없습니다."
    />
    <section v-else class="favorite-list" aria-label="찜한 관광지">
      <FilteredPlaceCard
        v-for="place in favorites"
        :key="place.id"
        :place="{ ...place, regionName: place.address }"
        @open="openPlace"
      />
    </section>
    <BottomNav />
  </main>
</template>

<style scoped>
.favorite-page { min-height: 100vh; padding: 12px 20px 92px; display: flex; flex-direction: column; }
.favorite-list { display: grid; gap: 16px; padding: 20px 0; }
</style>
